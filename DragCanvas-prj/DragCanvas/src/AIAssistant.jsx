import React, { useState } from 'react';
  import { useEditor } from '@craftjs/core';

  export default function AIAssistant() {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { actions } = useEditor();

    const buildCraftTree = (sections) => {
      const nodes = {};

      nodes.ROOT = {
        type: { resolvedName: 'Container' },
        isCanvas: true,
        props: { width: '100%', flexDirection: 'column' },
        displayName: 'Container',
        custom: {},
        hidden: false,
        nodes: []
      };

      let idCounter = 1;

      const buildNode = (element, parentId) => {
        const nodeId = `node-${idCounter++}`;
        const resolvedName = element.type
          ? element.type.charAt(0).toUpperCase() + element.type.slice(1)
          : 'Container';

        nodes[nodeId] = {
          type: { resolvedName },
          isCanvas: element.type === 'container',
          props: element.props || {},
          displayName: resolvedName,
          custom: {},
          hidden: false,
          nodes: []
        };

        nodes[parentId].nodes.push(nodeId);

        // Recursively build children
        if (Array.isArray(element.children) && element.children.length > 0) {
          for (const child of element.children) {
            buildNode(child, nodeId);
          }
        }
      };

      for (const section of sections) {
        const sectionId = `section-${idCounter++}`;

        nodes[sectionId] = {
          type: { resolvedName: 'Container' },
          isCanvas: true,
          props: section.props || {},
          displayName: 'Container',
          custom: {},
          hidden: false,
          nodes: []
        };

        nodes.ROOT.nodes.push(sectionId);

        // Build all children recursively
        if (Array.isArray(section.children)) {
          for (const child of section.children) {
            buildNode(child, sectionId);
          }
        }
      }

      return nodes;
    };

    const generateImage = async (imagePrompt) => {
      try {
        const formData = new FormData();
        formData.append('prompt', imagePrompt);
        formData.append('output_format', 'png');
        formData.append('aspect_ratio', '16:9');

        const res = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_STABILITY_API_KEY}`,
            'Accept': 'image/*',
          },
          body: formData,
        });

        if (!res.ok) return null;
        const blob = await res.blob();
        return URL.createObjectURL(blob);
      } catch (e) {
        console.error('Stability AI error:', e);
        return null;
      }
    };

    const collectImageInfo = (sections) => {
      const images = [];
      const walk = (elements) => {
        if (!Array.isArray(elements)) return;
        for (const el of elements) {
          if (el.type === 'Image' && el.props?.src?.includes('picsum.photos/seed/')) {
            const seed = el.props.src.split('/seed/')[1]?.split('/')[0] || 'image';
            const desc = seed.replace(/[-_]/g, ' ');
            images.push({ path: el, seed, prompt: `${desc}, professional website photo, high quality` });
          }
          if (el.type === 'Carousel') {
            ['src1', 'src2', 'src3'].forEach((key, i) => {
              if (el.props?.[key]?.includes('picsum.photos/seed/')) {
                const seed = el.props[key].split('/seed/')[1]?.split('/')[0] || `slide${i + 1}`;
                const heading = el.props?.[`heading${i + 1}`] || '';
                const desc = seed.replace(/[-_]/g, ' ');
                images.push({ path: el, key, seed, prompt: `${desc}${heading ? ', ' + heading : ''}, professional website photo, high quality` });
              }
            });
          }
          if (el.children) walk(el.children);
        }
      };
      walk(sections);
      return images;
    };

    const replaceImages = async (sections) => {
      const images = collectImageInfo(sections);
      if (images.length === 0) return;

      const prompts = [...new Set(images.map(i => i.prompt))].slice(0, 6);
      const results = await Promise.all(
        prompts.map(p => generateImage(p))
      );
      const urlMap = {};
      prompts.forEach((p, i) => { urlMap[p] = results[i]; });

      images.forEach(img => {
        const url = urlMap[img.prompt];
        if (url) {
          if (img.key) {
            img.path.props[img.key] = url;
          } else {
            img.path.props.src = url;
          }
        }
      });
    };

    const generateWebsite = async () => {
      if (!prompt.trim()) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
            'HTTP-Referer': window.location.origin,
          },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-001',
            messages: [
              {
                role: 'system',
                content: `You are a creative website builder AI. Given a user description, generate a visually stunning website as JSON. Be CREATIVE and use ALL available elements generously. Return ONLY valid JSON: { "sections": [...] }.

STRUCTURE:
- "sections" is an array of top-level section containers
- Each section: { "props": { ...containerProps }, "children": [ ...elements ] }
- Children can nest: { "type": "Container", "props": { ... }, "children": [ ... ] }
- Leaf elements have "type" and "props" but NO "children"

AVAILABLE ELEMENTS (use these EXACT type names, use ALL of them when appropriate):

1. Container (layout wrapper, can have children):
   Props: { "width": "100%", "height": "auto", "flexDirection": "row"|"column", "alignItems": "flex-start"|"center"|"flex-end", "justifyContent": "flex-start"|"center"|"flex-end"|"space-between", "background": {"r":255,"g":255,"b":255,"a":1}, "color": {"r":0,"g":0,"b":0,"a":1}, "padding": ["0","0","0","0"], "margin": ["0","0","0","0"], "shadow": 0, "radius": 0, "fillSpace": "no"|"yes" }

2. Text (inline text, editable):
   Props: { "text": "Hello World", "fontSize": "15", "fontWeight": "400"|"500"|"600"|"700", "textAlign": "left"|"center"|"right", "color": {"r":92,"g":90,"b":90,"a":1}, "shadow": 0, "margin": [0,0,0,0] }

3. Button (clickable button):
   Props: { "text": "Click Me", "background": {"r":0,"g":96,"b":172,"a":1}, "color": {"r":255,"g":255,"b":255,"a":1}, "buttonStyle": "full"|"outline", "margin": ["5","0","5","0"] }

4. Image (image with optional border radius):
   Props: { "src": "https://picsum.photos/800/400", "radius": 0, "width": "auto", "height": "auto" }

5. Video (YouTube embed OR background video with text overlay):
   Props: { "sourceType": "youtube"|"url", "videoId": "dQw4w9WgXcQ", "videoUrl": "", "text": "" }
   For YouTube: set sourceType:"youtube" and videoId.
   For background video with text overlay: set sourceType:"url", videoUrl to a direct .mp4 URL, and set "text" to display overlaid on the video (e.g. "Welcome to Our Company").
   Reliable stock video URLs: https://cdn.pixabay.com/video/2020/02/04/31877-389674498_large.mp4, https://cdn.pixabay.com/video/2021/08/20/86076-588504506_large.mp4, https://cdn.pixabay.com/video/2024/01/25/198165-906549789_large.mp4

6. Link (hyperlink):
   Props: { "href": "https://example.com", "text": "Click here", "fontSize": "16", "fontWeight": "500", "width": "auto", "height": "auto" }

7. Carousel (3-slide image carousel with captions):
   Props: { "src1": "url", "src2": "url", "src3": "url", "heading1": "Title", "heading2": "Title", "heading3": "Title", "label1": "Badge", "label2": "", "label3": "", "p1": "Description", "p2": "Description", "p3": "Description", "width": "600px", "height": "400px" }
   Use ONLY these exact working image URLs for carousel slides. Pick from these:
   https://picsum.photos/seed/hero1/800/400, https://picsum.photos/seed/hero2/800/400, https://picsum.photos/seed/hero3/800/400, https://picsum.photos/seed/card1/400/300, https://picsum.photos/seed/card2/400/300, https://picsum.photos/seed/card3/400/300, https://picsum.photos/seed/gallery1/600/400, https://picsum.photos/seed/gallery2/600/400, https://picsum.photos/seed/gallery3/600/400

8. Map (Leaflet map with marker):
   Props: { "lat": 32.3215, "lng": 34.8532, "zoom": 13, "height": "300px", "width": "100%", "label": "Location Name" }

9. NavbarElement (navigation bar - ALWAYS include as the first section):
   Props: { "variant": "dark"|"primary"|"light", "brand": "My Brand", "links": [{"text":"Home","href":"#"},{"text":"About","href":"#"},{"text":"Contact","href":"#"}], "textColor": {"r":255,"g":255,"b":255,"a":1}, "height": "56px", "width": "100%", "sticky": false }
   Always add a NavbarElement as the FIRST section. Make brand name relevant to the website topic. Use 3-5 links.

CREATIVE DESIGN PATTERNS YOU MUST USE:

- HERO SECTION: Full-width dark Container with a Video (sourceType:"url" with text overlay) or large Text (fontSize:"48", fontWeight:"700") + subtitle Text + Button. Add dramatic shadow.

- NAVBAR: Always first section. Use "dark" or "primary" variant. Make it sticky: true for single-page sites.

- GALLERY/SHOWCASE: Row Container with 3 card Containers, each with Image + Text + Button. Use radius:12 and shadow:30 for card effect.

- VIDEO HERO: Use Video with sourceType:"url", a stock video URL, and text overlay for a cinematic hero section.

- CAROUSEL SECTION: Full-width Carousel with high-quality images, headings, and descriptions. Great for portfolios or product showcases.

- SPLIT SECTIONS: Row Container with Image on one side (width:"50%") and Text content on the other (width:"50%"). Alternate left/right.

- CTA SECTIONS: Colored background Container with centered Text + Button(s). Use contrasting background colors.

- MAP SECTION: For business/contact pages, add a Map with the location pin.

- FEATURE CARDS: Row Container with 3-4 card Containers (background white, shadow:25, radius:12) each containing Image + Text + Text description.

- FOOTER: Dark Container with row of Text/Link elements for contact info, social links, etc.

DESIGN RULES:
- ALWAYS start with a NavbarElement
- Use AT LEAST 5-6 sections for a rich page
- MUST use at least 3 different element types (Navbar + Text + Button is minimum, aim for 6+)
- MUST include at least one Video or Carousel in every design
- Use varied backgrounds: alternate dark (r:30-50,g:30-50,b:30-50) and light sections
- Use rich padding: ["40","40","40","40"] for sections, ["20","20","20","20"] for inner containers
- Use shadow (20-50) on cards for depth
- Use radius:12 for rounded cards and images
- Create visual hierarchy: large headings (fontSize:"32"-"48"), medium subtext (fontSize:"18"-"22"), small body (fontSize:"14"-"16")
- For images use https://picsum.photos/seed/DESCRIPTIVE_NAME/WIDTH/HEIGHT (e.g. https://picsum.photos/seed/modern-office/800/400). The seed name describes the image content so it can be replaced with AI-generated images later. Use descriptive seeds like "team-meeting", "city-skyline", "product-showcase".
- Be bold with colors — use vibrant backgrounds, gradients via rgba, and high contrast
- Make every page look like a premium, professional website`
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            response_format: { type: 'json_object' }
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error?.message || 'OpenRouter request failed');
        }

        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('No response from AI');

        const parsed = JSON.parse(content);
        if (!parsed?.sections || !Array.isArray(parsed.sections)) {
          throw new Error('AI did not return valid sections');
        }

        console.log('AI Generated Sections:', JSON.stringify(parsed.sections, null, 2));

        await replaceImages(parsed.sections);

        const craftTree = buildCraftTree(parsed.sections);
        actions.deserialize(craftTree);

        setPrompt('');
      } catch (err) {
        console.error('AI Generate Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={{
        padding: '12px 16px',
        marginBottom: 10,
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #e8e0eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        maxWidth: '800px',
        width: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#7e57c2' }}>auto_awesome</span>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', fontWeight: 700, color: '#49454f' }}>AI Generator</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your website..."
            rows={1}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #e8e0eb',
              borderRadius: '10px',
              fontSize: '13px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              outline: 'none',
              resize: 'none',
              background: '#f7f4ec',
              color: '#1c1b1f',
            }}
          />
          <button
            onClick={generateWebsite}
            disabled={loading}
            style={{
              padding: '8px 18px',
              backgroundColor: loading ? '#cac4d0' : '#7e57c2',
              color: 'white',
              border: 'none',
              borderRadius: '9999px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#fff' }}>auto_awesome</span>
            {loading ? 'Wait...' : 'Generate'}
          </button>
        </div>

        {error && (
          <p style={{ color: 'red', marginTop: 5, fontSize: 12 }}>
            {error}
          </p>
        )}
      </div>
    );
  }
