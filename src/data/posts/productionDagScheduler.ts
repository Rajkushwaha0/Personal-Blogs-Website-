import type { Post } from '../../types/post'

export const productionDagSchedulerPost: Post = {
  slug: 'building-a-production-ready-dag-task-scheduler-for-ai-workflows',
  title: 'Building a Production-Ready DAG Task Scheduler for AI Workflows',
  date: '2026-07-30',
  excerpt:
    'How to schedule dependency-driven AI workflows without duplicate execution, lost children, or graph-wide scans — and what breaks first when you scale to millions of tasks.',
  status: 'published',
  tags: ['pipelines', 'scheduler', 'architecture', 'system-design'],
  content: [
    {
      type: 'paragraph',
      text: 'A product manager asks for a simple feature: the user types a prompt, the system generates two images, stitches a video from those images, then attaches audio. Four steps. Linear. Easy.',
    },
    {
      type: 'paragraph',
      text: 'Then production arrives. One image worker crashes after writing the PNG but before acknowledging the message. Another scheduler instance publishes the same video task twice. Audio starts before video finishes because a dependency flag and a dependency list disagree. Overnight the DAG grows from four nodes to forty thousand, and the nightly “find all waiting tasks” scan becomes the outage.',
    },
    {
      type: 'paragraph',
      text: 'Modern AI applications rarely execute a single task. They execute graphs. This article is a production-grade reference design for scheduling those graphs: what must be true under concurrency, how workers stay idempotent on at-least-once queues, and where the capacity numbers actually come from.',
    },
    {
      type: 'callout',
      title: 'How to read this',
      text: 'Treat this as an architecture you can implement or pressure-test in a design review — not a claim that every line is already shipped in one specific codebase. The invariants matter more than the brand names on the boxes.',
    },
    {
      type: 'heading',
      text: 'Meet the workflow that keeps breaking',
    },
    {
      type: 'paragraph',
      text: 'We will follow one run end to end:',
    },
    {
      type: 'list',
      ordered: true,
      items: [
        '`Prompt` produces structured generation params.',
        '`Image A` and `Image B` run in parallel from that prompt.',
        '`Video` waits for both images.',
        '`Audio` waits for the video.',
      ],
    },
    {
      type: 'paragraph',
      text: 'That shape is a Directed Acyclic Graph. Each node is a task. Each edge is a hard dependency: the child must not become executable until every required parent has completed successfully. Fan-out gives you free parallelism. Fan-in gives you correctness.',
    },
    {
      type: 'image',
      src: 'blog/production-ready-dag-task-scheduler/workflow-dag.png',
      alt: 'Workflow DAG showing a prompt task fanning out to two image tasks that converge into video generation and then audio generation',
      caption:
        'Fan-out gives parallelism for free. Fan-in is where correctness has to be enforced.',
    },
    {
      type: 'callout',
      title: 'The failure that forces the design',
      text: 'Image A finishes. Image B’s worker crashes after the model returns bytes but before the task is marked completed. SQS redelivers. A second worker starts Image B again. Meanwhile a second scheduler sees Image A’s children as READY and enqueues Video early. Without compare-and-set claims, leases, and explicit dependency counters, you get duplicate media, orphaned spend, and a video that started on incomplete inputs.',
    },
    {
      type: 'heading',
      text: 'Why a DAG — and why validate it on the server',
    },
    {
      type: 'paragraph',
      text: 'A list of jobs is not enough. Real creative workflows branch, converge, and sometimes get edited by clients that accidentally introduce cycles. A cycle is catastrophic: every task waits forever, no progress signal fires, and billing and UX hang.',
    },
    {
      type: 'paragraph',
      text: 'So before a workflow is stored, the API runs a topological sort (Kahn’s algorithm): count indegrees, repeatedly peel nodes with indegree zero, and reject the workflow if any nodes remain. That check belongs on the server. Client-only validation is a suggestion, not a platform guarantee.',
    },
    {
      type: 'list',
      items: [
        'Reject cycles at create time — never discover them as stuck `WAITING` tasks in production.',
        'Store an immutable snapshot of declared edges plus a mutable outstanding-dependency count per task.',
        'Do not mutate graph shape at runtime except through controlled admin replay tools.',
      ],
    },
    {
      type: 'heading',
      text: 'The invariants that make the rest of the design boring',
    },
    {
      type: 'paragraph',
      text: 'Senior reviews usually start here. If these hold, most of the scheduler becomes mechanical. If any fail, no amount of queue tuning saves you.',
    },
    {
      type: 'list',
      ordered: true,
      items: [
        'A task is eligible only when every required parent has succeeded — eligibility is derived from dependency state, not from a second conflicting flag.',
        'Amazon SQS (or any comparable queue) provides at-least-once delivery, not exactly-once execution.',
        'Ownership of work is established by a database compare-and-set claim that creates an `attemptId` and a lease — not by “I received a message.”',
        'Completion is also a compare-and-set: only the worker holding the matching `attemptId` may finalize the task.',
        'Logical task state and dispatch/outbox state are separate concerns; confusing them recreates dual-write races.',
        'Side effects (provider calls, object writes) are idempotent on `(taskId, attemptId)` or a deterministic output key.',
      ],
    },
    {
      type: 'callout',
      title: 'About the “blocked” flag',
      text: 'Some systems store `blocked=false` beside a non-empty dependency list. That is fine only if one field is clearly derived and never independently mutated. The invariant is single source of truth — not “never denormalize.” Prefer an atomic `remainingDependencies` counter (or an empty outstanding-deps set) that flips the task to READY in the same update that clears the last parent.',
    },
    {
      type: 'heading',
      text: 'Task model: schedule state, not business payloads',
    },
    {
      type: 'paragraph',
      text: 'Each task document should stay small. Large prompts, model configs, and media metadata belong in typed payloads or object storage references. The scheduler only needs enough to decide eligibility, claim work, retry, and resolve children.',
    },
    {
      type: 'list',
      items: [
        '`status` — logical lifecycle: `WAITING_DEPENDENCY`, `READY`, `RUNNING`, `WAITING_RETRY`, `COMPLETED`, `FAILED`, `CANCELLED`, and optionally `SKIPPED` for cascade policies.',
        '`remainingDependencies` — materialised count of unfinished required parents.',
        '`taskType`, `workflowId`, `origin` — routing and attribution.',
        '`attemptId`, `leaseOwner`, `leaseExpiresAt` — who owns the current run.',
        '`retryCount`, `maxRetries`, `nextRetryAt` — retry budget and backoff.',
        '`input` / `outputRefs` — compact params and pointers to produced media.',
        '`mediaRefs.fromTasks` — data-plane references to ancestor outputs, resolved before execution.',
      ],
    },
    {
      type: 'paragraph',
      text: 'Notice what is missing: a duplicated `children` array that must be kept in sync with every child’s `dependsOn`. Store edges once — typically as `dependsOn` on the child — and discover dependents with a reverse index query on completion. That avoids bidirectional drift and still costs O(direct dependents), not O(workflow size).',
    },
    {
      type: 'heading',
      text: 'Control plane vs data plane',
    },
    {
      type: 'paragraph',
      text: 'Dependencies decide when a task may run. Media references decide what bytes it consumes. Mixing those concerns is how pipelines start copying multi-megabyte metadata between every hop.',
    },
    {
      type: 'paragraph',
      text: 'Example: Video does not receive Image A’s PNG in the SQS body. It stores `{ taskId: imageA, output: "image" }` in `fromTasks`. During claim/preprocess, the worker resolves those references into concrete URLs or object keys. The queue message stays tiny — typically `{ taskId, attemptId }` — so workers re-read authoritative state from MongoDB (or your system of record) after claiming.',
    },
    {
      type: 'callout',
      title: 'Why tiny messages',
      text: 'Large messages couple your queue to payload evolution, inflate fan-out cost, and make retries rewrite stale inputs. Keep the queue as a wake-up signal. Keep truth in the database.',
    },
    {
      type: 'heading',
      text: 'Architecture overview',
    },
    {
      type: 'paragraph',
      text: 'The control plane looks like this:',
    },
    {
      type: 'list',
      ordered: true,
      items: [
        'Workflow API validates the DAG and persists tasks + edges.',
        'Tasks with zero dependencies enter `READY`.',
        'A transactional outbox records “publish this READY task.”',
        'An outbox publisher sends `{ taskId, attemptSeed }` to Amazon SQS.',
        'Stateless workers claim a lease in the database, execute, and complete under CAS.',
        'Completion decrements children’s `remainingDependencies`; newly READY children enter the outbox.',
        'A reconciler recovers expired leases; a retry scheduler re-publishes after backoff; a DLQ isolates exhausted failures.',
      ],
    },
    {
      type: 'paragraph',
      text: 'Workers never scan “all waiting tasks.” They consume wake-ups. The scheduler never walks the whole graph on every tick. Completion work is proportional to the number of direct children of the finished node.',
    },
    {
      type: 'image',
      src: 'blog/production-ready-dag-task-scheduler/scheduler-architecture.png',
      alt: 'Scheduler architecture showing the workflow API, DAG validator, MongoDB tasks and outbox, outbox publisher, SQS, stateless workers, dependency resolver, retry scheduler, dead-letter queue, and lease reconciler',
      caption:
        'Control plane and data plane stay separate. The queue carries wake-ups; the database carries truth.',
    },
    {
      type: 'heading',
      text: 'State machine and leases',
    },
    {
      type: 'paragraph',
      text: 'Happy path:',
    },
    {
      type: 'paragraph',
      text: '`WAITING_DEPENDENCY` → `READY` → `RUNNING` → `COMPLETED`',
    },
    {
      type: 'paragraph',
      text: 'Retry path:',
    },
    {
      type: 'paragraph',
      text: '`RUNNING` → `WAITING_RETRY` → `READY` → `RUNNING` … until success or budget exhaustion → `FAILED`',
    },
    {
      type: 'paragraph',
      text: 'The important transition is `READY` → `RUNNING`. It must be atomic and must mint a new `attemptId` plus `leaseExpiresAt`. If two workers (or two redeliveries) race, only one update matches `status = READY` (or `WAITING_RETRY` with `nextRetryAt <= now`). The loser sees zero documents modified and exits without calling the model.',
    },
    {
      type: 'list',
      items: [
        'Visibility timeout on SQS is a delivery hint, not ownership.',
        'If a worker dies while `RUNNING`, the lease expires and the reconciler returns the task to `READY` with a new attempt — or marks it failed if policy says so.',
        'If you also claim work by polling MongoDB instead of SQS, you still need leases; otherwise crashed workers leave tasks stuck in `RUNNING` forever.',
      ],
    },
    {
      type: 'image',
      src: 'blog/production-ready-dag-task-scheduler/task-state-and-lease.png',
      alt: 'Task lifecycle state machine with lease annotations covering waiting on dependencies, ready, running, waiting retry, completed, failed, and cancelled states',
      caption:
        'The claim transition mints an attempt ID and a lease. Everything downstream keys off that attempt.',
    },
    {
      type: 'callout',
      title: 'Do not collapse dispatch into status',
      text: 'Publishing to SQS can fail after the DB says READY. Completing a task can succeed while the follow-on publish fails. Model dispatch with an outbox (`PENDING` → `SENT`) or an explicit dispatch substate. One enum that means both “logically ready” and “definitely in the queue” will lie to you under partial failure.',
    },
    {
      type: 'heading',
      text: 'Completing a task without losing the next one',
    },
    {
      type: 'paragraph',
      text: 'When a worker finishes successfully, one transaction should do all of the following:',
    },
    {
      type: 'list',
      ordered: true,
      items: [
        'Verify `status = RUNNING` and `attemptId` matches.',
        'Persist output references (object keys / URLs), not giant blobs in the task row.',
        'Mark the task `COMPLETED`.',
        'Find direct dependents via the reverse index.',
        'Atomically decrement each child’s `remainingDependencies`.',
        'When a child’s counter hits zero, set `status = READY` and insert an outbox event to publish it.',
        'Commit. Only then does the outbox publisher send to SQS.',
      ],
    },
    {
      type: 'paragraph',
      text: 'If you publish to SQS inside the same code path but outside the transaction, you recreate the classic dual-write: DB commit succeeds, process dies, child never wakes — or SQS send succeeds, DB rolls back, and you enqueue a ghost. The transactional outbox closes that hole. Duplicate outbox publishes are fine because workers claim idempotently.',
    },
    {
      type: 'image',
      src: 'blog/production-ready-dag-task-scheduler/atomic-completion-outbox.png',
      alt: 'Sequence diagram of task completion inside one transaction: verify attempt, store output, mark completed, decrement child dependency counters, insert outbox event, then publish to SQS',
      caption:
        'Completion and child wake-up commit together. Publishing happens after the commit, from the outbox.',
    },
    {
      type: 'heading',
      text: 'Parallelism for free — and fan-in races that are not free',
    },
    {
      type: 'paragraph',
      text: 'When `Prompt` completes, both Image tasks become READY in the same dependency-resolution pass. Different workers can run them immediately. No special “parallel scheduler” is required; the DAG encodes it.',
    },
    {
      type: 'paragraph',
      text: 'Fan-in is harder. Image A and Image B may complete within milliseconds of each other. Both transactions try to decrement Video’s counter. That only works if decrements are atomic (`$inc: -1` with a condition, or equivalent). The worker that observes the counter transition `1 → 0` is responsible for marking Video READY and writing the outbox event. The other sees a still-positive counter and does nothing else. Lost updates here are silent production bugs: Video waits forever with `remainingDependencies = 0` never observed.',
    },
    {
      type: 'heading',
      text: 'Duplicate execution: what actually prevents it',
    },
    {
      type: 'paragraph',
      text: 'Multiple scheduler instances, overlapping cron ticks, SQS redelivery, and operator replays all look like “run this task again.” Defence in depth:',
    },
    {
      type: 'list',
      items: [
        'CAS on publish ownership if you still have a READY scanner — only one publisher moves a given outbox row to SENT.',
        'CAS on worker claim — only one `attemptId` owns `RUNNING`.',
        'CAS on finalize — second completion with a stale attempt is a no-op.',
        'Deterministic output keys — retries overwrite or skip the same object path.',
        'Provider idempotency keys where the vendor supports them — so a reissued HTTP call does not bill twice.',
      ],
    },
    {
      type: 'paragraph',
      text: 'If your article or design review stops at “we use SQS visibility timeout,” push harder. Visibility timeout recovers delivery. Idempotent claims recover correctness.',
    },
    {
      type: 'heading',
      text: 'Retries, backoff, and the dead-letter boundary',
    },
    {
      type: 'paragraph',
      text: 'Transient failures are normal for generative APIs: timeouts, rate limits, regional blips, model overload. Permanent failures are different: bad prompt schema, unsupported modality, policy rejection, missing input refs.',
    },
    {
      type: 'paragraph',
      text: 'On retryable failure:',
    },
    {
      type: 'list',
      items: [
        'Increment `retryCount`.',
        'If still under `maxRetries`, move to `WAITING_RETRY` with `nextRetryAt` from exponential backoff plus jitter.',
        'When the clock passes `nextRetryAt`, mark `READY` and outbox-publish again.',
        'If the budget is exhausted, mark `FAILED` and route to a DLQ / operator queue.',
      ],
    },
    {
      type: 'paragraph',
      text: 'Example backoff cadence: 5s, 15s, 45s, 2m, then longer caps. Jitter matters when hundreds of tasks share a sick dependency. Without it you recreate a thundering herd on the recovering provider.',
    },
    {
      type: 'image',
      src: 'blog/production-ready-dag-task-scheduler/failure-retry-recovery.png',
      alt: 'Failure and recovery paths showing worker crash redelivery, expired lease reconciliation, transient failure backoff, exhausted retry budget routing to a dead-letter queue, and descendant policy choices',
      caption:
        'Four different failures, four different recovery mechanisms. None of them require a human at 3am.',
    },
    {
      type: 'callout',
      title: 'Failure policy for descendants',
      text: 'You need an explicit product choice. Fail-fast: mark reachable children `SKIPPED` / failed so the workflow settles and billing closes. Park-and-replay: leave children `WAITING_DEPENDENCY` until an operator retries the failed ancestor from the DLQ, then re-open the subgraph. Creative tools often want park-and-replay. Metered SaaS often wants fail-fast. Supporting both is fine; pretending there is only one answer is not.',
    },
    {
      type: 'heading',
      text: 'Cancellation and human gates',
    },
    {
      type: 'paragraph',
      text: 'Users cancel mid-run. Approvals hold a branch. Billing may freeze a workflow. Model those as first-class transitions to `CANCELLED` or a held state that is not `READY`, and ensure publishers and workers refuse work once the terminal or hold bit is set. Cancellation should be idempotent and should stop outbox publish for descendants that never became eligible.',
    },
    {
      type: 'heading',
      text: 'Scaling without scanning the graph',
    },
    {
      type: 'paragraph',
      text: 'The anti-pattern is:',
    },
    {
      type: 'paragraph',
      text: '`find all non-terminal tasks → for each, check whether dependencies are done → repeat`',
    },
    {
      type: 'paragraph',
      text: 'That becomes O(workflow size) or worse every tick. Instead:',
    },
    {
      type: 'list',
      items: [
        'Index READY / outbox-pending work only.',
        'On completion, touch only direct dependents.',
        'Bound hot fan-out: if one parent has 100,000 children, process edge updates in batches with continued work tokens so a single transaction does not become a multi-second lock.',
        'Partition queues by `taskType` or tenant when provider SLAs and fairness differ.',
      ],
    },
    {
      type: 'paragraph',
      text: 'Whether a workflow has 10 tasks or 10 million historical tasks, steady-state scheduling cost should track active READY depth and completion fan-out — not the archive size.',
    },
    {
      type: 'heading',
      text: 'Back of the envelope: one million tasks per day',
    },
    {
      type: 'paragraph',
      text: 'SDE 3–4 reviews ask for numbers. These are illustrative; your model durations and provider quotas dominate reality.',
    },
    {
      type: 'list',
      items: [
        'Average arrival: `1,000,000 / 86,400 ≈ 11.6 tasks/second`.',
        'Design for a 10× burst: ~116 tasks/second.',
        'If mean runtime is 120 seconds, Little’s Law gives `11.6 × 120 ≈ 1,390` concurrent in-flight tasks at average load, and ~13,900 at a 10× burst.',
        'If mean fan-out is 2 child edges per completion, expect ~2M dependency updates/day ≈ 23/s average and ~230/s at burst — cheap if indexed and batched, expensive if each update rescans the graph.',
        'At ~2 KB per task document, raw task rows are ~2 GB/day before indexes, attempts, and outbox history; object storage for media will dwarf that.',
        'Provider quotas — images/minute, tokens/minute, concurrent video jobs — usually hit the wall before MongoDB or SQS do.',
      ],
    },
    {
      type: 'image',
      src: 'blog/production-ready-dag-task-scheduler/scale-envelope.png',
      alt: 'Capacity planning infographic for one million tasks per day showing arrival rate, burst rate, Little’s Law concurrency, dependency edge update rate, hot fan-out warning, and storage estimate',
      caption:
        'Task count is the least interesting number here. Runtime and fan-out set your capacity.',
    },
    {
      type: 'callout',
      title: 'What to watch in production',
      text: 'Queue depth alone is vanity. Track oldest message age, lease expiry rate, retry rate by error class, critical-path latency per workflow type, stuck `RUNNING` count, outbox lag, and per-tenant concurrency. Those metrics tell you whether the scheduler is healthy or merely busy.',
    },
    {
      type: 'heading',
      text: 'Operational concerns that diagrams omit',
    },
    {
      type: 'list',
      items: [
        'Fairness — newest-first policies starve old runs; prefer per-workflow or per-tenant fairness under load.',
        'Tenant quotas — protect noisy neighbors when one customer submits a 50,000-node graph.',
        'Backpressure — if the provider is 429ing, slow READY publish rather than amplifying retries.',
        'Retention — archive completed task payloads; keep enough history for replay and audit.',
        'Reconciliation — periodic sweeps for expired leases, stranded READY without outbox rows, and workflows with no progress past an SLA.',
        'Multi-scheduler safety — overlapping publisher processes are fine if every claim is CAS-protected; you do not need a single global leader for correctness.',
      ],
    },
    {
      type: 'heading',
      text: 'Recovery after restart',
    },
    {
      type: 'paragraph',
      text: 'The scheduler process should be stateless. Durable state lives in MongoDB (or equivalent) and in SQS. If a publisher dies, another instance drains the outbox. Messages already in flight continue. READY tasks missing a SENT outbox row get republished by reconciliation. You should not need to reconstruct an in-memory graph to resume.',
    },
    {
      type: 'heading',
      text: 'Build vs buy',
    },
    {
      type: 'paragraph',
      text: 'Temporal, AWS Step Functions, and similar orchestrators give you durable execution, timers, and visibility out of the box. Build a custom DAG scheduler when you need deep control over media routing, per-task-type queues, custom billing hooks, or cost envelopes that managed orchestrators do not fit. The price is owning CAS, leases, outbox, DLQ replay, and reconciliation yourself. That trade-off is rational for AI/media platforms; it is vanity if your graph is a short linear chain and a managed workflow engine already meets SLAs.',
    },
    {
      type: 'heading',
      text: 'Questions a design review will ask — and answers this design gives',
    },
    {
      type: 'list',
      items: [
        'How do you prevent duplicate execution? — CAS claim + attempt-scoped finalize + idempotent side effects.',
        'What if the worker crashes after doing useful work? — lease expiry + deterministic outputs + safe redelivery.',
        'What if two parents finish at once? — atomic dependency counters; only the `1→0` transition publishes the child.',
        'How do multiple schedulers coordinate? — no leader required; shared durable state and CAS.',
        'How do independent branches run in parallel? — they become READY together; workers scale horizontally on SQS.',
        'How do you scale to millions of tasks? — no full-graph scans; index READY/outbox; fan out only to direct children; batch hot parents.',
        'Where does exactly-once come from? — it does not. At-least-once delivery + idempotent processing is the honest model.',
      ],
    },
    {
      type: 'heading',
      text: 'What we deliberately avoid',
    },
    {
      type: 'list',
      items: [
        'Workers polling the entire task collection for runnable work as the primary path.',
        'Conflicting readiness signals (`blocked=false` while deps remain) updated on separate code paths.',
        'Assuming SQS visibility timeout alone equals crash recovery for DB-claimed work.',
        'Copying full media metadata through every queue message.',
        'Client-only cycle detection.',
        'Unbounded retries without a DLQ and an operator story.',
      ],
    },
    {
      type: 'heading',
      text: 'The takeaway',
    },
    {
      type: 'paragraph',
      text: 'A production DAG scheduler is not “run tasks in dependency order.” It is a concurrent system that must tell a consistent story when two schedulers, three redeliveries, and a crashed worker all touch the same node.',
    },
    {
      type: 'paragraph',
      text: 'Model workflows as validated DAGs. Keep eligibility and dispatch honest. Publish only READY work through an outbox into SQS. Claim with leases and attempt IDs. Complete under compare-and-set while decrementing only direct children. Retry with jittered backoff, isolate permanent failure in a DLQ, and measure queue age and lease expiry — not vanity throughput.',
    },
    {
      type: 'paragraph',
      text: 'Do that, and independent branches run in parallel while downstream work never starts early. Failure becomes a state transition. Scale becomes a capacity conversation instead of a midnight collection scan.',
    },
  ],
}
