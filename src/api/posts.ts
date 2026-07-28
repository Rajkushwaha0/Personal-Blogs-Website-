import { posts } from '../data/posts'
import type { Post, PostSummary } from '../types/post'

const SERIES_TITLES: Record<string, string> = {
  'redis-in-production': 'Redis in Production',
}

export type ComingSoonSeries = {
  series: string
  title: string
  description: string
  posts: PostSummary[]
}

function toSummary(post: Post): PostSummary {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    excerpt: post.excerpt,
    status: post.status,
    series: post.series,
    part: post.part,
    tags: post.tags,
  }
}

/**
 * Local data layer. Swap these implementations for fetch('/api/...') later
 * without changing HomePage or PostPage.
 */
export async function getPosts(): Promise<PostSummary[]> {
  return posts
    .filter((post) => post.status === 'published')
    .map(toSummary)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function getComingSoonSeries(): Promise<ComingSoonSeries[]> {
  const upcoming = posts
    .filter((post) => post.status === 'coming_soon')
    .map(toSummary)
    .sort((a, b) => (a.part ?? 0) - (b.part ?? 0))

  const bySeries = new Map<string, PostSummary[]>()
  for (const post of upcoming) {
    const key = post.series ?? 'other'
    const list = bySeries.get(key) ?? []
    list.push(post)
    bySeries.set(key, list)
  }

  return [...bySeries.entries()].map(([series, seriesPosts]) => ({
    series,
    title: SERIES_TITLES[series] ?? series,
    description:
      series === 'redis-in-production'
        ? 'From “what is Redis?” to the failures that wake you at 3am — built around a flash-sale product API.'
        : 'Upcoming posts in this series.',
    posts: seriesPosts,
  }))
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  return (
    posts.find((post) => post.slug === slug && post.status === 'published') ??
    null
  )
}
