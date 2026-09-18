import { describe, it, expect } from 'vitest'
import { buildExamRequestIssueUrl } from '../exam-request-url'

const BASE = 'https://github.com/newbdez33/question-crushing-king/issues/new'

describe('buildExamRequestIssueUrl', () => {
  it('opens the exam-request issue form', () => {
    const url = new URL(buildExamRequestIssueUrl())
    expect(`${url.origin}${url.pathname}`).toBe(BASE)
    expect(url.searchParams.get('template')).toBe('exam-request.yml')
    expect(url.searchParams.has('contact')).toBe(false)
  })

  it('prefills the contact field when an email is known', () => {
    const url = new URL(buildExamRequestIssueUrl({ contact: 'me+test@example.com' }))
    expect(url.searchParams.get('template')).toBe('exam-request.yml')
    expect(url.searchParams.get('contact')).toBe('me+test@example.com')
  })

  it('ignores an empty or null contact', () => {
    expect(new URL(buildExamRequestIssueUrl({ contact: '' })).searchParams.has('contact')).toBe(false)
    expect(new URL(buildExamRequestIssueUrl({ contact: null })).searchParams.has('contact')).toBe(false)
  })
})
