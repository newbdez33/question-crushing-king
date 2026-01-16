import { useEffect, useMemo, useState } from 'react'
import { mockExams } from '@/features/exams/data/mock-exams'

export type Exam = {
  id: string
  title: string
  description: string
  questionCount?: number
  lastStudied?: string
}

type DemoExam = {
  id: string
  title: string
  description: string
  questionCount?: number
}

const DEMO_EXAMS: DemoExam[] = [
  {
    id: 'SOA-C03',
    title: 'SOA-C03 (Demo)',
    description: 'Demo from /public/data/SOA-C03.json',
  },
]

export function useExams() {
  const [demoCounts, setDemoCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadCounts() {
      const next: Record<string, number> = {}

      await Promise.all(
        DEMO_EXAMS.map(async (exam) => {
          try {
            const res = await fetch(`/data/${exam.id}.json`)
            if (!res.ok) return
            const data = (await res.json()) as { questions?: unknown[] }
            const count = Array.isArray(data.questions)
              ? data.questions.length
              : 0
            next[exam.id] = count
          } catch {
            // ignore
          }
        })
      )

      if (!cancelled) {
        setDemoCounts(next)
        setLoading(false)
      }
    }

    void loadCounts()
    return () => {
      cancelled = true
    }
  }, [])

  const allExams = useMemo(() => {
    const mocks = Array.isArray(mockExams) ? mockExams : []
    return [
      ...DEMO_EXAMS.map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        questionCount: demoCounts[d.id] ?? d.questionCount,
        lastStudied: undefined as string | undefined,
      })),
      ...mocks,
    ]
  }, [demoCounts])

  return { exams: allExams, loading }
}
