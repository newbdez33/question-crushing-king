import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth-ctx'
import { useLanguage } from '@/context/language-provider'
import {
  AI_DEFAULTS,
  AiSettingsService,
  type AiSettings,
} from '@/services/ai-settings'
import {
  fetchRemoteAiSettings,
  saveRemoteAiSettings,
} from '@/services/firebase-ai-settings'
import { streamChat } from '@/services/ai-chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function AiSettingsForm() {
  const { user, guestId } = useAuth()
  const { t } = useLanguage()
  const userId = user?.uid || guestId

  const [values, setValues] = useState<AiSettings>(AI_DEFAULTS)
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!userId || loadedRef.current) return
    loadedRef.current = true
    setValues(AiSettingsService.get(userId))
    if (user?.uid) {
      fetchRemoteAiSettings(user.uid)
        .then((remote) => {
          if (remote && Object.keys(remote).length > 0) {
            const merged = { ...AI_DEFAULTS, ...remote }
            setValues(merged)
            AiSettingsService.save(userId, merged)
          }
        })
        .catch(() => undefined)
    }
  }, [userId, user?.uid])

  const update = <K extends keyof AiSettings>(key: K, value: AiSettings[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    try {
      AiSettingsService.save(userId, values)
      if (user?.uid) {
        await saveRemoteAiSettings(user.uid, values)
      }
      toast.success(t('settings.ai.saved'))
    } catch {
      toast.error(t('settings.ai.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setValues(AI_DEFAULTS)
  }

  const handleTest = async () => {
    if (testing) return
    setTesting(true)
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 60000)
      let content = ''
      let reasoning = ''
      for await (const delta of streamChat({
        baseUrl: values.baseUrl,
        apiKey: values.apiKey,
        model: values.model,
        messages: [
          { role: 'system', content: 'Reply with the single word: pong.' },
          { role: 'user', content: 'ping' },
        ],
        signal: controller.signal,
      })) {
        if (delta.content) content += delta.content
        if (delta.reasoning) reasoning += delta.reasoning
        // Stop as soon as we have proof of life: any final content,
        // or enough reasoning to confirm the stream is alive.
        if (content.length > 0 || reasoning.length > 64) {
          controller.abort()
          break
        }
      }
      clearTimeout(timer)
      const preview = (content || reasoning).trim().slice(0, 80)
      if (!preview) {
        toast.warning(t('settings.ai.testEmpty'))
      } else {
        toast.success(t('settings.ai.testOk'), { description: preview })
      }
    } catch (err) {
      // AbortError after we got a sample is a successful early-exit, not a failure.
      if ((err as { name?: string })?.name === 'AbortError') return
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(t('settings.ai.testFailed'), { description: msg })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <Label htmlFor='ai-baseUrl'>{t('settings.ai.baseUrl')}</Label>
        <Input
          id='ai-baseUrl'
          value={values.baseUrl}
          onChange={(e) => update('baseUrl', e.target.value)}
          placeholder='https://api.openai.com/v1'
        />
        <p className='text-xs text-muted-foreground'>
          {t('settings.ai.baseUrlHint')}
        </p>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='ai-model'>{t('settings.ai.model')}</Label>
        <Input
          id='ai-model'
          value={values.model}
          onChange={(e) => update('model', e.target.value)}
          placeholder='gpt-4o-mini'
        />
        <p className='text-xs text-muted-foreground'>
          {t('settings.ai.modelHint')}
        </p>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='ai-apiKey'>{t('settings.ai.apiKey')}</Label>
        <div className='flex gap-2'>
          <Input
            id='ai-apiKey'
            type={showKey ? 'text' : 'password'}
            value={values.apiKey}
            onChange={(e) => update('apiKey', e.target.value)}
            placeholder='sk-...'
            autoComplete='off'
          />
          <Button
            type='button'
            variant='outline'
            size='icon'
            onClick={() => setShowKey((s) => !s)}
            aria-label={showKey ? 'Hide API key' : 'Show API key'}
          >
            {showKey ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
          </Button>
        </div>
        <p className='text-xs text-muted-foreground'>
          {user?.uid ? t('settings.ai.apiKeyHintSynced') : t('settings.ai.apiKeyHint')}
        </p>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='ai-systemPrompt'>{t('settings.ai.systemPrompt')}</Label>
        <Textarea
          id='ai-systemPrompt'
          rows={5}
          value={values.systemPrompt}
          onChange={(e) => update('systemPrompt', e.target.value)}
        />
        <p className='text-xs text-muted-foreground'>
          {t('settings.ai.systemPromptHint')}
        </p>
      </div>

      <div className='flex flex-wrap items-center justify-between gap-2 border-t pt-4'>
        <Button
          type='button'
          variant='outline'
          onClick={handleTest}
          disabled={testing || !values.baseUrl || !values.model}
        >
          {testing && <Loader2 className='h-4 w-4 animate-spin' />}
          {t('settings.ai.testConnection')}
        </Button>
        <div className='flex gap-2'>
          <Button type='button' variant='ghost' onClick={handleReset}>
            {t('settings.ai.reset')}
          </Button>
          <Button type='button' onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className='h-4 w-4 animate-spin' />}
            {t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}
