import type { Language } from '@/context/language-provider'

export type LocalizedContent = Partial<Record<Language, string>>

export function readLocalizedContent(value: unknown): LocalizedContent | undefined {
  if (!value || typeof value !== 'object') return undefined

  const result: LocalizedContent = {}
  const source = value as Record<string, unknown>

  for (const language of ['en', 'zh', 'zh-TC', 'ja'] as const) {
    const content = source[language]
    if (typeof content === 'string') {
      result[language] = content
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}
