import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { ExamDetails } from '@/features/exams/exam-details'

const route = getRouteApi('/_authenticated/exams/$examId/')

export const Route = createFileRoute('/_authenticated/exams/$examId/')({
  component: () => {
    const { examId } = route.useParams()
    return <ExamDetails examId={examId} />
  },
})
