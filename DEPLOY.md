# Deploying DragCanvas

Three pieces deploy independently, and each one reads its own settings:

| Piece | Host | Address |
|---|---|---|
| React client | Netlify | `dragcanvasapp.netlify.app` |
| Node API | Render | `dragcanvas.onrender.com` |
| Python reports | Render | `dragcanvas-reports.onrender.com` |

All three deploy automatically when `main` is pushed. That is the thing to plan
around: a push updates everything at once, so anything a new commit needs must
already be in place before the push, not after it.

## The one rule worth reading twice

**A `VITE_` variable is not a secret.** Vite substitutes those values into the
JavaScript when the site is *built*, so whatever is in them ends up in the file
every visitor downloads. Addresses belong there; keys never do. A key that needs
to reach a provider goes in the Node service and the browser calls our own
endpoint instead.

This is not hypothetical - it happened twice in this project. The AI text key
was moved to the server first; the image key was missed and sat readable on the
published site until it was found and rotated. Marking the variable "secret" in
the Netlify UI does not help, because that only hides it from the dashboard, not
from the built file.

## Environment variables

### Netlify - client

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://dragcanvas.onrender.com` |
| `VITE_PY_API_URL` | `https://dragcanvas-reports.onrender.com` |
| `VITE_EXAMPLE_SITE_URL` | a genuinely published DragCanvas site |

All three are addresses, all three are public, and there must be nothing else
here. Note the second one carries `-reports`: it is a different service from the
first, and confusing the two makes the admin Statistics tab fail while
everything else looks healthy.

The third is what the landing page turns into a QR code, so a visitor can open a
real site on their phone. Left unset it falls back to this app's own address,
which scans perfectly and proves nothing - point it at something a stranger
could actually land on.

Vite reads these at build time, so **changing one requires a rebuild** - saving
it in the dashboard changes nothing on its own. Use *Deploys → Clear cache and
deploy*.

### Render - Node API

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Supabase connection string |
| `JWT_SECRET` | must be byte-identical to the reports service |
| `FRONTEND_URL` | `https://dragcanvasapp.netlify.app` - CORS and mail links |
| `PUBLIC_API_URL` | this service's own address, used to build image-proxy links |
| `PORT` | supplied by Render |
| `OPENROUTER_API_KEY`, `AI_MODEL` | layout generation |
| `STABILITY_API_KEY` | generated images - server-side, never `VITE_` |
| `PEXELS_API_KEY` | stock photos |
| `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | uploads |
| `NETLIFY_TOKEN` | publishing a project as a live site |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | see below |
| `TELEGRAM_BOT_TOKEN` | optional owner notifications for form submissions |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | platform key and signed Connect payment webhooks |
| `STRIPE_CONNECT_CLIENT_ID` | Connect client ID from Stripe platform settings |

For Stripe Connect, register this OAuth redirect URI in Stripe:
`https://dragcanvas.onrender.com/api/commerce/stripe/callback`. Configure the
Connect webhook endpoint as `https://dragcanvas.onrender.com/api/commerce/webhook`
and subscribe it to `checkout.session.completed` for connected accounts.

Mail is the one group that fails quietly. `mail.service.js` never throws: with
no credentials it logs `[MAIL] SMTP is not configured` once and returns
`{ok: false}`, so form notifications simply never arrive and nothing else looks
wrong. Being able to log in is not evidence that mail works - only a delivered
message is.

### Render - Python reports

| Variable | Notes |
|---|---|
| `DATABASE_URL` | same database, read-only use |
| `JWT_SECRET` | **must match the Node API exactly** |
| `FRONTEND_URL` | added to the CORS allowlist |

`JWT_SECRET` is what ties the two services together: the Node API signs a token,
the reports service verifies it with the same secret. If they differ, every
admin request to reports answers 401 while an anonymous one still answers 401 -
the two failures look identical from outside, which is why the check below uses
a real admin session rather than a bare `curl`.

## Deploying

1. **Apply database migrations.** From the Node project directory run `npm run db:migrate` with the production `DATABASE_URL`. The runner records each migration and is safe to run again.
2. **Set the variables first.** Any variable a new commit needs must exist
   before the push, on the service that reads it. A push triggers all three
   deploys immediately, so a variable added afterwards means a window of
   500s - and on the reports service a missing `JWT_SECRET` is a hard 500 on
   every request.
3. **Push `main`.** Render and Netlify pick it up on their own.
4. **Run the checks below.** A green deploy log only means the process started.

## Checks after a deploy

```bash
# Node API is up
curl -s -o /dev/null -w '%{http_code}\n' https://dragcanvas.onrender.com/health
# expect 200

# Reports refuses anonymous callers
curl -s -o /dev/null -w '%{http_code}\n' https://dragcanvas-reports.onrender.com/api/stats/summary
# expect 401 - a 200 here means the statistics are public

# No secret-shaped string reached the published bundle
BUNDLE=$(curl -s https://dragcanvasapp.netlify.app/ | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' | head -1)
curl -s "https://dragcanvasapp.netlify.app$BUNDLE" | grep -cE 'sk-[A-Za-z0-9_-]{12,}'
# expect 0
```

Three things a request cannot tell you, which need a browser and an admin login:

- **Statistics tab renders charts.** This is the only check that proves
  `JWT_SECRET` matches across the two services, because that code path runs only
  for a request that actually carries a token.
- **AI generation fills in images.** Grey `picsum.photos` placeholders left
  behind mean the Node service has no `STABILITY_API_KEY`.
- **A form submission arrives as mail.** Nothing else reveals broken SMTP.

If the browser disagrees with the checks above, suspect the browser's cache
before suspecting the deploy: compare the `/assets/index-*.js` filename the page
loads against the one Netlify serves, and hard-reload if they differ.

## Rotating a leaked key

Rotating means **deleting** the old key at the provider. Issuing a new one
alongside it leaves the leaked one working. Then put the new value on the Node
service, confirm nothing in `src/` still reads it through `import.meta.env`, and
redeploy the client so the old bundle stops being served.
