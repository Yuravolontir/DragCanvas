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
export async function deployToNetlify(html, siteName, existingSiteId) {
    const token = process.env.NETLIFY_TOKEN;
    if (!token) throw new Error('NETLIFY_TOKEN is not configured on the server');

    const jsonHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const createSite = async () => {
        let name = siteName;
        for (let attempt = 0; attempt < 3; attempt++) {
            const response = await fetch(`${NETLIFY_API}/sites`, {
                method: 'POST', headers: jsonHeaders, body: JSON.stringify({ name }),
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
    }

    // 2. Announce the deploy by file digest (Netlify's SHA1 method)
    const sha1 = crypto.createHash('sha1').update(html).digest('hex');
    const createDeploy = () => fetch(`${NETLIFY_API}/sites/${siteId}/deploys`, {
        method: 'POST', headers: jsonHeaders,
        body: JSON.stringify({ files: { '/index.html': sha1 } }),
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
    if ((deploy.required || []).includes(sha1)) {
        const uploadResponse = await fetch(`${NETLIFY_API}/deploys/${deploy.id}/files/index.html`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
            body: html,
        });
        if (!uploadResponse.ok) {
            throw new Error(`Netlify file upload failed (${uploadResponse.status}): ${await uploadResponse.text()}`);
        }
    }

    return { siteId, url: siteUrl || deploy.ssl_url || deploy.url };
}
