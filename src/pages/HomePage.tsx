import { useEffect, useState } from 'react'
import { getComingSoonSeries, getPosts } from '../api/posts'
import type { ComingSoonSeries } from '../api/posts'
import { PostCard } from '../components/PostCard'
import type { PostSummary } from '../types/post'

export function HomePage() {
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [comingSoon, setComingSoon] = useState<ComingSoonSeries[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    Promise.all([getPosts(), getComingSoonSeries()]).then(
      ([published, upcoming]) => {
        if (!cancelled) {
          setPosts(published)
          setComingSoon(upcoming)
          setLoading(false)
        }
      },
    )

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="home">
      <div className="home-intro">
        <h1>Writing</h1>
        <p>
          Deep dives on system design, high-level and low-level architecture,
          and backend engineering. Pick a post to start reading.
        </p>
      </div>

      {loading ? (
        <p className="status">Loading posts…</p>
      ) : (
        <>
          <div className="post-list">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>

          {comingSoon.length > 0 && (
            <section className="coming-soon" aria-labelledby="coming-soon-heading">
              <h2 id="coming-soon-heading" className="coming-soon-heading">
                Coming soon
              </h2>

              {comingSoon.map((group) => (
                <div key={group.series} className="coming-soon-series">
                  <h3 className="coming-soon-series-title">{group.title}</h3>
                  <p className="coming-soon-series-desc">{group.description}</p>
                  <ol className="coming-soon-list">
                    {group.posts.map((post) => (
                      <li key={post.slug} className="coming-soon-item">
                        <span className="coming-soon-part">
                          Part {post.part}
                        </span>
                        <div className="coming-soon-item-body">
                          <span className="coming-soon-item-title">
                            {post.title}
                          </span>
                          <span className="coming-soon-item-excerpt">
                            {post.excerpt}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </section>
  )
}
