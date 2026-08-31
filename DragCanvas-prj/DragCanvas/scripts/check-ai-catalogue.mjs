/**
 * Guards the AI prompt against drifting away from the editor.
 *
 * The prompt tells the model which components exist and which props they take.
 * When someone adds a component to the editor resolver, or adds
 * a prop to a component, the prompt silently goes stale and the model keeps
 * building pages out of yesterday's vocabulary.
 *
 * Run: node scripts/check-ai-catalogue.mjs
 * Exits non-zero when something is missing, so it can be wired into CI later.
 */
import fs from 'fs';
import { SYSTEM_PROMPT } from '../features/ai/prompt/system.prompt.js';
import { ANIMATION_NAMES } from '../src/utils/animation.js';

/** Props the model must NOT set: it cannot know a correct value. */
const DELIBERATELY_HIDDEN = {
    Video: ['videoId'],          // generated sites use stock files, not a YouTube id
    Button: ['textComponent'],   // internal nested Text config
};

/** Components the conversion cannot build (they need Craft.js linkedNodes). */
const NOT_GENERATABLE = [
    'Custom1', 'Custom2', 'Custom3', 'Custom2VideoDrop', 'Custom3BtnDrop', 'OnlyButtons',
];

/**
 * In the resolver and in the toolbox, but the model must not author them.
 *
 * Different from NOT_GENERATABLE: these build fine, they are just not what the
 * generator should reach for.
 */
const NOT_AUTHORED = [
    // A YouTube clip is somebody's own video. The generator has no id it could
    // honestly put here, and an invented one embeds a stranger's video, so the
    // prompt does not mention it; a person adds it from the toolbox.
    'YouTube',
];

/** Old resolver names retained only so saved projects can still deserialize. */
const LEGACY_ONLY = ['BackgroundVideo'];

function resolverComponents() {
    const source = fs.readFileSync('src/editor/editorResolver.js', 'utf8');
    const block = source.match(/export const editorResolver\s*=\s*\{([\s\S]*?)\n\};/);
    if (!block) throw new Error('resolver not found in src/editor/editorResolver.js');
    return [...block[1].matchAll(/\b(\w+)\s*:\s*Landing\./g)].map(m => m[1]);
}

