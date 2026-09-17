import { useEffect, useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPostBySlug } from '../api/posts'
import { TableOfContents } from '../components/TableOfContents'
import { BackToTop } from '../components/BackToTop'
import type { Post, PostContentBlock } from '../types/post'
import { getCachedPost } from '../utils/prefetch'
import { slugifyHeading } from '../utils/slugify'
import { useRafThrottle } from '../utils/timing'

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function InlineText({ text }: { text: string }) {
  return text.split(/(`[^`]+`)/g).map((part, index) =>
    part.startsWith('`') && part.endsWith('`') ? (
      <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>
    ) : (
      part
    ),
  )
}

function ContentBlock({ block }: { block: PostContentBlock }) {
  switch (block.type) {
    case 'heading': {
      const id = slugifyHeading(block.text)
      if (block.level === 3) {
        return (
          <h3 id={id} className="post-subsection-heading">
            <a href={`#${id}`} className="heading-anchor" aria-hidden="true">
              #
            </a>
            {block.text}
          </h3>
        )
      }
      return (
        <h2 id={id} className="post-section-heading">
          <a href={`#${id}`} className="heading-anchor" aria-hidden="true">
            #
          </a>
          {block.text}
        </h2>
      )
    }
    case 'paragraph':
      return (
        <p>
          <InlineText text={block.text} />
        </p>
      )
    case 'list': {
      const List = block.ordered ? 'ol' : 'ul'
      return (
        <List>
          {block.items.map((item) => (
            <li key={item}>
              <InlineText text={item} />
            </li>
          ))}
        </List>
      )
    }
    case 'callout':
      return (
        <aside className="post-callout">
          <strong>{block.title}</strong>
          <p>
            <InlineText text={block.text} />
          </p>
        </aside>
      )
    case 'image':
      return (
        <figure className="post-figure">
          <img
            src={`${import.meta.env.BASE_URL}${block.src}`}
            alt={block.alt}
            loading="lazy"
            decoding="async"
          />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      )
    case 'table':
      return (
        <figure className="post-table-wrap">
          <div className="post-table-scroll">
            <table className="post-table">
              <thead>
                <tr>
                  {block.headers.map((header) => (
                    <th key={header} scope="col">
                      <InlineText text={header} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={`${row[0] ?? 'row'}-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${cellIndex}-${cell}`}>
                        <InlineText text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      )
    case 'code':
      return (
        <figure className="post-code-wrap">
          {block.caption && (
            <figcaption className="post-code-caption">{block.caption}</figcaption>
          )}
          <pre className="post-code-block" data-language={block.language ?? 'text'}>
            <code>{block.code}</code>
          </pre>
        </figure>
      )
  }
}

function usePostSeo(post: Post | null) {
  useEffect(() => {
    if (!post) return

    const defaultTitle = "Raj's Blogs — Backend Engineering & System Architecture"
    const defaultDesc =
      "Raj's Blogs — deep dives on distributed systems, collaborative editing architectures (OT/CRDT), zero-downtime migrations, and backend engineering."
    const defaultCanonical = 'https://rajkushwaha0.github.io/Personal-Blogs-Website-/'
    const postUrl = `https://rajkushwaha0.github.io/Personal-Blogs-Website-/posts/${post.slug}`

    // 1. Update Title
    document.title = `${post.title} — Raj's Blogs`

    // 2. Helper to set/create meta tags
    const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('description', post.excerpt)
    setMeta('og:title', `${post.title} — Raj's Blogs`, 'property')
    setMeta('og:description', post.excerpt, 'property')
    setMeta('og:url', postUrl, 'property')
    setMeta('og:type', 'article', 'property')
    setMeta('twitter:title', `${post.title} — Raj's Blogs`)
    setMeta('twitter:description', post.excerpt)

    // 3. Update Canonical Link
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', postUrl)

    // 4. Inject Schema.org BlogPosting JSON-LD
    const jsonLdId = 'post-jsonld-schema'
    let scriptEl = document.getElementById(jsonLdId) as HTMLScriptElement | null
    if (!scriptEl) {
      scriptEl = document.createElement('script')
      scriptEl.id = jsonLdId
      scriptEl.type = 'application/ld+json'
      document.head.appendChild(scriptEl)
    }

    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      datePublished: post.date,
      dateModified: post.date,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': postUrl,
      },
      author: {
        '@type': 'Person',
        name: 'Raj Kushwaha',
        jobTitle: 'Backend Engineer',
        url: 'https://www.linkedin.com/in/raj-kushwaha-92611b20a/',
      },
      publisher: {
        '@type': 'Person',
        name: 'Raj Kushwaha',
      },
      keywords: (post.tags ?? []).join(', '),
    }
    scriptEl.textContent = JSON.stringify(schemaData)

    return () => {
      document.title = defaultTitle
      setMeta('description', defaultDesc)
      setMeta('og:title', defaultTitle, 'property')
      setMeta('og:description', defaultDesc, 'property')
      setMeta('og:url', defaultCanonical, 'property')
      setMeta('og:type', 'website', 'property')
      setMeta('twitter:title', defaultTitle)
      setMeta('twitter:description', defaultDesc)
      if (canonical) {
        canonical.setAttribute('href', defaultCanonical)
      }
      if (scriptEl && scriptEl.parentNode) {
        scriptEl.parentNode.removeChild(scriptEl)
      }
    }
  }, [post])
}

