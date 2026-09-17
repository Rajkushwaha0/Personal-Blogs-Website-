import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, writeFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Must match the GitHub repo name for project Pages:
// https://rajkushwaha0.github.io/Personal-Blogs-Website-/
function generateSitemapXml(): string {
  const postsFile = resolve(__dirname, 'src/data/posts/index.ts')
  const content = readFileSync(postsFile, 'utf-8')

  // Extract published posts from index.ts
  const postRegex = /slug:\s*['"]([^'"]+)['"][\s\S]*?date:\s*['"]([^'"]+)['"][\s\S]*?status:\s*['"]([^'"]+)['"]/g
  const posts: { slug: string; date: string }[] = []
  let match: RegExpExecArray | null
  while ((match = postRegex.exec(content)) !== null) {
    if (match[3] === 'published') {
      posts.push({ slug: match[1], date: match[2] })
    }
  }

  const baseUrl = 'https://rajkushwaha0.github.io/Personal-Blogs-Website-/'
  const latestDate = posts.length > 0 ? posts[0].date : new Date().toISOString().split('T')[0]

  const urlsXml = [
    `  <url>\n    <loc>${baseUrl}</loc>\n    <lastmod>${latestDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    ...posts.map(
      (p) =>
        `  <url>\n    <loc>${baseUrl}posts/${p.slug}</loc>\n    <lastmod>${p.date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    ),
  ].join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>\n`
}

function spaFallback(): Plugin {
  return {
    name: 'spa-github-pages-fallback',
    closeBundle() {
      const outDir = resolve(__dirname, 'docs')
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
      // Skip Jekyll on branch+/docs Pages so SPA assets are served as-is.
      writeFileSync(resolve(outDir, '.nojekyll'), '')

      // Generate & sync fresh sitemap.xml
      const sitemapXml = generateSitemapXml()
      writeFileSync(resolve(outDir, 'sitemap.xml'), sitemapXml)
      writeFileSync(resolve(__dirname, 'public/sitemap.xml'), sitemapXml)
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
