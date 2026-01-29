import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { Button } from '../button'

describe('Button', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders with role=button and default variant', () => {
    render(<Button>Click me</Button>)
    const btn = screen.getByRole('button', { name: /click me/i })
    expect(btn).toBeInTheDocument()
    // default variant should include base classes; we assert a stable data attribute instead
    expect(btn).toHaveAttribute('data-slot', 'button')
  })

  it('merges custom className', () => {
    render(
      <Button className='custom-class' aria-label='custom'>
        Custom
      </Button>
    )
    const btn = screen.getByRole('button', { name: /custom/i })
    expect(btn).toHaveClass('custom-class')
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Tap</Button>)
    const btn = screen.getByRole('button', { name: /tap/i })
    await user.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders as button element by default', () => {
    render(<Button>Button</Button>)
    expect(screen.getByRole('button').tagName).toBe('BUTTON')
  })

  it('renders as child element when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    const link = screen.getByRole('link')
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/test')
    expect(link).toHaveAttribute('data-slot', 'button')
  })

  it('renders with destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')
  })

  it('renders with outline variant', () => {
    render(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole('button')).toHaveClass('border')
  })

  it('renders with sm size', () => {
    render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-8')
  })

  it('renders with lg size', () => {
    render(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-10')
  })

  it('renders with icon size', () => {
    render(<Button size="icon">Icon</Button>)
    expect(screen.getByRole('button')).toHaveClass('size-9')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
