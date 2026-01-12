import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { PracticeMode } from '@/features/exams/practice-mode'

interface PracticeSearch {
  mode?: 'mistakes'
}

const route = getRouteApi('/_authenticated/exams/$examId/practice')

export const Route = createFileRoute('/_authenticated/exams/$examId/practice')({
  validateSearch: (search: Record<string, unknown>): PracticeSearch => {
    return {
      mode: search.mode === 'mistakes' ? 'mistakes' : undefined,
    }
  },
  component: () => {
    const { examId } = route.useParams()
    const { mode } = route.useSearch()
    return <PracticeMode examId={examId} initialMode={mode} />
  },
})
