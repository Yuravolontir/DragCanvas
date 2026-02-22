import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sql from 'mssql';

const app = express();
app.use(cors());
app.use(express.json());

// ---------- SQL ----------
const config = {
  server: 'YURA\\SQLEXPRESS',
  database: 'DragCanvas',
  user: 'webapp',
  password: 'WebApp123!',
  options: { encrypt: false, trustServerCertificate: true }
};

let pool;

async function start() {
  try {
    pool = await sql.connect(config);
    console.log('Connected to SQL Server!');
    app.listen(3001, () => console.log('Server running on port 3001'));
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}
start();

// ---------- Robust JSON extraction/parsing ----------
function extractBalancedJsonObject(text) {
  const s = String(text);
  const start = s.indexOf('{');
  if (start === -1) throw new Error('No { found');

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < s.length; i++) {
    const ch = s[i];

    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') depth++;
    if (ch === '}') depth--;

    if (depth === 0) return s.slice(start, i + 1);
  }

  throw new Error('JSON object not closed (unbalanced braces)');
}

function safeParseAIJson(rawText) {
  let s = String(rawText)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  // normalize smart quotes
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  // keep only first balanced JSON object (ignore trailing text)
  s = extractBalancedJsonObject(s);

  // remove trailing commas
  s = s.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

  // strip markdown link form if leaked: [url](url) -> url
  s = s.replace(/\[(https?:\/\/[^\]\s]+)\]\(\1\)/g, '$1');

  return JSON.parse(s);
}

async function repairJsonWithAI(raw, apiKey) {
  const repairRequest = {
    model: 'sonar-pro',
    messages: [
      {
        role: 'system',
        content:
          'You are a JSON repair tool. Return ONLY valid JSON. No markdown. No comments. Start with { and end with }. No trailing commas.'
      },
      {
        role: 'user',
        content:
          'Fix this into valid JSON (do not change meaning, only fix syntax). Return ONLY the fixed JSON:\n' +
          raw
      }
    ],
    max_tokens: 2500,
    temperature: 0.0
  };

  const rr = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(repairRequest)
  });

  const t = await rr.text();
  let d;
  try { d = JSON.parse(t); } catch { d = null; }

  if (!rr.ok) throw new Error(`Repair call failed: ${rr.status} ${t}`);

  const fixed = d?.choices?.[0]?.message?.content;
  if (!fixed) throw new Error('Repair returned empty content');
  return fixed;
}

// ---------- Normalization (fixes missing sections + missing props wrapper) ----------
function wrapToSections(parsed) {
  if (parsed && Array.isArray(parsed.sections)) return parsed;

  // If AI returned a single root node with children => treat children as sections
  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.children)) return { sections: parsed.children };
    if (parsed.type) return { sections: [parsed] };
  }

  return { sections: [] };
}

function normalizeNode(node) {
  if (!node || typeof node !== 'object') return node;

  // Already correct shape
  if (node.type && node.props) {
    return {
      type: node.type,
      props: node.props || {},
      children: Array.isArray(node.children) ? node.children.map(normalizeNode) : []
    };
  }

  // Convert flat keys to props
  const { type, children, props, ...rest } = node;

  return {
    type: type || 'container',
    props: { ...(props || {}), ...(rest || {}) },
    children: Array.isArray(children) ? children.map(normalizeNode) : []
  };
}

function normalizeLayout(parsed) {
  const wrapped = wrapToSections(parsed);
  return { sections: (wrapped.sections || []).map(normalizeNode) };
}

