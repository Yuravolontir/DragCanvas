import { cssRules, exportContext, generateClass, knownAnchors, mobileRules } from './sheet.js';
import { escapeAttribute, escapeHtmlText, rgbaToString, slugifyAnchor } from './values.js';
import { countdownTarget, engagementMode, readEngagementOptions } from '../elementRows.js';
import { readableInkCss } from '../readableInk.js';

/**
 * The parts of a published page that talk back to our server: forms,
 * bookings, sign-ups, and the navigation bar.
 *
 * Each entry turns one saved node into the markup a published page needs.
 * They are gathered up in converters.js next door.
 */
export const interactiveConverters = {
  Form: (node) => {
    const context = exportContext;
    const props = node.props || {};
    const className = generateClass('form');
    const fields = Array.isArray(props.fields) ? props.fields : [];
    const radius = props.radius ?? 8;
    const accent = rgbaToString(props.accent) || '#7e57c2';
    const textColor = props.textColor ? rgbaToString(props.textColor) : '#49454f';
    const inputBackground = props.inputBackground ? rgbaToString(props.inputBackground) : '#ffffff';
    const inputBorder = props.inputBorder ? rgbaToString(props.inputBorder) : '#dddddd';

    cssRules.push(`.${className} {
  background: ${rgbaToString(props.background) || '#ffffff'};
  padding: 24px;
  border-radius: ${radius}px;
  box-sizing: border-box;
  width: 100%;
}
.${className} label {
  display: block;
  font-size: 13px;
  margin-bottom: 4px;
  color: ${textColor};
}
.${className} input,
.${className} textarea {
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 12px;
  border: 1px solid ${inputBorder};
  border-radius: ${radius}px;
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
  background: ${inputBackground};
}
.${className} button {
  background: ${accent};
  color: ${readableInkCss(props.accent)};
  border: none;
  border-radius: ${radius}px;
  padding: 11px 22px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.${className} button[disabled] { opacity: 0.6; cursor: default; }
.${className} .form-done { font-size: 15px; color: #2e7d32; }
.${className} .hp { position: absolute; left: -9999px; }`);

    const inputs = fields.map((field, index) => {
      const name = (field.label || `field_${index + 1}`).trim();
      const required = field.required ? ' required' : '';
      const placeholder = escapeAttribute(field.placeholder || '');
      const label = escapeHtmlText(name) + (field.required ? ' *' : '');

      if (field.type === 'textarea') {
        return `      <label>${label}</label>\n      <textarea name="${escapeAttribute(name)}" rows="4" placeholder="${placeholder}"${required}></textarea>`;
      }
      if (field.type === 'file') {
        return `      <label>${label}</label>\n      <input type="file" name="attachment" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"${required}>`;
      }
      const inputType = field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text';
      return `      <label>${label}</label>\n      <input type="${inputType}" name="${escapeAttribute(name)}" placeholder="${placeholder}"${required}>`;
    }).join('\n');

    const formId = `${className}-el`;
    const apiUrl = context.apiUrl || '';
    const projectId = context.projectId ?? '';
    /*
     * The success message is written into the inline script, so escaping it for
     * HTML is not enough: it also has to survive being a JavaScript string.
     * "Thanks, you're in!" used to close the literal early, which is a syntax
     * error - the whole IIFE then failed to parse, no submit handler was
     * attached, and the form on the published page did a native submit and
     * navigated away. JSON.stringify emits the quotes and the escapes.
     * escapeHtmlText still runs first, so `<` is already `&lt;` and the markup
     * below cannot grow a `</script>`.
     */
    const successHtml = JSON.stringify(
      `<p class="form-done">${escapeHtmlText(props.successMessage || 'Thank you!')}</p>`
    );

    return `    <div class="${className}">
      <form id="${formId}">
${inputs}
        <input type="text" name="_hp" class="hp" tabindex="-1" autocomplete="off">
        <button type="submit">${escapeHtmlText(props.submitText || 'Send')}</button>
        <p class="dc-form-status" role="alert" aria-live="polite"></p>
      </form>
      <script>
      (function () {
        var form = document.getElementById('${formId}');
        if (!form) return;
        form.addEventListener('submit', function (event) {
          event.preventDefault();
          var button = form.querySelector('button');
          var status = form.querySelector('.dc-form-status');
          status.textContent = '';
          button.disabled = true;
          var payload = { projectId: ${JSON.stringify(projectId)} };
          new FormData(form).forEach(function (value, key) { if (!(value instanceof File)) payload[key] = value; });
          var file = form.querySelector('input[type="file"]');
          var upload = Promise.resolve(null);
          if (file && file.files[0]) {
            var uploadBody = new FormData(); uploadBody.append('projectId', ${JSON.stringify(projectId)}); uploadBody.append('file', file.files[0]);
            upload = fetch('${apiUrl}/api/assets/form-upload', { method: 'POST', body: uploadBody }).then(function (response) { if (!response.ok) throw new Error('upload failed'); return response.json(); }).then(function (body) { return (body.data || body).token; });
          }
          upload.then(function (uploadToken) { if (uploadToken) payload.uploadToken = uploadToken; return fetch('${apiUrl}/api/forms/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }); }).then(function (response) {
            if (!response.ok) throw new Error('failed');
            form.outerHTML = ${successHtml};
          }).catch(function () {
            button.disabled = false;
            status.textContent = 'Could not send. Please try again.';
          });
        });
      })();
      </script>
    </div>\n`;
  },

  Newsletter: (node) => {
    const props = node.props || {};
    const className = generateClass('newsletter');
    const formId = `${className}-form`;
    const apiUrl = exportContext.apiUrl || '';
    cssRules.push(`.${className} { width: 100%; color: ${rgbaToString(props.color)}; }
.${className} strong { display: block; margin-bottom: 10px; }
.${className} form { display: flex; gap: 8px; }
.${className} input { min-width: 0; flex: 1; padding: 12px; border: 1px solid #ccc; border-radius: 8px; font: inherit; }
.${className} button { padding: 12px 18px; border: 0; border-radius: 8px; background: ${rgbaToString(props.accent)}; color: ${readableInkCss(props.accent)}; cursor: pointer; }
.${className} .status { margin-top: 8px; font-size: 14px; }`);
    mobileRules.push(`  .${className} form { flex-direction: column; }`);
    return `    <div class="${className}">
      <strong>${escapeHtmlText(props.heading || 'Get updates')}</strong>
      <form id="${formId}"><input type="email" name="email" autocomplete="email" required placeholder="${escapeAttribute(props.placeholder || 'you@example.com')}"><button type="submit">${escapeHtmlText(props.buttonText || 'Subscribe')}</button></form>
      <p class="status" aria-live="polite"></p>
      <script>
      (function () {
        var form = document.getElementById(${JSON.stringify(formId)}), status = form.nextElementSibling;
        form.addEventListener('submit', function (event) {
          event.preventDefault(); var button = form.querySelector('button'); button.disabled = true;
          fetch(${JSON.stringify(`${apiUrl}/api/subscribers/subscribe`)}, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: ${JSON.stringify(exportContext.projectId)}, email: form.email.value }) })
            .then(function (response) { if (!response.ok) throw new Error(); status.textContent = ${JSON.stringify(props.successMessage || 'Check your email to confirm.')}; form.reset(); })
            .catch(function () { status.textContent = 'Could not subscribe. Please try again.'; })
            .finally(function () { button.disabled = false; });
        });
      })();
      </script>
    </div>\n`;
  },

  Booking: (node) => {
    const props = node.props || {}; const className = generateClass('booking'); const formId = `${className}-form`; const apiUrl = exportContext.apiUrl || '';
    cssRules.push(`.${className} { width: 100%; } .${className} strong { display:block;margin-bottom:10px; } .${className} .fields { display:grid;grid-template-columns:1fr 1fr;gap:8px; } .${className} input,.${className} select,.${className} textarea { width:100%;padding:11px;border:1px solid #ccc;border-radius:8px;font:inherit; } .${className} button { margin-top:8px;padding:12px 18px;border:0;border-radius:8px;background:${rgbaToString(props.accent)};color:${readableInkCss(props.accent)};cursor:pointer; } .${className} .status { margin-top:8px; }`);
    mobileRules.push(`  .${className} .fields { grid-template-columns: 1fr; }`);
    return `    <div class="${className}"><strong>${escapeHtmlText(props.heading || 'Book an appointment')}</strong><form id="${formId}"><div class="fields"><input name="date" type="date" required><select name="startAt" required disabled><option value="">Choose a date first</option></select><input name="name" autocomplete="name" required placeholder="Name"><input name="email" type="email" autocomplete="email" required placeholder="Email"><textarea name="notes" placeholder="Notes (optional)"></textarea></div><button type="submit">${escapeHtmlText(props.buttonText || 'Confirm booking')}</button></form><p class="status" aria-live="polite"></p><script>
(function(){var form=document.getElementById(${JSON.stringify(formId)}),slots=form.startAt,status=form.nextElementSibling,date=form.date;date.min=new Date().toISOString().slice(0,10);date.addEventListener('change',function(){slots.disabled=true;slots.innerHTML='<option>Loading…</option>';fetch(${JSON.stringify(`${apiUrl}/api/bookings/availability`)}+'?projectId='+encodeURIComponent(${JSON.stringify(exportContext.projectId)})+'&date='+encodeURIComponent(date.value)).then(function(r){if(!r.ok)throw new Error();return r.json();}).then(function(body){var values=body.data||body;slots.innerHTML=values.length?values.map(function(value){return '<option value="'+value+'">'+new Date(value).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'</option>';}).join(''):'<option value="">No slots available</option>';slots.disabled=!values.length;}).catch(function(){slots.innerHTML='<option value="">Could not load slots</option>';});});form.addEventListener('submit',function(event){event.preventDefault();var button=form.querySelector('button');button.disabled=true;fetch(${JSON.stringify(`${apiUrl}/api/bookings`)},{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId:${JSON.stringify(exportContext.projectId)},startAt:slots.value,name:form.name.value,email:form.email.value,notes:form.notes.value})}).then(function(r){if(!r.ok)throw new Error();status.textContent='Booking confirmed. Check your email.';form.reset();slots.disabled=true;}).catch(function(){status.textContent='That slot is unavailable. Please choose another.';}).finally(function(){button.disabled=false;});});})();
</script></div>\n`;
  },

  Engagement: (node, data, depth, nodeId) => {
    const props=node.props||{},mode=engagementMode(props),className=generateClass('engagement'),rootId=`${className}-root`,apiUrl=exportContext.apiUrl||'',options=readEngagementOptions(props);
    cssRules.push(`.${className}{width:100%;padding:20px;border:1px solid #ddd;border-radius:12px}. ${className} h3{margin-bottom:12px}.${className} input,.${className} textarea{display:block;width:100%;padding:10px;margin:8px 0;border:1px solid #ccc;border-radius:8px;font:inherit}.${className} button{margin:4px;padding:10px 14px;border:0;border-radius:8px;background:${rgbaToString(props.accent)};color:${readableInkCss(props.accent)};cursor:pointer}.${className} .entry{padding:12px 0;border-bottom:1px solid #eee}`.replace('. '+className,'.'+className));
    const controls=mode==='review'?`<form><input name="author" required maxlength="120" placeholder="Your name"><textarea name="content" required maxlength="3000" placeholder="Your review"></textarea><button type="submit">Submit for approval</button></form>`:`<div class="choices">${options.map(option=>`<button type="button" data-option="${escapeAttribute(option)}">${escapeHtmlText(option)} <span></span></button>`).join('')}</div>`;
    return `    <section class="${className}" id="${rootId}"><h3>${escapeHtmlText(props.heading||'Your opinion')}</h3>${controls}<p class="status" aria-live="polite"></p><div class="entries"></div><script>
(function(){var root=document.getElementById(${JSON.stringify(rootId)}),status=root.querySelector('.status'),entries=root.querySelector('.entries'),endpoint=${JSON.stringify(`${apiUrl}/api/engagement`)},projectId=${JSON.stringify(exportContext.projectId)},widgetKey=${JSON.stringify(String(nodeId||className))},mode=${JSON.stringify(mode)},visitorKey='dragcanvas-visitor';var visitor=localStorage.getItem(visitorKey);if(!visitor){visitor=(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random());localStorage.setItem(visitorKey,visitor)}function load(){fetch(endpoint+'/public/'+projectId+'/'+encodeURIComponent(widgetKey)).then(function(r){return r.json()}).then(function(body){var rows=body.data||body;if(mode==='review'){entries.textContent='';rows.filter(function(row){return row.Kind==='review'}).forEach(function(row){var article=document.createElement('article');article.className='entry';var strong=document.createElement('strong');strong.textContent=row.Author;var p=document.createElement('p');p.textContent=row.Content;article.append(strong,p);entries.appendChild(article)})}else{var counts={};rows.forEach(function(row){counts[row.OptionValue]=(counts[row.OptionValue]||0)+1});root.querySelectorAll('[data-option]').forEach(function(button){button.querySelector('span').textContent='('+ (counts[button.dataset.option]||0) +')'})}})}if(mode==='review'){root.querySelector('form').addEventListener('submit',function(event){event.preventDefault();var form=event.currentTarget;fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId:projectId,widgetKey:widgetKey,kind:mode,author:form.author.value,content:form.content.value})}).then(function(r){if(!r.ok)throw new Error();status.textContent='Thank you. Your review will appear after approval.';form.reset()}).catch(function(){status.textContent='Could not submit the review.'})})}else root.querySelectorAll('[data-option]').forEach(function(button){button.addEventListener('click',function(){fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId:projectId,widgetKey:widgetKey,kind:mode,option:button.dataset.option,visitorId:visitor})}).then(function(r){if(!r.ok)throw new Error();status.textContent='Response recorded.';load()}).catch(function(){status.textContent='You already responded.'})})});load()})();
</script></section>\n`;
  },

  /**
   * A live deadline, counted down in the visitor's own browser.
   *
   * The instant is baked in as milliseconds since the epoch, which is the same
   * moment everywhere - a visitor three time zones away sees the same amount of
   * time left, not the same wall clock. A node whose date could never be read
   * publishes a stopped counter rather than a row of NaNs.
   */
  Countdown: (node) => {
    const props = node.props || {}, className = generateClass('countdown'), id = `${className}-value`;
    const target = countdownTarget(props.target);
    cssRules.push(`.${className}{width:100%;text-align:center}.${className} strong{display:block;font-size:32px;color:${rgbaToString(props.accent)}}`);
    return `    <div class="${className}"><strong id="${id}">00 : 00 : 00 : 00</strong><span>${escapeHtmlText(props.label || 'Time remaining')}</span><script>(function(){var value=document.getElementById(${JSON.stringify(id)}),target=${JSON.stringify(target)},label=value.nextElementSibling,timer;function update(){if(target===null)return;var left=Math.max(0,target-Date.now()),days=Math.floor(left/86400000),hours=Math.floor(left/3600000)%24,minutes=Math.floor(left/60000)%60,seconds=Math.floor(left/1000)%60;value.textContent=[days,hours,minutes,seconds].map(function(n){return String(n).padStart(2,'0')}).join(' : ');if(!left){label.textContent=${JSON.stringify(props.expiredText || 'This offer has ended.')};clearInterval(timer)}}update();if(target!==null)timer=setInterval(update,1000)})();</script></div>\n`;
  },

  /**
   * The navigation bar. Without this converter every published page lost its
   * navbar silently, because the component keeps brand and links in props
   * rather than children, and the fallback branch only renders children.
   */
  NavbarElement: (node) => {
    const props = node.props || {};
    const className = generateClass('navbar');
    const variant = props.variant || 'dark';

    const palette = {
      dark: { background: '#212529', color: '#ffffff' },
      light: { background: '#f8f9fa', color: '#212529' },
      primary: { background: '#0d6efd', color: '#ffffff' },
    }[variant] || { background: '#212529', color: '#ffffff' };

    const textColor = rgbaToString(props.textColor) || palette.color;

    cssRules.push(`.${className} {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  width: ${props.width || '100%'};
  min-height: ${props.height || '56px'};
  padding: 12px 24px;
  background: ${palette.background};
  box-sizing: border-box;
  ${props.sticky ? 'position: sticky; top: 0; z-index: 100;' : ''}
}
.${className} .brand {
  font-size: 20px;
  font-weight: 700;
  color: ${textColor};
  text-decoration: none;
}
.${className} .links { display: flex; gap: 20px; flex-wrap: wrap; }
.${className} .links a {
  color: ${textColor};
  text-decoration: none;
  font-size: 15px;
  opacity: 0.9;
}
.${className} .links a:hover { opacity: 1; text-decoration: underline; }
.${className} .links .dead { color: ${textColor}; opacity: 0.55; }`);

    mobileRules.push(`  .${className} { flex-wrap: wrap; gap: 12px; }
  .${className} .menu-toggle-label { display: grid; }
  .${className} .links { display: none; flex: 0 0 100%; flex-direction: column; gap: 0; }
  .${className} .links a, .${className} .links .dead { padding: 10px 0; }
  .${className} .menu-toggle:checked ~ .links { display: flex; }`);

    cssRules.push(`.${className} .menu-toggle { position: absolute; opacity: 0; pointer-events: none; }
.${className} .menu-toggle-label {
  display: none; width: 42px; height: 42px; place-items: center; cursor: pointer;
  border: 1px solid currentColor; border-radius: 8px; color: ${textColor}; font-size: 24px;
}`);

    /**
     * A link is only a link if it leads somewhere.
     *
     * These used to be written out whatever they pointed at, and nothing in the
     * document ever carried an id - so every one of them was dead. An anchor
     * with no matching section now renders as its label: a word that does
     * nothing is honest, a link that does nothing invites the click first.
     */
    const links = (Array.isArray(props.links) ? props.links : [])
      .map(link => {
        const label = escapeHtmlText(link.text || '');
        const href = String(link.href || '').trim();
        const anchor = href.startsWith('#') ? slugifyAnchor(href.slice(1)) : '';

        if (anchor && knownAnchors.has(anchor)) {
          return `        <a href="#${escapeAttribute(anchor)}">${label}</a>`;
        }
        // An external link still points somewhere real
        if (/^(https?:)?\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')) {
          return `        <a href="${escapeAttribute(href)}">${label}</a>`;
        }
        // "/" is the site's own front page, and the pattern below wanted at
        // least one character after the slash — so the Home link of every
        // multi-page site published from here rendered as an inert word.
        if (href === '/') return `        <a href="/">${label}</a>`;
        if (/^\/[a-z0-9][a-z0-9-]*\/?$/.test(href)) return `        <a href="${escapeAttribute(href.endsWith('/') ? href : `${href}/`)}">${label}</a>`;
        return `        <span class="dead">${label}</span>`;
      })
      .join('\n');

    const toggleId = `${className}-toggle`;
    return `    <nav class="${className}">
      <a class="brand" href="#">${escapeHtmlText(props.brand || '')}</a>
      <input class="menu-toggle" id="${toggleId}" type="checkbox" aria-label="Toggle navigation">
      <label class="menu-toggle-label" for="${toggleId}" aria-hidden="true">☰</label>
      <div class="links">
${links}
      </div>
    </nav>\n`;
  },
};
