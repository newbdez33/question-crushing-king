import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from '../card'

describe('Card', () => {
  afterEach(() => {
    cleanup()
  })

  describe('Card', () => {
    it('should render children', () => {
      render(<Card>Card content</Card>)
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<Card className="custom-class" data-testid="card">Content</Card>)
      expect(screen.getByTestId('card')).toHaveClass('custom-class')
    })

    it('should have data-slot attribute', () => {
      render(<Card data-testid="card">Content</Card>)
      expect(screen.getByTestId('card')).toHaveAttribute('data-slot', 'card')
    })
  })

  describe('CardHeader', () => {
    it('should render children', () => {
      render(<CardHeader>Header content</CardHeader>)
      expect(screen.getByText('Header content')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<CardHeader className="custom-class">Header</CardHeader>)
      expect(screen.getByText('Header')).toHaveClass('custom-class')
    })

    it('should have data-slot attribute', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>)
      expect(screen.getByTestId('header')).toHaveAttribute('data-slot', 'card-header')
    })
  })

  describe('CardTitle', () => {
    it('should render children', () => {
      render(<CardTitle>Title content</CardTitle>)
      expect(screen.getByText('Title content')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<CardTitle className="custom-class">Title</CardTitle>)
      expect(screen.getByText('Title')).toHaveClass('custom-class')
    })

    it('should have data-slot attribute', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>)
      expect(screen.getByTestId('title')).toHaveAttribute('data-slot', 'card-title')
    })
  })

  describe('CardDescription', () => {
    it('should render children', () => {
      render(<CardDescription>Description content</CardDescription>)
      expect(screen.getByText('Description content')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<CardDescription className="custom-class">Desc</CardDescription>)
      expect(screen.getByText('Desc')).toHaveClass('custom-class')
    })

    it('should have data-slot attribute', () => {
      render(<CardDescription data-testid="desc">Desc</CardDescription>)
      expect(screen.getByTestId('desc')).toHaveAttribute('data-slot', 'card-description')
    })
  })

  describe('CardAction', () => {
    it('should render children', () => {
      render(<CardAction>Action content</CardAction>)
      expect(screen.getByText('Action content')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<CardAction className="custom-class">Action</CardAction>)
      expect(screen.getByText('Action')).toHaveClass('custom-class')
    })

    it('should have data-slot attribute', () => {
      render(<CardAction data-testid="action">Action</CardAction>)
      expect(screen.getByTestId('action')).toHaveAttribute('data-slot', 'card-action')
    })
  })

  describe('CardContent', () => {
    it('should render children', () => {
      render(<CardContent>Content body</CardContent>)
      expect(screen.getByText('Content body')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<CardContent className="custom-class">Content</CardContent>)
      expect(screen.getByText('Content')).toHaveClass('custom-class')
    })

    it('should have data-slot attribute', () => {
      render(<CardContent data-testid="content">Content</CardContent>)
      expect(screen.getByTestId('content')).toHaveAttribute('data-slot', 'card-content')
    })
  })

  describe('CardFooter', () => {
    it('should render children', () => {
      render(<CardFooter>Footer content</CardFooter>)
      expect(screen.getByText('Footer content')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<CardFooter className="custom-class">Footer</CardFooter>)
      expect(screen.getByText('Footer')).toHaveClass('custom-class')
    })

    it('should have data-slot attribute', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>)
      expect(screen.getByTestId('footer')).toHaveAttribute('data-slot', 'card-footer')
    })
  })

  describe('Full Card composition', () => {
    it('should render a complete card', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
            <CardAction>
              <button>Action</button>
            </CardAction>
          </CardHeader>
          <CardContent>Main content here</CardContent>
          <CardFooter>Footer text</CardFooter>
        </Card>
      )

      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test Description')).toBeInTheDocument()
      expect(screen.getByText('Action')).toBeInTheDocument()
      expect(screen.getByText('Main content here')).toBeInTheDocument()
      expect(screen.getByText('Footer text')).toBeInTheDocument()
    })
  })
})
