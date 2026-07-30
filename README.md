# Raj's Blogs

Static React blog (Vite + TypeScript) for system design, architecture, and backend engineering posts.

## Develop

```bash
npm install
npm run dev
```

Open the URL Vite prints. It should include `/Personal-Blogs-Website-/` in the path.

Vite serves files from `public/` at the site root. Blog images live under `public/blog/<post-slug>/` and are referenced in posts as `blog/<post-slug>/....png`.

## Build

```bash
npm run build
```

This writes the production site into the local `docs/` folder (gitignored). Use it for a local preview:

```bash
npm run preview
```

Do not edit or commit `docs/`. Static assets belong in `public/` only; every build copies them into `docs/`.

## Deploy (GitHub Actions)

Push to `main`. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs `npm ci`, `npm run build`, and deploys the generated `docs/` artifact to GitHub Pages.

In GitHub: **Settings → Pages → Build and deployment**

- Source: **GitHub Actions** (not “Deploy from a branch” + `/docs`)

Site URL:

`https://rajkushwaha0.github.io/Personal-Blogs-Website-/`

Posts use path URLs (`BrowserRouter`). Share links like:

`https://rajkushwaha0.github.io/Personal-Blogs-Website-/posts/...`

A `404.html` copy of the app is generated on build so GitHub Pages can load deep links.

## Add a post

1. Edit or add post data under [`src/data/posts/`](src/data/posts/) and register it in [`src/data/posts/index.ts`](src/data/posts/index.ts).
2. Put diagrams in `public/blog/<post-slug>/`.
3. Run `npm run build` locally to verify, then push `main` so Actions deploys.
