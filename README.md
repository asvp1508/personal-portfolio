# Arjun Pathi — Portfolio

Static single-file site. No build step, no dependencies to install.

## Deploy to Vercel

**Option A — Vercel dashboard (no CLI needed)**
1. Go to https://vercel.com/new
2. Choose "Deploy" → drag-and-drop this whole folder (or the zip, unzipped) onto the page
3. Vercel will detect it as a static site automatically — click Deploy

**Option B — Vercel CLI**
```bash
npm i -g vercel
cd this-folder
vercel --prod
```

**Option C — Git-based deploy**
1. Push this folder's contents to a GitHub repo
2. Import the repo at https://vercel.com/new
3. Leave build settings empty (no framework, no build command, output directory = root)
4. Deploy

## What's in here
- `index.html` — the entire site. All photos, posters, and the portrait are embedded
  directly in the file as base64 data, so there are no separate image files to
  worry about losing or misconfiguring.
- `vercel.json` — minimal config (clean URLs, no trailing slash). Not required,
  but harmless to keep.

## After deploying
- Custom domain: add it under the Vercel project's Settings → Domains.
- To update the site later, just replace `index.html` with a new export and redeploy
  (drag-and-drop again, or `vercel --prod` if using the CLI, or push to the connected repo).
