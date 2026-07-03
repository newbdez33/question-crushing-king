export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatDelta {
  /** Final answer tokens, accumulated by the UI as the visible assistant reply. */
  content?: string
  /** Chain-of-thought tokens emitted by reasoning models (DeepSeek, o1-style). */
  reasoning?: string
}

export interface StreamChatOptions {
  baseUrl: string
  apiKey: string
  model: string
  messages: ChatMessage[]
  signal?: AbortSignal
}

function joinUrl(base: string, path: string) {
  const trimmed = base.replace(/\/+$/, '')
  return `${trimmed}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Parse a single SSE data line content from an OpenAI-compatible chat completion
 * chunk. Returns the content/reasoning deltas, or null if there's nothing useful.
 */
export function parseChatChunk(data: string): ChatDelta | null {
  if (!data || data === '[DONE]') return null
  try {
    const json = JSON.parse(data) as {
      choices?: Array<{
        delta?: { content?: string; reasoning_content?: string; reasoning?: string }
      }>
    }
    const delta = json.choices?.[0]?.delta
    if (!delta) return null
    const content = delta.content
    const reasoning = delta.reasoning_content ?? delta.reasoning
    if (!content && !reasoning) return null
    const out: ChatDelta = {}
    if (content) out.content = content
    if (reasoning) out.reasoning = reasoning
    return out
  } catch {
    return null
  }
}

/**
 * Stream a chat completion. Yields {content, reasoning} deltas as they arrive.
 * Throws on non-2xx or network errors. Honors the provided AbortSignal.
 */
export async function* streamChat(
  options: StreamChatOptions
): AsyncGenerator<ChatDelta, void, void> {
  const { baseUrl, apiKey, model, messages, signal } = options
  const url = joinUrl(baseUrl, '/chat/completions')

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey || 'none'}`,
    },
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `AI request failed: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 300)}` : ''}`
    )
  }
  if (!res.body) throw new Error('AI response has no body')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      let nl: number
      while ((nl = buffer.indexOf('\n')) !== -1) {
        const rawLine = buffer.slice(0, nl).replace(/\r$/, '')
        buffer = buffer.slice(nl + 1)
        if (!rawLine.startsWith('data:')) continue
        const data = rawLine.slice(5).trim()
        const delta = parseChatChunk(data)
        if (delta) yield delta
      }
    }
  } finally {
    reader.releaseLock()
  }
}
