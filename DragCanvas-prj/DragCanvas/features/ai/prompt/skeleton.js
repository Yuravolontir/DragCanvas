/**
 * Compresses a saved design into a structural skeleton small enough to show the
 * model as an example.
 *
 * Craft.js stores a flat map of nodes with editor bookkeeping — ids, parent
 * links, display names, every styling prop. A whole template is 23-35 KB, so two
 * raw examples would cost ~18 000 input tokens per generation. What the model
 * needs from an example is the shape: which elements, nested how, with the props
 * that affect layout. Everything else goes.
 */

/**
 * Props worth keeping: they describe layout, not decoration.
 *
 * The two animation entries are here because a rule in prose ("stagger a row")
 * is worth much less than an example that visibly does it. Duration and repeat
 * stay out: they are decoration, and the defaults are the right answer.
 */
const LAYOUT_PROPS = [
    'flexDirection', 'alignItems', 'justifyContent', 'fillSpace',
    'width', 'height', 'radius',
    'variant', 'sticky', 'buttonStyle', 'sourceType', 'textAlign', 'fontWeight',
    'animation', 'animationDelay',
];

/** Turns rgba into a coarse label - exact colours are noise in an example. */
function describeBackground(background) {
    if (!background || typeof background !== 'object') return undefined;
    const { r = 255, g = 255, b = 255, a = 1 } = background;
    if (a === 0) return 'transparent';
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    if (brightness < 80) return 'dark';
    if (brightness > 200) return 'light';
    return 'accent';
}

/** ["40","40","40","40"] -> 40, or undefined when it is all zeros. */
function describePadding(padding) {
    if (!Array.isArray(padding)) return undefined;
    const values = padding.map(v => parseInt(v, 10) || 0);
    const max = Math.max(...values);
    return max > 0 ? max : undefined;
}

/** Values equal to the editor's defaults tell the model nothing. */
const DEFAULTS = {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    radius: 0,
    fillSpace: 'no',
    height: 'auto',
    width: 'auto',
};

function compressProps(props = {}) {
    const kept = {};

    for (const key of LAYOUT_PROPS) {
        const value = props[key];
        if (value === undefined || value === '' || value === 'auto' || value === 'no') continue;
        if (DEFAULTS[key] !== undefined && String(value) === String(DEFAULTS[key])) continue;
        kept[key] = value;
    }

    const background = describeBackground(props.background);
    if (background && background !== 'transparent') kept.background = background;

    const padding = describePadding(props.padding);
    if (padding) kept.padding = padding;

    // Keep how long the text is, not what it says
    if (typeof props.text === 'string' && props.text.trim()) {
        kept.text = props.text.length > 40 ? 'long text' : 'short text';
    }
    if (props.fontSize) kept.fontSize = Number(props.fontSize);

    return kept;
}

function resolveTypeName(node) {
    return node?.type?.resolvedName || node?.type || 'Unknown';
}

/**
 * Walk the flat node map into a nested skeleton.
 * `nodes` holds ordinary children, `linkedNodes` holds slots of composite
 * components (the Custom* blocks), so both are followed.
 */
function buildNode(nodeMap, nodeId, depth = 0, maxDepth = 6) {
    const node = nodeMap[nodeId];
    if (!node || depth > maxDepth) return null;

    const childIds = [
        ...(node.nodes || []),
        ...Object.values(node.linkedNodes || {}),
    ];

    const skeleton = {
        type: resolveTypeName(node),
        props: compressProps(node.props),
    };

    const children = childIds
        .map(id => buildNode(nodeMap, id, depth + 1, maxDepth))
        .filter(Boolean);

    if (children.length > 0) skeleton.children = children;
    if (Object.keys(skeleton.props).length === 0) delete skeleton.props;

    return skeleton;
}

/**
 * @param {object|string} templateData serialised Craft.js state (may be double-encoded)
 * @returns {{sections: object[]}} the same shape the model is asked to produce
 */
export function toSkeleton(templateData) {
    let data = templateData;
    // Stored templates are sometimes JSON inside JSON
    for (let i = 0; i < 2 && typeof data === 'string'; i++) data = JSON.parse(data);

    const root = data?.ROOT;
    if (!root) return { sections: [] };

    const sections = (root.nodes || [])
        .map(id => buildNode(data, id))
        .filter(Boolean);

    return { sections };
}
