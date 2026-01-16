import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { PracticeMode } from '@/features/exams/practice-mode'

interface PracticeSearch {
  mode?: 'mistakes'
  q?: number
}

const route = getRouteApi('/_authenticated/exams/$examId/practice')

export const Route = createFileRoute('/_authenticated/exams/$examId/practice')({
  validateSearch: (search: Record<string, unknown>): PracticeSearch => {
    const q = Number(search.q)
    return {
      mode: search.mode === 'mistakes' ? 'mistakes' : undefined,
      q: !isNaN(q) && q > 0 ? q : undefined,
    }
  },
  component: () => {
    const { examId } = route.useParams()
    const { mode, q } = route.useSearch()
    // Convert 1-based q to 0-based index
    const initialIndex = q ? q - 1 : undefined
    return (
      <PracticeMode
        examId={examId}
        initialMode={mode}
        initialQuestionIndex={initialIndex}
      />
    )
  },
})
