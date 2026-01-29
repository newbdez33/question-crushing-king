import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Main } from '../main'

describe('Main', () => {
  afterEach(() => {
    cleanup()
  })

  it('should render main element with children', () => {
    render(
      <Main data-testid="main">
        <div>Content</div>
      </Main>
    )

    expect(screen.getByTestId('main')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('should apply default classes', () => {
    render(<Main data-testid="main" />)

    const main = screen.getByTestId('main')
    expect(main).toHaveClass('px-4', 'py-6')
  })

  it('should set data-layout to auto by default', () => {
    render(<Main data-testid="main" />)

    const main = screen.getByTestId('main')
    expect(main).toHaveAttribute('data-layout', 'auto')
  })

  it('should set data-layout to fixed when fixed prop is true', () => {
    render(<Main data-testid="main" fixed />)

    const main = screen.getByTestId('main')
    expect(main).toHaveAttribute('data-layout', 'fixed')
  })

  it('should apply fixed classes when fixed prop is true', () => {
    render(<Main data-testid="main" fixed />)

    const main = screen.getByTestId('main')
    expect(main).toHaveClass('flex', 'grow', 'flex-col', 'overflow-hidden')
  })

  it('should apply max-width classes by default', () => {
    render(<Main data-testid="main" />)

    const main = screen.getByTestId('main')
    expect(main).toHaveClass('@7xl/content:max-w-7xl')
  })

  it('should not apply max-width classes when fluid prop is true', () => {
    render(<Main data-testid="main" fluid />)

    const main = screen.getByTestId('main')
    expect(main).not.toHaveClass('@7xl/content:max-w-7xl')
  })

  it('should apply custom className', () => {
    render(<Main data-testid="main" className="custom-class" />)

    const main = screen.getByTestId('main')
    expect(main).toHaveClass('custom-class')
  })

  it('should pass through additional props', () => {
    render(<Main data-testid="main" id="main-content" role="main" />)

    const main = screen.getByTestId('main')
    expect(main).toHaveAttribute('id', 'main-content')
    expect(main).toHaveAttribute('role', 'main')
  })

  it('should combine fixed and fluid props', () => {
    render(<Main data-testid="main" fixed fluid />)

    const main = screen.getByTestId('main')
    expect(main).toHaveAttribute('data-layout', 'fixed')
    expect(main).toHaveClass('flex', 'grow')
    expect(main).not.toHaveClass('@7xl/content:max-w-7xl')
  })
})
