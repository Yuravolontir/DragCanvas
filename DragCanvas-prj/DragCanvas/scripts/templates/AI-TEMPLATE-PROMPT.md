# Prompt: generate a DragCanvas template

Paste everything below the line into an AI, then add one sentence at the end
saying what the template is for ("a template for a florist", "a template for a
law firm"). What comes back is the `TemplateData` value of a template row.

Check it before you trust it: `npm run check:template -- <file.json>`.

---

You are producing one **template** for DragCanvas, a drag-and-drop website
builder. A template is a finished, good-looking example page that a stranger
will open in the editor and start changing. It is not a wireframe and not a
placeholder: every heading, price, name and opening time must read like it was
written for a real business.

Return **only** a single JSON object. No markdown fence, no commentary, no
trailing text.

## 1. The shape of the file

The page is a **flat map of nodes**, not a nested tree. Every key is a node id.
Exactly one key is `"ROOT"`. Parent and child point at each other, and both
directions must agree.

```json
{
  "ROOT": {
    "type": { "resolvedName": "Container" },
    "isCanvas": true,
    "props": { "...": "see Container below" },
    "displayName": "Container",
    "custom": { "displayName": "App" },
    "hidden": false,
    "nodes": ["nav01", "hero02"],
    "linkedNodes": {}
  },
  "hero02": {
    "type": { "resolvedName": "Container" },
    "isCanvas": true,
    "props": { "...": "..." },
    "displayName": "Container",
    "custom": { "displayName": "Hero" },
    "parent": "ROOT",
    "hidden": false,
    "nodes": ["head03"],
    "linkedNodes": {}
  },
  "head03": {
    "type": { "resolvedName": "Heading" },
    "isCanvas": false,
    "props": { "text": "...", "level": "1" },
    "displayName": "Heading",
    "custom": { "displayName": "Headline" },
    "parent": "hero02",
    "hidden": false,
    "nodes": [],
    "linkedNodes": {}
  }
}
```

Rules for the envelope:

- `type.resolvedName` must be one of the 27 names in section 3, spelled exactly.
- `displayName` repeats `type.resolvedName`.
- `custom.displayName` is what the editor shows in its layer list. Give it a
  human name — `"Hero"`, `"Menu cards"`, `"Footer"` — never `"Container 4"`.
- `parent` is on every node except `ROOT`, which has no `parent` key at all.
- The parent's `nodes` array lists its children **in display order**. A child
  missing from its parent's `nodes` does not render; a child listed under a
  parent it does not name is a broken file.
- `nodes` is `[]` for leaves. `linkedNodes` is always `{}`.
- `isCanvas` is `true` for `Container` and `Columns` only. Everything else is
  `false`.
- Ids are your own choice: lowercase, letters and digits, unique. A readable
  scheme like `hero02`, `head03`, `img14` makes the file easier to check.

`ROOT` is always a `Container` with `"width": "100%"` and the page's background
colour. Its children are the page's sections, top to bottom.

## 2. Value types — the four that get it wrong

1. **Colours** are objects, never strings.
   `{"r": 42, "g": 29, "b": 19, "a": 1}` — never `"#2a1d13"`, never `"rgb(...)"`.
2. **Padding and margin** are arrays of exactly four **strings**, in the order
   top, right, bottom, left: `["64", "48", "40", "48"]`. Not numbers, not a
   shorthand string.
3. **Numeric-looking props are strings**: `"fontSize": "44"`, `"count": "3"`,
   `"height": "320px"`. The exceptions, which are real numbers, are `radius`,
   `shadow`, `lat`, `lng`, `zoom` and `featured`.
4. **`src`, `videoUrl`, `href`, `text`, `brand`, `title`, `quote` and `author`
   must be strings.** Passing an object here is the single most common way to
   produce a page of broken images.

## 3. The elements

Use them. A pricing table built out of Containers has nothing holding its
columns level; `Pricing` does. The same goes for `Accordion`, `Stats`,
`Timeline`, `TeamGrid`, `Testimonial` and `List`. A good template uses fifteen
or more distinct element types.

**1. Container** — a section or a box. Can have children.
```
{ "width": "100%", "height": "auto",
  "flexDirection": "row"|"column", "alignItems": "flex-start"|"center"|"flex-end",
  "justifyContent": "flex-start"|"center"|"flex-end"|"space-between",
  "background": {r,g,b,a}, "color": {r,g,b,a},
  "padding": ["0","0","0","0"], "margin": ["0","0","0","0"],
  "shadow": 0, "radius": 0, "fillSpace": "no"|"yes",
  "anchor": "our-menu",
  "backgroundImage": "https://...", "overlay": {"r":0,"g":0,"b":0,"a":0.55} }
```
`anchor` goes on every top-level section: a short hyphenated name for what the
section is. It becomes the id the navbar jumps to, so the two must agree.
`backgroundImage` + `overlay` is what makes a hero look like a hero. Use it on
the first screen and on one or two section breaks — not everywhere.

**2. Text** — a run of prose. Not for titles.
```
{ "text": "...", "fontSize": "15", "fontWeight": "400"|"500"|"600"|"700",
  "textAlign": "left"|"center"|"right", "color": {r,g,b,a}, "shadow": 0,
  "margin": ["0","0","0","0"] }
```

**3. Button**
```
{ "text": "Book a table", "background": {r,g,b,a}, "color": {r,g,b,a},
  "buttonStyle": "full"|"outline", "textAlign": "center",
  "margin": ["5","0","5","0"] }
```

**4. Image**
```
{ "src": "https://...", "radius": 0, "width": "100%", "height": "auto",
  "maxWidth": "100%" }
```
An image inside `Columns` **must** have a pixel height — `"height": "260px"` —
so the row of cards lines up. Photographs arrive at different aspect ratios and
without a height each card is as tall as its own picture.

**5. Video** — a clip with an optional caption over it.
```
{ "sourceType": "url", "videoUrl": "https://videos.pexels.com/video-files/7206150/7206150-hd_1920_1080_25fps.mp4", "text": "" }
```
Only use a URL from the video list in section 5. Never invent one and never use
`sourceType: "youtube"` — you cannot know a real id.

**6. Link**
```
{ "href": "https://example.com", "text": "Read the notes", "fontSize": "16",
  "fontWeight": "500", "width": "auto", "height": "auto", "maxWidth": "100%" }
```

**7. Carousel** — three slides with captions.
```
{ "src1": "...", "src2": "...", "src3": "...",
  "heading1": "...", "heading2": "...", "heading3": "...",
  "label1": "Portugal", "label2": "...", "label3": "...",
  "p1": "...", "p2": "...", "p3": "...",
  "width": "100%", "height": "420px", "accent": {r,g,b,a} }
```
Set `accent` to the page's accent colour. Left alone the slide labels are
Bootstrap blue, which fights every palette that is not blue.

**8. Map**
```
{ "lat": 32.0853, "lng": 34.7818, "zoom": 14, "height": "320px",
  "width": "100%", "label": "Casa Oliva" }
```

**9. Form** — the visitor fills it in, the owner is emailed.
```
{ "fields": [{"label":"Name","type":"text","placeholder":"Your name","required":true}],
  "submitText": "Send", "successMessage": "Thank you!", "radius": 8,
  "background": {r,g,b,a}, "accent": {r,g,b,a}, "width": "100%", "height": "auto" }
```
Field types: `text`, `email`, `phone`, `textarea`. Three or four fields get
answered; ten do not.

**10. NavbarElement** — usually the first section.
```
{ "variant": "dark"|"primary"|"light", "brand": "Casa Oliva",
  "links": [{"text":"Menu","href":"#our-menu"}],
  "textColor": {r,g,b,a}, "height": "56px", "width": "100%", "sticky": false }
```
Every `href` is `#` plus the `anchor` of a section that exists on this page. A
link to an anchor nothing claims renders as plain text, not a link.

**11. Heading** — every title on the page.
```
{ "text": "Out of the oven at six", "level": "1"|"2"|"3"|"4",
  "fontSize": "44", "fontWeight": "800", "textAlign": "left",
  "color": {r,g,b,a}, "margin": ["0","0","0","0"] }
```
Exactly one `level: "1"` on the page, saying what the page is about. Section
titles are level 2. Level and size are separate concerns.

**12. Columns** — side by side, stacks on a phone. Children become the columns.
```
{ "count": "2"|"3"|"4", "gap": "24", "align": "stretch"|"center", "stack": "yes" }
```
Use this instead of Containers with `width: "33%"`, which stay narrow on a phone.

**13. Spacer** — `{ "height": "48" }`

**14. Divider** — `{ "thickness": "1", "color": {r,g,b,a}, "spacing": "24", "inset": "0" }`

**15. List** — a real list, not several Texts starting with a dash.
```
{ "items": ["First", "Second"], "ordered": "no"|"yes", "fontSize": "16",
  "gap": "8", "color": {r,g,b,a} }
```

**16. Quote** — a sentence lifted out of the copy.
```
{ "text": "...", "attribution": "", "fontSize": "20", "align": "left"|"center",
  "color": {r,g,b,a}, "accent": {r,g,b,a} }
```
For a customer vouching for the business use Testimonial instead.

**17. Icon** — one Material symbol, by its own name (`schedule`, `verified`,
`local_shipping`, `restaurant`).
```
{ "name": "bolt", "size": "32", "padded": "yes", "color": {r,g,b,a},
  "background": {r,g,b,a} }
```

**18. Badge** — `{ "text": "Most popular", "background": {r,g,b,a}, "color": {r,g,b,a}, "radius": 999 }`

**19. Accordion** — alternating lines: question, answer, question, answer.
```
{ "items": ["Will it hurt?", "No.", "What does it cost?", "Quoted first."],
  "background": {r,g,b,a}, "color": {r,g,b,a}, "radius": 10 }
```

**20. Pricing** — five lines per tier: name, price, period, button, features
separated by `;`. `featured` is which tier stands out, counting from 1.
```
{ "tiers": ["Starter","₪0","forever","Start free","One site; Community support",
            "Studio","₪49","per month","Choose Studio","Ten sites; Custom domain"],
  "featured": 2, "accent": {r,g,b,a}, "background": {r,g,b,a}, "color": {r,g,b,a} }
```

**21. Testimonial**
```
{ "quote": "...", "author": "Dana Levi", "role": "Owner", "avatar": "",
  "align": "left"|"center", "background": {r,g,b,a}, "color": {r,g,b,a},
  "accent": {r,g,b,a} }
```

**22. Stats** — two lines each: the value, then what it counts.
```
{ "items": ["1,200+", "sites published", "4 min", "from prompt to live"],
  "align": "center", "accent": {r,g,b,a}, "color": {r,g,b,a} }
```

**23. TeamGrid** — three lines each: name, role, photo URL. Empty URL gives an
initial. Use a **face** from section 5 — a photograph of anything else crops to
a small circle and becomes a smudge.
```
{ "people": ["Dana Levi","Head baker","https://...", "Omer Katz","Pastry",""],
  "columns": "3", "accent": {r,g,b,a}, "color": {r,g,b,a} }
```

**24. Timeline** — three lines each: marker, title, detail.
```
{ "steps": ["1","Describe it","One sentence is enough",
            "2","Make it yours","Move blocks around"],
  "accent": {r,g,b,a}, "color": {r,g,b,a} }
```

**25. CTABanner** — the ask, on a band of its own.
```
{ "title": "Ready to order?", "text": "", "cta": "Book a table",
  "href": "#contact", "background": {r,g,b,a}, "color": {r,g,b,a},
  "buttonBackground": {r,g,b,a}, "buttonColor": {r,g,b,a}, "radius": 16 }
```

**26. LogoStrip** — prefer **names**. An entry that is not a URL is set as a
wordmark, which is what a customer logo mostly is. Do not substitute a stock
photograph: at 32px it renders as a postage stamp of somebody's office.
```
{ "logos": ["Kettle","Fathom","Northwind"], "height": "32", "gap": "40",
  "grayscale": "yes", "color": {r,g,b,a} }
```
Set `color` when the strip sits on a dark section — wordmarks are type and
otherwise inherit the section's colour, which on a dark hero is invisible.

**27. SocialLinks** — two lines each: the name, then the address.
```
{ "items": ["Instagram","https://instagram.com/x", "Email","mailto:hi@x.co"],
  "background": {r,g,b,a}, "color": {r,g,b,a}, "size": "14" }
```

## 4. The rules the build enforces

A template that breaks any of these is rejected outright.

1. **Parent and child agree.** Every non-ROOT node has a `parent` that exists,
   and appears in that parent's `nodes`.
2. **`padding` and `margin`** are four numeric strings.
3. **One level-1 Heading.** Zero leaves the page with no subject; two make the
   outline ambiguous.
4. **No photograph twice.** Not as two `src` values, not as a `src` and a
   `backgroundImage`. Compared ignoring the `?w=` part, so the same picture at
   two sizes still counts as a repeat. This is the single thing that most makes
   a page look assembled rather than designed.
5. **Images inside `Columns` carry a pixel `height`.**
6. **A footer.** The last section is a `Container` whose
   `custom.displayName` is exactly `"Footer"` — a page that stops rather than
   ends reads as one that failed to load. One row: the name, a line of small
   print, and SocialLinks.
7. **Text on a photograph reaches 4.5:1.** Where a section has a
   `backgroundImage`, its `overlay` is what the words actually sit on. A dark
   scrim needs light text. Watch for the trap: a Container inside the hero that
   sets an opaque `background` puts its children on **that** colour instead, so
   either make it transparent (`"a": 0`) or colour the text for it.
8. **`Image` needs a `src`, `Video` needs a `videoUrl`**, both non-empty.

## 5. Photographs

Build every image URL from this pattern, substituting the id and the width:

```
https://images.pexels.com/photos/ID/pexels-photo-ID.jpeg?auto=compress&cs=tinysrgb&w=WIDTH
```

Widths: `1600` for a section background, `900` for a hero's side image, `600`
for a card, `400` for a face.

**Use only the ids below.** Every one has been opened and looked at; the caption
is what is actually in the frame. Do not invent an id — an id that does not
exist renders as a broken image, and an id you have not seen renders as
something unrelated, which is worse.

If nothing here fits your subject, use
`https://picsum.photos/seed/SOME-DESCRIPTIVE-WORDS/1600/900` instead. It always
loads, but the picture is arbitrary, so prefer the list.

```
BREAD        8633662 dark sourdough rounds · 35993723 wooden racks of bread
             10202985 rye and white loaves · 6202224 one gold croissant
             2245293 pastry counter, several trays · 7405059 baguettes on steel trays
FOOD         5531093 greens and pasta, wide bowl · 7243881 plated starter, red and white
             8864543 two-part plate, meat and grain · 8194817 dark braise, shallow bowl
             1327393 carrots and jus, fine dining · 262978 dining room in service
COFFEE       5373256 counter and back bar, warm wood · 1855214 menu boards above a counter
             7601665 bags and jars on shelves · 4916548 cups on a window table
             32617176 grinders on the bench · 302899 milk poured into a flat white
DENTAL       7800666 clinician at the chair · 7800669 the surgery, second angle
             6627447 a child being treated · 6812483 instruments laid out
             305567 an empty surgery, clean · 6502623 the room, wide
CONFERENCE   8348468 four people on a panel · 29708258 a speaker on a big stage
             31129059 the audience from behind · 3321796 smaller room, seated speaker
             9275222 full auditorium, slide behind · 8761641 empty chairs before doors open
TRAVEL       9805720 a walker on a bare ridge · 29719488 blue layered peaks in haze
             13522524 green valley from a train · 11680560 cloud on a crater
             10911356 palms against a late sky · 4096283 a wing above the horizon
             1271619 a hiker in summer meadow
DESIGN       2582933 yellow and grey facade, graphic · 414974 laptop and swatches from above
             7675029 three people at a shared monitor · 1714202 dark room, one bright screen
             4348193 hands over printed proofs · 3747269 pencils and layout sketches
             326518 an edit suite, screens and speakers
PHOTOGRAPHY  23991042 full-length shot, softbox in frame · 14257415 close portrait, warm key
             5611592 beauty shot against teal · 29085930 black and white, seated
             20029576 two people, studio · 34921744 a standing figure, low key
             37233404 a dark editorial set-up · 16666883 a photographer working
OFFICE/SAAS  6804068 an office of people at monitors · 7988116 two developers at one desk
             6805161 the wider floor, people working · 12902857 a group around a laptop
             1181461 one bright screen in a dim room · 3184291 a team around a table
             3184338 three colleagues at a laptop · 3184465 two hands meeting over a desk
             3184418 hands joined over paperwork · 29057425 two women, studio, confident
CODE         27427258 syntax-highlighted code, close · 4955393 dark terminal, green on black
             374559 a wall of numbered lines · 270488 HTML on a green screen
             4164418 code with the structure visible · 360591 a colourful stack trace
             1181671 hands holding a Python book
CERAMICS     34004100 rows of unglazed bowls · 8063833 finished pieces, black and white
             6693557 a wheel-head and hand tools · 4241336 hands centring terracotta
             31875677 a tall form being pulled up · 9304545 workshop, shelves of drying work
GYM          6628962 a loaded bar on rubber floor · 2261477 mid-lift, side on
             4464780 a weight stack, close · 32610333 dumbbells in the rack
INTERIORS    1571460 pale living room, stairs behind · 276724 a warm lounge at night
             1080721 a white kitchen, island in front
JOINERY      313776 a joiner planing at the bench · 5466144 fitting a carcass, brick behind
             6790066 the workshop, machines and stock · 5711703 cutting down a long board
             374049 a hand plane and its shavings
FACES        37148308 man in a dark suit · 29852852 woman, dark red hair, low key
             30004325 woman in a grey jacket · 29852895 woman in a white collar, smiling
             12311572 man laughing, red ground · 31869537 woman in black, dark ground
             9092311 man against violet · 26872232 man in a teal jacket
             29995581 man in navy, pale ground · 10816007 man in white and grey
             18032391 bearded man, violet ground
```

Videos, for the `Video` element — these two and no others:
```
https://videos.pexels.com/video-files/7206150/7206150-hd_1920_1080_25fps.mp4   a studio portrait session
https://videos.pexels.com/video-files/8126634/8126634-hd_1920_1080_25fps.mp4   a photographer shooting against brick
```

## 6. Making it good rather than merely valid

**Pick a palette of five and stop.** A ground, a raised panel, an ink, one
accent, one muted grey for secondary text. Write them once and reuse them —
seventeen shades of beige is what makes a page look home-made. Avoid a pure
white ground and pure black ink; `250,249,248` and `20,20,22` read better.

**Vary the section grounds.** Ground, panel, ground, panel, dark band. A page
that is one colour top to bottom has no rhythm.

**Compose the hero.** Either a photograph behind the whole section with a scrim
over it, or a two-column split with words on the left and a picture on the
right. Give it real padding: `["72","48","56","48"]`.

**Write like a person.** "Baked overnight and sold until they are gone" beats
"Quality products for our valued customers". Use concrete numbers, real street
names, actual opening hours. No lorem ipsum, no "Lorem", no "Your text here",
no "Company Name".

**Six to nine sections**, including the navbar and the footer. Choose what the
subject actually needs — a restaurant needs a menu and opening hours, a SaaS
needs pricing and an FAQ.

**Do not try to use all 27 elements.** Fifteen or so is a good page; reaching for
all of them forces the same skeleton onto every subject, which is the single
fastest way to make six templates that are one template in six colours. A
restaurant has no business carrying a pricing table, and a photographer has no
FAQ about deployment.

**Every line of copy is about this business and no other.** Section headings
included. If a heading would read equally well on a dental clinic, a conference
and a bakery — "Built around the parts that matter", "How it works", "Why choose
us" — it is filler, and filler is what makes a template look generated. Three
cards get three different thoughts, not the same three bullets repeated.

**Never copy the names in this prompt.** Dana Levi, Omer Katz, Kettle, Fathom,
Northwind and `hello@example.com` are illustrations of the format. Invent your
own, fitting the subject and the place.

**Never mention DragCanvas, elements, props or JSON in the copy.** The visitor is
reading a bakery's website, not a note about how it was built.

**Say what the picture shows.** If the card is captioned "Rye" the photograph
has to be rye. Mismatched captions are worse than no captions.

## 7. What to return

The JSON object, and nothing else. Alongside it — in your message, not in the
JSON — give one line:

```
name: Bakery — Lehem
category: Business | Landing Page | Portfolio | Event
thumb: https://images.pexels.com/photos/2245293/pexels-photo-2245293.jpeg?auto=compress&cs=tinysrgb&w=600
```

The thumb is a photograph from the page, at width 600.
