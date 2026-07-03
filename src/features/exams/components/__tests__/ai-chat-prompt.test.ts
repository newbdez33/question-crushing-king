import { describe, it, expect } from 'vitest'
import {
  buildQuestionContext,
  buildExplainInstruction,
  buildSystemPrompt,
  type QuestionContext,
} from '../ai-chat-prompt'

function makeCtx(overrides: Partial<QuestionContext> = {}): QuestionContext {
  return {
    questionId: 'q1',
    questionText: 'What does S3 stand for?',
    options: [
      { letter: 'A', text: 'Simple Storage Service' },
      { letter: 'B', text: 'Super Secure Storage' },
    ],
    correctLetters: ['A'],
    userSelectedLetters: [],
    language: 'en',
    ...overrides,
  }
}

describe('buildQuestionContext', () => {
  it('includes the stem, options, and correct answer', () => {
    const out = buildQuestionContext(makeCtx())
    expect(out).toContain('Question:')
    expect(out).toContain('What does S3 stand for?')
    expect(out).toContain('A. Simple Storage Service')
    expect(out).toContain('B. Super Secure Storage')
    expect(out).toContain('Correct answer: A')
  })

  it('joins multiple correct letters with commas', () => {
    const out = buildQuestionContext(makeCtx({ correctLetters: ['A', 'C'] }))
    expect(out).toContain('Correct answer: A, C')
  })

  it("omits the user's answer line when nothing was selected", () => {
    expect(buildQuestionContext(makeCtx())).not.toContain('My answer:')
  })

  it("includes the user's answer when selected", () => {
    const out = buildQuestionContext(makeCtx({ userSelectedLetters: ['B'] }))
    expect(out).toContain('My answer: B')
  })

  it('includes the built-in explanation only when present', () => {
    expect(buildQuestionContext(makeCtx())).not.toContain('Existing explanation')
    const out = buildQuestionContext(
      makeCtx({ builtinExplanation: 'S3 is object storage.' })
    )
    expect(out).toContain(
      'Existing explanation (for reference): S3 is object storage.'
    )
  })

  it('carries no instruction of its own', () => {
    expect(buildQuestionContext(makeCtx())).not.toContain('Please explain')
  })
})

describe('buildExplainInstruction', () => {
  it('asks for an explanation', () => {
    expect(buildExplainInstruction(makeCtx())).toContain('Please explain')
  })

  it('adds no language directive for English', () => {
    expect(buildExplainInstruction(makeCtx())).not.toContain('Respond in')
  })

  it.each([
    ['zh', 'Simplified Chinese'],
    ['zh-TC', 'Traditional Chinese'],
    ['ja', 'Japanese'],
  ])('adds a "%s" language directive', (language, name) => {
    expect(buildExplainInstruction(makeCtx({ language }))).toContain(
      `Respond in ${name}.`
    )
  })

  it('falls back to the raw code for unknown languages', () => {
    expect(buildExplainInstruction(makeCtx({ language: 'ko' }))).toContain(
      'Respond in ko.'
    )
  })
})

describe('buildSystemPrompt', () => {
  it('combines the user system prompt with the question context, in order', () => {
    const out = buildSystemPrompt('You are a tutor.', makeCtx())
    expect(out).toContain('You are a tutor.')
    expect(out).toContain('Question:')
    expect(out.indexOf('You are a tutor.')).toBeLessThan(
      out.indexOf('Question:')
    )
  })

  it('uses only the question context when the system prompt is empty', () => {
    expect(buildSystemPrompt('', makeCtx()).startsWith('Question:')).toBe(true)
  })

  it('handles an undefined system prompt', () => {
    expect(buildSystemPrompt(undefined, makeCtx()).startsWith('Question:')).toBe(
      true
    )
  })

  it('trims whitespace around the system prompt', () => {
    expect(buildSystemPrompt('  hi  ', makeCtx()).startsWith('hi\n\n')).toBe(
      true
    )
  })
})
