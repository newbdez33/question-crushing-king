import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Brain,
  ChevronDown,
  Loader2,
  RotateCcw,
  Send,
  Settings as SettingsIcon,
  Sparkles,
  Square,
} from 'lucide-react'
import { useAuth } from '@/context/auth-ctx'
import { useLanguage } from '@/context/language-provider'
import {
  AiSettingsService,
  type AiSettings,
} from '@/services/ai-settings'
import { streamChat, type ChatMessage } from '@/services/ai-chat'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  buildExplainInstruction,
  buildSystemPrompt,
  type QuestionContext,
} from './ai-chat-prompt'

interface AiChatPanelProps {
  context: QuestionContext
}

interface UiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** Chain-of-thought stream from reasoning models (DeepSeek, o1-style). */
  reasoning?: string
}

export function AiChatPanel({ context }: AiChatPanelProps) {
  const { user, guestId } = useAuth()
  const { t } = useLanguage()
  const userId = user?.uid || guestId

  const [settings, setSettings] = useState<AiSettings | null>(null)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Load settings + reset thread when question changes
  useEffect(() => {
    if (userId) setSettings(AiSettingsService.get(userId))
  }, [userId])

  useEffect(() => {
    setMessages([])
    setInput('')
    setError(null)
    abortRef.current?.abort()
    abortRef.current = null
    setStreaming(false)
    setStreamingId(null)
  }, [context.questionId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const hasKey = useMemo(
    () => !!settings && settings.apiKey.trim().length > 0,
    [settings]
  )

  const [streamingId, setStreamingId] = useState<string | null>(null)

  const runChat = async (history: UiMessage[]) => {
    if (!settings) return
    setError(null)
    setStreaming(true)
    const assistantId = `a-${Date.now()}`
    setStreamingId(assistantId)
    setMessages((m) => [...m, { id: assistantId, role: 'assistant', content: '' }])

    const controller = new AbortController()
    abortRef.current = controller
    // The current question is injected into the system message on every request
    // so the model always has it — whether the user clicked Explain or typed a
    // free-form message. Reasoning is internal; never send it back as history.
    const apiMessages: ChatMessage[] = [
      {
        role: 'system',
        content: buildSystemPrompt(settings.systemPrompt, context),
      },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ]

    try {
      for await (const delta of streamChat({
        baseUrl: settings.baseUrl,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: apiMessages,
        signal: controller.signal,
      })) {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: msg.content + (delta.content ?? ''),
                  reasoning: (msg.reasoning ?? '') + (delta.reasoning ?? ''),
                }
              : msg
          )
        )
      }
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') {
        // stopped by user — leave whatever has streamed in place
      } else {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        setMessages((m) =>
          m.filter(
            (msg) =>
              msg.id !== assistantId ||
              msg.content.length > 0 ||
              (msg.reasoning?.length ?? 0) > 0
          )
        )
      }
    } finally {
      setStreaming(false)
      setStreamingId(null)
      abortRef.current = null
    }
  }

  const handleExplain = () => {
    if (streaming || !settings) return
    const userMsg: UiMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: t('practice.ai.explainPrompt'),
    }
    // The question is carried by the system context; this message is just the
    // ask. Show the friendly label in the bubble, send the instruction.
    const sendableContent = buildExplainInstruction(context)
    const history = [...messages, { ...userMsg, content: sendableContent }]
    setMessages((m) => [...m, userMsg])
    void runChat(history)
  }

  const handleSend = () => {
    if (streaming || !settings) return
    const trimmed = input.trim()
    if (!trimmed) return
    const userMsg: UiMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    }
    const history = [...messages, userMsg]
    setMessages((m) => [...m, userMsg])
    setInput('')
    void runChat(history)
  }

  const handleStop = () => {
    abortRef.current?.abort()
  }

  const handleReset = () => {
    abortRef.current?.abort()
    setMessages([])
    setInput('')
    setError(null)
  }

  if (!settings) {
    return null
  }

  return (
    <div className='mt-3 rounded-lg border bg-card'>
      <div className='flex items-center justify-between border-b px-3 py-2 sm:px-4'>
        <div className='flex items-center gap-2'>
          <Sparkles className='h-4 w-4 text-purple-500' />
          <span className='text-sm font-medium'>{t('practice.ai.title')}</span>
          {hasKey && (
            <span className='text-xs text-muted-foreground hidden sm:inline'>
              · {settings.model}
            </span>
          )}
        </div>
        <div className='flex items-center gap-1'>
          {messages.length > 0 && (
            <Button
              type='button'
              variant='ghost'
              size='icon'
              onClick={handleReset}
              title={t('practice.ai.reset')}
            >
              <RotateCcw className='h-4 w-4' />
            </Button>
          )}
          <Link to='/settings/ai'>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              title={t('practice.ai.openSettings')}
            >
              <SettingsIcon className='h-4 w-4' />
            </Button>
          </Link>
        </div>
      </div>

      {!hasKey ? (
        <div className='flex flex-col items-center gap-2 p-6 text-center'>
          <Sparkles className='h-7 w-7 text-purple-500' />
          <p className='text-sm font-medium'>{t('practice.ai.emptyTitle')}</p>
          <p className='text-xs text-muted-foreground max-w-sm'>
            {t('practice.ai.emptyDesc')}
          </p>
          <Link to='/settings/ai'>
            <Button size='sm' className='mt-1'>
              {t('practice.ai.openSettings')}
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            className='max-h-[420px] space-y-3 overflow-y-auto px-3 py-3 sm:px-4'
          >
            {messages.length === 0 && (
              <p className='text-xs text-muted-foreground'>
                {t('practice.ai.hint')}
              </p>
            )}
            {messages.map((msg) => {
              if (msg.role === 'user') {
                return (
                  <div key={msg.id} className='flex justify-end'>
                    <div className='whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm leading-relaxed text-primary-foreground max-w-[85%]'>
                      {msg.content}
                    </div>
                  </div>
                )
              }
              const isStreamingThis = streamingId === msg.id
              const thinking =
                isStreamingThis && !msg.content && (msg.reasoning?.length ?? 0) > 0
              return (
                <div key={msg.id} className='flex justify-start'>
                  <div className='max-w-[92%] space-y-2'>
                    {msg.reasoning && (
                      <details
                        className='rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 px-3 py-2 text-xs text-muted-foreground'
                        open={thinking}
                      >
                        <summary className='flex cursor-pointer list-none items-center gap-1.5 font-medium select-none [&::-webkit-details-marker]:hidden'>
                          <Brain
                            className={cn(
                              'h-3.5 w-3.5',
                              thinking && 'animate-pulse text-purple-500'
                            )}
                          />
                          {thinking
                            ? t('practice.ai.thinking')
                            : t('practice.ai.thoughts')}
                          <ChevronDown className='ml-auto h-3 w-3 transition-transform [details[open]>summary>&]:rotate-180' />
                        </summary>
                        <div className='mt-2 whitespace-pre-wrap leading-relaxed'>
                          {msg.reasoning}
                        </div>
                      </details>
                    )}
                    {(msg.content || !msg.reasoning) && (
                      <div className='whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm leading-relaxed'>
                        {msg.content || (isStreamingThis ? '…' : '')}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {error && (
              <div className='rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive'>
                {error}
              </div>
            )}
          </div>

          <div className='border-t bg-muted/30 p-3 sm:p-4'>
            <div className='mb-2 flex flex-wrap gap-2'>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={handleExplain}
                disabled={streaming}
              >
                <Sparkles className='h-4 w-4' />
                {t('practice.ai.explain')}
              </Button>
              {streaming && (
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={handleStop}
                >
                  <Square className='h-4 w-4' />
                  {t('practice.ai.stop')}
                </Button>
              )}
            </div>
            <div className='flex items-end gap-2'>
              <Textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={t('practice.ai.placeholder')}
                className='min-h-[40px] resize-none'
                disabled={streaming}
              />
              <Button
                type='button'
                onClick={handleSend}
                disabled={streaming || input.trim().length === 0}
                size='icon'
                aria-label='Send'
              >
                {streaming ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Send className='h-4 w-4' />
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
