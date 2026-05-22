import { describe, it, expect, beforeEach } from 'vitest'

const store = new Map<string, string>()
const localStorageMock: Storage = {
  get length() {
    return store.size
  },
  clear: () => store.clear(),
  getItem: (k) => (store.has(k) ? store.get(k)! : null),
  key: (i) => Array.from(store.keys())[i] ?? null,
  removeItem: (k) => void store.delete(k),
  setItem: (k, v) => void store.set(k, String(v)),
}
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

const { AI_DEFAULTS, AiSettingsService } = await import('../ai-settings')

describe('AiSettingsService', () => {
  beforeEach(() => {
    store.clear()
  })

  it('returns defaults when nothing is stored', () => {
    expect(AiSettingsService.get('user-a')).toEqual(AI_DEFAULTS)
  })

  it('round-trips saved settings for a user', () => {
    const next = {
      ...AI_DEFAULTS,
      apiKey: 'sk-test',
      model: 'gpt-4.1',
      baseUrl: 'http://localhost:8000/v1',
      systemPrompt: 'be terse',
    }
    AiSettingsService.save('user-a', next)
    expect(AiSettingsService.get('user-a')).toEqual(next)
  })

  it('isolates settings per user', () => {
    AiSettingsService.save('user-a', { ...AI_DEFAULTS, apiKey: 'aaa' })
    AiSettingsService.save('user-b', { ...AI_DEFAULTS, apiKey: 'bbb' })
    expect(AiSettingsService.get('user-a').apiKey).toBe('aaa')
    expect(AiSettingsService.get('user-b').apiKey).toBe('bbb')
  })

  it('hasKey is true only when apiKey is non-empty', () => {
    expect(AiSettingsService.hasKey('u')).toBe(false)
    AiSettingsService.save('u', { ...AI_DEFAULTS, apiKey: '   ' })
    expect(AiSettingsService.hasKey('u')).toBe(false)
    AiSettingsService.save('u', { ...AI_DEFAULTS, apiKey: 'sk-xyz' })
    expect(AiSettingsService.hasKey('u')).toBe(true)
  })

  it('clear removes only the targeted user', () => {
    AiSettingsService.save('user-a', { ...AI_DEFAULTS, apiKey: 'aaa' })
    AiSettingsService.save('user-b', { ...AI_DEFAULTS, apiKey: 'bbb' })
    AiSettingsService.clear('user-a')
    expect(AiSettingsService.get('user-a')).toEqual(AI_DEFAULTS)
    expect(AiSettingsService.get('user-b').apiKey).toBe('bbb')
  })

  it('merges partial saved settings with defaults', () => {
    localStorage.setItem(
      'examtopics_ai_settings',
      JSON.stringify({ u: { apiKey: 'only-key' } })
    )
    const got = AiSettingsService.get('u')
    expect(got.apiKey).toBe('only-key')
    expect(got.baseUrl).toBe(AI_DEFAULTS.baseUrl)
    expect(got.model).toBe(AI_DEFAULTS.model)
  })
})
