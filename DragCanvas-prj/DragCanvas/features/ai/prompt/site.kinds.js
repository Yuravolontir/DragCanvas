/**
 * What tends to belong on different kinds of site.
 *
 * Measured problem this solves: the old prompt demanded a Carousel and a Map in
 * every design, so a coffee shop, a portfolio and a SaaS landing all came out
 * with the same ingredients — carousel and map appeared in 15 generations out
 * of 15. Here each kind gets its own vocabulary and nothing is compulsory.
 */

const SITE_KINDS = {
    restaurant: {
        label: 'restaurant / cafe / bar',
        sections: 'hero with atmosphere, the menu or signature dishes, a gallery of the place, the story behind it, opening hours and how to find it, footer',
        notes: 'A map genuinely helps here — people need to find the place. Photography matters more than text.',
        keywords: ['restaurant', 'cafe', 'coffee', 'bar', 'bakery', 'pizzeria', 'bistro', 'kitchen', 'food', 'menu', 'diner', 'pub', 'sushi'],
    },
    portfolio: {
        label: 'portfolio / personal site of a creator',
        sections: 'hero with the name and what they do, a grid of selected works, a short about, a way to get in touch, footer',
        notes: 'The work is the content. Large images, generous whitespace, very little copy. No map, no carousel unless the work is photography.',
        keywords: ['portfolio', 'photographer', 'designer', 'artist', 'illustrator', 'architect', 'freelance', 'showcase', 'works', 'creative'],
    },
    product: {
        label: 'SaaS / app / digital product',
        sections: 'hero with the promise and a call to action, the main features, how it works, pricing, testimonials or logos, final call to action, footer',
        notes: 'Conversion-driven. Repeated call-to-action buttons. No map — the product has no address.',
        keywords: ['saas', 'app', 'platform', 'software', 'startup', 'dashboard', 'tool', 'api', 'crm', 'analytics', 'subscription'],
    },
    localBusiness: {
        label: 'local business / services',
        sections: 'hero, the services offered, why choose us, gallery of past work, contact details with a map, footer',
        notes: 'Trust and reachability matter. A map is useful. Prices or a quote request often belong here.',
        keywords: ['salon', 'barber', 'clinic', 'dentist', 'gym', 'fitness', 'studio', 'repair', 'plumber', 'garage', 'law', 'agency', 'shop', 'store'],
    },
    event: {
        label: 'event / conference / wedding',
        sections: 'hero with date and place, the programme or schedule, speakers or people involved, venue with a map, registration, footer',
        notes: 'The date and the call to register are the point. A countdown feel helps.',
        keywords: ['event', 'conference', 'wedding', 'festival', 'meetup', 'summit', 'workshop', 'concert', 'exhibition'],
    },
    content: {
        label: 'blog / magazine / personal page',
        sections: 'hero, a list of recent posts, an about section, subscribe, footer',
        notes: 'Reading comfort first: narrow text column, clear typography. Rarely needs a carousel or a map.',
        keywords: ['blog', 'magazine', 'journal', 'newsletter', 'articles', 'writer', 'travel diary', 'recipes'],
    },
};

const FALLBACK = {
    label: 'general website',
    sections: 'hero, what this is about, supporting sections that fit the subject, a way to get in touch, footer',
    notes: 'Choose sections that genuinely suit the subject rather than filling a checklist.',
};

/** Cheap keyword match; a wrong guess only changes which advice is shown. */
export function inferSiteKind(prompt) {
    const text = String(prompt).toLowerCase();

    let best = null;
    let bestScore = 0;

    for (const [key, kind] of Object.entries(SITE_KINDS)) {
        const score = kind.keywords.filter(word => text.includes(word)).length;
        if (score > bestScore) {
            best = key;
            bestScore = score;
        }
    }

    return best ? { key: best, ...SITE_KINDS[best] } : { key: 'general', ...FALLBACK };
}

/** The part of the system prompt that describes this particular kind of site. */
export function describeSiteKind(kind) {
    return `THIS REQUEST LOOKS LIKE: ${kind.label}

Sections that usually belong on such a page: ${kind.sections}.
${kind.notes}

These are suggestions, not a checklist. Include a section only when it earns its
place for this specific subject, and feel free to invent one that is not listed.`;
}

export { SITE_KINDS };
