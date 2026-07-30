# DragCanvas

A drag-and-drop website builder: users design a page visually, can ask an AI to
generate a full layout from a text description, upload their own images, and
publish the result as a live website.

## Where the code is

| Folder | What it is |
|---|---|
| **[`DragCanvas-prj/DragCanvas`](DragCanvas-prj/DragCanvas)** | **Node.js / Express server + React client** — start here |
| [`DragCanvas-prj/python-reports`](DragCanvas-prj/python-reports) | Python FastAPI microservice: admin statistics charts and QR codes |

The full documentation — what the system does, the technologies, the API
endpoints and how to run everything — is in
**[`DragCanvas-prj/DragCanvas/README.md`](DragCanvas-prj/DragCanvas/README.md)**.

## Branches

| Branch | Contents |
|---|---|
| `feature/microservices-refactor` | **current code**: Express server split into feature modules, JWT authentication, Cloudinary uploads |
| `main` | previous version, kept because the deployed site runs from it |

## Quick start

```bash
cd DragCanvas-prj/DragCanvas
npm install
cp .env.example .env      # then fill in the values
npm start                 # server  -> http://localhost:3001
npm run dev               # client  -> http://localhost:5173
```

## Architecture

```
React client (Vite, Craft.js editor)
      │
      ├── Node.js / Express  ── PostgreSQL (Supabase)
      │        ├── Cloudinary      uploaded images
      │        ├── ZhipuAI GLM     AI layout generation
      │        ├── Pexels          stock photos and videos
      │        └── Netlify API     publishing a project as a live site
      │
      └── Python FastAPI     ── the same PostgreSQL, read-only reports
               └── matplotlib      charts for the admin panel, QR codes
```
