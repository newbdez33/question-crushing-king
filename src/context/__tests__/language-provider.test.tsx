import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Unmock to get the real implementation
vi.doUnmock('@/context/language-provider')

// Mock cookies for these tests
const mockCookies = new Map<string, string>()
vi.doMock('@/lib/cookies', () => ({
  getCookie: (key: string) => mockCookies.get(key) ?? null,
  setCookie: (key: string, value: string) => mockCookies.set(key, value),
  removeCookie: (key: string) => mockCookies.delete(key),
}))

// Import the actual implementation after setting up mocks
const { LanguageProvider, useLanguage, getLocalizedExplanation } = await vi.importActual<
  typeof import('../language-provider')
>('../language-provider')

// Test component that uses the context
function TestConsumer() {
  const { language, setLanguage, resetLanguage, t, defaultLanguage } = useLanguage()
  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="default">{defaultLanguage}</span>
      <span data-testid="translation">{t('practice.title')}</span>
      <span data-testid="missing">{t('nonexistent.key')}</span>
      <button onClick={() => setLanguage('zh')}>Set Chinese</button>
      <button onClick={() => setLanguage('ja')}>Set Japanese</button>
      <button onClick={() => resetLanguage()}>Reset</button>
    </div>
  )
}

describe('LanguageProvider', () => {
  beforeEach(() => {
    mockCookies.clear()
    vi.clearAllMocks()
    document.documentElement.setAttribute('lang', 'en')
  })

  afterEach(() => {
    cleanup()
    mockCookies.clear()
  })

  it('provides default language as en', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    )

    expect(screen.getByTestId('language')).toHaveTextContent('en')
    expect(screen.getByTestId('default')).toHaveTextContent('en')
  })

  it('provides translations for English', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    )

    expect(screen.getByTestId('translation')).toHaveTextContent('Practice')
  })

  it('returns key for missing translations', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    )

    expect(screen.getByTestId('missing')).toHaveTextContent('nonexistent.key')
  })

  it('allows changing language', async () => {
    const user = userEvent.setup()
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    )

    await user.click(screen.getByText('Set Chinese'))

    expect(screen.getByTestId('language')).toHaveTextContent('zh')
    expect(screen.getByTestId('translation')).toHaveTextContent('练习')
  })

  it('allows setting Japanese language', async () => {
    const user = userEvent.setup()
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    )

    await user.click(screen.getByText('Set Japanese'))

    expect(screen.getByTestId('language')).toHaveTextContent('ja')
    expect(screen.getByTestId('translation')).toHaveTextContent('練習')
  })

  it('allows resetting language', async () => {
    const user = userEvent.setup()
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    )

    await user.click(screen.getByText('Set Chinese'))
    expect(screen.getByTestId('language')).toHaveTextContent('zh')

    await user.click(screen.getByText('Reset'))
    expect(screen.getByTestId('language')).toHaveTextContent('en')
  })

  it('loads language from cookie', () => {
    mockCookies.set('app-language', 'zh')

    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    )

    expect(screen.getByTestId('language')).toHaveTextContent('zh')
  })

  it('ignores invalid cookie values', () => {
    mockCookies.set('app-language', 'invalid')

    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    )

    expect(screen.getByTestId('language')).toHaveTextContent('en')
  })

  it('uses custom default language', () => {
    render(
      <LanguageProvider defaultLanguage="zh">
        <TestConsumer />
      </LanguageProvider>
    )

    expect(screen.getByTestId('language')).toHaveTextContent('zh')
    expect(screen.getByTestId('default')).toHaveTextContent('zh')
  })

  it('sets HTML lang attribute', async () => {
    const user = userEvent.setup()
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    )

    expect(document.documentElement.getAttribute('lang')).toBe('en')

    await user.click(screen.getByText('Set Chinese'))
    expect(document.documentElement.getAttribute('lang')).toBe('zh')
  })
})

describe('getLocalizedExplanation', () => {
  it('returns empty string for undefined explanations', () => {
    expect(getLocalizedExplanation(undefined, 'en')).toBe('')
  })

  it('returns empty string for empty explanations object', () => {
    expect(getLocalizedExplanation({}, 'en')).toBe('')
  })

  it('returns explanation in requested language', () => {
    const explanations = {
      en: 'English explanation',
      zh: '中文解释',
      ja: '日本語の説明',
    }

    expect(getLocalizedExplanation(explanations, 'en')).toBe('English explanation')
    expect(getLocalizedExplanation(explanations, 'zh')).toBe('中文解释')
    expect(getLocalizedExplanation(explanations, 'ja')).toBe('日本語の説明')
  })

  it('falls back to English when requested language is missing', () => {
    const explanations = {
      en: 'English explanation',
    }

    expect(getLocalizedExplanation(explanations, 'zh')).toBe('English explanation')
    expect(getLocalizedExplanation(explanations, 'ja')).toBe('English explanation')
  })

  it('falls back to any available language when English is also missing', () => {
    const explanations = {
      zh: '中文解释',
    }

    expect(getLocalizedExplanation(explanations, 'en')).toBe('中文解释')
  })

  it('trims whitespace from explanations', () => {
    const explanations = {
      en: '  English explanation  ',
    }

    expect(getLocalizedExplanation(explanations, 'en')).toBe('English explanation')
  })

  it('returns empty string for whitespace-only explanations', () => {
    const explanations = {
      en: '   ',
    }

    expect(getLocalizedExplanation(explanations, 'en')).toBe('')
  })

  it('handles Japanese fallback when only Japanese is available', () => {
    const explanations = {
      ja: '日本語の説明',
    }

    expect(getLocalizedExplanation(explanations, 'en')).toBe('日本語の説明')
  })
})
