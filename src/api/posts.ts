import { posts } from '../data/posts'
import type { Post, PostSummary } from '../types/post'

/**
 * Local data layer. Swap these implementations for fetch('/api/...') later
 * without changing HomePage or PostPage.
 */
export async function getPosts(): Promise<PostSummary[]> {
  return posts
    .map(({ slug, title, date, excerpt }) => ({ slug, title, date, excerpt }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  return posts.find((post) => post.slug === slug) ?? null
}
