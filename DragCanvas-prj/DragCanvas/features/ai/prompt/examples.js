import db from '../../../utils/db.sql.services.js';
import { toSkeleton } from './skeleton.js';

/**
 * Shows the model an example of a real design from this system.
 *
 * The templates in TBTemplates were built by hand in the editor, so they are the
 * best available description of "a good page here". Compressed to skeletons they
 * cost ~1 800 tokens each, which is affordable as a single example per request.
 */

/** Which template category suits which inferred site kind. */
const KIND_TO_CATEGORY = {
    restaurant: 'Business',
    localBusiness: 'Business',
    portfolio: 'Portfolio',
    product: 'Landing Page',
    event: 'Landing Page',
    content: 'Landing Page',
};

let cache = null;
let cachedAt = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;

async function loadSkeletons() {
    if (cache && Date.now() - cachedAt < CACHE_TTL_MS) return cache;

    const rows = await db.executeQuery(`
        SELECT "Template_ID", "TemplateName", "Category", "TemplateData"
        FROM "TBTemplates"
        WHERE "IsActive" = true
    `);

    cache = rows
        .map(row => {
            try {
                const skeleton = toSkeleton(row.TemplateData);
                if (skeleton.sections.length === 0) return null;
                return { id: row.Template_ID, name: row.TemplateName, category: row.Category, skeleton };
            } catch (error) {
                console.log(`[AI] skipping template ${row.Template_ID}: ${error.message}`);
                return null;
            }
        })
        .filter(Boolean);

    cachedAt = Date.now();
    console.log(`[AI] cached ${cache.length} template skeletons`);
    return cache;
}

const pickRandom = list => list[Math.floor(Math.random() * list.length)];

/**
 * How often a request gets an example at all.
 *
 * Measured tradeoff: with an example on every request the model imitates it
 * closely and variety collapses - six of eight cafe generations came back with
 * an identical skeleton, and portfolio requests always saw the same template
 * because only one exists in that category. Showing an example roughly half the
 * time keeps the quality anchor without turning it into a new mould.
 */
const EXAMPLE_PROBABILITY = 0.5;

/**
 * One example, usually from a template whose category matches the kind of site.
 * Returns an empty string when no example should be shown, so the prompt simply
 * goes without one rather than failing.
 */
export async function buildExampleSection(kindKey) {
    if (Math.random() > EXAMPLE_PROBABILITY) return '';

    try {
        const skeletons = await loadSkeletons();
        if (skeletons.length === 0) return '';

        const wanted = KIND_TO_CATEGORY[kindKey];
        const matching = skeletons.filter(t => t.category === wanted);

        // Only lean on the category when there is more than one to choose from;
        // a single matching template would make every answer look like it.
        const pool = matching.length > 1 ? matching : skeletons;
        const chosen = pickRandom(pool);

        return `
EXAMPLE OF A REAL PAGE BUILT IN THIS SYSTEM ("${chosen.name}")

This is the structure only — colours are shown as dark/light/accent, text is
replaced by its length, and decoration is stripped. Study how sections are
composed and nested; do not copy it literally, and build something that fits
the request you were given.

${JSON.stringify(chosen.skeleton)}
`;
    } catch (error) {
        console.log(`[AI] no example available: ${error.message}`);
        return '';
    }
}
