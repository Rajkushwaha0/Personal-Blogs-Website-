import type { Post } from '../../types/post'

export const productionDagSchedulerPost: Post = {
  slug: 'building-a-production-ready-dag-task-scheduler-for-ai-workflows',
  title: 'How Production Workflow Schedulers Actually Work',
  date: '2026-07-30',
  excerpt:
    'A PM asks for a simple AI pipeline. It works on day 1. By day 60 the platform is on fire. Follow the failures that force every design decision — from dependency counters to CAS, leases, and the outbox.',
  status: 'published',
  tags: ['pipelines', 'scheduler', 'architecture', 'system-design'],
  content: [
    {
      type: 'paragraph',
      text: 'This is not a tour of “the scheduler I built.” It is an investigation. We start with a feature every engineer has been asked to ship, watch it fail in production the way real systems fail, and only then introduce each mechanism — when the pain makes the reason obvious.',
    },
    {
      type: 'callout',
      title: 'How to read this',
      text: 'You are learning with the system. Each section answers a question the previous failure raised. By the end you should be able to explain why queues alone are not enough, why DAGs exist, and why visibility timeout is not correctness.',
    },

    {
      type: 'heading',
      text: 'The feature looked easy',
    },
    {
      type: 'paragraph',
      text: 'A product manager asks for something simple. The user types a prompt. The system generates two images, stitches a video from those images, then attaches audio.',
    },
    {
      type: 'list',
      ordered: true,
      items: [
        'User enters a prompt',
        'Generate Image A',
        'Generate Image B',
        'Create Video',
        'Generate Audio',
      ],
    },
    {
      type: 'paragraph',
      text: 'Looks easy. Most of us build one of two things.',
    },
    {
      type: 'paragraph',
      text: 'A chain of queues:',
    },
    {
      type: 'list',
      ordered: true,
      items: [
        'Queue → worker → next queue → worker → done',
      ],
    },
    {
      type: 'paragraph',
      text: 'Or a straight line of awaits:',
    },
    {
      type: 'paragraph',
      text: '`await imageA()` → `await imageB()` → `await video()` → `await audio()`',
    },
    {
      type: 'paragraph',
      text: 'It works perfectly. Until production.',
    },

    {
      type: 'heading',
      text: 'Production broke everything',
    },
    {
      type: 'paragraph',
      text: 'Day 1. One hundred users. Everything works. You ship. You sleep.',
    },
    {
      type: 'paragraph',
      text: 'Day 10. A worker crashes after generating an image but before acknowledging the message. SQS redelivers. Another worker starts the same task. Now two image generations happen. Double billing. Same output written twice.',
    },
    {
      type: 'paragraph',
      text: 'Day 20. Video starts. Image B is not finished. You get a half-built video — or a video that ran on incomplete inputs. The queue happily delivered “video work.” It never knew Image B was a prerequisite.',
    },
    {
      type: 'paragraph',
      text: 'Day 40. Someone edits the workflow in a config UI. The graph becomes a cycle: A → B → C → A. Every task waits forever. Nobody knows why. There is no progress signal — only silence.',
    },
    {
      type: 'paragraph',
      text: 'Day 60. The workflow has 40,000 nodes. Your “scheduler” does the thing that felt obvious on day 1:',
    },
    {
      type: 'paragraph',
      text: '`find all waiting tasks` → check dependencies → repeat',
    },
    {
      type: 'paragraph',
      text: 'CPU sits at 100%. Mongo melts. The entire platform stops — not because one model timed out, but because the control plane scanned the world every tick.',
    },
    {
      type: 'image',
      src: 'blog/production-ready-dag-task-scheduler/failure-timeline.png',
      alt: 'Timeline of escalating production failures from day 1 through day 60: happy path, duplicate billing, early video, cyclic wait, and full-graph scan outage',
      caption:
        'Same feature. Five weeks. The failures escalate until the platform itself becomes the bottleneck.',
    },
    {
      type: 'callout',
      title: 'Why are all these happening?',
      text: 'Not because queues are bad. Not because Mongo is slow. Not because SQS “duplicated.” Because the scheduler does not understand dependencies. That is where a DAG enters — not before.',
    },

    {
      type: 'heading',
      text: 'Why a queue alone is not enough',
    },
    {
      type: 'paragraph',
      text: 'A queue delivers work. It does not encode “Video may run only after Image A and Image B succeed.” Linear pipelines hide that rule inside your head or inside brittle stage names. Graphs make the rule explicit.',
    },
    {
      type: 'image',
      src: 'blog/production-ready-dag-task-scheduler/linear-vs-dag.png',
      alt: 'Side-by-side comparison of a linear queue chain versus a dependency DAG with prompt fanning out to two images that converge into video then audio',
      caption:
        'Left: delivery. Right: execution rules. Only one of these knows when Video is allowed to start.',
    },
    {
      type: 'table',
      headers: ['Question', 'Linear queue / awaits', 'Dependency DAG'],
      rows: [
        [
          'Understands dependencies?',
          'No — only “what’s next in line”',
          'Yes — edges are hard prerequisites',
        ],
        [
          'Independent branches in parallel?',
          'Only if you hand-build fan-out',
          'Automatic when parents complete',
        ],
        [
          'Fan-in (wait for both images)?',
          'Easy to get wrong',
          'First-class: child waits on all parents',
        ],
        [
          'Cycle safety?',
          'Not a concept',
          'Reject at create time',
        ],
        [
          'Scales without scanning?',
          'Often “check everything waiting”',
          'React: completion wakes direct children',
        ],
      ],
      caption:
        'Queues move messages. DAGs decide eligibility. You need both — and they are not the same job.',
    },

    {
      type: 'heading',
      text: 'What exactly is a DAG?',
    },
    {
      type: 'paragraph',
      text: 'Most blogs say “Directed Acyclic Graph” and move on. Nobody understands that from the words alone. Start visually.',
    },
    {
      type: 'paragraph',
      text: 'A line:',
    },
    {
      type: 'paragraph',
      text: 'Prompt → Image A → Video → Audio',
    },
    {
      type: 'paragraph',
      text: 'Add branching:',
    },
    {
      type: 'paragraph',
      text: 'Prompt → Image A and Image B → both feed Video → Audio',
    },
    {
      type: 'paragraph',
      text: 'This is no longer a list. It is a graph. Every box is a task. Every arrow is a dependency. One rule powers everything:',
    },
    {
      type: 'callout',
      title: 'The one rule',
      text: 'A task cannot run until all incoming edges are complete. Fan-out gives parallelism for free. Fan-in gives correctness.',
    },
    {
      type: 'image',
      src: 'blog/production-ready-dag-task-scheduler/workflow-dag.png',
      alt: 'Workflow DAG showing a prompt task fanning out to two image tasks that converge into video generation and then audio generation',
      caption:
        'Same product feature as the PM asked for — now drawn as execution rules, not a to-do list.',
    },
    {
      type: 'paragraph',
      text: 'Why directed? Arrows have direction: Image A enables Video; Video does not enable Image A.',
    },
    {
      type: 'paragraph',
      text: 'Why acyclic? Because A → B → C → A can never finish. Everyone waits forever. So before a workflow is stored, the API runs a topological sort (Kahn’s algorithm) and rejects cycles. That check belongs on the server. Client-only validation is a suggestion, not a platform guarantee.',
    },

    {
      type: 'heading',
      text: 'How the scheduler thinks',
    },
    {
      type: 'paragraph',
      text: 'Do not jump into a field dump. Imagine Video depends on Image A and Image B. The scheduler stores one number:',
    },
    {
      type: 'paragraph',
      text: '`remainingDependencies = 2`',
    },
    {
      type: 'paragraph',
      text: 'Image A completes. The counter becomes 1. Still waiting. Image B completes. The counter becomes 0. The scheduler immediately knows: Video is READY.',
    },
    {
      type: 'paragraph',
      text: 'No scan of the whole workflow. No loop asking “is Image A done? is Image B done?” every second. We only react when something changes.',
    },
    {
      type: 'callout',
      title: 'Huge lesson',
      text: 'Good schedulers are event-driven. Completed parents wake children. Polling the entire graph to discover ready work is how day 60 happens.',
    },
    {
      type: 'paragraph',
      text: 'Store edges once — typically as `dependsOn` on the child — and discover dependents with a reverse index on completion. Avoid a duplicated `children` array that drifts from reality. Keep payloads small: media travels as references (`fromTasks`), not as megabytes copied through every hop. The queue message stays tiny — usually `{ taskId }` — and workers re-read truth from the database after claiming.',
    },

    {
      type: 'heading',
      text: 'End-to-end: one click of Generate',
    },
    {
      type: 'paragraph',
      text: 'Walk one request instead of jumping between subsystems.',
    },
    {
      type: 'list',
      ordered: true,
      items: [
        'API receives the workflow and validates the graph. Cycle? Reject.',
        'Store tasks with `remainingDependencies`, `status`, attempt/lease fields, retry budget, and output refs.',
        'Tasks with `remainingDependencies = 0` become READY.',
        'READY work enters a transactional outbox; the publisher sends to Amazon SQS.',
        'Worker receives a message — and does not trust SQS alone. It reads Mongo, claims the task, mints an `attemptId` and a lease.',
        'Worker runs the model, stores output refs, marks complete under compare-and-set.',
        'Looks only at direct children, decrements each counter. When a counter hits zero, that child becomes READY and enters the outbox.',
        'The workflow continues. No full-graph walk.',
      ],
    },
    {
      type: 'image',
      src: 'blog/production-ready-dag-task-scheduler/scheduler-architecture.png',
      alt: 'Scheduler architecture showing the workflow API, DAG validator, MongoDB tasks and outbox, outbox publisher, SQS, stateless workers, dependency resolver, retry scheduler, dead-letter queue, and lease reconciler',
      caption:
        'Control plane for eligibility and wake-ups. Data plane for bytes. The queue is a signal, not the source of truth.',
    },
    {
      type: 'paragraph',
      text: 'Cancellation and human gates fit the same model: move a run to `CANCELLED` or a held state that is not READY, and refuse publish/claim once that bit is set. Approvals and billing freezes are just eligibility rules with different names.',
    },
    {
      type: 'callout',
      title: 'Build vs buy',
      text: 'Temporal and AWS Step Functions give durability and timers out of the box. Build a custom DAG scheduler when you need deep media routing, per-task-type queues, or billing hooks those products do not fit. The price is owning CAS, leases, outbox, DLQ, and reconciliation yourself.',
    },

    {
      type: 'heading',
      text: 'Concurrency: two workers, one door',
    },
    {
      type: 'paragraph',
      text: 'Imagine two workers receive the same message. Who runs the model?',
    },
    {
      type: 'paragraph',
      text: 'Compare-and-set sounds academic until you picture two people trying to lock one room. The first closes the door. The second reaches it — already locked — and leaves. That is CAS: only one update matches `status = READY` (or the retry-eligible state) and wins the claim. The loser sees zero documents modified and exits without calling the provider.',
    },
    {
      type: 'paragraph',
      text: 'The claim mints an `attemptId` and `leaseExpiresAt`. Completion is also CAS: only the matching attempt may finalize. Second delivery with a stale attempt is a no-op.',
    },
    {
      type: 'paragraph',
      text: 'Think of a lease like renting a parking spot. You own it until the timer expires. If you disappear, the spot becomes free. A reconciler returns expired `RUNNING` tasks to READY (or fails them by policy). SQS visibility timeout is a delivery hint. The lease is ownership.',
    },
    {
      type: 'image',
      src: 'blog/production-ready-dag-task-scheduler/task-state-and-lease.png',
      alt: 'Task lifecycle state machine with lease annotations covering waiting on dependencies, ready, running, waiting retry, completed, failed, and cancelled states',
      caption:
        'Happy path and retry path share one idea: claim with an attempt, finish only if that attempt still owns the task.',
    },
    {
      type: 'paragraph',
      text: 'Fan-in races matter too. Image A and Image B may finish milliseconds apart. Both decrement Video’s counter. Decrements must be atomic. Only the transition that observes `1 → 0` marks Video READY and writes the outbox event. Lost updates here look like “Video forever waiting” with a counter that never quite flipped in anyone’s transaction.',
    },

    {
      type: 'heading',
      text: 'Why SQS is not enough',
    },
    {
      type: 'paragraph',
      text: 'Beginners believe visibility timeout solves everything. Challenge that.',
    },
    {
      type: 'paragraph',
      text: 'Worker generates an image. Before updating Mongo, the machine dies. Visibility timeout expires. A new worker arrives. What happens?',
    },
    {
      type: 'paragraph',
      text: 'Image generated twice. Twice the money. Twice the API call — unless side effects are idempotent on `(taskId, attemptId)` or a deterministic object key, and finalize is CAS-guarded.',
    },
    {
      type: 'callout',
      title: 'Memorable line',
      text: 'Visibility timeout recovered delivery. Not correctness. Correctness comes from claims, leases, attempt IDs, and idempotent side effects.',
    },

    {
      type: 'heading',
      text: 'Why the outbox exists',
    },
    {
      type: 'paragraph',
      text: 'Imagine Mongo marks Video READY. The server crashes before SQS publish. The task is READY forever and never executes.',
    },
    {
      type: 'paragraph',
      text: 'Opposite case: SQS publish succeeds, then Mongo rolls back. A worker gets a ghost task.',
    },
    {
      type: 'paragraph',
      text: 'Those are dual-write gaps between components — not bugs inside SQS or Mongo alone. A transactional outbox closes both: commit “please publish this” with the state change, then a publisher drains the outbox. Duplicate publishes are fine because workers claim idempotently.',
    },
    {
      type: 'image',
      src: 'blog/production-ready-dag-task-scheduler/atomic-completion-outbox.png',
      alt: 'Sequence diagram of task completion inside one transaction: verify attempt, store output, mark completed, decrement child dependency counters, insert outbox event, then publish to SQS',
      caption:
        'Completion and child wake-up commit together. Publishing happens after the commit, from the outbox.',
    },
    {
      type: 'callout',
      title: 'Do not collapse dispatch into status',
      text: 'One enum that means both “logically ready” and “definitely in the queue” will lie under partial failure. Keep logical status and outbox/dispatch state separate.',
    },

    {
      type: 'heading',
      text: 'What happens during failures',
    },
    {
      type: 'paragraph',
      text: 'Transient failures (timeouts, rate limits, overload) retry with exponential backoff plus jitter. Permanent failures exhaust the budget and go to a DLQ for humans. Descendants need an explicit product choice: fail-fast (skip the subgraph so billing settles) or park-and-replay (leave children waiting until an operator retries the failed ancestor).',
    },
    {
      type: 'image',
      src: 'blog/production-ready-dag-task-scheduler/failure-retry-recovery.png',
      alt: 'Failure and recovery paths showing worker crash redelivery, expired lease reconciliation, transient failure backoff, exhausted retry budget routing to a dead-letter queue, and descendant policy choices',
      caption:
        'Different failures need different mechanisms. One retry loop cannot cover all of them.',
    },
    {
      type: 'table',
      headers: ['Failure', 'What breaks', 'Fix'],
      rows: [
        [
          'Worker crash mid-run',
          'Task stuck `RUNNING`, or silent redelivery',
          'Lease expiry + reconciler; idempotent outputs',
        ],
        [
          'Duplicate SQS message',
          'Same task twice, double spend',
          'CAS claim + attempt-scoped finalize',
        ],
        [
          'Provider timeout',
          'Transient error storms',
          'Backoff + jitter, then READY again',
        ],
        [
          'Permanent error',
          'Infinite retry / endless cost',
          'Retry budget → DLQ / operator queue',
        ],
        [
          'Cycle in the graph',
          'Workflow waits forever',
          'Server-side DAG validation at create',
        ],
        [
          'Huge workflow',
          'DB/CPU melt from full scans',
          '`remainingDependencies` + wake children only',
        ],
        [
          'READY but never published',
          'Work stalls after crash between DB and SQS',
          'Transactional outbox + publisher',
        ],
      ],
      caption:
        'When someone asks “what if X?”, answer from this table — then dig into the mechanism.',
    },

    {
      type: 'heading',
      text: 'Scaling without scanning the graph',
    },
    {
      type: 'paragraph',
      text: 'Suppose a workflow has a million tasks. Would you, every second, loop every task and check dependencies? Impossible.',
    },
    {
      type: 'paragraph',
      text: 'A good scheduler never scans the graph to find work. It only reacts. Completion touches direct children. Hot fan-out (one parent, 100,000 children) is batched so one transaction does not lock the world. Index READY / outbox-pending work — not “all non-terminal tasks.”',
    },
    {
      type: 'paragraph',
      text: 'Illustrative envelope for 1M tasks/day: ~11.6 tasks/s average, ~116/s at a 10× burst. At 120s mean runtime, Little’s Law gives ~1,390 concurrent tasks average and ~13,900 at burst. Mean fan-out of 2 means ~2M edge updates/day — cheap if indexed, fatal if each update rescans the graph. Provider quotas usually hit the wall before Mongo or SQS.',
    },
    {
      type: 'image',
      src: 'blog/production-ready-dag-task-scheduler/scale-envelope.png',
      alt: 'Capacity planning infographic for one million tasks per day showing arrival rate, burst rate, Little’s Law concurrency, dependency edge update rate, hot fan-out warning, and storage estimate',
      caption:
        'Task count is vanity. Runtime, fan-out, and provider quotas set capacity.',
    },
    {
      type: 'callout',
      title: 'What to watch',
      text: 'Oldest message age, lease expiry rate, retry rate by error class, critical-path latency, stuck `RUNNING` count, outbox lag, per-tenant concurrency. Fairness and quotas matter: newest-first policies starve old runs; one customer’s 50,000-node graph should not drown everyone else.',
    },

    {
      type: 'heading',
      text: 'What this scheduler taught me',
    },
    {
      type: 'list',
      items: [
        'A queue does not understand dependencies; it only delivers work.',
        'DAGs are not about visualization — they encode execution rules.',
        'At-least-once delivery is easy; exactly-once execution is a myth. Idempotency is the real solution.',
        'Never scan an entire workflow to discover ready tasks. Let completed tasks wake their children.',
        'Distributed systems fail in the gaps between components, not only inside individual services. Outbox, CAS, and leases exist to close those gaps.',
        'Visibility timeout recovered delivery — not correctness.',
        'Every optimization should preserve correctness first. Speed without correctness only creates faster failures.',
        'The best schedulers are event-driven. They react to state changes instead of continuously searching for work.',
        'Design every component assuming crashes, duplicate messages, retries, and partial failures will happen.',
      ],
    },
    {
      type: 'paragraph',
      text: 'If you leave with one instinct, make it this: when a workflow misbehaves, ask whether the system understands dependencies — or whether you asked a queue to do a job only a graph can do.',
    },
  ],
}
