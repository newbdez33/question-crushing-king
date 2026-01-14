import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, BookOpen, CheckCircle, RotateCcw, AlertCircle, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { useAuth } from '@/context/auth-ctx'
import { ProgressService, type ExamProgress } from '@/services/progress-service'
import * as RemoteProgress from '@/services/firebase-progress'
import { mockExams } from './data/mock-exams'

interface ExamDetailsProps {
  examId: string
}

export function ExamDetails({ examId }: ExamDetailsProps) {
  const { user, guestId } = useAuth()
  const userId = user?.uid || guestId
  const fallbackExam = mockExams.find((e) => e.id === examId)
  const [demoQuestionCount, setDemoQuestionCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(!fallbackExam)
  const [progress, setProgress] = useState<ExamProgress>({})

  useEffect(() => {
    if (userId && examId) {
      const local = ProgressService.getExamProgress(userId, examId)
      setProgress(local)
    }
  }, [userId, examId])

  useEffect(() => {
    if (!user?.uid) return
    const unsub = RemoteProgress.subscribeExamProgress(user.uid, examId, (p) => {
      setProgress(p || {})
    })
    return () => unsub()
  }, [user?.uid, examId])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (fallbackExam) {
        setIsLoading(false)
        setDemoQuestionCount(null)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/data/${examId}.json`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = (await response.json()) as { questions?: unknown[] }
        const count = Array.isArray(data.questions) ? data.questions.length : 0
        if (!cancelled) setDemoQuestionCount(count)
      } catch {
        if (!cancelled) setDemoQuestionCount(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [examId, fallbackExam])

  const stats = useMemo(() => {
    const questions = Object.values(progress)
    const answered = questions.filter((q) => q.status).length
    const lastStudiedTimestamp = questions.reduce(
      (max, q) => Math.max(max, q.lastAnswered || 0),
      0
    )

    return {
      answered,
      lastStudied:
        lastStudiedTimestamp > 0
          ? new Date(lastStudiedTimestamp).toISOString()
          : undefined,
    }
  }, [progress])

  const exam = useMemo(() => {
    const base = fallbackExam || {
      id: examId,
      title: `${examId} (Demo)`,
      description: `Demo from /public/data/${examId}.json`,
      questionCount: demoQuestionCount ?? 0,
      lastStudied: undefined as string | undefined,
    }

    return {
      ...base,
      questionCount: fallbackExam ? base.questionCount : (demoQuestionCount ?? 0),
      lastStudied: stats.lastStudied || base.lastStudied,
    }
  }, [demoQuestionCount, examId, fallbackExam, stats])

  if (isLoading && !fallbackExam) {
    return (
      <>
        <Header>
          <div className='ms-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className='text-sm text-muted-foreground'>Loading exam…</div>
        </Main>
      </>
    )
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-4'>
          <Link to='/exams'>
            <Button variant='ghost' size='icon'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </Link>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-6'>
          <div className='flex items-start justify-between'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>{exam.title}</h1>
              <p className='mt-2 text-muted-foreground'>{exam.description}</p>
            </div>
          </div>
        </div>

        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Questions</CardTitle>
              <BookOpen className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{exam.questionCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Last Studied</CardTitle>
              <RotateCcw className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {exam.lastStudied ? new Date(exam.lastStudied).toLocaleDateString() : 'Never'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Progress</CardTitle>
              <CheckCircle className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {exam.questionCount > 0
                  ? Math.round((stats.answered / exam.questionCount) * 100)
                  : 0}
                %
              </div>
              <p className='text-xs text-muted-foreground'>
                {stats.answered} of {exam.questionCount} completed
              </p>
            </CardContent>
          </Card>
        </div>

        <div className='mt-8'>
          <h2 className='mb-4 text-xl font-semibold'>Study Modes</h2>
          <div className='grid gap-4 md:grid-cols-2'>
            <Link to="/exams/$examId/practice" params={{ examId: exam.id }}>
              <Card className='cursor-pointer transition-colors hover:bg-muted/50 h-full'>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Practice Mode
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    Answer questions one by one with immediate feedback and explanations.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/exams/$examId/study" params={{ examId: exam.id }}>
              <Card className='cursor-pointer transition-colors hover:bg-muted/50 h-full'>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Study Mode
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    View questions with correct answers and explanations directly.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/exams/$examId/practice" params={{ examId: exam.id }} search={{ mode: 'mistakes' }}>
              <Card className='cursor-pointer transition-colors hover:bg-muted/50 h-full'>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    My Mistakes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    Review and retry questions you answered incorrectly.
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Card className='opacity-50 h-full'>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Exam Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  Simulate the real exam environment with a timer and no immediate answers. (Coming Soon)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}
