import { Link } from 'react-router-dom'
import type { PostSummary } from '../types/post'

type PostCardProps = {
  post: PostSummary
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="post-card">
      <time className="post-date" dateTime={post.date}>
        {formatDate(post.date)}
      </time>
      <h2 className="post-card-title">
        <Link to={`/posts/${post.slug}`}>{post.title}</Link>
      </h2>
      <p className="post-excerpt">{post.excerpt}</p>
      <Link to={`/posts/${post.slug}`} className="post-read-more">
        Read post
      </Link>
    </article>
  )
}
