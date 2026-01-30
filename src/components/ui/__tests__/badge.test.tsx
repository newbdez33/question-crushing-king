import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Badge } from '../badge'

describe('Badge', () => {
  afterEach(() => {
    cleanup()
  })

  it('should render with default variant', () => {
    render(<Badge>Default Badge</Badge>)
    expect(screen.getByText('Default Badge')).toBeInTheDocument()
  })

  it('should have data-slot attribute', () => {
    render(<Badge data-testid="badge">Badge</Badge>)
    expect(screen.getByTestId('badge')).toHaveAttribute('data-slot', 'badge')
  })

  it('should render with secondary variant', () => {
    render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('bg-secondary')
  })

  it('should render with destructive variant', () => {
    render(<Badge variant="destructive" data-testid="badge">Destructive</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('bg-destructive')
  })

  it('should render with outline variant', () => {
    render(<Badge variant="outline" data-testid="badge">Outline</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('text-foreground')
  })

  it('should apply custom className', () => {
    render(<Badge className="custom-class" data-testid="badge">Badge</Badge>)
    expect(screen.getByTestId('badge')).toHaveClass('custom-class')
  })

  it('should render as span by default', () => {
    render(<Badge data-testid="badge">Badge</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge.tagName).toBe('SPAN')
  })

  it('should render as child element when asChild is true', () => {
    render(
      <Badge asChild data-testid="badge">
        <a href="/test">Link Badge</a>
      </Badge>
    )
    const badge = screen.getByTestId('badge')
    expect(badge.tagName).toBe('A')
    expect(badge).toHaveAttribute('href', '/test')
  })

  it('should pass through additional props', () => {
    render(<Badge data-testid="badge" id="my-badge">Badge</Badge>)
    expect(screen.getByTestId('badge')).toHaveAttribute('id', 'my-badge')
  })
})
