# Raj's Blogs

Static React blog (Vite + TypeScript) for system design, architecture, and backend engineering posts.

## Develop

```bash
npm install
npm run dev
```

Open the URL Vite prints. It should include `/Personal-Blogs-Website-/` in the path.

## Build for GitHub Pages

```bash
npm run build
```

This writes the production site into the `docs/` folder.

## Deploy (current setup)

1. Run `npm run build`
2. Commit and push the `docs/` folder to `main`
3. In GitHub: **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/docs**
4. Wait 1–2 minutes, then open:
   `https://rajkushwaha0.github.io/Personal-Blogs-Website-/`

Posts use HashRouter, so refresh works on URLs like:
`https://rajkushwaha0.github.io/Personal-Blogs-Website-/#/posts/...`

## Why the blank page / missing images happened

GitHub was serving the repo root (`index.html` + `/src/main.tsx`). Browsers cannot run TypeScript that way, so the page stayed blank.

Images also broke because:

- the app requests `/Personal-Blogs-Website-/blog/image.png`
- the unbuilt repo only had `/Personal-Blogs-Website-/public/blog/image.png`

The Vite build copies `public/blog/*` into `docs/blog/*`, which matches the image URLs.

## Add a post

Edit [`src/data/posts/index.ts`](src/data/posts/index.ts), then run `npm run build` and push `docs/` again.
