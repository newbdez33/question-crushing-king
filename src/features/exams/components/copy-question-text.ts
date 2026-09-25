import { getLocalizedText, type Language } from '@/context/language-provider'
import type { LocalizedContent } from '../localized-content'

export type CopyableQuestion = {
  text: string
  contentHtml?: string
  contents?: LocalizedContent
  options: { text: string; html?: string; contents?: LocalizedContent }[]
}

function htmlToText(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent ?? '').trim()
}

/**
 * Render the question stem and its lettered options as plain text, in the
 * current language, for copying to the clipboard.
 */
export function formatQuestionForCopy(
  question: CopyableQuestion,
  language: Language
): string {
  const stem = htmlToText(
    getLocalizedText(
      question.contentHtml ?? question.text,
      question.contents,
      language
    )
  )
  const options = question.options.map((opt, idx) => {
    const letter = String.fromCharCode(65 + idx)
    const text = htmlToText(
      getLocalizedText(opt.html ?? opt.text, opt.contents, language)
    )
    return `${letter}. ${text}`
  })
  return [stem, '', ...options].join('\n')
}
