export type PostStatus = 'published' | 'coming_soon'

export type PostSummary = {
  slug: string
  title: string
  date: string
  excerpt: string
  status: PostStatus
  series?: string
  part?: number
  tags?: string[]
}

export type PostContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string; level?: 2 | 3 }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'callout'; title: string; text: string }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | {
      type: 'table'
      headers: string[]
      rows: string[][]
      caption?: string
    }
  | {
      type: 'code'
      code: string
      language?: string
      caption?: string
    }

export type Post = PostSummary & {
  content: string | PostContentBlock[]
}
