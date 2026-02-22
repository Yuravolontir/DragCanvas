import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sql from 'mssql';

const app = express();
app.use(cors());
app.use(express.json());

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

// ---------- AI ----------
console.log('PPLX_API_KEY exists:', Boolean(process.env.PPLX_API_KEY));

app.post('/api/ai-generate', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    if (!process.env.PPLX_API_KEY) {
      return res.status(500).json({ error: 'Missing PPLX_API_KEY in .env' });
    }

    const systemPrompt = `
Output ONLY valid JSON (no markdown, no code blocks).
Start with { and end with }.
No trailing commas.
All string values must be single-line (no literal newlines). Use \\n if needed.

Use ONLY these URLs as plain strings (no [text](url) markdown):
https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop
https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop
https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop
https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop
https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop
https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop
https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800&h=600&fit=crop
https://placehold.co/400x300/007bff/white?text=Image
https://placehold.co/1920x600/6c5ce7/white?text=Hero

Video embedUrl must be:
https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&mute=1

AVAILABLE TYPES: container, text, button, image, video, link
Generate 6-8 sections using structure:
{ "sections":[ { "type":"container","props":{...},"children":[ ... ] } ] }
`.trim();

    const requestData = {
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a website layout for: ${prompt}` },
      ],
      max_tokens: 2000,
      temperature: 0.7,
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

    const raw = data?.choices?.[0]?.message?.content; // correct path [web:42]
    if (!raw) {
      return res.status(500).json({ error: 'No choices[0].message.content', body: data });
    }

    let parsed;
    try {
      parsed = safeParseAIJson(raw);
    } catch (e) {
      return res.status(400).json({
        error: 'AI returned invalid JSON',
        message: e?.message,
        rawPreview: String(raw).slice(0, 1200),
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

function safeParseAIJson(rawText) {
  let s = String(rawText)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('No JSON object found');
  s = s.slice(first, last + 1);

  // smart quotes -> normal quotes
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  // remove trailing commas
  s = s.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

  // strip markdown links if leaked: [url](url) -> url
  s = s.replace(/\[(https?:\/\/[^\]\s]+)\]\(\1\)/g, '$1');

  return JSON.parse(s);
}

export default app;
