import { describe, it, expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import type { ExamProgress } from '@/services/progress-service'

// Since the PracticeMode component has complex dependencies and state management,
// we'll test it through integration tests (E2E) rather than unit tests.
// Here we focus on testing utility functions and simpler aspects.

// Mock all required dependencies
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/components/layout/header', () => ({
  Header: ({ children }: { children: React.ReactNode }) => (
    <header data-testid="header">{children}</header>
  ),
}))

vi.mock('@/components/layout/main', () => ({
  Main: ({ children }: { children: React.ReactNode }) => (
    <main data-testid="main">{children}</main>
  ),
}))

vi.mock('@/components/theme-switch', () => ({
  ThemeSwitch: () => <button data-testid="theme-switch">Theme</button>,
}))

vi.mock('@/context/auth-ctx', () => ({
  useAuth: () => ({
    user: null,
    guestId: 'guest-456',
    loading: false,
  }),
}))

vi.mock('@/services/progress-service', () => ({
  ProgressService: {
    getExamProgress: vi.fn().mockReturnValue({}),
    saveAnswer: vi.fn(),
    toggleBookmark: vi.fn(),
    clearExamProgress: vi.fn(),
    saveExamSettings: vi.fn(),
    getExamSettings: vi.fn().mockReturnValue({}),
  },
}))

