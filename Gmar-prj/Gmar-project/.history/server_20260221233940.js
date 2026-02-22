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

  // normalize “smart quotes”
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  // remove trailing commas
  s = s.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

  // strip markdown links if they leak in: [url](url) -> url
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
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(repairRequest),
  });

  const text = await rr.text();
  let data;
  try { data = JSON.parse(text); } catch { data = null; }

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

    // Keep prompt minimal and strict: less chance of broken JSON
   const systemPrompt = `
  Output ONLY valid JSON (no markdown, no code blocks).
  Start with { and end with }.
  No trailing commas.
  All string values must be single-line.

  USE ONLY THESE IMAGE URLS:
  https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=c
  rop
  https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=cro
  p
  https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=cro
  p
  https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=cro
  p

  VIDEO (must include these sections):
  For background video with text overlay, create a container with:
  - props.backgroundVideo: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&m
  ute=1&loop=1&playlist=dQw4w9WgXcQ&controls=0"
  - props.background: "#000000"
  - props.padding: ["80","40","80","40"]
  - Add text children with props.color: "white" and larger fontSize

  Example hero with video:
  {
    "type": "container",
    "props": {"width":"100%","flexDirection":"column","padding":["80","40","80","4
  0"],"background":"#000000","backgroundVideo":"https://www.youtube.com/embed/dQw4
  w9WgXcQ?autoplay=1&mute=1&loop=1"},
    "children": [
      {"type":"text","props":{"text":"Welcome","fontSize":"72","fontWeight":"bold"
  ,"textAlign":"center","color":"white"}},
      {"type":"text","props":{"text":"Your amazing journey starts
  here","fontSize":"28","textAlign":"center","color":"white"}}
    ]
  }

  For standalone video sections, use:
  {"type":"video","props":{"embedUrl":"https://www.youtube.com/embed/dQw4w9WgXcQ?a
  utoplay=0","width":"100%","height":"500"}}

  AVAILABLE TYPES: container, text, button, image, video, link

  GENERATE 7-8 SECTIONS:
  1. Hero with background video + large headline + CTA button
  2. Features grid (3-4 columns)
  3. About with image + text side by side
  4. Video showcase section
  5. Services/products cards
  6. Testimonials
  7. Stats/numbers
  8. Final CTA with button

  Use modern colors: #007bff, #667eea, #764ba2, #f093fb, #4facfe
  `.trim();


    const requestData = {
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a website layout for: ${prompt}` },
      ],
      max_tokens: 3000,
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
    try { data = JSON.parse(text); } catch { data = null; }

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

    // 1st try parse
    let parsed;
    try {
      parsed = safeParseAIJson(raw);
    } catch (e1) {
      // 2nd try: ask AI to repair JSON
      const fixedRaw = await repairJsonWithAI(raw, process.env.PPLX_API_KEY);
      parsed = safeParseAIJson(fixedRaw);
    }

    if (!parsed?.sections || !Array.isArray(parsed.sections)) {
      return res.status(400).json({
        error: 'AI JSON missing sections[]',
        parsed,
      });
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
