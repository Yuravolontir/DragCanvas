const LOOPBACK_API = /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/gi;
const PRODUCTION_API = 'https://dragcanvas.onrender.com';

function isLoopback(value) {
    LOOPBACK_API.lastIndex = 0;
    return LOOPBACK_API.test(String(value || ''));
}

export function publicApiBase(req, configured = process.env.PUBLIC_API_URL) {
    const explicit = String(configured || '').trim().replace(/\/$/, '');
    if (explicit && !isLoopback(explicit)) return explicit;

    const requestOrigin = `${req.protocol}://${req.get('host')}`.replace(/\/$/, '');
    // Publishing can legitimately be initiated through the local development
    // server. The generated public site still has to call the production API,
    // not the developer's (or a visitor's) loopback interface.
    return isLoopback(requestOrigin) ? PRODUCTION_API : requestOrigin;
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
