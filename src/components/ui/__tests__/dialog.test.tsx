import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../dialog'

describe('Dialog', () => {
  afterEach(() => {
    cleanup()
  })

  it('should render dialog trigger', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>Content</DialogContent>
      </Dialog>
    )

    expect(screen.getByText('Open Dialog')).toBeInTheDocument()
  })

  it('should open dialog when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog description text</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByText('Open Dialog'))

    await waitFor(() => {
      expect(screen.getByText('Dialog Title')).toBeInTheDocument()
      expect(screen.getByText('Dialog description text')).toBeInTheDocument()
    })
  })

  it('should show close button by default', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>Content</DialogContent>
      </Dialog>
    )

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByText('Close')).toBeInTheDocument()
    })
  })

  it('should hide close button when showCloseButton is false', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent showCloseButton={false}>Content</DialogContent>
      </Dialog>
    )

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    expect(screen.queryByText('Close')).not.toBeInTheDocument()
  })

  it('should close when close button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByText('Open'))
    await waitFor(() => {
      expect(screen.getByText('Title')).toBeInTheDocument()
    })

    const closeButton = screen.getByText('Close').closest('button')
    await user.click(closeButton!)

    await waitFor(() => {
      expect(screen.queryByText('Title')).not.toBeInTheDocument()
    })
  })

  it('should render DialogHeader', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>Header content</DialogHeader>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByText('Header content')).toBeInTheDocument()
  })

  it('should render DialogFooter', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogFooter>Footer content</DialogFooter>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })

  it('should apply custom className to DialogContent', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent className="custom-dialog">Content</DialogContent>
      </Dialog>
    )

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByText('Content').closest('[data-slot="dialog-content"]')).toHaveClass('custom-dialog')
    })
  })

  it('should render DialogClose as explicit close button', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogClose>Custom Close</DialogClose>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByText('Custom Close')).toBeInTheDocument()
    })
  })

  it('should have correct data-slot attributes', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger data-testid="trigger">Open</DialogTrigger>
        <DialogContent>
          <DialogHeader data-testid="header">
            <DialogTitle data-testid="title">Title</DialogTitle>
            <DialogDescription data-testid="desc">Description</DialogDescription>
          </DialogHeader>
          <DialogFooter data-testid="footer">Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByTestId('trigger')).toHaveAttribute('data-slot', 'dialog-trigger')

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByTestId('header')).toHaveAttribute('data-slot', 'dialog-header')
      expect(screen.getByTestId('title')).toHaveAttribute('data-slot', 'dialog-title')
      expect(screen.getByTestId('desc')).toHaveAttribute('data-slot', 'dialog-description')
      expect(screen.getByTestId('footer')).toHaveAttribute('data-slot', 'dialog-footer')
    })
  })

  it('should support controlled open state', () => {
    const { rerender } = render(
      <Dialog open={false}>
        <DialogContent>Content</DialogContent>
      </Dialog>
    )

    expect(screen.queryByText('Content')).not.toBeInTheDocument()

    rerender(
      <Dialog open={true}>
        <DialogContent>Content</DialogContent>
      </Dialog>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('should call onOpenChange when dialog state changes', async () => {
    const user = userEvent.setup()
    const handleOpenChange = vi.fn()

    render(
      <Dialog onOpenChange={handleOpenChange}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>Content</DialogContent>
      </Dialog>
    )

    await user.click(screen.getByText('Open'))

    expect(handleOpenChange).toHaveBeenCalledWith(true)
  })
})
