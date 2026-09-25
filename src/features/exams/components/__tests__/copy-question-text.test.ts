import { describe, it, expect } from 'vitest'
import { formatQuestionForCopy } from '../copy-question-text'

describe('formatQuestionForCopy', () => {
  it('joins the stem and lettered options as plain text', () => {
    const text = formatQuestionForCopy(
      {
        text: 'What is 1+1?',
        options: [{ text: '1' }, { text: '2' }, { text: '3' }],
      },
      'en'
    )

    expect(text).toBe('What is 1+1?\n\nA. 1\nB. 2\nC. 3')
  })

  it('strips HTML from the stem and options', () => {
    const text = formatQuestionForCopy(
      {
        text: 'fallback',
        contentHtml: '<p>What is <b>1+1</b>?</p>',
        options: [{ text: 'fallback', html: '<p>Two</p>' }],
      },
      'en'
    )

    expect(text).toBe('What is 1+1?\n\nA. Two')
  })

  it('uses the localized content for the current language', () => {
    const text = formatQuestionForCopy(
      {
        text: 'What is 1+1?',
        contents: { en: 'What is 1+1?', zh: '1+1 等于几？' },
        options: [{ text: 'Two', contents: { en: 'Two', zh: '二' } }],
      },
      'zh'
    )

    expect(text).toBe('1+1 等于几？\n\nA. 二')
  })
})
