import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

describe('Button', () => {
  it('renders with role=button and default variant', () => {
    render(<Button>Click me</Button>)
    const btn = screen.getByRole('button', { name: /click me/i })
    expect(btn).toBeInTheDocument()
    // default variant should include base classes; we assert a stable data attribute instead
    expect(btn).toHaveAttribute('data-slot', 'button')
  })

  it('merges custom className', () => {
    render(
      <Button className="custom-class" aria-label="custom">
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
})
