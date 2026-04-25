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
  lastUpdated?: string // ISO date string for question bank content updates
  lastStudied?: string // ISO Date string
  questions: Question[]
}

export const mockExams: Exam[] = []
