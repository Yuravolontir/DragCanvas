/**
 * What tends to belong on different kinds of site.
 *
 * Measured problem this solves: the old prompt demanded a Carousel and a Map in
 * every design, so a coffee shop, a portfolio and a SaaS landing all came out
 * with the same ingredients — carousel and map appeared in 15 generations out
 * of 15. Here each kind gets its own vocabulary and nothing is compulsory.
 *
 * That fixed the ingredients and left the shape. `sections` used to read as a
 * running order, so every bakery came back with the same six sections in the same
 * sequence and only the colours changed. It is a menu now: more entries than any
 * one page should use, and the model chooses which and in what order. The
 * composition drawn in design.presets.js decides the shape they are poured into.
 */

const SITE_KINDS = {
    restaurant: {
        label: 'restaurant / cafe / bar',
        sections: 'hero with atmosphere · the menu or signature dishes · a gallery of the place · the story behind it · the people who cook · a dish of the week · what regulars say · opening hours and how to find it · booking or ordering · footer',
        notes: 'A map genuinely helps here — people need to find the place. Photography matters more than text. Opening hours suit a Timeline or a List; a menu suits Columns of Text.',
        keywords: ['restaurant', 'cafe', 'coffee', 'bar', 'bakery', 'pizzeria', 'bistro', 'kitchen', 'food', 'menu', 'diner', 'pub', 'sushi'],
    },
    portfolio: {
        label: 'portfolio / personal site of a creator',
        sections: 'hero with the name and what they do · a grid of selected works · one project told in depth · a short about · how they work · clients or places published · a way to get in touch · footer',
        notes: 'The work is the content. Large images, generous whitespace, very little copy. A Quote can carry the one line of positioning. No map, no carousel unless the work is photography.',
        keywords: ['portfolio', 'photographer', 'designer', 'artist', 'illustrator', 'architect', 'freelance', 'showcase', 'works', 'creative'],
    },
    product: {
        label: 'SaaS / app / digital product',
        sections: 'hero with the promise and a call to action · the main features · how it works · what it replaces · pricing · testimonials or logos · frequently asked questions · final call to action · footer',
        notes: 'Conversion-driven. Pricing and Accordion both belong here, and a CTABanner near the end. Stats and LogoStrip carry the credibility. No map — the product has no address.',
        keywords: ['saas', 'app', 'platform', 'software', 'startup', 'dashboard', 'tool', 'api', 'crm', 'analytics', 'subscription'],
    },
    localBusiness: {
        label: 'local business / services',
        sections: 'hero · the services offered · why choose us · gallery of past work · prices or a quote request · the team · what customers say · contact details with a map · footer',
        notes: 'Trust and reachability matter. A map is useful. Testimonial and TeamGrid are what build the trust; Pricing suits a fixed price list.',
        keywords: ['salon', 'barber', 'clinic', 'dentist', 'gym', 'fitness', 'studio', 'repair', 'plumber', 'garage', 'law', 'agency', 'shop', 'store', 'florist', 'dealership', 'veterinary', 'vet ', 'estate', 'charity', 'nonprofit', 'foundation', 'shelter'],
    },
    event: {
        label: 'event / conference / wedding',
        sections: 'hero with date and place · the programme or schedule · speakers or people involved · what previous years looked like · venue with a map · tickets or registration · getting there and staying · footer',
        notes: 'The date and the call to register are the point. A Timeline is the natural shape for a schedule, TeamGrid for the speakers, CTABanner for registering.',
        keywords: ['event', 'conference', 'wedding', 'festival', 'meetup', 'summit', 'workshop', 'concert', 'exhibition'],
    },
    education: {
        label: 'school / academy / lessons / course',
        sections: 'hero showing the thing being taught · the classes or levels offered · who the instructors are · how a beginner starts · safety and what to bring · what students and parents say · prices or packages · the timetable · where it happens with a map · sign up or book a trial · footer',
        notes: 'A parent or a beginner is deciding whether this is for them, so the levels and the first step matter more than the history. A Timeline suits a syllabus or a term schedule, TeamGrid the instructors, Pricing the packages, Countdown a term or intake that starts on a date. Photographs of real lessons do more than any amount of copy.',
        keywords: ['school', 'academy', 'lesson', 'lessons', 'course', 'courses', 'class', 'classes', 'training', 'coaching', 'tutor', 'tutoring', 'instructor', 'teacher', 'learn', 'camp', 'workshop for', 'driving', 'language', 'music school', 'dance', 'yoga', 'martial', 'swimming', 'bmx', 'skate', 'climbing'],
    },

    content: {
        label: 'blog / magazine / personal page',
        sections: 'hero with what this publication is about · the latest pieces · one piece featured in full · who writes it · subscribe by email · what readers say · an archive or topics list · footer',
        notes: 'Reading comfort first: narrow text column, clear typography. Rarely needs a carousel or a map.',
        keywords: ['blog', 'magazine', 'journal', 'newsletter', 'articles', 'writer', 'travel diary', 'recipes', 'podcast', 'essays', 'column'],
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

Sections that could belong on such a page: ${kind.sections}.
${kind.notes}

This is a menu, not a running order. It deliberately lists more than one page
should carry: choose five to seven that earn their place for this particular
subject, put them in whatever order tells the story best, and invent one if the
subject calls for something that is not here.

Do not simply work down the list. Two pages built from the same menu in the same
sequence are the same page in different colours, and the visual brief above has
already decided the shape this one should take.`;
}

export { SITE_KINDS };
