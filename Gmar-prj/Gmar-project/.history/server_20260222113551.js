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

 const systemPrompt = `Output ONLY valid JSON. No markdown. No code blocks.

  STRUCTURE:
  {"sections":[{"type":"container","props":{...},"children":[{"type":"container","
  props":{...},"children":[{},{}]}]}]}

  RULES:
  - EVERY { must have matching }
  - NO trailing commas inside {} or []
  - All strings on ONE line (no \\n inside strings)
  - Output complete JSON, never truncate

  ELEMENT TYPES: container text button image video link

  CONTAINER PROPS: width flexDirection padding background position minHeight
  overflow top left right bottom zIndex display justifyContent alignItems gap
  margin
  TEXT PROPS: text fontSize fontWeight textAlign color lineHeight maxWidth
  BUTTON PROPS: text background color padding borderRadius width
  IMAGE PROPS: src width height borderRadius
  VIDEO PROPS: videoId width height position top left zIndex
  LINK PROPS: text href color fontSize

  GUARANTEED WORKING IMAGES:
  https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=c
  rop
  https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=cro
  p
  https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=cro
  p
  https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=cro
  p
  https://placehold.co/1920x600/1a1a2a/ffffff?text=Hero+Banner
  https://placehold.co/800x600/007bff/ffffff?text=Feature

  VIDEO IDS: IwzUs1IMdyQ dQw4w9WgXcQ 9bZkp7q19f0 JGwWNGJdvx8

  COLOR PALETTE: #007bff #28a745 #ffc107 #dc3545 #6c757d #343a40 #f8f9fa #ffffff
  #212529

  PROFESSIONAL HERO EXAMPLE:
  {"type":"container","props":{"width":"100%","position":"relative","minHeight":"6
  50","overflow":"hidden","background":"linear-gradient(135deg,#667eea 0%,#764ba2
  100%)"},"children":[{"type":"container","props":{"width":"100%","padding":["100"
  ,"40","100","40"],"textAlign":"center"},"children":[{"type":"text","props":{"tex
  t":"Build Something Amazing","fontSize":"72","fontWeight":"bold","color":"white"
  ,"lineHeight":"1.2"}},{"type":"text","props":{"text":"Transform your ideas into
  reality with our powerful platform","fontSize":"24","color":"rgba(255,255,255,0.
  9)","marginTop":"24"}},{"type":"button","props":{"text":"Get Started
  Free","background":"#ffffff","color":"#667eea","padding":["20","40"],"borderRadi
  us":"50","fontWeight":"bold","marginTop":"40"}}]}]}

  FEATURES GRID EXAMPLE:
  {"type":"container","props":{"width":"100%","padding":["80","40","80","40"],"bac
  kground":"#f8f9fa"},"children":[{"type":"container","props":{"width":"100%","tex
  tAlign":"center","marginBottom":"50"},"children":[{"type":"text","props":{"text"
  :"Why Choose Us","fontSize":"48","fontWeight":"bold","color":"#212529"}}]},{"typ
  e":"container","props":{"width":"100%","display":"flex","flexDirection":"row","g
  ap":"30","justifyContent":"center"},"children":[{"type":"container","props":{"wi
  dth":"30%","textAlign":"center","padding":["30","20"],"background":"white","bord
  erRadius":"12","boxShadow":"0 4px 20px
  rgba(0,0,0,0.1)"},"children":[{"type":"text","props":{"text":"Lightning
  Fast","fontSize":"24","fontWeight":"bold","marginBottom":"10"}},{"type":"text","
  props":{"text":"Built for speed and efficiency","fontSize":"16","color":"#6c757d
  "}}]},{"type":"container","props":{"width":"30%","textAlign":"center","padding":
  ["30","20"],"background":"white","borderRadius":"12","boxShadow":"0 4px 20px
  rgba(0,0,0,0.1)"},"children":[{"type":"text","props":{"text":"Secure","fontSize"
  :"24","fontWeight":"bold","marginBottom":"10"}},{"type":"text","props":{"text":"
  Enterprise-grade security","fontSize":"16","color":"#6c757d"}}]},{"type":"contai
  ner","props":{"width":"30%","textAlign":"center","padding":["30","20"],"backgrou
  nd":"white","borderRadius":"12","boxShadow":"0 4px 20px
  rgba(0,0,0,0.1)"},"children":[{"type":"text","props":{"text":"24/7
  Support","fontSize":"24","fontWeight":"bold","marginBottom":"10"}},{"type":"text
  ","props":{"text":"Always here to
  help","fontSize":"16","color":"#6c757d"}}]}]}]}}

  Generate 6-8 SECTIONS in this order: 1)Gradient hero with heading 2)Features
  grid 3)About with image side 4)Video section 5)Services cards 6)Testimonials
  7)Stats counter 8)Call to action with dark background. Use varied layouts and
  professional styling.`;

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
