import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { StudyMode } from '@/features/exams/study-mode'

const route = getRouteApi('/_authenticated/exams/$examId/study')

export const Route = createFileRoute('/_authenticated/exams/$examId/study')({
  component: () => {
    const { examId } = route.useParams()
    return <StudyMode examId={examId} />
  },
})
