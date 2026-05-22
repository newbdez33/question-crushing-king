export interface AiSettings {
  baseUrl: string
  model: string
  apiKey: string
  systemPrompt: string
}

export const AI_DEFAULTS: AiSettings = {
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  apiKey: '',
  systemPrompt:
    'You are a helpful certification-exam tutor. When given a multiple-choice question, explain clearly why the correct answer is right and why each other option is wrong. Use short bullet points, plain language, and avoid filler.',
}

const STORAGE_KEY = 'examtopics_ai_settings'

type AllAiSettings = Record<string, Partial<AiSettings>>

function readAll(): AllAiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AllAiSettings) : {}
  } catch {
    return {}
  }
}

function writeAll(data: AllAiSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const AiSettingsService = {
  get(userId: string): AiSettings {
    const all = readAll()
    const partial = all[userId] || {}
    return { ...AI_DEFAULTS, ...partial }
  },

  save(userId: string, settings: AiSettings) {
    const all = readAll()
    all[userId] = settings
    writeAll(all)
  },

  clear(userId: string) {
    const all = readAll()
    delete all[userId]
    writeAll(all)
  },

  hasKey(userId: string): boolean {
    return this.get(userId).apiKey.trim().length > 0
  },
}
