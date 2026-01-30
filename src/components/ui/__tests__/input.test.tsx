import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../input'

describe('Input', () => {
  afterEach(() => {
    cleanup()
  })

  it('should render an input element', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should accept and display value', async () => {
    const user = userEvent.setup()
    render(<Input />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'test value')

    expect(input).toHaveValue('test value')
  })

  it('should apply custom className', () => {
    render(<Input className="custom-class" />)
    expect(screen.getByRole('textbox')).toHaveClass('custom-class')
  })

  it('should support different input types', () => {
    const { rerender } = render(<Input type="email" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')

    rerender(<Input type="password" />)
    // Password inputs don't have textbox role
    expect(document.querySelector('input')).toHaveAttribute('type', 'password')
  })

  it('should support placeholder', () => {
    render(<Input placeholder="Enter your name" />)
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument()
  })

  it('should support disabled state', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('should forward ref', () => {
    const ref = { current: null }
    render(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('should have data-slot attribute', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toHaveAttribute('data-slot', 'input')
  })

  it('should pass through additional props', () => {
    render(<Input name="test-input" maxLength={50} />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('name', 'test-input')
    expect(input).toHaveAttribute('maxLength', '50')
  })
})
