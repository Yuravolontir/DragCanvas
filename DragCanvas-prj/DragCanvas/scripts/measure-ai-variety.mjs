/**
 * Measures how varied the AI generator actually is.
 *
 * Runs the same prompt N times, reduces every result to its "section skeleton"
 * (the ordered list of section kinds) and counts how many distinct skeletons
 * came back. One distinct skeleton out of ten runs means the generator always
 * produces the same page.
 *
 * Usage:
 *   node scripts/measure-ai-variety.mjs                      # baseline: current frontend prompt
 *   node scripts/measure-ai-variety.mjs --target=backend     # the /api/ai/generate endpoint
 *   node scripts/measure-ai-variety.mjs --runs=5 --prompt="a fitness studio"
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const args = Object.fromEntries(
    process.argv.slice(2).map(a => {
        const [k, v] = a.replace(/^--/, '').split('=');
        return [k, v ?? true];
    })
);

const RUNS = Number(args.runs ?? 10);
const PROMPT = args.prompt ?? 'a coffee shop in Tel Aviv';
const TARGET = args.target ?? 'frontend';
const API_URL = args.api ?? 'http://localhost:3001';

/** Pull the system prompt out of AIAssistant.jsx so the baseline uses the real one. */
function readFrontendSystemPrompt() {
    const file = path.join(process.cwd(), 'src', 'AIAssistant.jsx');
    const source = fs.readFileSync(file, 'utf8');
    const start = source.indexOf('You are a creative website builder AI');
    if (start === -1) throw new Error('system prompt not found in AIAssistant.jsx');
    const end = source.indexOf('`', start);
    return source.slice(start, end);
}

async function generateViaOpenRouter(systemPrompt) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.VITE_OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
            model: process.env.AI_MODEL || 'google/gemini-2.5-flash',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: PROMPT },
            ],
            response_format: { type: 'json_object' },
        }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(`OpenRouter ${response.status}: ${JSON.stringify(data).slice(0, 200)}`);
    return JSON.parse(data.choices[0].message.content);
}

async function generateViaBackend(token) {
    const response = await fetch(`${API_URL}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ prompt: PROMPT }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
}

async function loginForToken() {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: process.env.MEASURE_EMAIL || 'yuravolontir@gmail.com',
            password: process.env.MEASURE_PASSWORD || '123456',
        }),
    });
    const data = await response.json();
    if (!data.success) throw new Error('login failed: ' + data.error);
    return data.data.token;
}

/**
 * Reduce a generated layout to the shape we care about: which kinds of section
 * appear, in which order. Colours and copy are ignored on purpose.
 */
function sectionSkeleton(layout) {
    const sections = layout?.sections ?? [];
    return sections.map(describeSection);
}

function describeSection(node) {
    const type = node?.type || 'unknown';
    if (type === 'NavbarElement') return 'navbar';

    const kinds = new Set();
    (function walk(n) {
        if (!n || typeof n !== 'object') return;
        const t = n.type;
        if (t && t !== 'Container') kinds.add(t.toLowerCase());
        (n.children || []).forEach(walk);
    })(node);

    const props = node?.props || {};
    const row = props.flexDirection === 'row';
    const childCount = (node?.children || []).length;

    if (kinds.has('carousel')) return 'carousel';
    if (kinds.has('map')) return 'map';
    if (kinds.has('video')) return 'video-hero';
    if (kinds.has('image') && row && childCount >= 3) return 'cards';
    if (kinds.has('image') && row) return 'split';
    if (kinds.has('image')) return 'gallery';
    if (kinds.has('button') && !kinds.has('image')) return 'cta';
    if (kinds.has('link')) return 'footer';
    if (kinds.has('text')) return 'text';
    return 'other';
}

async function main() {
    console.log(`target: ${TARGET} | runs: ${RUNS} | prompt: "${PROMPT}"\n`);

    const systemPrompt = TARGET === 'frontend' ? readFrontendSystemPrompt() : null;
    const token = TARGET === 'backend' ? await loginForToken() : null;

    const skeletons = [];
    const durations = [];
    let failures = 0;

    for (let i = 1; i <= RUNS; i++) {
        const started = Date.now();
        try {
            const layout = TARGET === 'frontend'
                ? await generateViaOpenRouter(systemPrompt)
                : await generateViaBackend(token);

            const skeleton = sectionSkeleton(layout);
            const seconds = ((Date.now() - started) / 1000).toFixed(1);

            skeletons.push(skeleton.join(' > '));
            durations.push(Number(seconds));
            console.log(`${String(i).padStart(2)}. ${seconds}s  ${skeleton.join(' > ')}`);
        } catch (error) {
            failures++;
            console.log(`${String(i).padStart(2)}. FAILED: ${error.message.slice(0, 120)}`);
        }
    }

    const distinct = new Set(skeletons);
    const avg = durations.length ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1) : '-';

    console.log('\n' + '='.repeat(60));
    console.log(`успешных запусков : ${skeletons.length}/${RUNS}${failures ? ` (ошибок: ${failures})` : ''}`);
    console.log(`РАЗНЫХ СКЕЛЕТОВ   : ${distinct.size}`);
    console.log(`среднее время     : ${avg}s`);
    console.log('='.repeat(60));

    if (distinct.size > 0) {
        console.log('\nвстретившиеся скелеты:');
        const counts = {};
        skeletons.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
        Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .forEach(([skeleton, count]) => console.log(`  ${String(count).padStart(2)}×  ${skeleton}`));
    }
}

main().catch(e => { console.error(e); process.exit(1); });
