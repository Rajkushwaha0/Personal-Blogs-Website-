import type { Post } from '../../types/post'

const img = 'blog/streaming-llm-tokens-without-melting-your-servers'

export const llmStreamingBackpressurePost: Post = {
  slug: 'streaming-llm-tokens-without-melting-your-servers',
  title: 'The 500-User Launch That Melted Our Servers: The Truth Behind LLM Streaming',
  date: '2026-08-29',
  excerpt:
    'On localhost, our AI chat felt instant. On launch day with 500 users, our server ran out of memory and crashed. A post-mortem of how token streaming works, where it broke, and how we fixed it.',
  status: 'published',
  tags: ['ai', 'llm', 'streaming', 'nodejs', 'system-design', 'architecture'],
  content: [
    {
      type: 'paragraph',
      text: 'Have you ever noticed what happens when you ask ChatGPT a long question?',
    },
    {
      type: 'paragraph',
      text: 'It does not make you stare at a blank screen for 30 seconds while it writes an entire essay. Instead, words appear one by one, like someone is typing directly onto your screen in real time.',
    },
    {
      type: 'paragraph',
      text: 'In software engineering, that is called "token streaming." It is the difference between an app that feels fast and alive, versus an app that feels broken and frozen.',
    },
    {
      type: 'paragraph',
      text: 'A few months ago, we decided to add that exact feature to our AI platform. On localhost, it felt like pure magic. Ten lines of code, instant typewriter effect, zero lag.',
    },
    {
      type: 'paragraph',
      text: 'Then we launched to 500 users. Within two minutes, our server memory spiked to 3.8 GB, connections stalled, and our entire backend collapsed.',
    },
    {
      type: 'callout',
      title: 'How to read this',
      text: 'This is not an introductory tutorial on how to call an AI SDK. It is an investigation into what happens to HTTP connections, TCP sockets, and memory buffers when 500 users stream tokens concurrently.',
    },
    {
      type: 'image',
      src: `${img}/localhost-vs-production.png`,
      alt: 'Architecture comparison showing one localhost user working smoothly versus 500 concurrent production users causing timeouts and an out of memory server crash',
      caption:
        'Localhost hides concurrency. In production, 500 open sockets hold memory and file descriptors hostage for 45 seconds at a time.',
    },

    {
      type: 'heading',
      text: 'Why everyone wants streaming',
    },
    {
      type: 'paragraph',
      text: 'To understand why our server crashed, you first need to see how standard web applications work versus how AI applications work.',
    },
    {
      type: 'paragraph',
      text: 'In a standard web app (like fetching a profile or saving a cart), your browser asks for data, the server answers in 50 milliseconds, and the connection immediately closes. It is like ordering a coffee: you pay, you grab your cup, and you walk away. The server is instantly free to help the next customer.',
    },
    {
      type: 'paragraph',
      text: 'AI models do not work like that. If you ask an LLM to explain a complex topic, it takes 30 to 45 seconds to generate the full answer. If you use the standard approach, your user stares at a spinning loading wheel for 45 seconds wondering if their Wi-Fi died.',
    },
    {
      type: 'paragraph',
      text: 'So instead of waiting for the full answer, we stream: as soon as the AI generates word #1, we push it to the browser. Then word #2. Then word #3.',
    },
    {
      type: 'list',
      items: [
        'Standard request: Takes 50ms. Connection closes immediately.',
        'Streaming AI request: Takes 45,000ms (45s). The phone and server stay connected the entire time.',
      ],
    },
    {
      type: 'paragraph',
      text: 'That single difference is where all the danger hides.',
    },

    {
      type: 'heading',
      text: 'The 25-second freeze in staging',
    },
    {
      type: 'paragraph',
      text: 'We wrote our streaming code using Server-Sent Events (SSE). On our laptops, it was flawless. We pushed the code to our staging server to test it in a real cloud environment.',
    },
    {
      type: 'paragraph',
      text: 'We opened our phones, typed a prompt, and hit enter.',
    },
    {
      type: 'paragraph',
      text: 'Nothing happened. No typewriter effect. The screen sat completely blank for 25 seconds. Then suddenly — BAM! The entire 500-word answer dumped onto the screen all at once.',
    },
    {
      type: 'paragraph',
      text: 'Why was it streaming on localhost, but buffering in the cloud?',
    },
    {
      type: 'callout',
      title: 'The Middleman Problem (NGINX / Reverse Proxies)',
      text: 'In production, your backend server does not talk directly to the internet. A reverse proxy router (like NGINX, Cloudflare, or an AWS ALB) sits in front to shield your app and distribute incoming traffic.',
    },
    {
      type: 'paragraph',
      text: 'By default, this middleman is programmed to optimize network bandwidth. It assumes: "Why waste network overhead sending tiny 3-letter words one by one? Let me wait until I have a big 4KB buffer of text, and then I will send it all together."',
    },
    {
      type: 'paragraph',
      text: 'Without knowing it, our proxy middleman was catching every streamed word, holding it in a bucket, and destroying the live streaming experience.',
    },
    {
      type: 'image',
      src: `${img}/proxy-buffering-trap.png`,
      alt: 'Diagram showing default proxy buffering holding chunks in a 4KB bucket causing a 25-second screen freeze, versus X-Accel-Buffering no opening a bypass valve for smooth typewriter delivery',
      caption:
        'The Middleman Problem. Proxies buffer small chunks to optimize bandwidth, turning your real-time stream into a delayed batch dump.',
    },
    {
      type: 'paragraph',
      text: 'To fix this, we had to explicitly instruct the reverse proxy: "Do not hold these words. Let them pass through immediately."',
    },
    {
      type: 'code',
      language: 'typescript',
      caption: 'Express / Fastify streaming handler with anti-buffering header',
      code: `app.post('/api/chat', async (req, res) => {
  // 1. Tell the browser we are streaming text events
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  // 2. Tell the NGINX / Cloudflare middleman NOT to buffer chunks!
  res.setHeader('X-Accel-Buffering', 'no')

  // Flush headers immediately so the stream starts flowing
  res.flushHeaders()
  // ...
})`,
    },

    {
      type: 'heading',
      text: 'Launch day: when 500 users showed up',
    },
    {
      type: 'paragraph',
      text: 'The proxy fix worked! We tested with 10 people in the office. Smooth typewriter text. Instant response. We were thrilled.',
    },
    {
      type: 'paragraph',
      text: 'At 11:00 AM, our launch went live. Traffic climbed quickly: 50 users, 150 users, then 500 simultaneous users all asking questions at the same time.',
    },
    {
      type: 'paragraph',
      text: 'At 11:04 AM, our monitoring dashboard turned blood red.',
    },
    {
      type: 'paragraph',
      text: 'Our server memory was normally around 200 megabytes. Suddenly, it was at 1.5 gigabytes. Thirty seconds later, 2.8 gigabytes. At 3.8 gigabytes, our server ran out of memory and the operating system violently terminated the container: Exit Code 137 (OOM Killed).',
    },
    {
      type: 'paragraph',
      text: 'The entire site went dark.',
    },
    {
      type: 'image',
      src: `${img}/backpressure-flow.png`,
      alt: 'Diagram comparing blind piping causing memory overflow versus backpressure control that pauses token generation until the client catches up',
      caption:
        'The firehose vs the straw. When the AI produces faster than a slow phone can consume, unread text pools in the server RAM.',
    },

    {
      type: 'heading',
      text: 'The firehose and the straw: understanding backpressure',
    },
    {
      type: 'paragraph',
      text: 'Here is what nobody tells you about streaming: not all internet connections are equal.',
    },
    {
      type: 'paragraph',
      text: 'The AI model (like OpenAI or an internal cluster) is a firehose. It generates tokens at 80 words per second. But some of your users are on a subway train with weak 3G cellular data. Their phone can only receive 10 words per second.',
    },
    {
      type: 'paragraph',
      text: 'Ask yourself: Where do the other 70 words per second go while the user is slowly catching up?',
    },
    {
      type: 'paragraph',
      text: 'If your backend code blindly reads from the AI and writes to the user, the server has to store those unread words somewhere. It stores them in server RAM! With 1 user, that is a few kilobytes. But with 200 slow mobile users receiving long explanations, gigabytes of unread text pile up in server memory within seconds.',
    },
    {
      type: 'callout',
      title: 'The Concept: Backpressure',
      text: 'Backpressure is a simple engineering principle: if the receiver cannot consume data fast enough, the producer must pause until the buffer clears.',
    },
    {
      type: 'paragraph',
      text: 'How we solved it: In Node.js, `res.write()` tells you if the network buffer is full by returning `false`. When it returns `false`, we pause the AI stream and wait for the `drain` event before asking for more words:',
    },
    {
      type: 'code',
      language: 'typescript',
      caption: 'Backpressure-aware streaming loop',
      code: `for await (const chunk of openAIStream) {
  const word = chunk.choices[0]?.delta?.content || ''
  if (!word) continue

  // Try to write word to the client
  const hasBufferSpace = res.write(\`data: \${JSON.stringify({ text: word })}\\n\\n\`)

  // BACKPRESSURE: If the user's network buffer is full, pause!
  if (!hasBufferSpace) {
    // Wait until the user has caught up before pulling more tokens
    await new Promise((resolve) => res.once('drain', resolve))
  }
}`,
    },

    {
      type: 'heading',
      text: 'The ghost tabs burning our API credits',
    },
    {
      type: 'paragraph',
      text: 'Once we fixed backpressure, our memory dropped to a steady, calm 180 megabytes. The server stopped crashing. But three days later, our finance dashboard showed another alarming problem: our AI provider bill was 40% higher than projected.',
    },
    {
      type: 'paragraph',
      text: 'Where was all that money going?',
    },
    {
      type: 'paragraph',
      text: 'We traced the logs and found a very human behavior: a user asks a question, watches the first sentence stream in, realizes they made a typo, and immediately closes the browser tab or clicks "Cancel."',
    },
    {
      type: 'paragraph',
      text: 'To the user, the interaction is over. But on our backend server, our loop was still running in the background! It was still happily downloading the remaining 2,000 words from the AI provider and paying for every single token, only to throw them into an abandoned, dead socket.',
    },
    {
      type: 'image',
      src: `${img}/ghost-tab-billing-leak.png`,
      alt: 'Infographic showing the ghost tab problem where closing a browser tab leaves the backend loop running and burning API money, compared to AbortController immediately terminating the upstream stream',
      caption:
        'The Ghost Tab Leak. When users close their tab after a typo, naive loops keep pulling tokens in the background, burning thousands of dollars on abandoned generation.',
    },
    {
      type: 'callout',
      title: 'The Fix: AbortController',
      text: 'Whenever a user closes their tab or navigates away, the HTTP request fires a "close" event. You must wire that event directly to an AbortController so the server immediately tells the AI: "Stop! The user left!"',
    },
    {
      type: 'code',
      language: 'typescript',
      caption: 'Hooking tab closures to immediate AI cancellation',
      code: `app.post('/api/chat', async (req, res) => {
  const abortController = new AbortController()

  // Detect when the user closes their browser tab or navigates away
  req.on('close', () => {
    console.log('User closed tab! Cancelling AI generation immediately...')
    abortController.abort() // Stops the AI model and saves your money!
  })

  try {
    const stream = await openai.chat.completions.create(
      {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: req.body.prompt }],
        stream: true,
      },
      { signal: abortController.signal } // Pass the cancellation signal
    )

    for await (const chunk of stream) {
      const word = chunk.choices[0]?.delta?.content || ''
      const ok = res.write(\`data: \${JSON.stringify({ text: word })}\\n\\n\`)
      if (!ok) {
        await new Promise((resolve) => res.once('drain', resolve))
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      // Clean cancellation, zero wasted dollars
    }
  } finally {
    res.end()
  }
})`,
    },

    {
      type: 'heading',
      text: 'The 4 lessons every backend engineer needs to know',
    },
    {
      type: 'paragraph',
      text: 'If you are building any AI product that uses streaming today, keep this mental model in your pocket:',
    },
    {
      type: 'table',
      headers: ['Failure Scenario', 'What Actually Happened', 'The Engineering Solution'],
      rows: [
        [
          'The 25-Second Freeze',
          'Reverse proxy (NGINX/Cloudflare) was buffering small token chunks',
          'Send X-Accel-Buffering: no to tell the proxy to let words flow immediately',
        ],
        [
          'The 3.8GB Memory Crash',
          'Fast AI poured tokens faster than slow mobile users could consume',
          'Listen to res.write() and wait for the drain event (Backpressure)',
        ],
        [
          'The Runaway AI Bill',
          'Users closed tabs, but the server kept generating tokens for ghosts',
          'Hook req.on("close") to an AbortController to cut upstream API calls',
        ],
        [
          'Dropped Connections',
          'Long-lived 45s sockets timed out on default proxy settings',
          'Increase proxy read timeout and send periodic SSE ping comments',
        ],
      ],
      caption: 'The four hidden operational problems of LLM streaming and how to solve them.',
    },

    {
      type: 'heading',
      text: 'Final thoughts',
    },
    {
      type: 'paragraph',
      text: 'In the era of AI, it is very easy to write demo code. You import an SDK, pass an API key, and watch things work on your machine.',
    },
    {
      type: 'paragraph',
      text: 'Real engineering is what happens between your demo and 500 real humans on unpredictable mobile networks. When you understand how networks buffer data, how streams apply backpressure, and how to protect your server memory, you move from someone who just uses AI APIs to someone who builds systems that stay online when it matters most.',
    },
  ],
}
