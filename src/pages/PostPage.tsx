import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPostBySlug } from '../api/posts'
import type { Post, PostContentBlock } from '../types/post'

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
    case 'heading':
      return <h2>{block.text}</h2>
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
  }
}

export function PostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false

    if (!slug) {
      setNotFound(true)
      setLoading(false)
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

  if (loading) {
    return <p className="status">Loading post…</p>
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
    <article className="post">
      <Link to="/" className="back-link">
        ← All posts
      </Link>
      <header className="post-header">
        <time className="post-date" dateTime={post.date}>
          {formatDate(post.date)}
        </time>
        <h1>{post.title}</h1>
      </header>
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
    </article>
  )
}
