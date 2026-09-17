import type { PostSummary } from '../../types/post'

export const postSummaries: PostSummary[] = [
  {
    slug: 'how-google-docs-works-real-time-collaboration',
    title: 'How Real-Time Collaboration Works: Designing a Google Docs-Style Editor',
    date: '2026-09-17',
    excerpt:
      'Two users edit the same paragraph at the same millisecond. One deletes it, another formats it, and an admin revokes permissions mid-keystroke. Here is how real-time collaborative editors achieve instant responsiveness and consistent convergence without losing data.',
    status: 'published',
    tags: ['system-design', 'architecture', 'distributed-systems', 'websockets', 'database'],
  },
  {
    slug: 'streaming-llm-tokens-without-melting-your-servers',
    title: 'The 500-User Launch That Melted Our Servers: The Truth Behind LLM Streaming',
    date: '2026-08-29',
    excerpt:
      'On localhost, our AI chat felt instant. On launch day with 500 users, our server ran out of memory and crashed. A post-mortem of how token streaming works, where it broke, and how we fixed it.',
    status: 'published',
    tags: ['ai', 'llm', 'streaming', 'nodejs', 'system-design', 'architecture'],
  },
  {
    slug: 'why-good-logging-matters-correlation-ids-and-observability',
    title: 'The Day a Server Went Down: Why Good Logging Matters',
    date: '2026-08-07',
    excerpt:
      'A server crashes. Finding the error is easy. Finding which request caused it — and reconstructing the story — is the real observability problem.',
    status: 'published',
    tags: ['logging', 'observability', 'nodejs', 'grafana', 'system-design'],
  },
  {
    slug: 'production-ready-dag-task-scheduler',
    title: 'Building a Production-Ready DAG Task Scheduler in TypeScript',
    date: '2026-07-31',
    excerpt:
      'From Kahn’s topological sort to worker pools and crash-resilient checkpoints. A complete guide to building an enterprise DAG runner.',
    status: 'published',
    tags: ['algorithms', 'architecture', 'typescript', 'dag', 'concurrency'],
  },
  {
    slug: 'designing-an-end-to-end-media-enrichment-pipeline',
    title: 'Designing an End-to-End Media Enrichment Pipeline',
    date: '2026-07-25',
    excerpt:
      'Follow one uploaded video through validation, SQS, parallel workers, CDN sync, retries, and deletion — and the failures each stage has to survive.',
    status: 'published',
    tags: ['media', 'pipelines', 'architecture'],
  },
  {
    slug: 'welcome-to-raj-blogs',
    title: 'Welcome to Raj’s Blogs',
    date: '2026-07-24',
    excerpt:
      'What this blog is about: system design, architecture, and backend engineering explained through real production problems.',
    status: 'published',
    tags: ['meta'],
  },

  // Upcoming Series: Redis in Production
  {
    slug: 'redis-in-production-what-and-when',
    title: 'What Redis Is and When to Use It',
    date: '2026-08-06',
    excerpt:
      'Cache, sessions, rate limits, pub/sub, queues — and when Redis is the wrong tool for the job.',
    status: 'coming_soon',
    series: 'redis-in-production',
    part: 1,
    tags: ['redis', 'cache', 'system-design'],
  },
  {
    slug: 'redis-in-production-caching-strategies',
    title: 'Caching Strategies',
    date: '2026-08-13',
    excerpt:
      'Cache-aside, read-through, write-through, write-behind, and refresh-ahead — each with the footgun that shows up in production.',
    status: 'coming_soon',
    series: 'redis-in-production',
    part: 2,
    tags: ['redis', 'cache', 'system-design'],
  },
  {
    slug: 'redis-in-production-cache-failures',
    title: 'Famous Cache Failures',
    date: '2026-08-20',
    excerpt:
      'Penetration, hot-key breakdown, avalanche, stampede, and pollution — named by the symptom that wakes you up.',
    status: 'coming_soon',
    series: 'redis-in-production',
    part: 3,
    tags: ['redis', 'cache', 'system-design'],
  },
  {
    slug: 'redis-in-production-consistency-and-locks',
    title: 'Consistency, Races, and Distributed Locks',
    date: '2026-08-27',
    excerpt:
      'Stale cache after DB writes, double-delete, lost updates, and why a Redis lock alone is not enough.',
    status: 'coming_soon',
    series: 'redis-in-production',
    part: 4,
    tags: ['redis', 'cache', 'concurrency'],
  },
  {
    slug: 'redis-in-production-persistence',
    title: 'Persistence: RDB, AOF, and Hybrid',
    date: '2026-09-03',
    excerpt:
      'Snapshots, append-only recovery, RPO/RTO trade-offs, and what happens when Redis restarts cold.',
    status: 'coming_soon',
    series: 'redis-in-production',
    part: 5,
    tags: ['redis', 'persistence'],
  },
  {
    slug: 'redis-in-production-replication-and-sentinel',
    title: 'Replication and Sentinel',
    date: '2026-09-10',
    excerpt:
      'Read replicas, replication lag, quorum elections, automatic failover, and split-brain risks.',
    status: 'coming_soon',
    series: 'redis-in-production',
    part: 6,
    tags: ['redis', 'ha', 'sentinel'],
  },
  {
    slug: 'redis-in-production-cluster-and-ops',
    title: 'Cluster, Hot Keys, and Ops Failures',
    date: '2026-09-17',
    excerpt:
      'Hash slots, MOVED vs ASK, big keys, slow commands, eviction policies, and connection storms.',
    status: 'coming_soon',
    series: 'redis-in-production',
    part: 7,
    tags: ['redis', 'cluster', 'ops'],
  },
  {
    slug: 'redis-in-production-playbook',
    title: 'Production Playbook and Interview Scenarios',
    date: '2026-09-24',
    excerpt:
      'A runbook checklist plus system-design drills: flash sales, rate limiters, sessions, and failover.',
    status: 'coming_soon',
    series: 'redis-in-production',
    part: 8,
    tags: ['redis', 'system-design', 'interview'],
  },
]
