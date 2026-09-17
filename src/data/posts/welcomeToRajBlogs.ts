import type { Post } from '../../types/post'

export const welcomeToRajBlogsPost: Post = {
  slug: 'welcome-to-raj-blogs',
  title: 'Welcome to Raj’s Blogs',
  date: '2026-07-24',
  excerpt:
    'What this blog is about: system design, architecture, and backend engineering explained through real production problems.',
  status: 'published',
  tags: ['meta'],
  content: [
    {
      type: 'paragraph',
      text: 'Welcome. This is where I write about designing and running backend systems — the decisions, trade-offs, and failure cases that only become obvious once a system carries real traffic.',
    },
    {
      type: 'paragraph',
      text: 'Most engineering content stops at the diagram. I want to go further and explain why a design was chosen, what it costs, how it behaves under load, and what breaks first when something goes wrong.',
    },
    {
      type: 'heading',
      text: 'What you will find here',
    },
    {
      type: 'list',
      items: [
        'High-level design: architecture, scaling strategies, and system boundaries.',
        'Low-level design: class structure, interfaces, design patterns, and clean abstractions.',
        'Architecture learning: distributed systems concepts explained through practical examples.',
        'Backend engineering: APIs, queues, storage, caching, reliability, and cost.',
        'Production lessons: retries, idempotency, observability, and recovery from failure.',
      ],
    },
    {
      type: 'callout',
      title: 'How posts are written',
      text: 'Each post starts from a real problem, walks through the design reasoning step by step, and ends with the trade-offs and numbers behind the decision.',
    },
    {
      type: 'paragraph',
      text: 'If you are preparing for design interviews or building systems that need to survive scale, these posts are meant to be read as walkthroughs rather than summaries. Start with any topic that matches what you are building right now.',
    },
  ],
}
