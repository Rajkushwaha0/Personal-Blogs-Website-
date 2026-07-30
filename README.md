# Raj's Blogs

Static React blog (Vite + TypeScript) for system design, architecture, and backend engineering posts.

## Develop

```bash
npm install
npm run dev
```

Open the URL Vite prints. It should include `/Personal-Blogs-Website-/` in the path.

Vite serves files from `public/` at the site root. Blog images live under `public/blog/<post-slug>/` and are referenced in posts as `blog/<post-slug>/....png`.

## Build for GitHub Pages

```bash
npm run build
```

This writes the production site into the `docs/` folder. Always edit images under `public/`; then rebuild so `docs/` stays in sync.

## Deploy (current setup)

1. Run `npm run build`
2. Commit and push the `docs/` folder to `main`
3. In GitHub: **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/docs**
4. Wait 1–2 minutes, then open:
   `https://rajkushwaha0.github.io/Personal-Blogs-Website-/`

Posts use path URLs (BrowserRouter). Share and open links like:
`https://rajkushwaha0.github.io/Personal-Blogs-Website-/posts/...`

A `404.html` copy of the app and an empty `.nojekyll` file are generated on build so GitHub Pages can load deep links and skip Jekyll processing.

## Add a post

1. Edit or add post data under [`src/data/posts/`](src/data/posts/) and register it in [`src/data/posts/index.ts`](src/data/posts/index.ts).
2. Put diagrams in `public/blog/<post-slug>/`.
3. Run `npm run build`, then commit `src/`, `public/`, and `docs/`, and push `main`.