function componentProps(name) {
    const path = `src/editor/Landing/${name}.jsx`;
    if (!fs.existsSync(path)) return null;
    const source = fs.readFileSync(path, 'utf8');
    const block = source.match(/craft\s*=\s*\{[\s\S]*?props:\s*\{([\s\S]*?)\n\s{2,4}\}/);
    return block ? [...block[1].matchAll(/^\s*(\w+):/gm)].map(m => m[1]) : [];
}

function promptProps() {
    const found = {};
    let current = null;
    for (const line of SYSTEM_PROMPT.split('\n')) {
        // A shouted heading ends the element list. Without this, the Props line
        // in a section such as ANIMATION was read as belonging to whichever
        // element was numbered last, and that element's real props went missing.
        if (/^[A-Z][A-Z ]{2,}[-:( ]/.test(line)) current = null;
        const heading = line.match(/^\s*\d+\.\s+(\w+)/);
        if (heading) current = heading[1];
        const props = line.match(/Props:\s*\{(.+)\}/);
        if (props && current) {
            found[current] = [...props[1].matchAll(/"(\w+)"\s*:/g)].map(m => m[1]);
        }
    }
    return found;
}

/**
 * The toolbox is the third hand-maintained list of the same components, after
 * the resolver and the prompt. Parsed the same way: by regex, so this script
 * stays dependency-free and does not have to import JSX.
 */
function catalogueEntries() {
    const path = 'src/editor/Landing/elements.catalogue.jsx';
    const source = fs.readFileSync(path, 'utf8');
    const groups = source.match(/ELEMENT_GROUPS\s*=\s*\[([^\]]*)\]/);
    const known = groups ? [...groups[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [];
    const entries = [];
    for (const block of source.split(/\n  \{\n/).slice(1)) {
        const field = (k) => (block.match(new RegExp(`^\\s*${k}: '([^']*)'`, 'm')) || [])[1];
        const name = field('name');
        if (name) entries.push({ name, group: field('group'), icon: field('icon'), tip: field('tip'), label: field('label') });
    }
    return { entries, known };
}

/**
 * The entrances the prompt offers have to be the entrances that exist.
 *
 * A name the exporter does not know falls back to standing still, so a drifted
 * list shows up as generated pages that quietly do not move.
 */
function checkAnimationVocabulary(problems) {
    const line = SYSTEM_PROMPT.split('\n').find((row) => row.includes('"animation" is exactly one of:'));
    if (!line) {
        problems.push('the prompt never tells the model which animations exist');
        return;
    }
    const listed = line.split(':')[1].split(',').map((name) => name.trim()).filter(Boolean);
    const missing = ANIMATION_NAMES.filter((name) => !listed.includes(name));
    const unknown = listed.filter((name) => !ANIMATION_NAMES.includes(name));
    if (missing.length) problems.push(`animations the prompt never offers: ${missing.join(', ')}`);
    if (unknown.length) problems.push(`animations the prompt offers that do not exist: ${unknown.join(', ')}`);
}

const resolver = resolverComponents();
const described = promptProps();
const { entries: catalogue, known: knownGroups } = catalogueEntries();
const problems = [];
checkAnimationVocabulary(problems);

console.log(`resolver: ${resolver.length} components | prompt describes: ${Object.keys(described).length}\n`);

for (const name of resolver) {
    if (LEGACY_ONLY.includes(name)) {
        console.log(`  ${name.padEnd(18)} skipped - legacy compatibility only`);
        continue;
    }
    if (NOT_GENERATABLE.includes(name)) {
        console.log(`  ${name.padEnd(18)} skipped - needs linkedNodes, which buildCraftTree cannot produce`);
        continue;
    }

    if (NOT_AUTHORED.includes(name)) {
        // The prompt must not describe it, or the model will use it anyway.
        if (described[name]) {
            problems.push(`${name} is not for the generator, but the prompt still describes it`);
            console.log(`  ${name.padEnd(18)} STILL IN PROMPT`);
        } else {
            console.log(`  ${name.padEnd(18)} skipped - not authored by the model`);
        }
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

// ---- The toolbox catalogue ----
//
// Same exclusion list as above: the Custom* helpers cannot be built from
// serialized props, and they are not things a user drags either.

console.log(`\ncatalogue: ${catalogue.length} elements | groups: ${knownGroups.join(', ')}\n`);

const byName = new Map(catalogue.map(e => [e.name, e]));

for (const name of resolver) {
    if (LEGACY_ONLY.includes(name)) continue;
    if (NOT_GENERATABLE.includes(name)) continue;
    if (!byName.has(name)) {
        problems.push(`${name} is in the resolver but has no entry in elements.catalogue.jsx, so nothing in the toolbox can add it`);
        console.log(`  ${name.padEnd(18)} MISSING FROM TOOLBOX`);
    }
}

for (const entry of catalogue) {
    if (!resolver.includes(entry.name)) {
        problems.push(`${entry.name} is in elements.catalogue.jsx but not in the resolver, so dropping it would break the project`);
    }
    if (!knownGroups.includes(entry.group)) {
        problems.push(`${entry.name}: group "${entry.group}" is not one of ${knownGroups.join(', ')}`);
    }
    const shown = entry.label || entry.name;
    if (!entry.tip || entry.tip.toLowerCase() === shown.toLowerCase()) {
        problems.push(`${entry.name}: tooltip "${entry.tip}" only repeats the label - say something the label does not`);
    }
}

const iconOwners = new Map();
for (const entry of catalogue) {
    if (!iconOwners.has(entry.icon)) iconOwners.set(entry.icon, []);
    iconOwners.get(entry.icon).push(entry.label || entry.name);
}
for (const [icon, owners] of iconOwners) {
    if (owners.length > 1) {
        problems.push(`icon "${icon}" is used by ${owners.join(' and ')} - two elements drawn the same are two the user cannot tell apart`);
        console.log(`  ${icon.padEnd(18)} DUPLICATE: ${owners.join(', ')}`);
    }
}

if (problems.length > 0) {
    console.log(`\n${problems.length} problem(s):`);
    problems.forEach(p => console.log(`  - ${p}`));
    process.exit(1);
}

console.log('\nprompt, editor and toolbox agree');
