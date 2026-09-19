import { postSummaries } from '../data/posts'
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

// Dynamic import loaders: enables on-demand code splitting and true lazy loading for each post
const postLoaders: Record<string, () => Promise<Record<string, unknown>>> = {
  'how-google-docs-works-real-time-collaboration': () =>
    import('../data/posts/howGoogleDocsWorks'),
  'streaming-llm-tokens-without-melting-your-servers': () =>
    import('../data/posts/llmStreamingBackpressure'),
  'why-good-logging-matters-correlation-ids-and-observability': () =>
    import('../data/posts/whyGoodLoggingMatters'),
  'production-ready-dag-task-scheduler': () =>
    import('../data/posts/productionDagScheduler'),
  'building-a-production-ready-dag-task-scheduler-for-ai-workflows': () =>
    import('../data/posts/productionDagScheduler'),
  'designing-an-end-to-end-media-enrichment-pipeline': () =>
    import('../data/posts/mediaEnrichmentPipeline'),
  'welcome-to-raj-blogs': () =>
    import('../data/posts/welcomeToRajBlogs'),
}

export async function getPosts(): Promise<PostSummary[]> {
  return postSummaries
    .filter((post) => post.status === 'published')
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function getComingSoonSeries(): Promise<ComingSoonSeries[]> {
  const upcoming = postSummaries
    .filter((post) => post.status === 'coming_soon')
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
  const loader = postLoaders[slug]
  if (!loader) return null

  try {
    const mod = await loader()
    const post =
      Object.values(mod).find(
        (item): item is Post =>
          Boolean(
            item &&
              typeof item === 'object' &&
              'slug' in item &&
              (item as Post).slug === slug
          )
      ) ??
      Object.values(mod).find(
        (item): item is Post =>
          Boolean(
            item &&
              typeof item === 'object' &&
              'slug' in item &&
              'content' in item
          )
      )

    return post ?? null
  } catch (err) {
    console.error(`Failed to dynamically load post for slug: ${slug}`, err)
    return null
  }
}
