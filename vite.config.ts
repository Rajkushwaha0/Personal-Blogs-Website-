import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Must match the GitHub repo name for project Pages:
// https://rajkushwaha0.github.io/Personal-Blogs-Website-/
function spaFallback(): Plugin {
  return {
    name: 'spa-github-pages-fallback',
    closeBundle() {
      const outDir = resolve(__dirname, 'docs')
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

export default defineConfig({
  plugins: [react(), spaFallback()],
  base: '/Personal-Blogs-Website-/',
  build: {
    // GitHub Pages "Deploy from a branch" + /docs folder
    outDir: 'docs',
    emptyOutDir: true,
  },
})
