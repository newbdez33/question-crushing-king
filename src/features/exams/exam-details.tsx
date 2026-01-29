import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import * as RemoteProgress from '@/services/firebase-progress'
import { ProgressService, type ExamProgress } from '@/services/progress-service'
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  CheckCircle,
  RotateCcw,
  AlertCircle,
  Brain,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth-ctx'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { mockExams } from './data/mock-exams'
import { useExams } from '@/hooks/use-exams'

interface ExamDetailsProps {
  examId: string
}

export function ExamDetails({ examId }: ExamDetailsProps) {
  const navigate = useNavigate()
  const { user, guestId } = useAuth()
  const userId = user?.uid || guestId
  const fallbackExam =
    (Array.isArray(mockExams) ? mockExams : []).find((e) => e.id === examId) ||
    undefined
  const { exams, loading: examsLoading } = useExams()
  const [joinLoading, setJoinLoading] = useState(false)
  const [progress, setProgress] = useState<ExamProgress>({})
  const [examDialogOpen, setExamDialogOpen] = useState(false)
  const [examCount, setExamCount] = useState<number>(
    fallbackExam?.questionCount ?? 10
  )
  const [examSeed, setExamSeed] = useState<string>('')
  const [isOwned, setIsOwned] = useState(false)

  useEffect(() => {
    if (userId && examId) {
      const local = ProgressService.getExamProgress(userId, examId)
      const settings = ProgressService.getExamSettings(userId, examId)
      setProgress(local)
      setIsOwned(!!settings.owned)
    }
  }, [userId, examId])

  const handleJoin = async () => {
    try {
      setJoinLoading(true)
      const res = await fetch(`/data/${examId}.json`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await res.json()
      ProgressService.saveExamSettings(userId, examId, { owned: true })
      if (user?.uid) {
        void RemoteProgress.saveExamSettings(user.uid, examId, { owned: true })
      }
      setIsOwned(true)
      toast.success('Exam added to My Exams')
    } catch {
      toast.error('Failed to download exam data')
    } finally {
      setJoinLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.uid) return
    const unsub = RemoteProgress.subscribeExamProgress(
      user.uid,
      examId,
      (p) => {
        setProgress(p || {})
      }
    )
    return () => unsub()
  }, [user?.uid, examId])

  // No heavy load at details: counts come from registry (index.json) via useExams

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
    const fromIndex = exams.find((e) => e.id === examId)
    const base = fromIndex || fallbackExam || {
      id: examId,
      title: examId,
      description: `/public/data/${examId}.json`,
      questionCount: 0,
      lastStudied: undefined as string | undefined,
    }
    const count =
      (fromIndex && typeof fromIndex.questionCount === 'number'
        ? fromIndex.questionCount
        : undefined) ??
      (fallbackExam && typeof fallbackExam.questionCount === 'number'
        ? fallbackExam.questionCount
        : undefined) ??
      0
    return { ...base, questionCount: count, lastStudied: stats.lastStudied || base.lastStudied }
  }, [exams, examId, fallbackExam, stats])

  if (examsLoading && !fallbackExam) {
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
              <h1 className='text-3xl font-bold tracking-tight'>
                {exam.title}
              </h1>
              <p className='mt-2 text-muted-foreground'>{exam.description}</p>
            </div>
            {!isOwned && (
              <Button onClick={handleJoin} disabled={joinLoading}>
                {joinLoading ? 'Downloading…' : 'Join My Exams'}
              </Button>
            )}
          </div>
        </div>

        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Questions
              </CardTitle>
              <BookOpen className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{exam.questionCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Last Studied
              </CardTitle>
              <RotateCcw className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {exam.lastStudied
                  ? new Date(exam.lastStudied).toLocaleDateString()
                  : 'Never'}
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
            <Link to='/exams/$examId/practice' params={{ examId: exam.id }}>
              <Card className='h-full cursor-pointer transition-colors hover:bg-muted/50'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <CheckCircle className='h-5 w-5' />
                    Practice Mode
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    Answer questions one by one with immediate feedback and
                    explanations.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to='/exams/$examId/study' params={{ examId: exam.id }}>
              <Card className='h-full cursor-pointer transition-colors hover:bg-muted/50'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BookOpen className='h-5 w-5' />
                    Study Mode
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    View questions with correct answers and explanations
                    directly.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link
              to='/exams/$examId/practice'
              params={{ examId: exam.id }}
              search={{ mode: 'mistakes' }}
            >
              <Card className='h-full cursor-pointer transition-colors hover:bg-muted/50'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <AlertCircle className='h-5 w-5' />
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

            <Link
              to='/exams/$examId/practice'
              params={{ examId: exam.id }}
              search={{ mode: 'bookmarks' }}
            >
              <Card className='h-full cursor-pointer transition-colors hover:bg-muted/50'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Bookmark className='h-5 w-5' />
                    My Bookmarks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    Review questions you've bookmarked for later.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
              <DialogTrigger asChild>
                <Card className='h-full cursor-pointer transition-colors hover:bg-muted/50'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Brain className='h-5 w-5' />
                      Exam Mode
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-muted-foreground'>
                      Randomly select questions to simulate an exam session.
                    </p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start Exam Mode</DialogTitle>
                  <DialogDescription>
                    Enter the number of questions to include. Optional: provide
                    a seed to reproduce selection.
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                  <div className='grid grid-cols-4 items-center gap-3'>
                    <Label htmlFor='exam-count' className='col-span-1'>
                      Question count
                    </Label>
                    <Input
                      id='exam-count'
                      type='number'
                      min={1}
                      max={exam.questionCount || 1}
                      value={examCount}
                      onChange={(e) =>
                        setExamCount(Math.max(1, Number(e.target.value) || 1))
                      }
                      className='col-span-3'
                    />
                  </div>
                  <div className='grid grid-cols-4 items-center gap-3'>
                    <Label htmlFor='exam-seed' className='col-span-1'>
                      Seed
                    </Label>
                    <Input
                      id='exam-seed'
                      type='text'
                      value={examSeed}
                      onChange={(e) => setExamSeed(e.target.value)}
                      placeholder='Optional'
                      className='col-span-3'
                    />
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Available questions: {exam.questionCount}. Count will be
                    clamped to this maximum.
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => setExamDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      const finalCount = Math.min(
                        Math.max(1, examCount || 1),
                        exam.questionCount || 1
                      )
                      setExamDialogOpen(false)
                      navigate({
                        to: '/exams/$examId/exam',
                        params: { examId },
                        search: (prev) => ({
                          ...prev,
                          count: finalCount,
                          seed: examSeed || undefined,
                        }),
                      })
                    }}
                  >
                    Start
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Main>
    </>
  )
}