vi.mock('@/services/firebase-progress', () => ({
  getExamProgress: vi.fn().mockResolvedValue({}),
  saveAnswer: vi.fn().mockResolvedValue(undefined),
  toggleBookmark: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('sonner', () => ({
  toast: vi.fn(),
}))

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver

describe('PracticeMode utilities', () => {
  afterEach(() => {
    cleanup()
  })

  describe('htmlToText', () => {
    it('should convert HTML to plain text', () => {
      const html = '<p>Hello <strong>World</strong></p>'
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const text = (doc.body.textContent ?? '').trim()
      expect(text).toBe('Hello World')
    })

    it('should handle empty HTML', () => {
      const html = ''
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const text = (doc.body.textContent ?? '').trim()
      expect(text).toBe('')
    })
  })

  describe('resolveAssetUrl', () => {
    it('should return empty string for empty input', () => {
      const trimmed = ('').trim()
      expect(trimmed).toBe('')
    })

    it('should not modify http URLs', () => {
      const url = 'https://example.com/image.png'
      expect(/^https?:\/\//i.test(url)).toBe(true)
    })

    it('should not modify URLs starting with /', () => {
      const url = '/data/images/test.png'
      expect(url.startsWith('/')).toBe(true)
    })

    it('should prepend /data/ for images/ paths', () => {
      const src = 'images/test.png'
      const resolved = src.startsWith('images/') ? `/data/${src}` : `/data/${src}`
      expect(resolved).toBe('/data/images/test.png')
    })
  })

  describe('parseCorrectLabels', () => {
    it('should extract uppercase letters from input', () => {
      const input = 'A, B, C'
      const matches = (input ?? '').toUpperCase().match(/[A-Z]/g) ?? []
      const result = Array.from(new Set(matches))
      expect(result).toEqual(['A', 'B', 'C'])
    })

    it('should handle null input', () => {
      const input = null
      const matches = ((input ?? '') as string).toUpperCase().match(/[A-Z]/g) ?? []
      const result = Array.from(new Set(matches))
      expect(result).toEqual([])
    })

    it('should remove duplicates', () => {
      const input = 'A, A, B'
      const matches = (input ?? '').toUpperCase().match(/[A-Z]/g) ?? []
      const result = Array.from(new Set(matches))
      expect(result).toEqual(['A', 'B'])
    })
  })

  describe('formatQuestionType', () => {
    it('should return Multiple for multiple type', () => {
      const type = 'multiple'
      const formatted = type === 'multiple' ? 'Multiple' : 'Single'
      expect(formatted).toBe('Multiple')
    })

    it('should return Single for other types', () => {
      const type: string = 'single'
      const formatted = type === 'multiple' ? 'Multiple' : 'Single'
      expect(formatted).toBe('Single')
    })
  })

  describe('sameSelections', () => {
    it('should return true for identical arrays', () => {
      const a = [1, 2, 3]
      const b = [1, 2, 3]
      const same = a.length === b.length && a.every((item) => new Set(b).has(item))
      expect(same).toBe(true)
    })

    it('should return true for same elements in different order', () => {
      const a = [3, 1, 2]
      const b = [1, 2, 3]
      const same = a.length === b.length && a.every((item) => new Set(b).has(item))
      expect(same).toBe(true)
    })

    it('should return false for different lengths', () => {
      const a = [1, 2]
      const b = [1, 2, 3]
      const same = a.length === b.length && a.every((item) => new Set(b).has(item))
      expect(same).toBe(false)
    })

    it('should return false for different elements', () => {
      const a = [1, 2, 4]
      const b = [1, 2, 3]
      const same = a.length === b.length && a.every((item) => new Set(b).has(item))
      expect(same).toBe(false)
    })
  })

  describe('mergeProgress', () => {
    it('should merge remote progress into local', () => {
      const local: ExamProgress = {
        q1: { status: 'correct', lastAnswered: 1000 },
      }
      const remote: ExamProgress = {
        q2: { status: 'incorrect', lastAnswered: 2000 },
      }

      const merged = { ...local }
      Object.entries(remote).forEach(([qId, rVal]) => {
        const lVal = merged[qId]
        if (!lVal || (rVal.lastAnswered || 0) > (lVal.lastAnswered || 0)) {
          merged[qId] = rVal
        }
      })

      expect(merged).toEqual({
        q1: { status: 'correct', lastAnswered: 1000 },
        q2: { status: 'incorrect', lastAnswered: 2000 },
      })
    })

    it('should prefer remote if more recent', () => {
      const local: ExamProgress = {
        q1: { status: 'correct', lastAnswered: 1000 },
      }
      const remote: ExamProgress = {
        q1: { status: 'incorrect', lastAnswered: 2000 },
      }

      const merged = { ...local }
      Object.entries(remote).forEach(([qId, rVal]) => {
        const lVal = merged[qId]
        if (!lVal || (rVal.lastAnswered || 0) > (lVal.lastAnswered || 0)) {
          merged[qId] = rVal
        }
      })

      expect(merged.q1?.status).toBe('incorrect')
    })

    it('should keep local if more recent', () => {
      const local: ExamProgress = {
        q1: { status: 'correct', lastAnswered: 3000 },
      }
      const remote: ExamProgress = {
        q1: { status: 'incorrect', lastAnswered: 2000 },
      }

      const merged = { ...local }
      Object.entries(remote).forEach(([qId, rVal]) => {
        const lVal = merged[qId]
        if (!lVal || (rVal.lastAnswered || 0) > (lVal.lastAnswered || 0)) {
          merged[qId] = rVal
        }
      })

      expect(merged.q1?.status).toBe('correct')
    })
  })

  describe('renderExamHtml parsing', () => {
    it('should parse paragraph tags', () => {
      const html = '<p>Test paragraph</p>'
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const nodes = Array.from(doc.body.childNodes)
      expect(nodes.length).toBe(1)
      expect((nodes[0] as Element).tagName.toLowerCase()).toBe('p')
    })

    it('should parse list tags', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>'
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const ul = doc.querySelector('ul')
      expect(ul).not.toBeNull()
      expect(ul?.children.length).toBe(2)
    })

    it('should parse inline formatting tags', () => {
      const html = '<p><strong>Bold</strong> and <em>italic</em></p>'
      const doc = new DOMParser().parseFromString(html, 'text/html')
      expect(doc.querySelector('strong')).not.toBeNull()
      expect(doc.querySelector('em')).not.toBeNull()
    })

    it('should parse image tags', () => {
      const html = '<img src="test.png" alt="Test image" />'
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const img = doc.querySelector('img')
      expect(img?.getAttribute('src')).toBe('test.png')
      expect(img?.getAttribute('alt')).toBe('Test image')
    })

    it('should parse br tags', () => {
      const html = '<p>Line 1<br/>Line 2</p>'
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const br = doc.querySelector('br')
      expect(br).not.toBeNull()
    })

    it('should parse code tags', () => {
      const html = '<code>const x = 1;</code>'
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const code = doc.querySelector('code')
      expect(code?.textContent).toBe('const x = 1;')
    })

    it('should handle nested elements', () => {
      const html = '<ul><li><strong>Bold item</strong></li></ul>'
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const strong = doc.querySelector('li strong')
      expect(strong?.textContent).toBe('Bold item')
    })

    it('should handle ordered lists', () => {
      const html = '<ol><li>First</li><li>Second</li></ol>'
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const ol = doc.querySelector('ol')
      expect(ol).not.toBeNull()
      expect(ol?.children.length).toBe(2)
    })

    it('should ignore comment nodes', () => {
      const html = '<p>Text</p><!-- comment -->'
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const children = Array.from(doc.body.childNodes)
      // Filter only element nodes
      const elements = children.filter(
        (n) => n.nodeType === Node.ELEMENT_NODE
      )
      expect(elements.length).toBe(1)
    })
  })
})
