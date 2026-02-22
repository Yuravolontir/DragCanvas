import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sql from 'mssql';

const app = express();
app.use(cors());
app.use(express.json());

// ================== SQL ==================

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

// ================== JSON HELPERS ==================

function extractBalancedJsonObject(text) {
  const s = String(text);
  const start = s.indexOf('{');
  if (start === -1) throw new Error('No JSON object found');

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

  throw new Error('Unbalanced JSON braces');
}

function safeParseAIJson(rawText) {
  let s = String(rawText)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  s = extractBalancedJsonObject(s);

  s = s.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

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
          'Fix this into valid JSON. Do not change meaning. Return ONLY fixed JSON:\n' +
          raw
      }
    ],
    max_tokens: 2000,
    temperature: 0.0
  };

  const r = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(repairRequest)
  });

  const txt = await r.text();
  let data;

  try {
    data = JSON.parse(txt);
  } catch {
    throw new Error('Repair response not JSON');
  }

  if (!r.ok) {
    throw new Error(`Repair failed: ${r.status}`);
  }

  const fixed = data?.choices?.[0]?.message?.content;
  if (!fixed) throw new Error('Repair returned empty content');

  return fixed;
}

// ================== NORMALIZATION ==================

function wrapToSections(parsed) {
  if (parsed?.sections && Array.isArray(parsed.sections)) return parsed;

  if (parsed?.children && Array.isArray(parsed.children))
    return { sections: parsed.children };

  if (parsed?.type) return { sections: [parsed] };

  return { sections: [] };
}

function normalizeNode(node) {
  if (!node || typeof node !== 'object') return node;

  if (node.type && node.props) {
    return {
      type: node.type,
      props: node.props || {},
      children: Array.isArray(node.children)
        ? node.children.map(normalizeNode)
        : []
    };
  }

  const { type, children, props, ...rest } = node;

  return {
    type: type || 'container',
    props: { ...(props || {}), ...(rest || {}) },
    children: Array.isArray(children)
      ? children.map(normalizeNode)
      : []
  };
}

function normalizeLayout(parsed) {
  const wrapped = wrapToSections(parsed);
  return {
    sections: (wrapped.sections || []).map(normalizeNode)
  };
}

// ================== AI ENDPOINT ==================

app.post('/api/ai-generate', async (req, res) => {
  try {
    const { prompt } = req.body || {};

    if (!prompt?.trim())
      return res.status(400).json({ error: 'Missing prompt' });

    if (!process.env.PPLX_API_KEY)
      return res.status(500).json({ error: 'Missing PPLX_API_KEY' });

    const systemPrompt = `
Output ONLY valid JSON. No markdown.

STRUCTURE:
{"sections":[{"type":"container","props":{},"children":[]}]}

TYPES: container text button image video link

Generate EXACTLY 5 sections.
Keep structure shallow.
Avoid deep nesting.
Use modern design colors: #007bff #28a745 #ffc107 #dc3545 #343a40.
`;

    const requestData = {
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a website layout for: ${prompt}` }
      ],
      max_tokens: 3500,
      temperature: 0.4
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

    try {
      data = JSON.parse(txt);
    } catch {
      return res.status(500).json({ error: 'AI response not JSON', raw: txt });
    }

    if (!r.ok) {
      return res.status(r.status).json({
        error: 'Perplexity error',
        body: data
      });
    }

    const raw = data?.choices?.[0]?.message?.content;
    if (!raw)
      return res.status(500).json({ error: 'Missing AI content' });

    // 🔥 TRUNCATION CHECK
    if (!raw.trim().endsWith('}')) {
      return res.status(500).json({
        error: 'AI output likely truncated',
        preview: raw.slice(-500)
      });
    }

    let parsed;

    try {
      parsed = safeParseAIJson(raw);
    } catch (e1) {
      console.warn('Initial parse failed. Attempting repair...');

      const fixedRaw = await repairJsonWithAI(
        raw,
        process.env.PPLX_API_KEY
      );

      try {
        parsed = safeParseAIJson(fixedRaw);
      } catch {
        return res.status(500).json({
          error: 'AI returned irreparable JSON',
          preview: raw.slice(0, 2000)
        });
      }
    }

    const normalized = normalizeLayout(parsed);

    if (!normalized.sections.length) {
      return res.status(400).json({
        error: 'No sections generated'
      });
    }

    return res.json(normalized);

  } catch (e) {
    return res.status(500).json({
      error: 'Server exception',
      message: e.message
    });
  }
});

export default app;