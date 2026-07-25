import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Must match the GitHub repo name for project Pages:
// https://rajkushwaha0.github.io/Personal-Blogs-Website-/
export default defineConfig({
  plugins: [react()],
  base: '/Personal-Blogs-Website-/',
  build: {
    // GitHub Pages "Deploy from a branch" + /docs folder
    outDir: 'docs',
    emptyOutDir: true,
  },
})
