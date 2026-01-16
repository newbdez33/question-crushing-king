import { createFileRoute } from '@tanstack/react-router'
import { ExamsList } from '@/features/exams'

export const Route = createFileRoute('/_authenticated/exams/')({
  component: ExamsList,
  errorComponent: ({ error }) => (
    <div className='p-4'>Error loading exams: {error.message}</div>
  ),
})
