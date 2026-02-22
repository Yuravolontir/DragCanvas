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

        const systemPrompt = `You are an expert web designer. Output ONLY valid
  JSON. No markdown.

  Create professional, modern websites with 6-8 sections.

  DIRECT VIDEO URLs (use these for backgrounds):
  - Tech abstract: https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-b
  ackground-1612-large.mp4
  - Nature: https://assets.mixkit.co/videos/preview/mixkit-flying-through-clouds-2
  072-large.mp4
  - Business: https://assets.mixkit.co/videos/preview/mixkit-working-on-a-laptop-i
  n-an-office-2918-large.mp4
  - Cooking: https://assets.mixkit.co/videos/preview/mixkit-cooking-meat-in-a-fryi
  ng-pan-large.mp4
  - Fitness: https://assets.mixkit.co/videos/preview/mixkit-woman-stretching-befor
  e-workout-205-large.mp4
  - Abstract:
  https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4

  HIGH-QUALITY IMAGES:
  https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=c
  rop
  https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=cro
  p
  https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=cro
  p
  https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=cro
  p

  VIDEO HERO EXAMPLE (videoUrl for direct video files):
  {"type":"container","props":{"width":"100%","position":"relative","minHeight":"7
  00","overflow":"hidden","background":"#1a1a2a"},"children":[
    {"type":"video","props":{"videoUrl":"https://assets.mixkit.co/videos/preview/m
  ixkit-stars-in-space-background-1612-large.mp4","width":"100%","height":"100%","
  position":"absolute","top":"0","left":"0","zIndex":"0"}},
    {"type":"container","props":{"position":"absolute","top":"0","left":"0","right
  ":"0","bottom":"0","zIndex":"2","display":"flex","flexDirection":"column","justi
  fyContent":"center","alignItems":"center","padding":["80","60","80","60"],"backg
  round":"linear-gradient(to
  bottom,rgba(0,0,0,0.7),rgba(0,0,0,0.4))"},"children":[
      {"type":"text","props":{"text":"Build Something
  Extraordinary","fontSize":"72","fontWeight":"800","color":"#ffffff","textAlign":
  "center","letterSpacing":"-0.02"}},
      {"type":"text","props":{"text":"Transform your vision into reality with our
  cutting-edge platform","fontSize":"24","color":"rgba(255,255,255,0.9)","textAlig
  n":"center","marginTop":"20","maxWidth":"700"}},
      {"type":"button","props":{"text":"Start Free
  Trial","background":"linear-gradient(135deg,#667eea 0%,#764ba2
  100%)","color":"#ffffff","padding":["20","48"],"borderRadius":"60","fontSize":"1
  8","fontWeight":"600","marginTop":"40","boxShadow":"0 10px 40px
  rgba(102,126,234,0.4)"}}
    ]}
  ]}}

  FEATURES GRID EXAMPLE:
  {"type":"container","props":{"width":"100%","padding":["100","60","100","60"],"b
  ackground":"linear-gradient(180deg,#f8f9fa 0%,#ffffff 100%)"},"children":[
    {"type":"text","props":{"text":"Why Choose
  Us","fontSize":"56","fontWeight":"700","textAlign":"center","marginBottom":"60",
  "color":"#1a1a2a","letterSpacing":"-0.01"}},
    {"type":"container","props":{"display":"flex","gap":"40","justifyContent":"cen
  ter","flexWrap":"wrap"},"children":[
      {"type":"container","props":{"flex":"1","minWidth":"280","padding":["40","30
  ","40","30"],"background":"#ffffff","borderRadius":"20","boxShadow":"0 10px 40px
   rgba(0,0,0,0.08)","textAlign":"center"},"children":[
        {"type":"text","props":{"text":"⚡ Lightning Fast","fontSize":"28","fontWe
  ight":"700","color":"#1a1a2a","marginBottom":"12"}},
        {"type":"text","props":{"text":"Optimized for speed and
  performance","fontSize":"16","color":"#666","lineHeight":"1.6"}}
      ]},
      {"type":"container","props":{"flex":"1","minWidth":"280","padding":["40","30
  ","40","30"],"background":"#ffffff","borderRadius":"20","boxShadow":"0 10px 40px
   rgba(0,0,0,0.08)","textAlign":"center"},"children":[
        {"type":"text","props":{"text":"🔒 Bank-Level Security","fontSize":"28","f
  ontWeight":"700","color":"#1a1a2a","marginBottom":"12"}},
        {"type":"text","props":{"text":"Enterprise-grade security and
  encryption","fontSize":"16","color":"#666","lineHeight":"1.6"}}
      ]}
    ]}
  ]}

  ADVANCED DESIGN RULES:
  - Use gradients: linear-gradient(135deg,#667eea 0%,#764ba2 100%)
  - Add shadows: boxShadow or borderRadius for depth
  - Use padding arrays: ["60","40","60","40"] means [top,right,bottom,left]
  - Text colors: white for dark backgrounds, #1a1a2a for light
  - CTAs: Use gradients and shadows for buttons

  Match the video to the topic. Create modern, impressive layouts. End with }}]`;
    const requestData = {
      model:  'llama-3.1-sonar-huge',
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