// ---------- AI endpoint ----------
app.post('/api/ai-generate', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    if (!process.env.PPLX_API_KEY) {
      return res.status(500).json({ error: 'Missing PPLX_API_KEY in .env' });
    }

        const systemPrompt = `You are a professional web designer. Output ONLY
  valid JSON. No markdown. No code blocks. Start with {"sections":[ and end with
  }]}. FOR VIDEO BACKGROUNDS: ALWAYS use videoUrl prop with direct MP4 URLs. NEVER
   use videoId. Available videoUrl options: https://assets.mixkit.co/videos/previe
  w/mixkit-stars-in-space-background-1612-large.mp4 https://assets.mixkit.co/video
  s/preview/mixkit-flying-through-clouds-2072-large.mp4 https://assets.mixkit.co/v
  ideos/preview/mixkit-working-on-a-laptop-in-an-office-2918-large.mp4 https://ass
  ets.mixkit.co/videos/preview/mixkit-cooking-meat-in-a-frying-pan-large.mp4
  https://assets.mixkit.co/videos/preview/mixkit-woman-stretching-before-workout-2
  05-large.mp4 Images: https://images.unsplash.com/photo-1497366216548-37526070297
  c?w=1920&h=1080&fit=crop https://images.unsplash.com/photo-1506905925346-21bda4d
  32df4?w=800&h=600&fit=crop

  ELEMENT PROPS (all available):
  Container: width flexDirection alignItems justifyContent padding margin
  background color shadow radius
  Text: fontSize textAlign fontWeight color shadow text margin
  Button: background color text
  Video: videoUrl text

  FORMATTING RULES:
  - Colors: {"r":0,"g":0,"b":0,"a":1} format for solid colors OR use string for
  gradients like "linear-gradient(135deg,#667eea 0%,#764ba2 100%)"
  - Padding/margin: [top,right,bottom,left] as array
  - Text color: {"r":255,"g":255,"b":255,"a":1} format
  - Video: MUST use videoUrl prop with direct MP4 URL,
  position:absolute,top:0,left:0,zIndex:0
  - Gradients work for backgrounds

  COMPLETE VIDEO HERO EXAMPLE:
  {"sections":[{"type":"container","props":{"width":"100%","position":"relative","
  minHeight":"700","overflow":"hidden"},"children":[{"type":"video","props":{"vide
  oUrl":"https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-
  1612-large.mp4","width":"100%","height":"100%","position":"absolute","top":"0","
  left":"0","zIndex":"0"}},{"type":"container","props":{"position":"absolute","top
  ":"0","left":"0","right":"0","bottom":"0","zIndex":"1","display":"flex","flexDir
  ection":"column","justifyContent":"center","alignItems":"center","padding":[80,4
  0,80,40],"background":"rgba(0,0,0,0.5)"},"children":[{"type":"text","props":{"te
  xt":"Your Headline","fontSize":56,"color":{"r":255,"g":255,"b":255,"a":1},"textA
  lign":"center"}},{"type":"button","props":{"text":"Call to
  Action","background":"#667eea","color":"white","padding":[16,32],"borderRadius":
  8}}]}]},{"type":"container","props":{"width":"100%","padding":[80,40,80,40],"bac
  kground":"linear-gradient(135deg,#f8f9fa 0%,#ffffff
  100%)"},"children":[{"type":"text","props":{"text":"Our Features","fontSize":48,
  "color":{"r":33,"g":37,"b":41,"a":1},"textAlign":"center"}}]}]}

  CRITICAL INSTRUCTIONS:
  1. Section 1 MUST use videoUrl from the list above
  2. Match video to topic (cooking→cooking video, fitness→exercise video)
  3. ALWAYS use videoUrl NEVER videoId for backgrounds
  4. Use color objects like {"r":255,"g":255,"b":255,"a":1} for text colors
  5. Use padding arrays like [80,40,80,40] for spacing

  Create 6 sections total. Make it impressive. End with }]}`;
      const requestData = {
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create a professional website for: ${prompt}.
  Use direct video URLs (videoUrl prop) for backgrounds. Create 6 impressive
  sections with video hero, features, about, testimonials, and CTA. Match videos
  to the topic.` }
        ],
        max_tokens: 10000,
        temperature: 0.7
      };

    const r = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.PPLX_API_KEY}`
      },
      body: JSON.stringify(requestData)
    });

    const txt = await r.text();
    let data;
    try { data = JSON.parse(txt); } catch { data = null; }

    if (!r.ok) {
      return res.status(r.status).json({
        error: 'Perplexity API error',
        status: r.status,
        body: data ?? txt
      });
    }

    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) {
      return res.status(500).json({ error: 'No choices[0].message.content', body: data });
    }

    // Parse with repair fallback
    let parsed;
    try {
      parsed = safeParseAIJson(raw);
    } catch (e1) {
      const fixedRaw = await repairJsonWithAI(raw, process.env.PPLX_API_KEY);
      parsed = safeParseAIJson(fixedRaw);
    }

    // Normalize format to {sections:[{type,props,children}]}
    const normalized = normalizeLayout(parsed);

    if (!normalized.sections || !Array.isArray(normalized.sections) || normalized.sections.length === 0) {
      return res.status(400).json({ error: 'No sections generated', parsed, normalized });
    }

    return res.json(normalized);
  } catch (e) {
    return res.status(500).json({
      error: 'Server exception',
      message: e?.message,
      stack: e?.stack
    });
  }
});

export default app;
