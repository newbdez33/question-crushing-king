import { useEffect, useMemo, useState } from 'react'
import { mockExams } from '@/features/exams/data/mock-exams'

export type Exam = {
  id: string
  title: string
  description: string
  questionCount?: number
  lastStudied?: string
}

type IndexFile = {
  exams?: Array<{ id: string; title?: string; description?: string }>
}

type ExamMeta = {
  id: string
  title: string
  description: string
}

export function useExams() {
  const [examsFromIndex, setExamsFromIndex] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadFromIndex() {
      const next: Exam[] = []

      try {
        const res = await fetch(`/data/index.json`)
        if (!res.ok) {
          if (!cancelled) {
            setExamsFromIndex([])
            setLoading(false)
          }
          return
        }
        const idx = (await res.json()) as IndexFile
        const entries = Array.isArray(idx.exams) ? idx.exams : []
        await Promise.all(
          entries.map(async (entry) => {
            const id = entry.id
            if (!id) return
            try {
              const dr = await fetch(`/data/${id}.json`)
              if (!dr.ok) return
              const data = (await dr.json()) as { questions?: unknown[] }
              const count = Array.isArray(data.questions) ? data.questions.length : 0
              next.push({
                id,
                title: entry.title ?? id,
                description: entry.description ?? `/public/data/${id}.json`,
                questionCount: count,
                lastStudied: undefined,
              })
            } catch {
            }
          })
        )
      } catch {
      }

      if (!cancelled) {
        setExamsFromIndex(next)
        setLoading(false)
      }
    }

    void loadFromIndex()
    return () => {
      cancelled = true
    }
  }, [])

  const allExams = useMemo(() => {
    const mocks = Array.isArray(mockExams) ? mockExams : []
    return [
      ...examsFromIndex,
      ...mocks,
    ]
  }, [examsFromIndex])

  return { exams: allExams, loading }
}
