import { useEffect, useState } from 'react'
import { getPosts } from '../api/posts'
import { PostCard } from '../components/PostCard'
import type { PostSummary } from '../types/post'

export function HomePage() {
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getPosts().then((data) => {
      if (!cancelled) {
        setPosts(data)
        setLoading(false)
      }
    })

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
        <div className="post-list">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </section>
  )
}
