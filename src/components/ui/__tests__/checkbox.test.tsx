import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from '../checkbox'

describe('Checkbox', () => {
  afterEach(() => {
    cleanup()
  })

  it('should render a checkbox', () => {
    render(<Checkbox />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('should be unchecked by default', () => {
    render(<Checkbox />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('should toggle when clicked', async () => {
    const user = userEvent.setup()
    render(<Checkbox />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)
    expect(checkbox).toBeChecked()

    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })

  it('should support controlled checked state', () => {
    const { rerender } = render(<Checkbox checked={false} />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()

    rerender(<Checkbox checked={true} />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('should call onCheckedChange when toggled', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Checkbox onCheckedChange={handleChange} />)

    await user.click(screen.getByRole('checkbox'))
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('should apply custom className', () => {
    render(<Checkbox className="custom-class" />)
    expect(screen.getByRole('checkbox')).toHaveClass('custom-class')
  })

  it('should support disabled state', () => {
    render(<Checkbox disabled />)
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })

  it('should have data-slot attribute', () => {
    render(<Checkbox />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('data-slot', 'checkbox')
  })

  it('should support aria-label', () => {
    render(<Checkbox aria-label="Accept terms" />)
    expect(screen.getByLabelText('Accept terms')).toBeInTheDocument()
  })
})
