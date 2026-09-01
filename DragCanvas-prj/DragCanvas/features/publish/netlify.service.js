import crypto from 'crypto';

const NETLIFY_API = 'https://api.netlify.com/api/v1';

/** Turn "My Cool Site!" into "my-cool-site". */
export function slugify(text) {
    return String(text).toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
}

/**
 * External API integration: deploy a single HTML page to Netlify.
 * Creates the site on the first publish and re-deploys to the same site
 * (same URL) afterwards.
 */
export async function deployToNetlify(html, siteName, existingSiteId, extraFiles = {}, siteOptions = {}) {
    const token = process.env.NETLIFY_TOKEN;
    if (!token) throw new Error('NETLIFY_TOKEN is not configured on the server');

    const jsonHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const createSite = async () => {
        let name = siteName;
        for (let attempt = 0; attempt < 3; attempt++) {
            const response = await fetch(`${NETLIFY_API}/sites`, {
                method: 'POST', headers: jsonHeaders, body: JSON.stringify({ name, ...(siteOptions.password ? { password: siteOptions.password } : {}) }),
            });
            if (response.ok) return response.json();
            if (response.status === 422) {
                // Name already taken - retry with a random suffix
                name = `${siteName}-${Math.random().toString(36).slice(2, 6)}`;
                continue;
            }
            throw new Error(`Netlify create site failed (${response.status}): ${await response.text()}`);
        }
        throw new Error('Could not find a free Netlify site name');
    };

    // 1. Create the site if this project was never published before
    let siteId = existingSiteId;
    let siteUrl = null;
    if (!siteId) {
        const site = await createSite();
        siteId = site.id;
        siteUrl = site.ssl_url || site.url;
    } else if (html.includes('{{DRAGCANVAS_SITE_URL}}')) {
        // A loaded project's URL normally comes from the client. Keep the
        // server correct for stale tabs and direct API callers as well.
        const siteResponse = await fetch(`${NETLIFY_API}/sites/${siteId}`, { headers: jsonHeaders });
        if (siteResponse.ok) {
            const site = await siteResponse.json();
            siteUrl = site.ssl_url || site.url;
        }
    }
    if (existingSiteId && siteOptions.password !== undefined) {
        const updateSite = await fetch(`${NETLIFY_API}/sites/${siteId}`, { method: 'PATCH', headers: jsonHeaders, body: JSON.stringify({ password: siteOptions.password || null }) });
        if (!updateSite.ok) throw new Error(`Netlify site protection failed (${updateSite.status}): ${await updateSite.text()}`);
    }

    // The public URL does not exist until Netlify creates the site. The exporter
    // leaves this token in canonical/OG tags so the first deploy is correct too.
    const publicUrl = siteUrl || `https://${siteName}.netlify.app`;
    html = html.replaceAll('{{DRAGCANVAS_SITE_URL}}', publicUrl);
    const deployFiles = { '/index.html': html };
    for (const [path, content] of Object.entries(extraFiles || {})) {
        if ((/^\/[a-z0-9][a-z0-9-]*\/index\.html$/.test(path) || path === '/robots.txt' || path === '/sitemap.xml') && typeof content === 'string') {
            deployFiles[path] = content.replaceAll('{{DRAGCANVAS_SITE_URL}}', publicUrl);
        }
    }

    // 2. Announce the deploy by file digest (Netlify's SHA1 method)
    const digests = Object.fromEntries(Object.entries(deployFiles).map(([path, content]) => [path, crypto.createHash('sha1').update(content).digest('hex')]));
    const createDeploy = () => fetch(`${NETLIFY_API}/sites/${siteId}/deploys`, {
        method: 'POST', headers: jsonHeaders,
        body: JSON.stringify({ files: digests }),
    });

    let deployResponse = await createDeploy();

    // The stored site was deleted on Netlify - create a fresh one and retry
    if (deployResponse.status === 404 && existingSiteId) {
        const site = await createSite();
        siteId = site.id;
        siteUrl = site.ssl_url || site.url;
        deployResponse = await createDeploy();
    }
    if (!deployResponse.ok) {
        throw new Error(`Netlify create deploy failed (${deployResponse.status}): ${await deployResponse.text()}`);
    }

    const deploy = await deployResponse.json();

    // 3. Upload the content only if Netlify does not have this digest yet
    for (const [path, content] of Object.entries(deployFiles)) {
        if ((deploy.required || []).includes(digests[path])) {
            const uploadResponse = await fetch(`${NETLIFY_API}/deploys/${deploy.id}/files${path}`, {
                method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/octet-stream' }, body: content,
            });
            if (!uploadResponse.ok) throw new Error(`Netlify file upload failed (${uploadResponse.status}): ${await uploadResponse.text()}`);
        }
    }

    return { siteId, url: siteUrl || deploy.ssl_url || deploy.url };
}

/**
 * Take a published site down, because its project is gone.
 *
 * Deleting a project only ever removed the row. The site it had published went
 * on serving, on a URL nobody could reach from the account any more and nobody
 * could take down either - the id that identified it was in the row that had
 * just been deleted. Every deleted-but-published project was a page left up for
 * good, and a name nobody could reuse.
 *
 * Reports rather than throws. The project is going away either way: this is the
 * user's own delete, and refusing it because a third-party API was briefly
 * unhappy would trap them with a project they have asked twice to be rid of.
 * The caller says what happened.
 *
 * @returns {Promise<{ok: boolean, reason?: string}>} ok when the site is gone -
 *   including when it was already gone, which is the same outcome.
 */
export async function deleteNetlifySite(siteId) {
    if (!siteId) return { ok: true };

    const token = process.env.NETLIFY_TOKEN;
    if (!token) return { ok: false, reason: 'NETLIFY_TOKEN is not configured on the server' };

    let response;
    try {
        response = await fetch(`${NETLIFY_API}/sites/${siteId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    } catch (error) {
        return { ok: false, reason: error.message };
    }

    // 404 is not a failure. Somebody deleting the site in Netlify's own
    // dashboard first is the ordinary way this happens, and the end state they
    // asked for is the end state they have.
    if (response.ok || response.status === 404) return { ok: true };
    return { ok: false, reason: `Netlify answered ${response.status}` };
}

export async function connectCustomDomain(siteId, domain) {
    const token = process.env.NETLIFY_TOKEN;
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const update = await fetch(`${NETLIFY_API}/sites/${siteId}`, { method: 'PATCH', headers, body: JSON.stringify({ custom_domain: domain, force_ssl: true }) });
    if (!update.ok) throw new Error(`Netlify domain connection failed (${update.status}): ${await update.text()}`);
    const site = await update.json();
    let ssl = 'pending_dns';
    const provision = await fetch(`${NETLIFY_API}/sites/${siteId}/ssl`, { method: 'POST', headers });
    if (provision.ok) ssl = 'provisioned';
    return { domain: site.custom_domain || domain, ssl, netlifyUrl: site.ssl_url || site.url };
}
