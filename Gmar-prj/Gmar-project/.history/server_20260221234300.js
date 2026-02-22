import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sql from 'mssql';

const app = express();
app.use(cors());
app.use(express.json());

// ---------------- SQL ----------------
const config = {
  server: 'YURA\\SQLEXPRESS',
  database: 'DragCanvas',
  user: 'webapp',
  password: 'WebApp123!',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
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

// ---------------- Helpers ----------------
function safeParseAIJson(rawText) {
  let s = String(rawText)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('No JSON object found');
  s = s.slice(first, last + 1);

  // Normalize smart quotes
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  // Remove trailing commas
  s = s.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

  // Strip markdown links if leaked: [url](url) -> url
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
          'You are a JSON repair tool. Return ONLY valid JSON. No markdown. No comments. Start with { and end with }. No trailing commas.',
      },
      {
        role: 'user',
        content:
          'Fix this into valid JSON (do not change meaning, only fix syntax). Return ONLY the fixed JSON:\n' +
          raw,
      },
    ],
    max_tokens: 2500,
    temperature: 0.0,
  };

  const rr = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(repairRequest),
  });

  const text = await rr.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  if (!rr.ok) {
    throw new Error(`Repair call failed: ${rr.status} ${text}`);
  }

  const fixed = data?.choices?.[0]?.message?.content;
  if (!fixed) throw new Error('Repair returned empty content');
  return fixed;
}

// ---------------- AI endpoint ----------------
app.post('/api/ai-generate', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    if (!process.env.PPLX_API_KEY) {
      return res.status(500).json({ error: 'Missing PPLX_API_KEY in .env' });
    }

    // IMPORTANT: plain URLs only, no markdown links, no line breaks inside strings.
    const systemPrompt = `
Output ONLY valid JSON (no markdown, no code blocks).
Start with { and end with }.
No trailing commas.
All string values must be single-line (no literal newlines). Use \\n if needed.
Do not use markdown like **bold** or *italic* in any text.

AVAILABLE TYPES: container, text, button, image, video, link

ALLOWED PROPS (use only these keys):
Container props: width, flexDirection, padding, background, position, minHeight, overflow, top, left, right, bottom, display, justifyContent, alignItems, zIndex, gap
Text props: text, fontSize, fontWeight, textAlign, color, maxWidth
Button props: text, background, color, padding, borderRadius, href
Image props: src, width, height, borderRadius
Video props: embedUrl, width, height, position, top, left, zIndex, opacity

USE ONLY THESE IMAGE URLS (plain strings):
https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop
https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop
https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop
https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop
https://placehold.co/1920x600/6c5ce7/white?text=Hero
https://placehold.co/400x300/007bff/white?text=Image

BACKGROUND VIDEO HERO (MUST INCLUDE EXACTLY 1 HERO LIKE THIS):
Hero section must be a container with:
props: { "width":"100%","position":"relative","minHeight":"650","overflow":"hidden","background":"#000000","padding":["0","0","0","0"] }

Hero children MUST be in this exact order:
1) video background:
{ "type":"video","props":{
  "embedUrl":"https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ&controls=0",
  "position":"absolute","top":"0","left":"0","width":"100%","height":"100%","opacity":"0.55","zIndex":"0"
}}

2) overlay container on top:
{ "type":"container","props":{
  "position":"absolute","top":"0","left":"0","right":"0","bottom":"0",
  "display":"flex","flexDirection":"column","justifyContent":"center","alignItems":"center",
  "padding":["80","40","80","40"],"zIndex":"1","gap":"16"
},
"children":[
  { "type":"text","props":{"text":"(headline)","fontSize":"72","fontWeight":"bold","textAlign":"center","color":"white","maxWidth":"1000"} },
  { "type":"text","props":{"text":"(subtitle)","fontSize":"24","textAlign":"center","color":"white","maxWidth":"800"} },
  { "type":"button","props":{"text":"Get Started","background":"#007bff","color":"white","padding":"14px 26px","borderRadius":"999px","href":"#"} }
]}

GENERATE 7 SECTIONS TOTAL (including the hero):
1. Hero (with background video + overlay text + CTA)
2. Features (3-4 items)
3. About (image + text)
4. Video showcase (standalone video)
5. Services/products cards
6. Testimonials
7. Final CTA
`.trim();

    const requestData = {
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a website layout for: ${prompt}` },
      ],
      max_tokens: 3200,
      temperature: 0.6,
    };

    const r = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.PPLX_API_KEY}`,
      },
      body: JSON.stringify(requestData),
    });

    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (!r.ok) {
      return res.status(r.status).json({
        error: 'Perplexity API error',
        status: r.status,
        body: data ?? text,
      });
    }

    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) {
      return res.status(500).json({ error: 'No choices[0].message.content', body: data });
    }

    // Parse (with repair fallback)
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
      stack: e?.stack,
    });
  }
});

export default app;
