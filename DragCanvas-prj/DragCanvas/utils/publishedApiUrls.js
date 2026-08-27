const LOOPBACK_API = /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/gi;

export function publicApiBase(req, configured = process.env.PUBLIC_API_URL) {
    const explicit = String(configured || '').trim().replace(/\/$/, '');
    if (explicit && !LOOPBACK_API.test(explicit)) return explicit;
    LOOPBACK_API.lastIndex = 0;
    return `${req.protocol}://${req.get('host')}`.replace(/\/$/, '');
}

export function rewritePublishedApiUrls(content, apiBase) {
    if (typeof content !== 'string') return content;
    LOOPBACK_API.lastIndex = 0;
    return content.replace(LOOPBACK_API, String(apiBase || '').replace(/\/$/, ''));
}

export function rewritePublishedFiles(files, apiBase) {
    return Object.fromEntries(Object.entries(files || {}).map(([path, content]) => [
        path,
        rewritePublishedApiUrls(content, apiBase),
    ]));
}
