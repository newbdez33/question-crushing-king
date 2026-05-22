import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseChatChunk, streamChat } from '../ai-chat'

describe('parseChatChunk', () => {
  it('extracts assistant delta from a normal SSE payload', () => {
    expect(
      parseChatChunk(
        JSON.stringify({ choices: [{ delta: { content: 'Hello' } }] })
      )
    ).toBe('Hello')
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

  it('returns null when delta has no content (e.g. role-only chunks)', () => {
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

  it('yields deltas in order from SSE chunks split across packets', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      makeStreamResponse([
        `data: ${JSON.stringify({ choices: [{ delta: { content: 'Hel' } }] })}\n`,
        `data: ${JSON.stringify({ choices: [{ delta: { content: 'lo' } }] })}\n`,
        // chunk split mid-line — the parser must buffer until newline
        `data: ${JSON.stringify({ choices: [{ delta: { content: ' wo' } }] }).slice(0, 30)}`,
        `${JSON.stringify({ choices: [{ delta: { content: ' wo' } }] }).slice(30)}\n`,
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
      out.push(d)
    }
    expect(out.join('')).toBe('Hello wo')
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
