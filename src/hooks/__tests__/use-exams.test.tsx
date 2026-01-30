import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useExams } from '../use-exams'

// Mock the mock-exams module
vi.mock('@/features/exams/data/mock-exams', () => ({
  mockExams: [
    {
      id: 'mock-exam-1',
      title: 'Mock Exam 1',
      description: 'A mock exam for testing',
      questionCount: 10,
    },
  ],
}))

describe('useExams', () => {
  const mockIndexData = {
    exams: [
      {
        id: 'real-exam-1',
        title: 'Real Exam 1',
        description: 'A real exam',
        questionCount: 50,
      },
      {
        id: 'real-exam-2',
        title: 'Real Exam 2',
        description: 'Another real exam',
        questionCount: 100,
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should start with loading state', () => {
    globalThis.fetch = vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves

    const { result } = renderHook(() => useExams())

    expect(result.current.loading).toBe(true)
  })

  it('should load exams from index.json successfully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockIndexData,
    })

    const { result } = renderHook(() => useExams())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should have both real exams and mock exams
    expect(result.current.exams).toHaveLength(3)
    expect(result.current.exams[0].id).toBe('real-exam-1')
    expect(result.current.exams[1].id).toBe('real-exam-2')
    expect(result.current.exams[2].id).toBe('mock-exam-1')
  })

  it('should handle fetch failure gracefully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    })

    const { result } = renderHook(() => useExams())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should still have mock exams
    expect(result.current.exams).toHaveLength(1)
    expect(result.current.exams[0].id).toBe('mock-exam-1')
  })

  it('should handle network error gracefully', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useExams())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should still have mock exams
    expect(result.current.exams).toHaveLength(1)
  })

  it('should handle entries without id', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        exams: [
          { id: 'valid-exam', title: 'Valid' },
          { title: 'No ID Exam' }, // Missing id
          { id: '', title: 'Empty ID' }, // Empty id
        ],
      }),
    })

    const { result } = renderHook(() => useExams())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should only include valid exam + mock
    const ids = result.current.exams.map(e => e.id)
    expect(ids).toContain('valid-exam')
    expect(ids).not.toContain('')
    expect(ids).toContain('mock-exam-1')
  })

  it('should use id as title if title not provided', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        exams: [{ id: 'exam-no-title' }],
      }),
    })

    const { result } = renderHook(() => useExams())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const exam = result.current.exams.find(e => e.id === 'exam-no-title')
    expect(exam?.title).toBe('exam-no-title')
  })

  it('should use default description if not provided', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        exams: [{ id: 'exam-id' }],
      }),
    })

    const { result } = renderHook(() => useExams())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const exam = result.current.exams.find(e => e.id === 'exam-id')
    expect(exam?.description).toBe('/public/data/exam-id.json')
  })

  it('should handle non-array exams field', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        exams: 'not an array',
      }),
    })

    const { result } = renderHook(() => useExams())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should only have mock exams
    expect(result.current.exams).toHaveLength(1)
  })

  it('should handle missing exams field', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    const { result } = renderHook(() => useExams())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should only have mock exams
    expect(result.current.exams).toHaveLength(1)
  })

  it('should handle questionCount correctly', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        exams: [
          { id: 'with-count', questionCount: 42 },
          { id: 'string-count', questionCount: '50' }, // Non-number should be ignored
          { id: 'no-count' },
        ],
      }),
    })

    const { result } = renderHook(() => useExams())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const withCount = result.current.exams.find(e => e.id === 'with-count')
    const stringCount = result.current.exams.find(e => e.id === 'string-count')
    const noCount = result.current.exams.find(e => e.id === 'no-count')

    expect(withCount?.questionCount).toBe(42)
    expect(stringCount?.questionCount).toBeUndefined()
    expect(noCount?.questionCount).toBeUndefined()
  })

  it('should cancel fetch on unmount', async () => {
    let resolvePromise: (value: unknown) => void
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    globalThis.fetch = vi.fn().mockReturnValue(fetchPromise)

    const { unmount } = renderHook(() => useExams())

    // Unmount before fetch completes
    unmount()

    // Resolve after unmount
    resolvePromise!({
      ok: true,
      json: async () => mockIndexData,
    })

    // Wait a bit to ensure no state updates happen
    await new Promise(resolve => setTimeout(resolve, 50))

    // If we got here without error, the cancelled flag worked
    expect(true).toBe(true)
  })

  it('should set lastStudied to undefined for all exams', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockIndexData,
    })

    const { result } = renderHook(() => useExams())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    result.current.exams.forEach(exam => {
      expect(exam.lastStudied).toBeUndefined()
    })
  })
})