export function PostPage() {
  const { slug } = useParams<{ slug: string }>()
  // Read from prefetch cache immediately for zero-lag transition
  const cached = slug ? getCachedPost(slug) : null
  const [post, setPost] = useState<Post | null>(cached)
  const [loading, setLoading] = useState(!cached)
  const [notFound, setNotFound] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)

  // Manage page SEO meta tags and Schema.org JSON-LD dynamically
  usePostSeo(post)

  // Throttled reading progress calculation via requestAnimationFrame
  const updateProgress = useRafThrottle(() => {
    const totalHeight =
      document.documentElement.scrollHeight - window.innerHeight
    if (totalHeight > 0) {
      const currentProgress = (window.scrollY / totalHeight) * 100
      setReadingProgress(Math.min(100, Math.max(0, currentProgress)))
    }
  })

  useEffect(() => {
    window.addEventListener('scroll', updateProgress, { passive: true })
    return () => {
      window.removeEventListener('scroll', updateProgress)
    }
  }, [updateProgress])

  // Always open articles from the top (0, 0)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    setReadingProgress(0)
  }, [slug])

  useEffect(() => {
    let cancelled = false

    if (!slug) {
      setNotFound(true)
      setLoading(false)
      return
    }

    // If we already have the post from cache, skip spinner
    const currentCached = getCachedPost(slug)
    if (currentCached) {
      setPost(currentCached)
      setLoading(false)
      setNotFound(false)
      return
    }

    setLoading(true)
    getPostBySlug(slug).then((data) => {
      if (cancelled) return
      if (!data) {
        setNotFound(true)
        setPost(null)
      } else {
        setNotFound(false)
        setPost(data)
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [slug])

  // Extract headings for the Table of Contents index (excluding level 3 subheadings)
  const headings = useMemo(() => {
    if (!post || !Array.isArray(post.content)) return []
    return post.content
      .filter(
        (block): block is { type: 'heading'; text: string; level?: 2 | 3 } =>
          block.type === 'heading' && block.level !== 3,
      )
      .map((b) => b.text)
  }, [post])

  if (loading && !post) {
    return (
      <div className="post-loading-state">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-meta" />
        <div className="skeleton-line skeleton-body" />
        <div className="skeleton-line skeleton-body" />
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <section className="post-missing">
        <h1>Post not found</h1>
        <p>That slug does not match any post.</p>
        <Link to="/" className="back-link">
          ← Back to all posts
        </Link>
      </section>
    )
  }

  return (
    <>
      {/* Throttled reading progress bar */}
      <div
        className="reading-progress-bar"
        style={{ transform: `scaleX(${readingProgress / 100})` }}
        role="progressbar"
        aria-valuenow={Math.round(readingProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {/* Top Header Section */}
      <div className="post-top-bar">
        <Link to="/" className="back-link">
          ← All posts
        </Link>

        <header className="post-header">
          <div className="post-meta-row">
            <time className="post-date" dateTime={post.date}>
              {formatDate(post.date)}
            </time>
            {post.tags && post.tags.length > 0 && (
              <div className="post-tags-list">
                {post.tags.map((tag) => (
                  <span key={tag} className="post-tag-pill">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <h1>{post.title}</h1>
        </header>
      </div>

      {/* Main Dual-Column Content Layout */}
      <div className={`post-page-layout ${headings.length > 2 ? 'has-sidebar' : ''}`}>
        {/* Left Sticky Sidebar (TOC) on Desktop, Collapsible Accordion on Mobile */}
        {headings.length > 2 && (
          <aside className="post-sidebar-col">
            <TableOfContents headings={headings} />
          </aside>
        )}

        <article className="post post-content-col">
          <div className="post-body">
            {typeof post.content === 'string'
              ? post.content.split('\n\n').map((paragraph) => (
                  <p key={paragraph}>
                    <InlineText text={paragraph} />
                  </p>
                ))
              : post.content.map((block, index) => (
                  <ContentBlock key={`${block.type}-${index}`} block={block} />
                ))}
          </div>

          {/* Post footer with return to all posts and back-to-top action */}
          <footer className="post-footer-nav">
            <Link to="/" className="back-link">
              ← All posts
            </Link>
            <button
              type="button"
              className="post-footer-back-to-top"
              onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })}
            >
              ↑ Back to top
            </button>
          </footer>
        </article>
      </div>

      {/* Floating Back to Top Button */}
      <BackToTop />
    </>
  )
}
