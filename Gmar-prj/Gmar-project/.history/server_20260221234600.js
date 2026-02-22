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

// ---------- Robust JSON extraction ----------
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
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') depth++;
    if (ch === '}') depth--;

    if (depth === 0) {
      // i is the end of the first full JSON object
      return s.slice(start, i + 1);
    }
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

  // extract only the FIRST balanced JSON object (ignores trailing text)
  s = extractBalancedJsonObject(s);

  // remove trailing commas
  s = s.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

  // strip markdown links if leaked: [url](url) -> url
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
          'Fix this into valid JSON (do not change meaning, only fix syntax). Return ONLY the fixed JSON:\n' + raw
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

// ---------- AI endpoint ----------
app.post('/api/ai-generate', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || !String(prompt).trim()) return res.status(400).json({ error: 'Missing prompt' });

    if (!process.env.PPLX_API_KEY) {
      return res.status(500).json({ error: 'Missing PPLX_API_KEY in .env' });
    }

    const systemPrompt = `
Output ONLY valid JSON (no markdown, no code blocks).
Start with { and end with }.
No trailing commas.
All string values must be single-line (no literal newlines). Use \\n if needed.
Do not add ANY text before/after the JSON.

AVAILABLE TYPES: container, text, button, image, video, link

ALLOWED PROPS:
Container: width, flexDirection, padding, background, position, minHeight, overflow, top, left, right, bottom, display, justifyContent, alignItems, zIndex, gap
Text: text, fontSize, fontWeight, textAlign, color, maxWidth
Button: text, background, color, padding, borderRadius, href
Image: src, width, height, borderRadius
Video: embedUrl, width, height, position, top, left, zIndex, opacity

USE ONLY THESE IMAGE URLS:
https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop
https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop
https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop
https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop
https://placehold.co/1920x600/6c5ce7/white?text=Hero
https://placehold.co/400x300/007bff/white?text=Image

HERO MUST USE BACKGROUND VIDEO + OVERLAY (children order fixed):
- section container: position:"relative", overflow:"hidden", minHeight:"650", background:"#000000"
- child 1 video: position:"absolute", top:"0", left:"0", width:"100%", height:"100%", zIndex:"0", opacity:"0.55"
  embedUrl: https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ&controls=0
- child 2 overlay container: position:"absolute", top:"0", left:"0", right:"0", bottom:"0", zIndex:"1"
  display:"flex", justifyContent:"center", alignItems:"center", flexDirection:"column"
  overlay text color must be "white"

Generate 7 sections total (including hero).
`.trim();

    const requestData = {
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a website layout for: ${prompt}` }
      ],
      max_tokens: 3200,
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
      return res.status(r.status).json({ error: 'Perplexity API error', status: r.status, body: data ?? txt });
    }

    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) return res.status(500).json({ error: 'No choices[0].message.content', body: data });

    let parsed;
    try {
      parsed = safeParseAIJson(raw);
    } catch {
      const fixedRaw = await repairJsonWithAI(raw, process.env.PPLX_API_KEY);
      parsed = safeParseAIJson(fixedRaw);
    }

    if (!parsed?.sections || !Array.isArray(parsed.sections)) {
      return res.status(400).json({ error: 'AI JSON missing sections[]', parsed });
    }

    return res.json(parsed);
  } catch (e) {
    return res.status(500).json({
      error: 'Server exception',
      message: e?.message,
      stack: e?.stack
    });
  }
});

export default app;
