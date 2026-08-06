import type { Post } from '../../types/post'

const img = 'blog/why-good-logging-matters-correlation-ids-and-observability'

export const whyGoodLoggingMattersPost: Post = {
  slug: 'why-good-logging-matters-correlation-ids-and-observability',
  title: 'The Day a Server Went Down: Why Good Logging Matters',
  date: '2026-08-07',
  excerpt:
    'A server crashes. Finding the error is easy. Finding which request caused it — and reconstructing the story — is the real observability problem.',
  status: 'published',
  tags: ['logging', 'observability', 'nodejs', 'grafana', 'system-design'],
  content: [
    {
      type: 'paragraph',
      text: 'It was one of those production incidents every developer eventually faces. A server went down unexpectedly.',
    },
    {
      type: 'paragraph',
      text: 'The first question was simple: what happened?',
    },
    {
      type: 'paragraph',
      text: 'The second question was much harder: which request caused it?',
    },
    {
      type: 'callout',
      title: 'How to read this',
      text: 'You are not learning log libraries. You are learning how to reconstruct a request after a crash — and what to copy into your own API this week.',
    },
    {
      type: 'heading',
      text: 'The day a server went down',
    },
    {
      type: 'paragraph',
      text: 'We knew something had failed. Our biggest problem was not finding an error. It was finding the story behind the error.',
    },
    {
      type: 'list',
      items: [
        'What request came in?',
        'What was its payload?',
        'Which route was hit?',
        'What happened before the process went down?',
        'Did the request ever finish?',
        'If multiple APIs were involved, where did the workflow stop?',
      ],
    },
    {
      type: 'paragraph',
      text: 'That is when you realize logging is not about writing “Something went wrong.” Logging is about making your application explain what happened.',
    },
    {
      type: 'image',
      src: `${img}/incident-what-happened.png`,
      alt: 'Diagram of an offline node-02 server with two panels: error found is easy, which request caused it is hard',
      caption:
        'The crash is visible. The request that caused it is not — until your logs tell a story.',
    },

    {
      type: 'heading',
      text: 'Why “just add logs” fails',
    },
    {
      type: 'paragraph',
      text: 'Most applications start with logs like `User login started`, `User login successful`, `Onboarding started`, `Something went wrong`. They look useful when you are developing locally.',
    },
    {
      type: 'paragraph',
      text: 'Now imagine thousands of requests hitting production. Someone says: “The onboarding API failed around 2:30 PM.”',
    },
    {
      type: 'paragraph',
      text: 'You search the logs. You find hundreds of onboarding requests. Which one was theirs? What payload did it contain? Which server handled it? What happened before the failure?',
    },
    {
      type: 'paragraph',
      text: 'You could spend hours searching. That is the problem with unstructured logging. You have information, but you do not have context.',
    },
    {
      type: 'callout',
      title: 'Information without context is noise',
      text: 'A wall of “Onboarding failed” messages is not observability. Observability starts when you can isolate one request and reconstruct its path.',
    },

    {
      type: 'heading',
      text: 'Make every request a searchable event',
    },
    {
      type: 'paragraph',
      text: 'For our Node.js application, we use Pino to create structured JSON logs. Instead of a plain “Onboarding failed,” we produce a searchable event — fields you can filter on, not sentences you skim.',
    },
    {
      type: 'paragraph',
      text: 'A finished error log includes fields like `timestamp`, `level`, `node`, `correlationId`, `processId`, `status`, `statusCode`, `event` (for example `request.finished`), plus an `error` object with `message`, `code`, and `stack`.',
    },
    {
      type: 'paragraph',
      text: 'Example shape: `{ "node": "node-02", "correlationId": "req-123", "processId": "process-456", "event": "request.finished", "statusCode": 500, "error": { "message": "Database connection failed", "code": "DB_CONNECTION_ERROR" } }`',
    },
    {
      type: 'paragraph',
      text: 'Now a log is not just a message. It is a searchable event. Ask for everything with `correlationId=req-123` and you can reconstruct what happened to that request.',
    },
    {
      type: 'image',
      src: `${img}/unstructured-vs-structured.png`,
      alt: 'Split comparison of messy text logs versus one structured JSON event with searchable fields',
      caption:
        'Same failure. One side is noise. The other is a queryable event.',
    },

    {
      type: 'heading',
      text: 'correlationId: follow one request',
    },
    {
      type: 'paragraph',
      text: 'A single request might go through Client → API → Authentication → Database → Business Logic → Response.',
    },
    {
      type: 'paragraph',
      text: 'In practice: middleware creates a UUID on each request (or reuses one from an incoming header), stores it on the request context, and every log line in that path includes `correlationId=req-123`. Return that same ID in the response header or error body so support — or the user — can hand it back to you.',
    },
    {
      type: 'paragraph',
      text: 'When something fails, you do not search through thousands of unrelated lines. You search for one ID. The question becomes: where did this particular request go?',
    },
    {
      type: 'image',
      src: `${img}/correlation-id-request-path.png`,
      alt: 'Request lifecycle from client to response with correlationId req-123 under every stage',
      caption:
        'One request. One ID. Full story.',
    },
    {
      type: 'callout',
      title: 'The support trick',
      text: 'If your error response includes `correlationId`, a customer can paste it into a ticket. Debugging starts at the right request in seconds — not at “around 2:30 PM.”',
    },

    {
      type: 'heading',
      text: 'processId: follow the workflow',
    },
    {
      type: 'paragraph',
      text: 'Sometimes one request is not enough. A business workflow might look like Login → Onboarding → Profile → Document. Each API call may have a different `correlationId`, but they belong to the same overall journey.',
    },
    {
      type: 'paragraph',
      text: 'That is why we also use a `processId`. Create it once at the start of the journey (login or onboarding kickoff), send it to the client, and ask later APIs to pass it back — often as a header. Login might be `req-101`, onboarding `req-102`, profile `req-103` — all sharing `processId=process-456`.',
    },
    {
      type: 'table',
      headers: ['ID', 'Question it answers'],
      rows: [
        ['`correlationId`', 'Where did this request go?'],
        ['`processId`', 'Where did this entire workflow go?'],
      ],
      caption:
        'Two levels of visibility. Use both when debugging multi-step flows.',
    },
    {
      type: 'image',
      src: `${img}/process-id-workflow.png`,
      alt: 'Four API calls with different correlation IDs grouped by one processId spine',
      caption:
        'Same journey, different requests — tied together by processId.',
    },
    {
      type: 'callout',
      title: 'When processId matters',
      text: 'If onboarding failed but login succeeded, correlation IDs alone show two separate stories. processId shows they were one customer journey that stopped mid-flight.',
    },

    {
      type: 'heading',
      text: 'Log the beginning and the end — then notice silence',
    },
    {
      type: 'paragraph',
      text: 'Every incoming request generates an incoming log. We capture useful context: IP, route, query, params, body, headers, `correlationId`, `processId`.',
    },
    {
      type: 'paragraph',
      text: 'One important rule: never blindly log sensitive data. Passwords, tokens, authorization headers, and secrets must be redacted — for example `"authorization": "[REDACTED]"` and `"password": "[REDACTED]"`.',
    },
    {
      type: 'paragraph',
      text: 'We also generate a finish log: status, statusCode, response summary, duration, IDs, and event name. That gives you REQUEST IN → application work → REQUEST OUT.',
    },
    {
      type: 'paragraph',
      text: 'Here is the interesting part. If you see `request.incoming`, then `database.query.started`, then `database.query.failed` — but never `request.finished` — you have a clue. Something interrupted the normal lifecycle. A crash. A kill. An unexpected exception. The missing log itself becomes evidence.',
    },
    {
      type: 'image',
      src: `${img}/request-lifecycle-and-silence.png`,
      alt: 'Timeline showing request.incoming and a failed query, with request.finished missing, plus a small App to Grafana pipeline strip',
      caption:
        'Silence is a clue. A missing request.finished often marks where the story stopped.',
    },
    {
      type: 'callout',
      title: 'Absence is a signal',
      text: 'Most teams only look at the errors they have. Experienced teams also look for the finish events they expected and never got.',
    },

    {
      type: 'heading',
      text: 'From local files to Grafana',
    },
    {
      type: 'paragraph',
      text: 'Our application writes logs locally under `/var/log/app/production-app-1/` as `out.log` and `error.log`, with rotation so files do not eat the disk. Local files are not enough. SSH-ing into every server to grep is not a scalable debugging strategy.',
    },
    {
      type: 'paragraph',
      text: 'We centralize with the Grafana ecosystem: Application → Pino → structured JSON → a collector (for example Alloy) → Loki → Grafana. Search by `correlationId`, `statusCode >= 500`, `node`, or `event` without guessing which box holds the file.',
    },
    {
      type: 'paragraph',
      text: 'The same signals power detection. If an API that usually responds in 150 ms drifts to 900 ms, or an error rate jumps from 0.1% to 5%, that is not trivia — that is an alert waiting to fire. The workflow shifts from “customer reports a problem” to “system detects a problem, then you investigate.”',
    },
    {
      type: 'callout',
      title: 'Why Grafana here — and what about ELK?',
      text: 'ELK can also centralize logs, search, dashboards, and alerts. We chose Grafana for a unified logs-plus-metrics experience. The lesson is not “Grafana always wins.” Choose the stack that helps your team answer production questions quickly.',
    },
    {
      type: 'paragraph',
      text: 'Go back to the fallen server. Start with the affected node. Search recent errors. Find the `correlationId`. Follow `request.incoming` → authentication → database → business work — and notice if `request.finished` never arrived. Then search the `processId` and see where the larger workflow stopped.',
    },
    {
      type: 'paragraph',
      text: 'Instead of “Something went wrong. Where do I start?” you ask: “The request entered here, reached this point, and disappeared. What happened at this boundary?”',
    },

    {
      type: 'heading',
      text: 'What to copy into your API this week',
    },
    {
      type: 'paragraph',
      text: 'You do not need a perfect observability platform on day one. You need three habits that make the next incident shorter.',
    },
    {
      type: 'list',
      ordered: true,
      items: [
        'Switch to structured JSON logs (Pino or similar) with stable field names.',
        'Add middleware: create `correlationId`, put it on every log, return it on every response.',
        'Log `request.incoming` and `request.finished` (with duration). Treat a missing finish as a crash clue.',
        'Redact auth headers, passwords, and tokens before they hit disk.',
        'If you have multi-step flows, add a `processId` clients can pass across APIs.',
      ],
    },
    {
      type: 'list',
      items: [
        'Good logging does not prevent every incident — servers still go down.',
        'It changes what happens next: alert → dashboard → correlation ID → request timeline → error with context.',
        'We build observability because we know something eventually will not work.',
        'The best production systems are not only systems that work — they are systems that can explain themselves when they do not.',
      ],
    },
    {
      type: 'callout',
      title: 'Takeaway',
      text: 'When that day comes again, you want your system to tell its story. correlationId finds the request. processId finds the journey. request.finished — or its absence — tells you where the story stopped.',
    },
  ],
}
