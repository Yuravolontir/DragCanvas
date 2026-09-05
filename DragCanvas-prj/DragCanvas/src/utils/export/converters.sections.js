import { cssRules, generateClass, mobileRules } from './sheet.js';
import { escapeAttribute, escapeHtmlText, rgbaToString } from './values.js';
import { cloudinaryVariant, responsiveImageAttrs } from './images.js';
import { normalizePaymentUrl, pairUp } from '../elementData.js';
import {
  opensNewTab,
  readAccordionRows,
  readLogoRows,
  readPricingRows,
  readProductRows,
  readStatRows,
  readTeamRows,
  readTimelineRows,
  safeHref,
  statDisplay,
  statsCountUp,
} from '../elementRows.js';
import { readSocialRows, socialHref } from '../socialPlatforms.js';
import { readableInkCss } from '../readableInk.js';

/**
 * The ready-made sections built from a list of records: a team, a price
 * list, a set of logos.
 *
 * Each entry turns one saved node into the markup a published page needs.
 * They are gathered up in converters.js next door.
 */
export const sectionsConverters = {
  /**
   * Questions that open and close, with no JavaScript.
   *
   * `<details>` does this in the browser. Reproducing it with a script would mean
   * every published page carrying code whose only job is to toggle a class, and
   * a page that needs no script cannot break because one failed to load.
   */
  Accordion: (node) => {
    const props = node.props || {};
    const className = generateClass('accordion');
    const entries = readAccordionRows(props);

    cssRules.push(`.${className} {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.${className} details {
  background: ${rgbaToString(props.background) || '#f4f3f2'};
  color: ${rgbaToString(props.color) || 'inherit'};
  border-radius: ${props.radius ?? 10}px;
  padding: 14px 18px;
}

.${className} summary {
  cursor: pointer;
  font-weight: 600;
}

.${className} .answer {
  margin-top: 10px;
  opacity: 0.85;
  line-height: 1.6;
}`);

    const html = entries.map((entry) => `      <details>
        <summary>${escapeHtmlText(entry.question)}</summary>
        <div class="answer">${escapeHtmlText(entry.answer)}</div>
      </details>`).join('\n');

    return `    <div class="${className}">\n${html}\n    </div>\n`;
  },

  /** Tiers in a grid, so the columns line up and the buttons share a baseline. */
  Pricing: (node) => {
    const props = node.props || {};
    const className = generateClass('pricing');
    const records = readPricingRows(props);
    const accent = rgbaToString(props.accent) || '#0040e0';

    cssRules.push(`.${className} {
  display: grid;
  grid-template-columns: repeat(${Math.max(records.length, 1)}, minmax(0, 1fr));
  gap: 20px;
  width: 100%;
  align-items: stretch;
}

.${className} .tier {
  display: flex;
  flex-direction: column;
  padding: 26px;
  border-radius: 14px;
  background: ${rgbaToString(props.background) || '#ffffff'};
  color: ${rgbaToString(props.color) || 'inherit'};
  border: 2px solid rgba(0,0,0,0.08);
}

.${className} .tier.featured {
  border-color: ${accent};
  box-shadow: 0 18px 40px -20px rgba(0,0,0,0.35);
}

.${className} .name { font-size: 15px; font-weight: 600; opacity: 0.7; }
.${className} .price { font-size: 38px; font-weight: 800; letter-spacing: -0.02em; margin-top: 6px; }
.${className} .period { font-size: 13px; opacity: 0.6; }
.${className} ul { list-style: none; padding: 0; margin: 18px 0 0; display: flex; flex-direction: column; gap: 8px; font-size: 14px; }
.${className} .cta { margin-top: auto; padding-top: 20px; }
.${className} .cta span {
  display: block;
  text-align: center;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 15px;
  border: 2px solid ${accent};
  color: ${accent};
}
.${className} .tier.featured .cta span { background: ${accent}; color: ${readableInkCss(props.accent)}; }
.${className} .cta a { display: block; text-decoration: none; }`);

    mobileRules.push(`  .${className} {\n    grid-template-columns: minmax(0, 1fr);\n  }`);

    const tiers = records.map((tier) => {
      const items = tier.features
        .map(f => `          <li>${escapeHtmlText(f)}</li>`).join('\n');
      const href = safeHref(tier.href);
      // The button is a link only when the author gave it somewhere to go. A
      // dead link invites the click and then does nothing, which is worse than
      // a label that plainly is not one.
      const label = `<span>${escapeHtmlText(tier.cta)}</span>`;
      const button = tier.cta
        ? (href
          ? `<a href="${escapeAttribute(href)}"${opensNewTab(href) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`
          : label)
        : '';
      return `      <div class="tier${tier.featured ? ' featured' : ''}">
        <span class="name">${escapeHtmlText(tier.name)}</span>
        <span class="price">${escapeHtmlText(tier.price)}</span>
        <span class="period">${escapeHtmlText(tier.period)}</span>
        <ul>
${items}
        </ul>
        <span class="cta">${button}</span>
      </div>`;
    }).join('\n');

    return `    <div class="${className}">\n${tiers}\n    </div>\n`;
  },

  /** Somebody vouching for the thing, with a face attached. */
  Testimonial: (node) => {
    const props = node.props || {};
    const className = generateClass('testimonial');

    cssRules.push(`.${className} {
  margin: 0;
  padding: 28px;
  border-radius: 14px;
  background: ${rgbaToString(props.background) || '#ffffff'};
  color: ${rgbaToString(props.color) || 'inherit'};
  border: 1px solid rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
}

.${className} blockquote { margin: 0; font-size: 18px; line-height: 1.6; }
.${className} figcaption { display: flex; align-items: center; gap: 12px; }
.${className} img, .${className} .initial {
  width: 44px; height: 44px; border-radius: 50%; object-fit: cover; display: block;
}
.${className} .initial {
  display: grid; place-items: center; font-weight: 700;
  background: ${rgbaToString(props.accent) || '#eef0ff'};
}
.${className} .who { display: flex; flex-direction: column; line-height: 1.3; }
.${className} .name { font-weight: 700; font-size: 15px; }
.${className} .role { font-size: 13px; opacity: 0.65; }`);

    const face = props.avatar
      ? `<img src="${escapeAttribute(cloudinaryVariant(props.avatar, 480))}"${responsiveImageAttrs(props.avatar)} alt="" loading="lazy" decoding="async">`
      : `<span class="initial">${escapeHtmlText((props.author || '?').trim().charAt(0).toUpperCase())}</span>`;

    return `    <figure class="${className}">
      <blockquote>${escapeHtmlText(props.quote || '')}</blockquote>
      <figcaption>
        ${face}
        <span class="who">
          <span class="name">${escapeHtmlText(props.author || '')}</span>
          <span class="role">${escapeHtmlText(props.role || '')}</span>
        </span>
      </figcaption>
    </figure>\n`;
  },

  /**
   * A row of numbers worth saying out loud.
   *
   * How the block arrives is the shared animation's job. What is left here is
   * the counting, which is about the figures rather than the box they sit in.
   */
  Stats: (node) => {
    const props = node.props || {};
    const className = generateClass('stats');
    const rootId = `${className}-root`;
    const records = readStatRows(props);
    const counting = statsCountUp(props);
    const repeat = props.animationRepeat === true;

    cssRules.push(`.${className} {
  display: grid;
  grid-template-columns: repeat(${Math.max(records.length, 1)}, minmax(0, 1fr));
  gap: 24px;
  width: 100%;
  text-align: ${props.align || 'center'};
}

.${className} .value {
  display: block;
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
  color: ${rgbaToString(props.accent) || 'inherit'};
}

.${className} .label {
  display: block;
  font-size: 14px;
  opacity: 0.7;
  margin-top: 4px;
  color: ${rgbaToString(props.color) || 'inherit'};
}`);

    mobileRules.push(`  .${className} {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }`);

    const html = records.map((row) => `      <div>
        <span class="value" aria-label="${escapeAttribute(statDisplay(row))}" data-stat-prefix="${escapeAttribute(row.prefix)}" data-stat-value="${escapeAttribute(row.value)}" data-stat-suffix="${escapeAttribute(row.suffix)}">${escapeHtmlText(statDisplay(row))}</span>
        <span class="label">${escapeHtmlText(row.label)}</span>
      </div>`).join('\n');

    const script = counting ? `    <script>
      (function () {
        var root = document.getElementById(${JSON.stringify(rootId)});
        if (!root) return;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        var figures = [], frame = 0;
        function format(amount, decimals) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount);
        }
        Array.prototype.forEach.call(root.querySelectorAll('[data-stat-value]'), function (element) {
          var raw = element.dataset.statValue || '', prefix = element.dataset.statPrefix || '', suffix = element.dataset.statSuffix || '', numeric = raw;
          var embedded = raw.match(/^([^\\d+-]*)([-+]?\\d[\\d,\\s]*?(?:\\.\\d+)?)([^\\d]*)$/);
          if (embedded && !/^-?\\d+(?:\\.\\d+)?$/.test(raw.replace(/[\\s,]/g, ''))) { prefix += embedded[1]; numeric = embedded[2]; suffix = embedded[3] + suffix; }
          var normalized = numeric.replace(/[\\s,]/g, '');
          // Text such as 24/7 stays put rather than becoming NaN.
          if (!/^-?\\d+(?:\\.\\d+)?$/.test(normalized)) return;
          var decimals = (normalized.split('.')[1] || '').length;
          figures.push({ element: element, target: Number(normalized), decimals: decimals, prefix: prefix, suffix: suffix, done: element.textContent });
        });
        if (!figures.length) return;
        // The markup carries the finished number so the page reads correctly
        // without scripting; the zeroing happens here, before the first paint,
        // so a counted figure never shows its total and then snaps back.
        function zero() {
          figures.forEach(function (figure) { figure.element.textContent = figure.prefix + format(0, figure.decimals) + figure.suffix; });
        }
        zero();
        function count() {
          cancelAnimationFrame(frame);
          var start = performance.now(), duration = 1000;
          function draw(now) {
            var linear = Math.min(1, (now - start) / duration), progress = 1 - Math.pow(1 - linear, 3);
            figures.forEach(function (figure) {
              // The last frame reads back exactly what was typed, so a value
              // written as 1200 does not finish as 1,200.
              figure.element.textContent = linear < 1
                ? figure.prefix + format(figure.target * progress, figure.decimals) + figure.suffix
                : figure.done;
            });
            if (linear < 1) frame = requestAnimationFrame(draw);
          }
          frame = requestAnimationFrame(draw);
        }
        if (!('IntersectionObserver' in window)) return count();
        var arrive = new IntersectionObserver(function (entries) {
          if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
          ${repeat ? '' : 'arrive.disconnect();'}
          count();
        }, { threshold: .12 });
        arrive.observe(root);${repeat ? `
        // Winding back only happens once the block is entirely off screen, so
        // nobody watches the numbers fall.
        var leave = new IntersectionObserver(function (entries) {
          if (entries.some(function (entry) { return entry.isIntersecting; })) return;
          cancelAnimationFrame(frame); zero();
        }, { threshold: 0 });
        leave.observe(root);` : ''}
      })();
    </script>\n` : '';

    return `    <div class="${className}" id="${rootId}">\n${html}\n    </div>\n${script}`;
  },

  /** The people behind the thing. */
  TeamGrid: (node) => {
    const props = node.props || {};
    const className = generateClass('teamgrid');
    const records = readTeamRows(props);

    cssRules.push(`.${className} {
  display: grid;
  grid-template-columns: repeat(${Number(props.columns) || 3}, minmax(0, 1fr));
  gap: 24px;
  width: 100%;
}

.${className} figure {
  margin: 0; text-align: center; display: flex; flex-direction: column;
  align-items: center; gap: 12px;
  color: ${rgbaToString(props.color) || 'inherit'};
}

.${className} img, .${className} .initial {
  width: 96px; height: 96px; border-radius: 50%; object-fit: cover; display: block;
}
.${className} .initial {
  display: grid; place-items: center; font-size: 32px; font-weight: 700;
  background: ${rgbaToString(props.accent) || '#eef0ff'};
}
.${className} .name { display: block; font-weight: 700; font-size: 16px; }
.${className} .role { display: block; font-size: 13px; opacity: 0.65; }
.${className} figure > a { display: block; line-height: 0; }`);

    mobileRules.push(`  .${className} {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }`);

    const html = records.map(({ name, role, photo, href }) => {
      const face = photo
        ? `<img src="${escapeAttribute(cloudinaryVariant(photo, 480))}"${responsiveImageAttrs(photo)} alt="${escapeAttribute(name || '')}" loading="lazy" decoding="async">`
        : `<span class="initial">${escapeHtmlText((name || '?').trim().charAt(0).toUpperCase())}</span>`;
      const link = safeHref(href);
      // Clicking a face is what people try, so it is worth wiring up - and a
      // link that leaves the site takes rel protection with it.
      const portrait = link
        ? `<a href="${escapeAttribute(link)}"${opensNewTab(link) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${face}</a>`
        : face;
      return `      <figure>
        ${portrait}
        <figcaption>
          <span class="name">${escapeHtmlText(name)}</span>
          <span class="role">${escapeHtmlText(role)}</span>
        </figcaption>
      </figure>`;
    }).join('\n');

    return `    <div class="${className}">\n${html}\n    </div>\n`;
  },

  /** Steps in order, or a history. */
  Timeline: (node) => {
    const props = node.props || {};
    const className = generateClass('timeline');
    const records = readTimelineRows(props);
    const accent = rgbaToString(props.accent) || '#0040e0';

    cssRules.push(`.${className} {
  width: 100%;
  display: flex;
  flex-direction: column;
  color: ${rgbaToString(props.color) || 'inherit'};
}

.${className} .step { display: flex; gap: 18px; align-items: stretch; }
.${className} .rail { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
.${className} .marker {
  width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
  background: ${accent}; color: ${readableInkCss(props.accent)}; font-weight: 700; font-size: 14px; flex-shrink: 0;
}
.${className} .tail { flex: 1; width: 2px; background: ${accent}; opacity: 0.25; min-height: 24px; }
.${className} .title { display: block; font-weight: 700; font-size: 17px; }
.${className} .detail { display: block; font-size: 14px; opacity: 0.7; line-height: 1.6; margin-top: 4px; }
.${className} .body { padding-bottom: 28px; }
.${className} .step:last-child .body { padding-bottom: 0; }`);

    const html = records.map(({ marker, title, detail }, i) => `      <div class="step">
        <div class="rail">
          <span class="marker">${escapeHtmlText(marker)}</span>
          ${i < records.length - 1 ? '<span class="tail"></span>' : ''}
        </div>
        <div class="body">
          <span class="title">${escapeHtmlText(title)}</span>
          <span class="detail">${escapeHtmlText(detail)}</span>
        </div>
      </div>`).join('\n');

    return `    <div class="${className}">\n${html}\n    </div>\n`;
  },

  /** The ask, on a band of its own. */
  CTABanner: (node) => {
    const props = node.props || {};
    const className = generateClass('ctabanner');

    cssRules.push(`.${className} {
  width: 100%;
  padding: 48px 32px;
  border-radius: ${props.radius ?? 16}px;
  background: ${rgbaToString(props.background) || '#0040e0'};
  color: ${rgbaToString(props.color) || '#ffffff'};
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.${className} .title { font-size: 30px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.15; }
.${className} .sub { font-size: 16px; opacity: 0.85; max-width: 46ch; }
.${className} a {
  margin-top: 12px;
  display: inline-block;
  padding: 14px 30px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 16px;
  text-decoration: none;
  background: ${rgbaToString(props.buttonBackground) || '#ffffff'};
  color: ${rgbaToString(props.buttonColor) || '#0040e0'};
}`);

    mobileRules.push(`  .${className} {\n    padding: 32px 20px;\n  }\n\n  .${className} .title {\n    font-size: 24px;\n  }`);

    const sub = props.text ? `\n      <span class="sub">${escapeHtmlText(props.text)}</span>` : '';
    return `    <div class="${className}">
      <span class="title">${escapeHtmlText(props.title || '')}</span>${sub}
      <a href="${escapeAttribute(props.href || '#')}">${escapeHtmlText(props.cta || '')}</a>
    </div>\n`;
  },

  /** A row of logos, matched on height rather than width. */
  LogoStrip: (node) => {
    const props = node.props || {};
    const className = generateClass('logostrip');
    const logos = readLogoRows(props);

    cssRules.push(`.${className} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: ${Number(props.gap) || 40}px;
  width: 100%;
${rgbaToString(props.color) ? `  color: ${rgbaToString(props.color)};\n` : ''}}

.${className} img {
  height: ${Number(props.height) || 32}px;
  width: auto;
  display: block;
  ${props.grayscale === 'no' ? '' : 'filter: grayscale(1);\n  opacity: 0.65;\n  transition: filter 200ms ease, opacity 200ms ease;'}
}

.${className} span {
  font-size: ${Math.round((Number(props.height) || 32) * 0.62)}px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1;
  white-space: nowrap;
  ${props.grayscale === 'no' ? '' : 'opacity: 0.75;\n  transition: opacity 200ms ease;'}
}

${props.grayscale === 'no' ? '' : `.${className} span:hover {\n  opacity: 1;\n}`}

${props.grayscale === 'no' ? '' : `.${className} img:hover {\n  filter: none;\n  opacity: 1;\n}`}

.${className} a { color: inherit; text-decoration: none; line-height: 0; }`);

    // A company with no image is set as a wordmark. See the LogoStrip component
    // for why that is the more useful reading of a customer logo you do not have
    // the file for.
    const html = logos
      .map((row) => {
        const mark = row.src
          ? `<img src="${escapeAttribute(cloudinaryVariant(row.src, 768))}"${responsiveImageAttrs(row.src)} alt="${escapeAttribute(row.label || '')}" loading="lazy" decoding="async">`
          : `<span>${escapeHtmlText(row.label)}</span>`;
        const href = safeHref(row.href);
        return `      ${href
          ? `<a href="${escapeAttribute(href)}"${opensNewTab(href) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${mark}</a>`
          : mark}`;
      })
      .join('\n');

    return `    <div class="${className}">\n${html}\n    </div>\n`;
  },

  /** Where else to find them. */
  SocialLinks: (node) => {
    const props = node.props || {};
    const className = generateClass('sociallinks');
    const records = readSocialRows(props);
    const box = Math.round((Number(props.size) || 14) * 2.3);
    const glyph = Math.round(box * 0.58);

    cssRules.push(`.${className} {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  width: 100%;
}

.${className} a {
  display: inline-grid;
  place-items: center;
  width: ${box}px;
  height: ${box}px;
  border-radius: 50%;
  text-decoration: none;
  background: ${rgbaToString(props.background) || 'rgba(0,0,0,0.06)'};
  color: ${rgbaToString(props.color) || 'inherit'};
}

.${className} svg { width: ${glyph}px; height: ${glyph}px; fill: currentColor; display: block; }`);

    // The mark is inlined rather than fetched: a published page has no bundle
    // and no icon font, and a row of social buttons that waits on a third-party
    // request is a row of social buttons that sometimes never arrives.
    const html = records
      .map((row) => {
        const href = socialHref(row);
        if (!href) return '';
        return `      <a href="${escapeAttribute(href)}" aria-label="${escapeAttribute(row.label)}"${/^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${escapeAttribute(row.icon)}"/></svg></a>`;
      })
      .filter(Boolean)
      .join('\n');

    return `    <div class="${className}">\n${html}\n    </div>\n`;
  },

  ProductCatalog: (node) => {
    const props = node.props || {}; const className = generateClass('catalog'); const rows = readProductRows(props);
    cssRules.push(`.${className} { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px; } .${className} article { border:1px solid #ddd;border-radius:12px;overflow:hidden;padding:16px; } .${className} article img { width:100%;aspect-ratio:4/3;object-fit:cover; } .${className} article a { display:block;width:fit-content;margin-top:10px;background:${rgbaToString(props.accent)};color:${readableInkCss(props.accent)};border-radius:8px;padding:10px 14px;text-decoration:none; }`);
    mobileRules.push(`  .${className} { grid-template-columns: 1fr; }`);
    const cards = rows.map(({ name, description, price, image, href: link }) => {
      const href = normalizePaymentUrl(link);
      return `<article>${image ? `<img src="${escapeAttribute(image)}" alt="${escapeAttribute(name || '')}" loading="lazy">` : ''}<h3>${escapeHtmlText(name)}</h3><p>${escapeHtmlText(description)}</p><strong>${escapeHtmlText(price)} ${escapeHtmlText(String(props.currency || 'USD').toUpperCase())}</strong>${href ? `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">${escapeHtmlText(props.buttonText || 'Buy now')}</a>` : ''}</article>`;
    }).join('');
    return `    <section class="${className}">${cards}</section>\n`;
  },

  /**
   * A real, working form on the published page.
   *
   * The editor renders an inert preview; this is what visitors actually use.
   * It posts to our API from whatever domain the site ended up on, so the
   * project id has to be baked in at export time - the page has no other way
   * to know which site it belongs to.
   */
  Tabs: (node) => {
    const props=node.props||{},className=generateClass('tabs'),rows=pairUp(props.items);
    cssRules.push(`.${className}{width:100%}.${className} details{border-bottom:1px solid #ddd;padding:10px}.${className} summary{cursor:pointer;font-weight:700;color:${rgbaToString(props.accent)}}.${className} p{margin-top:8px}`);
    return `    <div class="${className}">${rows.map(([label,content],i)=>`<details${i===0?' open':''}><summary>${escapeHtmlText(label)}</summary><p>${escapeHtmlText(content)}</p></details>`).join('')}</div>\n`;
  },
};
