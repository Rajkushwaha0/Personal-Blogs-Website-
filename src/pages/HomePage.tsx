import { useEffect, useState, useMemo } from 'react'
import { getComingSoonSeries, getPosts } from '../api/posts'
import type { ComingSoonSeries } from '../api/posts'
import { PostCard } from '../components/PostCard'
import type { PostSummary } from '../types/post'
import { useDebounce } from '../utils/timing'

export function HomePage() {
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [comingSoon, setComingSoon] = useState<ComingSoonSeries[]>([])
  const [loading, setLoading] = useState(true)

  // Search and Tag Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Debounce the search input by 180ms to avoid re-rendering on every single keystroke
  const debouncedSearch = useDebounce(searchQuery, 180)

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

  // Collect all unique tags across published posts
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const post of posts) {
      if (post.tags) {
        for (const tag of post.tags) {
          tagSet.add(tag)
        }
      }
    }
    return Array.from(tagSet).sort()
  }, [posts])

  // Filter posts based on debounced search and active tag
  const filteredPosts = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()

    return posts.filter((post) => {
      // Tag match
      if (selectedTag && (!post.tags || !post.tags.includes(selectedTag))) {
        return false
      }

      // Query match (title, excerpt, tags)
      if (!query) return true

      const titleMatch = post.title.toLowerCase().includes(query)
      const excerptMatch = post.excerpt.toLowerCase().includes(query)
      const tagMatch = post.tags?.some((t) => t.toLowerCase().includes(query))

      return titleMatch || excerptMatch || tagMatch
    })
  }, [posts, debouncedSearch, selectedTag])

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedTag(null)
  }

  return (
    <section className="home">
      <div className="home-intro">
        <h1>Writing</h1>
        <p>
          Deep dives on system design, high-level and low-level architecture,
          and backend engineering. Pick a post to start reading.
        </p>
      </div>

      {/* Instant Search & Topic Index Bar */}
      <div className="search-filter-bar">
        <div className="search-input-wrap">
          <input
            type="search"
            className="search-input"
            placeholder="Search articles by title, topic, or keyword (e.g. 'OT', 'CRDT', 'streaming')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search posts"
          />
          <svg
            className="search-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search input"
            >
              ×
            </button>
          )}
        </div>

        {/* Tag Index Filter Pills */}
        {allTags.length > 0 && (
          <div className="tag-filters-list">
            <button
              type="button"
              className={`tag-filter-btn ${selectedTag === null ? 'active' : ''}`}
              onClick={() => setSelectedTag(null)}
            >
              All Topics
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`tag-filter-btn ${selectedTag === tag ? 'active' : ''}`}
                onClick={() =>
                  setSelectedTag((prev) => (prev === tag ? null : tag))
                }
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <p className="status">Loading posts…</p>
      ) : (
        <>
          {filteredPosts.length === 0 ? (
            <div className="search-empty-state">
              <p>No articles found matching your criteria.</p>
              <button
                type="button"
                className="reset-filters-btn"
                onClick={handleResetFilters}
              >
                Reset Search & Filters
              </button>
            </div>
          ) : (
            <div className="post-list">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.slug}
                  post={post}
                  onTagClick={(tag) => setSelectedTag(tag)}
                />
              ))}
            </div>
          )}

          {comingSoon.length > 0 && selectedTag === null && !searchQuery && (
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
