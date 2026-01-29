import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '../alert-dialog'

describe('AlertDialog', () => {
  afterEach(() => {
    cleanup()
  })

  it('should render trigger', () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Title</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>
    )

    expect(screen.getByText('Open Dialog')).toBeInTheDocument()
  })

  it('should open dialog when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(
      <AlertDialog>
        <AlertDialogTrigger>Delete Item</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    await user.click(screen.getByText('Delete Item'))

    await waitFor(() => {
      expect(screen.getByText('Are you sure?')).toBeInTheDocument()
      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Continue')).toBeInTheDocument()
    })
  })

  it('should close dialog when cancel is clicked', async () => {
    const user = userEvent.setup()
    render(
      <AlertDialog>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Confirm</AlertDialogTitle>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    await user.click(screen.getByText('Open'))
    await waitFor(() => {
      expect(screen.getByText('Confirm')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Cancel'))

    await waitFor(() => {
      expect(screen.queryByText('Confirm')).not.toBeInTheDocument()
    })
  })

  it('should close dialog when action is clicked', async () => {
    const user = userEvent.setup()
    render(
      <AlertDialog>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Confirm</AlertDialogTitle>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    await user.click(screen.getByText('Open'))
    await waitFor(() => {
      expect(screen.getByText('Confirm')).toBeInTheDocument()
    })

    await user.click(screen.getByText('OK'))

    await waitFor(() => {
      expect(screen.queryByText('Confirm')).not.toBeInTheDocument()
    })
  })

  it('should call onClick on action button', async () => {
    const user = userEvent.setup()
    const handleAction = vi.fn()
    render(
      <AlertDialog>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Confirm</AlertDialogTitle>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    await user.click(screen.getByText('Open'))
    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Delete'))

    expect(handleAction).toHaveBeenCalled()
  })

  it('should support controlled open state', () => {
    const { rerender } = render(
      <AlertDialog open={false}>
        <AlertDialogContent>
          <AlertDialogTitle>Title</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>
    )

    expect(screen.queryByText('Title')).not.toBeInTheDocument()

    rerender(
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogTitle>Title</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>
    )

    expect(screen.getByText('Title')).toBeInTheDocument()
  })

  it('should call onOpenChange when dialog state changes', async () => {
    const user = userEvent.setup()
    const handleOpenChange = vi.fn()

    render(
      <AlertDialog onOpenChange={handleOpenChange}>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Title</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>
    )

    await user.click(screen.getByText('Open'))

    expect(handleOpenChange).toHaveBeenCalledWith(true)
  })

  it('should have correct data-slot attributes', async () => {
    const user = userEvent.setup()
    render(
      <AlertDialog>
        <AlertDialogTrigger data-testid="trigger">Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader data-testid="header">
            <AlertDialogTitle data-testid="title">Title</AlertDialogTitle>
            <AlertDialogDescription data-testid="desc">Description</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter data-testid="footer">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    expect(screen.getByTestId('trigger')).toHaveAttribute('data-slot', 'alert-dialog-trigger')

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByTestId('header')).toHaveAttribute('data-slot', 'alert-dialog-header')
      expect(screen.getByTestId('title')).toHaveAttribute('data-slot', 'alert-dialog-title')
      expect(screen.getByTestId('desc')).toHaveAttribute('data-slot', 'alert-dialog-description')
      expect(screen.getByTestId('footer')).toHaveAttribute('data-slot', 'alert-dialog-footer')
    })
  })

  it('should apply custom className to components', async () => {
    const user = userEvent.setup()
    render(
      <AlertDialog>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent className="custom-content">
          <AlertDialogHeader className="custom-header">
            <AlertDialogTitle className="custom-title">Title</AlertDialogTitle>
            <AlertDialogDescription className="custom-desc">Desc</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="custom-footer">
            <AlertDialogCancel className="custom-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction className="custom-action">OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByText('Title').closest('[data-slot="alert-dialog-title"]')).toHaveClass('custom-title')
      expect(screen.getByText('Desc').closest('[data-slot="alert-dialog-description"]')).toHaveClass('custom-desc')
    })
  })
})
