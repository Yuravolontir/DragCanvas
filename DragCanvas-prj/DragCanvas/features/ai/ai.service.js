    /** External API calls used by the AI website generator. */

const GLM_API = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const GLM_MODEL = 'glm-4-plus';

// Images are served through our own proxy so the editor canvas is not tainted
const PUBLIC_API_URL = process.env.PUBLIC_API_URL || 'http://localhost:3001';

const SYSTEM_PROMPT = `You are a web designer. Output ONLY valid JSON — no markdown, no code blocks, no commentary. Schema: {"sections":[{"type":"container","props":{},"children":[]}]}

ELEMENT TYPES: Container, Text, Button, Video, Image, Link.

Container props: width,height,padding[top,right,bottom,left],margin[t,r,b,l],background{"r","g","b","a"},color{"r","g","b","a"},radius,shadow,flexDirection,alignItems,justifyContent,gap
Text props: text,fontSize,fontWeight,textAlign,color{"r","g","b","a"},margin[t,r,b,l],shadow
Button props: text,buttonStyle,background{"r","g","b","a"},color{"r","g","b","a"},margin[t,r,b,l],radius
Video props: videoId,videoUrl,text
Image props: src,radius,width,height
Link props: href,text,fontSize

IMAGES: Use IMAGE_PLACEHOLDER_1..8 as src. They auto-replace with real photos.
VIDEO: Use VIDEO_PLACEHOLDER_1 as videoUrl in hero.

Create exactly 5 sections:
1. HERO — dark bg, 500px, VIDEO_PLACEHOLDER_1, heading + button
2. ABOUT — light bg, row: IMAGE_PLACEHOLDER_1 + text
3. SERVICES — 3 cards row, each with IMAGE + title + short desc
4. GALLERY — row of 3 images
5. FOOTER — dark, short text

RULES:
- Alternate dark/light backgrounds
- Headings: 36-48px, bold. Body: 16-18px
- Short realistic text (3-8 word headings, 8-15 word descriptions)
- Every prop MUST be present
- Output ONLY the JSON object starting with { and ending with }`;

async function callGlm(messages, maxTokens = 16000, temperature = 0.7) {
    const response = await fetch(GLM_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GLM_API_KEY}`,
        },
        body: JSON.stringify({ model: GLM_MODEL, messages, max_tokens: maxTokens, temperature }),
    });

    const data = await response.json();
    if (!response.ok) {
        const error = new Error(`GLM API error (${response.status})`);
        error.status = response.status;
        error.body = data;
        throw error;
    }
    return data?.choices?.[0]?.message?.content ?? null;
}

/** Ask the model to design a website layout for the given prompt. */
export function generateLayout(prompt) {
    const userMessage = `Create a website for "${prompt}". Use IMAGE_PLACEHOLDER_1..8 for images, VIDEO_PLACEHOLDER_1 for hero video. 5 sections. Output ONLY raw JSON, no markdown.`;
    return callGlm([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
    ]);
}

/** Second chance: ask the model to fix its own broken JSON. */
export function repairLayoutJson(raw) {
    return callGlm([
        { role: 'user', content: `Fix this broken JSON and return ONLY valid JSON matching this schema: {"sections":[{type,props,children}]}\n\n${raw}` },
    ]);
}

export async function fetchPexelsImages(query, count = 10) {
    try {
        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
            { headers: { 'Authorization': process.env.PEXELS_API_KEY } }
        );
        const data = await response.json();
        return (data.photos || []).map(photo => ({
            src: `${PUBLIC_API_URL}/api/image-proxy?url=${encodeURIComponent(photo.src.landscape)}`,
            alt: photo.alt || query,
            width: photo.width,
            height: photo.height,
        }));
    } catch (error) {
        console.log('Pexels image search error:', error.message);
        return [];
    }
}

export async function fetchPexelsVideos(query, count = 5) {
    try {
        const response = await fetch(
            `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
            { headers: { 'Authorization': process.env.PEXELS_API_KEY } }
        );
        const data = await response.json();
        return (data.videos || []).map(video => {
            const hd = video.video_files.find(f => f.quality === 'hd') || video.video_files[0];
            return { videoUrl: hd?.link || '', text: query };
        });
    } catch (error) {
        console.log('Pexels video search error:', error.message);
        return [];
    }
}
