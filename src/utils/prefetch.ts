import { getPostBySlug } from '../api/posts'
import type { Post } from '../types/post'

const postCache = new Map<string, Post>()
const pendingPrefetches = new Set<string>()
const prefetchedImages = new Set<string>()

/**
 * Prefetch a post's full data and warm its media assets in the browser cache.
 */
export async function prefetchPost(slug: string): Promise<Post | null> {
  if (postCache.has(slug)) {
    return postCache.get(slug)!
  }

  if (pendingPrefetches.has(slug)) {
    return null
  }

  pendingPrefetches.add(slug)

  try {
    const post = await getPostBySlug(slug)
    if (post) {
      postCache.set(slug, post)

      // Opportunistically pre-warm image assets in browser cache
      if (Array.isArray(post.content)) {
        for (const block of post.content) {
          if (block.type === 'image' && block.src && !prefetchedImages.has(block.src)) {
            prefetchedImages.add(block.src)
            const img = new Image()
            img.src = `${import.meta.env.BASE_URL}${block.src}`
          }
        }
      }
    }
    return post
  } finally {
    pendingPrefetches.delete(slug)
  }
}

/**
 * Synchronously read from the prefetch cache if available.
 */
export function getCachedPost(slug: string): Post | null {
  return postCache.get(slug) ?? null
}
