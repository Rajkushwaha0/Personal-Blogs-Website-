import type { Post } from '../../types/post'

export const posts: Post[] = [
  {
    slug: 'designing-an-end-to-end-media-enrichment-pipeline',
    title: 'Designing an End-to-End Media Enrichment Pipeline',
    date: '2026-07-25',
    excerpt:
      'Follow one uploaded video through validation, SQS, parallel workers, CDN sync, retries, and deletion — and the failures each stage has to survive.',
    status: 'published',
    tags: ['media', 'pipelines', 'architecture'],
    content: [
      {
        type: 'paragraph',
        text: 'A user uploads a 2 GB video. The upload succeeds. Thirty seconds later the server crashes halfway through thumbnail generation. Five minutes later the same upload request is retried. Meanwhile another worker also starts processing the same file.',
      },
      {
        type: 'paragraph',
        text: 'Now you have duplicate thumbnails, duplicate HLS outputs, inconsistent database state, two different CDN copies, and no reliable way to know which version is correct.',
      },
      {
        type: 'paragraph',
        text: 'Uploading media is not difficult. Building a media pipeline that survives failures at every stage is.',
      },
      {
        type: 'heading',
        text: 'What this article is about',
      },
      {
        type: 'paragraph',
        text: 'While building our media platform, we were processing more than 50,000 media assets every day. We quickly realized that uploading a file was the easiest part. Validation, transcoding, metadata extraction, retries, CDN synchronization, and deletion were where the real engineering problems began.',
      },
      {
        type: 'paragraph',
        text: 'This article explains the architecture we ended up using in production, the trade-offs behind it, and the lessons we learned along the way. To keep it concrete, we will follow one file through the entire system.',
      },
      {
        type: 'callout',
        title: 'Meet video.mp4',
        text: 'A customer uploads video.mp4 for a project. From this point forward, every section asks the same question: what happens to this one file next, and what happens when that step fails?',
      },
      {
        type: 'image',
        src: 'blog/media-pipeline-architecture.png',
        alt: 'Architecture diagram of the full media processing pipeline from upload through deletion',
        caption:
          'The full lifecycle. The rest of this article walks video.mp4 through each box, one failure at a time.',
      },
      {
        type: 'heading',
        text: 'How video.mp4 reaches S3',
      },
      {
        type: 'paragraph',
        text: 'Uploads do not stream through our API servers. The backend issues an S3 presigned URL, and the client uploads directly to private storage. For large videos, we use multipart uploads with multiple presigned URLs so a multi-gigabyte file can transfer in parts, resume after network failures, and never pin an application server for the duration of the upload.',
      },
      {
        type: 'callout',
        title: 'Why presigned URLs?',
        text: 'The API stays thin: authorize the upload, return signed access, create the media record. Bandwidth and retries stay between the client and S3. That is the first separation that keeps upload latency independent of processing.',
      },
      {
        type: 'image',
        src: 'blog/upload-flow.png',
        alt: 'Upload flow diagram showing client requesting a presigned URL, uploading to private S3, validation, media record creation, and SQS publish',
        caption:
          'video.mp4 never streams through the API. Presigned upload, then validation, then the media record, then the queue.',
      },
      {
        type: 'heading',
        text: 'Can we trust video.mp4?',
      },
      {
        type: 'paragraph',
        text: 'Presigned upload does not make the bytes trustworthy. The filename and Content-Type are still only claims. Renaming malware to video.mp4 does not make it a video.',
      },
      {
        type: 'paragraph',
        text: 'So before video.mp4 enters the processing pipeline, we validate the content itself:',
      },
      {
        type: 'list',
        items: [
          'Inspect magic bytes instead of trusting the extension.',
          'Probe the stream with ffprobe rather than assuming the container is valid.',
          'Allowlist codecs and reject MIME mismatches.',
          'Enforce size, duration, resolution, and frame-count limits.',
          'Sanitize the filename and never use user-controlled paths as S3 keys.',
        ],
      },
      {
        type: 'callout',
        title: 'Why validate content, not just headers?',
        text: 'Because attackers do not attack your architecture diagram. They attack the assumption that .mp4 means "safe video." Content validation is the first gate that keeps poisoned input out of FFmpeg, storage, and every downstream worker.',
      },
      {
        type: 'paragraph',
        text: 'Once validation passes, the original object lands in a private S3 bucket. The upload API can return. video.mp4 is durable. Processing has not started yet — and that is intentional.',
      },
      {
        type: 'heading',
        text: 'Why not process the upload synchronously?',
      },
      {
        type: 'paragraph',
        text: 'Because a five-minute FFmpeg conversion should never keep an HTTP connection open. If thumbnail generation blocks the upload response, every spike in media traffic becomes an availability incident for the API.',
      },
      {
        type: 'paragraph',
        text: 'At 50,000 assets per day you need the opposite property: upload latency must stay independent of processing time. The upload service finishes quickly. Everything expensive happens later.',
      },
      {
        type: 'heading',
        text: 'Create one source of truth for video.mp4',
      },
      {
        type: 'paragraph',
        text: 'Before any worker touches the file, we create a media document. This document becomes the source of truth for ownership, state, and processing progress.',
      },
      {
        type: 'list',
        items: [
          '`userId` and `projectId` — who owns the asset.',
          '`uploadedAt` — when ingestion completed.',
          '`mediaUrl` — the application-facing reference.',
          '`s3Url` — private backend-only location of the original.',
          '`cdnUrl` — CloudFront delivery URL.',
          '`mediaType` and `method` — detected type and upload method.',
          '`status` — active or inactive.',
          '`isDeleted` — soft-delete flag, initially false.',
          '`processing` — flags for HLS, media info, thumbnails, compression, and CDN sync.',
        ],
      },
      {
        type: 'callout',
        title: 'Why not simply return the S3 URL?',
        text: 'Because S3 is your storage layer, not your public API. Tomorrow you may migrate storage, change bucket layout, or restrict access further — without changing a single client response. The CDN URL, or an application media ID, is the contract. The private `s3Url` stays backend-only.',
      },
      {
        type: 'heading',
        text: 'Publish work, do not wait for it',
      },
      {
        type: 'paragraph',
        text: 'With the media record in place, the upload service publishes an event to Amazon SQS. video.mp4 is now waiting in a queue, not trapped inside a request thread.',
      },
      {
        type: 'paragraph',
        text: 'Two independent branches pick up the work:',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          'Worker A converts video into adaptive HLS renditions.',
          'Worker B enriches the asset with media info, aspect ratio, thumbnails, and compression.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Why two branches instead of one giant job? Because a thumbnail failure should not block streaming output, and a long HLS job should not prevent metadata from becoming available earlier. Each workload scales on its own.',
      },
      {
        type: 'image',
        src: 'blog/parallel-workers.png',
        alt: 'Parallel workers diagram showing SQS fanning out to HLS, enrichment, and write-back to the media document',
        caption:
          'One message, parallel work. HLS and enrichment scale independently and both write back to the same media document.',
      },
      {
        type: 'heading',
        text: 'From Lambda to in-house workers',
      },
      {
        type: 'paragraph',
        text: 'We started with Lambda consumers on those queues. That worked for smaller assets. Large videos were different: FFmpeg ran long enough to hit Lambda timeouts and ephemeral-storage limits mid-transcode.',
      },
      {
        type: 'paragraph',
        text: 'So we moved the heavy path to in-house queue-listening workers. The learning point is simple: keep the same SQS contract, but run workers that can hold concurrency limits, claim a job before starting, and refuse to run a duplicate for the same asset stage. Lambda remained fine for short work; long media processing needed dedicated workers.',
      },
      {
        type: 'callout',
        title: 'Architecture lesson',
        text: 'Choose compute based on worst-case job duration, not average case. A design that works for images can still fail for a 2 GB video.',
      },
      {
        type: 'heading',
        text: 'Worker A: HLS for video.mp4',
      },
      {
        type: 'paragraph',
        text: 'The HLS worker turns the original into multiple resolutions — 240p, 480p, 720p, 1080p — and writes an m3u8 playlist. Players can switch bitrates as network conditions change.',
      },
      {
        type: 'callout',
        title: 'Failure case: crash after 720p',
        text: 'Imagine FFmpeg finishes 720p, then the worker dies before 1080p. Should we restart everything, or continue? Restarting blindly wastes compute and can leave duplicate outputs. Continuing safely requires deterministic keys and stage checkpoints. The worker must know exactly what already exists for this asset ID before generating the next rendition.',
      },
      {
        type: 'list',
        items: [
          'Choose renditions from detected codec and dimensions — do not upscale without a reason.',
          'Store segments under a deterministic prefix derived from the asset ID.',
          'Mark HLS complete only after the durable set of outputs exists.',
          'Claim the job before work starts so concurrency control blocks duplicate runs for the same stage.',
        ],
      },
      {
        type: 'heading',
        text: 'Worker B: enrich video.mp4',
      },
      {
        type: 'paragraph',
        text: 'The enrichment worker uses ffprobe and FFmpeg to understand and optimize the asset, then writes results back to the same media document:',
      },
      {
        type: 'list',
        items: [
          'Media info — codec, duration, dimensions, bitrate, frame rate, audio streams.',
          'Aspect ratio — normalized dimensions for layouts and transforms.',
          'Thumbnail image — a representative frame.',
          'Thumbnail set — delivery sizes for lists and detail pages.',
          'Compression — an optimized derivative with an acceptable quality target.',
        ],
      },
      {
        type: 'paragraph',
        text: 'The UI can show partial progress because the document updates stage by stage. Clients do not need to know which worker finished first.',
      },
      {
        type: 'heading',
        text: 'Why every worker must be idempotent',
      },
      {
        type: 'paragraph',
        text: 'SQS is at-least-once delivery. The same message can arrive twice. A worker can crash after doing useful work. A visibility timeout can expire while processing continues. If your pipeline assumes exactly-once execution, video.mp4 will eventually corrupt your storage.',
      },
      {
        type: 'paragraph',
        text: 'So every stage answers one question before doing work: has this exact output already been produced for this asset?',
      },
      {
        type: 'list',
        items: [
          'Deterministic S3 keys — retries overwrite or skip the same path, not a new random one.',
          'Attempt counters — visibility into how often a stage is failing.',
          'Atomic state transitions — claim work so two workers do not race on the same stage.',
          'Exponential backoff with jitter — avoid thundering herds on temporary failures.',
          'Dead-letter queue — exhausted messages go somewhere humans can inspect and replay.',
        ],
      },
      {
        type: 'callout',
        title: 'Idempotency turns retries into a feature',
        text: 'Without it, retries create duplicates. With it, retries become the normal recovery path. That is the difference between a pipeline that occasionally works and a pipeline that survives production.',
      },
      {
        type: 'heading',
        text: 'Why synchronize beyond CloudFront?',
      },
      {
        type: 'paragraph',
        text: 'video.mp4 now has a CloudFront URL. For many products that would be enough. In our case it was not.',
      },
      {
        type: 'paragraph',
        text: 'Some clients needed assets in Shopify Files. Others used Gumlet. Some enterprises required their own CDN or object store. Synchronization became a separate adapter-driven stage keyed by asset ID and upload ID.',
      },
      {
        type: 'paragraph',
        text: 'There was also a cost reason. Once eligible traffic is served from the client’s existing CDN, repeated end-user delivery no longer has to burn our CloudFront egress. We still keep CloudFront as a default delivery path, but we do not force every byte of every client through it forever.',
      },
      {
        type: 'callout',
        title: 'Trade-off: sync is not free',
        text: 'Copying assets to Shopify or Gumlet has transfer, storage, and API costs. We enable destinations per client only when integration value or serving savings exceeds those costs. Cost optimization never overrides the requirement to track every copy for later deletion.',
      },
      {
        type: 'paragraph',
        text: 'Why adapters? Because the workflow should not care whether the destination is CloudFront, Shopify, Gumlet, or a future provider. Adding a destination means adding an adapter with upload, status, and delete — not rewriting ingestion.',
      },
      {
        type: 'image',
        src: 'blog/cdn-sync-flow.png',
        alt: 'CDN synchronization diagram showing a sync worker distributing an asset to CloudFront, Shopify, Gumlet, and other client CDNs',
        caption:
          'CloudFront is the default. Client destinations are adapters — and a way to keep repeated delivery cost off our egress bill.',
      },
      {
        type: 'heading',
        text: 'The customer deletes video.mp4',
      },
      {
        type: 'paragraph',
        text: 'Delete sounds simple until you remember where video.mp4 now lives: private S3, HLS segments, thumbnails, compressed derivatives, CloudFront, maybe Shopify, maybe Gumlet, and application references that once pointed to it.',
      },
      {
        type: 'paragraph',
        text: 'So we do not destroy everything on click. First we soft-delete:',
      },
      {
        type: 'list',
        items: [
          '`isDeleted = true`',
          '`status = inactive`',
          '`deletedAt` starts a 3–6 month retention window',
        ],
      },
      {
        type: 'paragraph',
        text: 'The asset disappears from normal product queries but remains recoverable. After retention expires, a cleanup worker walks the manifest and deletes everywhere — including client CDNs — with retry, attempt tracking, and eventual consistency.',
      },
      {
        type: 'callout',
        title: 'Why soft delete first?',
        text: 'Because permanent deletion is irreversible and distributed. Soft delete buys recovery time and turns hard cleanup into a scheduled workflow with per-destination state. A missing remote object counts as success, so repeated cleanup stays safe.',
      },
      {
        type: 'image',
        src: 'blog/deletion-flow.png',
        alt: 'Safe deletion diagram showing soft delete, retention window, cleanup worker, and delete-everywhere across storage and CDNs',
        caption:
          'Delete is a workflow, not a button. Soft delete first, retain for recovery, then clean every copy.',
      },
      {
        type: 'heading',
        text: 'What we deliberately did not build',
      },
      {
        type: 'list',
        items: [
          'Proxying large uploads through the API — multi-GB videos belong on presigned or multipart S3 uploads, not application servers.',
          'Synchronous processing — a long FFmpeg job would hold the upload request and turn media spikes into API outages.',
          'Lambda for every video — fine for short jobs; large transcodes hit timeout and storage limits, which is why heavy work moved to in-house workers.',
          'CloudFront URLs as the only source of truth — CloudFront is a delivery layer; the media document and private original are the source of truth.',
          'One monolithic worker — a single failure would block unrelated stages and force full restarts.',
          'Hard delete on request — one click should not instantly erase every copy across every provider.',
        ],
      },
      {
        type: 'heading',
        text: 'Design principles that made the pipeline hold',
      },
      {
        type: 'list',
        items: [
          'Single Responsibility — upload, validation, HLS, enrichment, sync, and cleanup stay separate.',
          'Open/Closed — new CDN destinations arrive as adapters.',
          'Dependency Inversion — workflows depend on interfaces, not vendor SDKs.',
          'Strategy Pattern — codecs, thumbnails, and destinations vary by media type and client.',
          'Repository Pattern — workers update media state through one persistence boundary.',
          'Event-driven architecture — slow work scales with queue depth, not request concurrency.',
        ],
      },
      {
        type: 'heading',
        text: 'Back-of-the-envelope: what 50k+/day actually means',
      },
      {
        type: 'paragraph',
        text: 'Production scale only becomes useful when translated into capacity. These numbers are illustrative; your codec mix and video minutes will dominate the real cost.',
      },
      {
        type: 'list',
        items: [
          'Average rate: `50,000 / 86,400 ≈ 0.58 uploads/second` (~35 per minute).',
          'Peak design: a 10× burst is ~6 uploads/second without slowing the API.',
          'Queue volume: two processing branches mean up to ~100,000 initial jobs/day before sync and cleanup.',
          'Concurrency: if a job occupies a worker for two minutes, Little’s Law gives `0.58 × 120 ≈ 70` steady-state workers; a 10× peak can need hundreds of slots.',
          'Outage buffer: 15 minutes offline at peak can queue thousands of jobs — SQS keeps ingestion alive while workers recover.',
          'Storage: at 25 MB average originals, uploads alone are ~1.25 TB/day; derivatives can push total writes much higher.',
          'Delivery: moving eligible traffic to client CDNs can materially reduce CloudFront egress.',
        ],
      },
      {
        type: 'callout',
        title: 'Count more than assets',
        text: 'Asset count is vanity if you ignore uploaded bytes, video minutes, rendition count, processing seconds, queue age, retry rate, and delivered bytes. One hour of 4K video can cost more than thousands of small images.',
      },
      {
        type: 'heading',
        text: 'What we got wrong initially',
      },
      {
        type: 'paragraph',
        text: 'The architecture above was not the first version. Early on we tried ideas that looked simple and became bottlenecks:',
      },
      {
        type: 'list',
        items: [
          'Processing uploads synchronously — upload latency became processing latency.',
          'Assuming Lambda could handle every video — large files hit timeouts; dedicated workers with concurrency claims fixed it.',
          'Keeping upload status only in memory — restarts erased progress.',
          'Retrying entire pipelines from scratch — partial success turned into duplicate work and wasted compute.',
          'Tightly coupling CDN synchronization to upload — every new destination forced changes in the ingestion path.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Separating every stage into independently retryable workers fixed most operational pain. Idempotency, dead-letter queues, and soft deletion fixed the rest.',
      },
      {
        type: 'heading',
        text: 'The takeaway',
      },
      {
        type: 'paragraph',
        text: 'The biggest lesson was not learning FFmpeg, S3, or CloudFront. It was realizing that media processing is fundamentally a distributed systems problem.',
      },
      {
        type: 'paragraph',
        text: 'Every upload can fail halfway. Every worker can retry. Every external provider can become temporarily unavailable. Once you design for those failures first, scaling to tens of thousands of media assets per day becomes much simpler.',
      },
      {
        type: 'paragraph',
        text: 'Architecture is not about making the happy path work. It is about making failure boring.',
      },
    ],
  },
  {
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
  },
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
    content: [],
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
    content: [],
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
    content: [],
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
    content: [],
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
    content: [],
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
    content: [],
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
    content: [],
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
    content: [],
  },
]
