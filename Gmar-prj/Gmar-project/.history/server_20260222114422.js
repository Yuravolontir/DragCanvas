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

   const systemPrompt = `Output ONLY valid JSON. No markdown.

  Complete example of a hero section with background video and text overlay:
  {"sections":[
    {"type":"container","props":{"width":"100%","position":"relative","minHeight":
  "600","overflow":"hidden","background":"#000"},"children":[
      {"type":"video","props":{"videoId":"IwzUs1IMdyQ","width":"100%","height":"10
  0%","position":"absolute","top":"0","left":"0","zIndex":"0"}},
      {"type":"container","props":{"position":"absolute","top":"0","left":"0","rig
  ht":"0","bottom":"0","zIndex":"1","display":"flex","flexDirection":"column","jus
  tifyContent":"center","alignItems":"center","padding":["60","40","60","40"],"gap
  ":"20","background":"rgba(0,0,0,0.4)"},"children":[
        {"type":"text","props":{"text":"Welcome to Our Platform","fontSize":"64","
  fontWeight":"bold","color":"white","textAlign":"center"}},
        {"type":"text","props":{"text":"The best solution for your
  needs","fontSize":"24","color":"rgba(255,255,255,0.9)","textAlign":"center"}},
        {"type":"button","props":{"text":"Get Started","background":"#007bff","col
  or":"white","padding":["16","32"],"borderRadius":"8"}}
      ]}
    ]},
    {"type":"container","props":{"width":"100%","padding":["80","40","80","40"],"b
  ackground":"#f8f9fa"},"children":[
      {"type":"text","props":{"text":"Our Features","fontSize":"48","fontWeight":"
  bold","textAlign":"center","marginBottom":"50","color":"#212529"}}
    ]}
  ]}

  Key patterns to follow:
  1. Video background: position absolute top 0 left 0 zIndex 0 width 100% height
  100%
  2. Text overlay: position absolute top 0 left 0 right 0 bottom 0 zIndex 1
  3. Overlay container: display flex flexDirection column justifyContent center
  alignItems center
  4. Add background rgba(0,0,0,0.4) to text overlay container for readability
  5. Text color should be white for visibility on video

  Images:
  https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=c
  rop
  https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=cro
  p
  https://placehold.co/1920x600/6c5ce7/ffffff?text=Hero

  Video IDs by topic:
  - Tech: 9bZkp7q19f0
  - Nature: JGwWNGJdvx8
  - Food: 4Sq7SEaQ5xM
  - Business: ER7mPmKgnWI
  - Default: IwzUs1IMdyQ

  Generate 5 sections following the hero video pattern above. Match video to
  topic. End with }}]`;
    const requestData = {
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a website layout for: ${prompt}` }
      ],
      max_tokens: 10000,
      temperature: 0.6
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
