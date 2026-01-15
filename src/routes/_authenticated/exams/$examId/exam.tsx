import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { ExamMode } from '@/features/exams/exam-mode'

interface ExamSearch {
  q?: number
  count?: number
  seed?: string
}

const route = getRouteApi('/_authenticated/exams/$examId/exam')

export const Route = createFileRoute('/_authenticated/exams/$examId/exam')({
  validateSearch: (search: Record<string, unknown>): ExamSearch => {
    const q = Number(search.q)
    const count = Number(search.count)
    return {
      q: !isNaN(q) && q > 0 ? q : undefined,
      count: !isNaN(count) && count > 0 ? count : undefined,
      seed: typeof search.seed === 'string' ? search.seed : undefined,
    }
  },
  component: () => {
    const { examId } = route.useParams()
    const { q, count, seed } = route.useSearch()
    const initialIndex = q ? q - 1 : undefined
    return <ExamMode examId={examId} count={count} seed={seed} initialQuestionIndex={initialIndex} />
  },
})
