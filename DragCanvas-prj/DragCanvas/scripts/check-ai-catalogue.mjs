/**
 * Guards the AI prompt against drifting away from the editor.
 *
 * The prompt tells the model which components exist and which props they take.
 * When someone adds a component to the resolver in CreateNewProject.jsx, or adds
 * a prop to a component, the prompt silently goes stale and the model keeps
 * building pages out of yesterday's vocabulary.
 *
 * Run: node scripts/check-ai-catalogue.mjs
 * Exits non-zero when something is missing, so it can be wired into CI later.
 */
import fs from 'fs';
import { SYSTEM_PROMPT } from '../features/ai/prompt/system.prompt.js';

/** Props the model must NOT set: it cannot know a correct value. */
const DELIBERATELY_HIDDEN = {
    Video: ['videoId'],          // no way to know a real YouTube id
    Button: ['textComponent'],   // internal nested Text config
};

/** Components the conversion cannot build (they need Craft.js linkedNodes). */
const NOT_GENERATABLE = [
    'Custom1', 'Custom2', 'Custom3', 'Custom2VideoDrop', 'Custom3BtnDrop', 'OnlyButtons',
];

function resolverComponents() {
    const source = fs.readFileSync('src/CreateNewProject.jsx', 'utf8');
    const block = source.match(/resolver=\{\{([\s\S]*?)\}\}/);
    if (!block) throw new Error('resolver not found in CreateNewProject.jsx');
    return [...block[1].matchAll(/^\s*(\w+):/gm)].map(m => m[1]);
}

function componentProps(name) {
    const path = `src/Components/Landing/${name}.jsx`;
    if (!fs.existsSync(path)) return null;
    const source = fs.readFileSync(path, 'utf8');
    const block = source.match(/craft\s*=\s*\{[\s\S]*?props:\s*\{([\s\S]*?)\n\s{2,4}\}/);
    return block ? [...block[1].matchAll(/^\s*(\w+):/gm)].map(m => m[1]) : [];
}

function promptProps() {
    const found = {};
    let current = null;
    for (const line of SYSTEM_PROMPT.split('\n')) {
        const heading = line.match(/^\s*\d+\.\s+(\w+)/);
        if (heading) current = heading[1];
        const props = line.match(/Props:\s*\{(.+)\}/);
        if (props && current) {
            found[current] = [...props[1].matchAll(/"(\w+)"\s*:/g)].map(m => m[1]);
        }
    }
    return found;
}

const resolver = resolverComponents();
const described = promptProps();
const problems = [];

console.log(`resolver: ${resolver.length} components | prompt describes: ${Object.keys(described).length}\n`);

for (const name of resolver) {
    if (NOT_GENERATABLE.includes(name)) {
        console.log(`  ${name.padEnd(18)} skipped - needs linkedNodes, which buildCraftTree cannot produce`);
        continue;
    }

    const told = described[name];
    if (!told) {
        problems.push(`${name} is in the resolver but the prompt never mentions it`);
        console.log(`  ${name.padEnd(18)} MISSING FROM PROMPT`);
        continue;
    }

    const real = componentProps(name) || [];
    const hidden = DELIBERATELY_HIDDEN[name] || [];
    const missing = real.filter(p => !told.includes(p) && !hidden.includes(p));

    if (missing.length > 0) {
        problems.push(`${name}: prompt does not mention ${missing.join(', ')}`);
        console.log(`  ${name.padEnd(18)} missing props: ${missing.join(', ')}`);
    } else {
        console.log(`  ${name.padEnd(18)} ok`);
    }
}

if (problems.length > 0) {
    console.log(`\n${problems.length} problem(s):`);
    problems.forEach(p => console.log(`  - ${p}`));
    process.exit(1);
}

console.log('\nprompt and editor agree');
