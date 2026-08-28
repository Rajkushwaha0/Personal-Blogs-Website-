import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Must match the GitHub repo name for project Pages:
// https://rajkushwaha0.github.io/Personal-Blogs-Website-/
function spaFallback(): Plugin {
  return {
    name: 'spa-github-pages-fallback',
    closeBundle() {
      const outDir = resolve(__dirname, 'docs')
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
      // Skip Jekyll on branch+/docs Pages so SPA assets are served as-is.
      writeFileSync(resolve(outDir, '.nojekyll'), '')
    },
  }
}

function autoRedirectRoot(): Plugin {
  return {
    name: 'auto-redirect-root',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/' || req.url === '') {
          res.writeHead(302, { Location: '/Personal-Blogs-Website-/' })
          res.end()
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), spaFallback(), autoRedirectRoot()],
  base: '/Personal-Blogs-Website-/',
  build: {
    // GitHub Pages "Deploy from a branch" + /docs folder
    outDir: 'docs',
    emptyOutDir: true,
  },
})
