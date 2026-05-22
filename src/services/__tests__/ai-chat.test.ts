import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseChatChunk, streamChat } from '../ai-chat'

describe('parseChatChunk', () => {
  it('extracts content from a normal SSE payload', () => {
    expect(
      parseChatChunk(
        JSON.stringify({ choices: [{ delta: { content: 'Hello' } }] })
      )
    ).toEqual({ content: 'Hello' })
  })

  it('extracts reasoning_content (DeepSeek-style)', () => {
    expect(
      parseChatChunk(
        JSON.stringify({
          choices: [{ delta: { reasoning_content: 'Let me think' } }],
        })
      )
    ).toEqual({ reasoning: 'Let me think' })
  })

  it('also accepts the alternate "reasoning" field name', () => {
    expect(
      parseChatChunk(
        JSON.stringify({ choices: [{ delta: { reasoning: 'thinking…' } }] })
      )
    ).toEqual({ reasoning: 'thinking…' })
  })

  it('returns both when content and reasoning arrive in the same chunk', () => {
    expect(
      parseChatChunk(
        JSON.stringify({
          choices: [{ delta: { content: 'A', reasoning_content: 'B' } }],
        })
      )
    ).toEqual({ content: 'A', reasoning: 'B' })
  })

  it('returns null for the [DONE] sentinel', () => {
    expect(parseChatChunk('[DONE]')).toBeNull()
  })

  it('returns null for empty strings', () => {
    expect(parseChatChunk('')).toBeNull()
  })

  it('returns null for malformed JSON', () => {
    expect(parseChatChunk('not json')).toBeNull()
  })

  it('returns null when delta has only a role (no usable text)', () => {
    expect(
      parseChatChunk(JSON.stringify({ choices: [{ delta: { role: 'assistant' } }] }))
    ).toBeNull()
  })
})

function makeStreamResponse(lines: string[]): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const line of lines) controller.enqueue(encoder.encode(line))
      controller.close()
    },
  })
  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

describe('streamChat', () => {
  const originalFetch = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('yields content deltas in order, supports mid-line chunk splits', async () => {
    const fullSecond = JSON.stringify({ choices: [{ delta: { content: ' wo' } }] })
    globalThis.fetch = vi.fn().mockResolvedValue(
      makeStreamResponse([
        `data: ${JSON.stringify({ choices: [{ delta: { content: 'Hel' } }] })}\n`,
        `data: ${JSON.stringify({ choices: [{ delta: { content: 'lo' } }] })}\n`,
        `data: ${fullSecond.slice(0, 30)}`,
        `${fullSecond.slice(30)}\n`,
        `data: [DONE]\n`,
      ])
    ) as unknown as typeof fetch

    const out: string[] = []
    for await (const d of streamChat({
      baseUrl: 'http://example/v1',
      apiKey: 'k',
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
    })) {
      if (d.content) out.push(d.content)
    }
    expect(out.join('')).toBe('Hello wo')
  })

  it('yields reasoning then content for reasoning models', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      makeStreamResponse([
        `data: ${JSON.stringify({ choices: [{ delta: { reasoning_content: 'thinking ' } }] })}\n`,
        `data: ${JSON.stringify({ choices: [{ delta: { reasoning_content: 'hard' } }] })}\n`,
        `data: ${JSON.stringify({ choices: [{ delta: { content: 'answer' } }] })}\n`,
        `data: [DONE]\n`,
      ])
    ) as unknown as typeof fetch

    let reasoning = ''
    let content = ''
    for await (const d of streamChat({
      baseUrl: 'http://example/v1',
      apiKey: 'k',
      model: 'm',
      messages: [],
    })) {
      if (d.reasoning) reasoning += d.reasoning
      if (d.content) content += d.content
    }
    expect(reasoning).toBe('thinking hard')
    expect(content).toBe('answer')
  })

  it('throws on non-2xx responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response('boom', { status: 401, statusText: 'Unauthorized' })
    ) as unknown as typeof fetch

    await expect(async () => {
      for await (const chunk of streamChat({
        baseUrl: 'http://example/v1',
        apiKey: 'k',
        model: 'm',
        messages: [],
      })) {
        void chunk
      }
    }).rejects.toThrow(/401/)
  })

  it('joins baseUrl with trailing slash correctly', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeStreamResponse([`data: [DONE]\n`]))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    for await (const chunk of streamChat({
      baseUrl: 'http://host/v1/',
      apiKey: 'k',
      model: 'm',
      messages: [],
    })) {
      void chunk
    }
    expect(fetchMock).toHaveBeenCalledWith(
      'http://host/v1/chat/completions',
      expect.any(Object)
    )
  })
})
