# DragCanvas — Node.js / Express Server

Final project for **Fullstack Server Development with Node.js** (Ruppin).

## 1. What the system does

DragCanvas is a drag-and-drop website builder. A user registers, builds a page by
dragging components onto a canvas, can ask an **AI** to generate a whole layout from a
text description, uploads their own images, and finally **publishes** the result as a
real live website.

This repository contains the Express server behind it plus the React client.

Main flows:

| Flow | What happens |
|---|---|
| Register / login | Password is hashed with bcrypt, login returns a **JWT** |
| Build & save | The canvas is serialised to JSON and stored against the user's project |
| Upload media | File → server memory → **Cloudinary** → public URL saved in the database |
| AI generation | A prompt is sent to an LLM, which returns a full page layout that is then filled with real stock media |
| Publish | The page is exported to static HTML and deployed to **Netlify** through their API |
| Contact form | A visitor fills in the form on a published site; the submission is stored and emailed to the site owner |
| Notifications | Newsletters, scheduled sends and birthday greetings go out as real email over SMTP |
| Admin area | User management, newsletters, scheduled notifications, delivery logs, statistics |

## 2. Technologies

**Server**
- Node.js + Express 5 (ES Modules)
- PostgreSQL through the `pg` driver, wrapped in a **Singleton** connection-pool service
- `jsonwebtoken` — authentication; `bcryptjs` — password hashing
- `multer` + `cloudinary` — file upload to the cloud
- `node-cron` — background jobs: scheduled notifications and daily birthday greetings
- `nodemailer` — real email delivery over SMTP
- `express-rate-limit` — protects the public form endpoint and the paid AI calls
- External APIs: ZhipuAI GLM (layout generation), Pexels (stock media), Netlify (deployment)

**Client**
- React 19 + Vite, Craft.js (drag-and-drop editor), MUI + React-Bootstrap

**Related services** (separate microservices, not in this folder)
- Python FastAPI reports service — admin charts and QR codes

## 3. Architecture

```
server.js            express app: middlewares -> routes -> error handling -> listen
routes.js            central router, mounts every feature under /api
features/<name>/
   <name>.router.js  the endpoints of this feature
   <name>.ctrl.js    request handling and responses
   <name>.mdl.js     SQL / data access
utils/
   db.sql.services.js   Singleton PostgreSQL service (pool + executeQuery)
   response.builder.js  uniform { success, data, timestamp } envelope
   ai.helpers.js        parsing and normalising the AI answer
middlewares/
   auth.js           verifyToken, requireAdmin, requireSuperAdmin
   files.js          multer (memory storage) + Cloudinary configuration
   error.js          404 handler + global error handler
jobs/
   schedule.processor.js   node-cron job that sends scheduled notifications
tests/*.http         ready-made requests for a REST client / Postman
```

Every response follows the same shape:

```json
{ "success": true,  "data": { }, "timestamp": "..." }
{ "success": false, "error": "message", "timestamp": "..." }
```

### Data model (two related entities with full CRUD)

```
TBUsers ──1:N──> TBProjects     (a user owns projects)
   │
   └────1:N──> TBAssets         (a user owns uploaded images; the row stores the Cloudinary URL)
```

## 4. Main API endpoints

Protected endpoints require the header `Authorization: Bearer <token>`.

### Authentication — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create an account (password hashed with bcrypt) |
| POST | `/api/auth/login` | – | Verify the password and return a JWT |
| POST | `/api/auth/logout` | token | Close the session and write the audit log |

### Users — `/api/users`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users` | admin | List all users |
| GET | `/api/users/:id` | token | One user |
| GET | `/api/users/:id/stats` | token | Projects / exports / activity counters |
| POST | `/api/users/update-status` | admin | Activate or deactivate a user |
| POST | `/api/users/update-role` | admin | Grant or revoke admin rights |
| POST | `/api/users/reset-password` | admin | Set a new password for a user |

### Projects — `/api/projects`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/projects/user` | token | Projects of the signed-in user |
| GET | `/api/projects/:projectId` | token | One project with its canvas data |
| POST | `/api/projects/save` | token | Create or update a project |
| DELETE | `/api/projects/:projectId` | token | Soft-delete a project |

### Assets (Cloudinary) — `/api/assets`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/assets/upload` | token | Upload a file, store it in Cloudinary, save the URL |
| GET | `/api/assets/user` | token | List the user's uploads |
| DELETE | `/api/assets/:assetId` | token | Delete from the database and from Cloudinary |

### Forms — `/api/forms`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/forms/submit` | **public** | A visitor submits a form on a published site. Open to any origin because published pages live on their own domains; protected by a honeypot field, a rate limit and strict validation |
| GET | `/api/forms/project/:projectId` | token | The owner reads submissions |
| PUT | `/api/forms/project/:projectId/:submissionId/read` | token | Mark one as read |

### AI — `/api/ai`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/ai/generate` | token | Turn a text prompt into a full page layout |

### Publishing — `/api/publish`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/publish/site` | token | Deploy the exported HTML to Netlify |
| GET | `/site-by-domain/:domain` | – | Serve a published site by its custom domain |

### Templates, notifications and admin tools
`/api/templates`, `/api/notifications`, `/api/schedules`,
`/api/notification-templates`, `/api/notification-logs`, `/api/notification-settings`
— see `tests/*.http` for ready-made requests of each one.

## 5. How to run

```bash
# 1. Install dependencies
npm install

# 2. Configure the environment
cp .env.example .env      # then fill in the values

# 3. Start the server (http://localhost:3001)
npm start

# 4. Start the React client in another terminal (http://localhost:5173)
npm run dev
```

Required variables are listed in `.env.example`. The minimum to boot the server is
`DATABASE_URL` and `JWT_SECRET`; Cloudinary, AI, Netlify and SMTP settings are
needed for those specific features.

### Email

Delivery uses plain SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`,
`MAIL_FROM`). With Gmail you need an **App Password**, not the account password,
and two-factor authentication switched on.

Two limits worth knowing:

- Gmail accepts roughly **500 messages a day** and throttles bursts, so batches
  are sent one at a time with a short delay. A real product would use SendGrid
  or Resend — the mail service sits behind one small interface, so that is a
  change to `.env` rather than to code.
- A `delivered` status means the mail server **accepted** the message, not that
  it arrived. A wrong-but-well-formed address is accepted and bounces later,
  out of our sight; catching that needs inbound webhooks from a transactional
  provider.

Without SMTP configured the server still runs — sending is skipped with a
warning instead of crashing.

### Testing the API

Open any file in `tests/` with the VS Code **REST Client** extension (or import the
requests into Postman). Start with `tests/auth.http`: run *Login*, copy the token from
the response, and paste it into the `@token` variable of the other files.
