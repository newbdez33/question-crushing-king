import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { QuestionsLoading } from '../questions-loading'

describe('QuestionsLoading', () => {
  afterEach(() => {
    cleanup()
  })

  it('announces the loading state with a message and a first-load hint', () => {
    render(<QuestionsLoading />)

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Loading questions…')
    expect(status).toHaveTextContent(
      'Large question banks can take a moment the first time.'
    )
  })

  it('renders a skeleton question card', () => {
    render(<QuestionsLoading />)

    expect(
      document.querySelectorAll('[data-slot="skeleton"]').length
    ).toBeGreaterThan(0)
  })
})
