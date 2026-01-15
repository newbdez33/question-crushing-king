export interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: number // Index of the correct option
  explanation?: string
}

export interface Exam {
  id: string
  title: string
  description: string
  questionCount: number
  lastStudied?: string // ISO Date string
  questions: Question[]
}

export const mockExams: Exam[] = []
