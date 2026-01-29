import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '../sheet'

describe('Sheet', () => {
  afterEach(() => {
    cleanup()
  })

  it('should render sheet trigger', () => {
    render(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
        <SheetContent>Content</SheetContent>
      </Sheet>
    )

    expect(screen.getByText('Open Sheet')).toBeInTheDocument()
  })

  it('should open sheet when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>Sheet description</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open Sheet'))

    await waitFor(() => {
      expect(screen.getByText('Sheet Title')).toBeInTheDocument()
      expect(screen.getByText('Sheet description')).toBeInTheDocument()
    })
  })

  it('should show close button by default', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>Content</SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByText('Close')).toBeInTheDocument()
    })
  })

  it('should close when close button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle>Title</SheetTitle>
        </SheetContent>
      </Sheet>
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

  it('should render SheetHeader', () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetHeader data-testid="header">Header content</SheetHeader>
        </SheetContent>
      </Sheet>
    )

    expect(screen.getByText('Header content')).toBeInTheDocument()
    expect(screen.getByTestId('header')).toHaveAttribute('data-slot', 'sheet-header')
  })

  it('should render SheetFooter', () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetFooter data-testid="footer">Footer content</SheetFooter>
        </SheetContent>
      </Sheet>
    )

    expect(screen.getByText('Footer content')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toHaveAttribute('data-slot', 'sheet-footer')
  })

  it('should support left side position', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent side="left" data-testid="content">Content</SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })
  })

  it('should support top side position', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent side="top" data-testid="content">Content</SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })
  })

  it('should support bottom side position', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent side="bottom" data-testid="content">Content</SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })
  })

  it('should support controlled open state', () => {
    const { rerender } = render(
      <Sheet open={false}>
        <SheetContent>Content</SheetContent>
      </Sheet>
    )

    expect(screen.queryByText('Content')).not.toBeInTheDocument()

    rerender(
      <Sheet open={true}>
        <SheetContent>Content</SheetContent>
      </Sheet>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('should call onOpenChange when state changes', async () => {
    const user = userEvent.setup()
    const handleOpenChange = vi.fn()

    render(
      <Sheet onOpenChange={handleOpenChange}>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>Content</SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    expect(handleOpenChange).toHaveBeenCalledWith(true)
  })

  it('should render SheetClose as explicit close button', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetClose data-testid="custom-close">Custom Close</SheetClose>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByTestId('custom-close')).toHaveAttribute('data-slot', 'sheet-close')
    })
  })

  it('should have correct data-slot attributes', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger data-testid="trigger">Open</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle data-testid="title">Title</SheetTitle>
            <SheetDescription data-testid="desc">Description</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )

    expect(screen.getByTestId('trigger')).toHaveAttribute('data-slot', 'sheet-trigger')

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByTestId('title')).toHaveAttribute('data-slot', 'sheet-title')
      expect(screen.getByTestId('desc')).toHaveAttribute('data-slot', 'sheet-description')
    })
  })

  it('should apply custom className to SheetContent', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent className="custom-sheet">Content</SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByText('Content').closest('[data-slot="sheet-content"]')).toHaveClass('custom-sheet')
    })
  })
})
