import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { PostSummary } from '../types/post'
import { prefetchPost } from '../utils/prefetch'

type PostCardProps = {
  post: PostSummary
  onTagClick?: (tag: string) => void
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function PostCard({ post, onTagClick }: PostCardProps) {
  const cardRef = useRef<HTMLElement | null>(null)

  // Viewport prefetching: When the card scrolls into view, opportunistically preload the post
  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Idle prefetch
            if ('requestIdleCallback' in window) {
              window.requestIdleCallback(() => prefetchPost(post.slug))
            } else {
              setTimeout(() => prefetchPost(post.slug), 200)
            }
            observer.disconnect()
            break
          }
        }
      },
      { rootMargin: '100px 0px' }
    )

    observer.observe(el)

    return () => {
      observer.disconnect()
    }
  }, [post.slug])

  const handleWarmCache = () => {
    prefetchPost(post.slug)
  }

  return (
    <article
      ref={cardRef}
      className="post-card"
      onMouseEnter={handleWarmCache}
      onTouchStart={handleWarmCache}
    >
      <div className="post-card-body">
        <div className="post-card-header">
          <time className="post-date" dateTime={post.date}>
            {formatDate(post.date)}
          </time>
          {post.tags && post.tags.length > 0 && (
            <div className="post-tags-list">
              {post.tags.slice(0, 2).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="post-tag-pill"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onTagClick?.(tag)
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        <h2 className="post-card-title">
          <Link
            to={`/posts/${post.slug}`}
            onMouseEnter={handleWarmCache}
            onFocus={handleWarmCache}
          >
            {post.title}
          </Link>
        </h2>
        <p className="post-excerpt">{post.excerpt}</p>
      </div>
      <Link
        to={`/posts/${post.slug}`}
        className="post-read-more"
        onMouseEnter={handleWarmCache}
        onFocus={handleWarmCache}
      >
        Read post →
      </Link>
    </article>
  )
}
