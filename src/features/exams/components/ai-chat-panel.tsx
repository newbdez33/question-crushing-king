import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
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

interface QuestionContext {
  questionId: string
  questionText: string
  options: { letter: string; text: string }[]
  correctLetters: string[]
  userSelectedLetters: string[]
  language: string
  builtinExplanation?: string
}

interface AiChatPanelProps {
  context: QuestionContext
}

interface UiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function buildInitialUserPrompt(ctx: QuestionContext): string {
  const lines: string[] = []
  lines.push('Question:')
  lines.push(ctx.questionText)
  lines.push('')
  lines.push('Options:')
  ctx.options.forEach((o) => {
    lines.push(`${o.letter}. ${o.text}`)
  })
  lines.push('')
  lines.push(`Correct answer: ${ctx.correctLetters.join(', ')}`)
  if (ctx.userSelectedLetters.length > 0) {
    lines.push(`My answer: ${ctx.userSelectedLetters.join(', ')}`)
  }
  if (ctx.builtinExplanation) {
    lines.push('')
    lines.push(`Existing explanation (for reference): ${ctx.builtinExplanation}`)
  }
  lines.push('')
  lines.push(
    'Please explain why the correct answer is right and why each other option is wrong, in plain language.'
  )
  if (ctx.language && ctx.language !== 'en') {
    const langName =
      ctx.language === 'zh'
        ? 'Simplified Chinese'
        : ctx.language === 'zh-TC'
          ? 'Traditional Chinese'
          : ctx.language === 'ja'
            ? 'Japanese'
            : ctx.language
    lines.push(`Respond in ${langName}.`)
  }
  return lines.join('\n')
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

  const runChat = async (history: UiMessage[]) => {
    if (!settings) return
    setError(null)
    setStreaming(true)
    const assistantId = `a-${Date.now()}`
    setMessages((m) => [...m, { id: assistantId, role: 'assistant', content: '' }])

    const controller = new AbortController()
    abortRef.current = controller
    const apiMessages: ChatMessage[] = [
      { role: 'system', content: settings.systemPrompt || '' },
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
              ? { ...msg, content: msg.content + delta }
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
        setMessages((m) => m.filter((msg) => msg.id !== assistantId || msg.content.length > 0))
      }
    } finally {
      setStreaming(false)
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
    // Use the rich prompt as the actual content sent, but show the friendly label.
    const sendableContent = buildInitialUserPrompt(context)
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
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'max-w-[85%] rounded-br-sm bg-primary text-primary-foreground'
                      : 'max-w-[92%] rounded-bl-sm bg-muted'
                  )}
                >
                  {msg.role === 'user'
                    ? // hide the bulky structured prompt; show friendly label
                      msg.content.startsWith('Question:\n')
                      ? t('practice.ai.explainPrompt')
                      : msg.content
                    : msg.content || (streaming ? '…' : '')}
                </div>
              </div>
            ))}
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
