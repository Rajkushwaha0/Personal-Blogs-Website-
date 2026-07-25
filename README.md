# Raj's Blogs

Static React blog (Vite + TypeScript) for system design, architecture, and backend engineering posts. Two screens: a home list and a post detail page. Content is local for now; the data layer is ready to swap to a backend later.

## Develop

```bash
npm install
npm run dev
```

Open the URL Vite prints (with base `/Personal-Blogs-Website-/`).

## Build

```bash
npm run build
npm run preview
```

## Add a post

Edit [`src/data/posts/index.ts`](src/data/posts/index.ts). Add an object with `slug`, `title`, `date`, `excerpt`, and `content`.

Pages load posts only through [`src/api/posts.ts`](src/api/posts.ts). When you add a backend, change that file to call your API.

## Deploy to GitHub Pages

1. Push this repo to GitHub (name it `pipelines`, or change `base` in `vite.config.ts` to match).
2. In the repo: **Settings → Pages → Source → GitHub Actions**.
3. Push to `main` (or run the **Deploy to GitHub Pages** workflow).

Site URL: `https://<username>.github.io/pipelines/`

Routes use HashRouter (`/#/posts/...`) so refreshes work on Pages without a server.
