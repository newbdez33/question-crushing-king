import { useEffect, useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import * as RemoteProgress from '@/services/firebase-progress'
import { ProgressService } from '@/services/progress-service'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Bookmark,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/auth-ctx'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { StudyMobileBar } from './components/study-mobile-bar'
import { StudySidebar, type StudySettings } from './components/study-sidebar'
import { mockExams } from './data/mock-exams'

interface StudyModeProps {
  examId: string
}

type ExamOption = {
  label: string
  content: string
}

type ExamQuestion = {
  id: string
  questionNumber: number
  type: string
  content: string
  options: ExamOption[]
  correctAnswer: string
  explanation?: string
}

type ExamFile = {
  questions: ExamQuestion[]
}

type StudyQuestion = {
  id: string
  type: 'single' | 'multiple'
  text: string
  contentHtml?: string
  options: string[]
  correctAnswers: number[]
  explanation?: string
}

function htmlToText(html: string) {
  if (typeof window === 'undefined') return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent ?? '').trim()
}

function resolveAssetUrl(src: string) {
  const trimmed = (src ?? '').trim()
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/')) return trimmed
  if (trimmed.startsWith('images/')) return `/data/${trimmed}`
  return `/data/${trimmed}`
}

function parseCorrectLabels(input: string) {
  const matches = (input ?? '').toUpperCase().match(/[A-Z]/g) ?? []
  return Array.from(new Set(matches))
}

function formatQuestionType(type: string) {
  if (type === 'multiple') return 'Multiple'
  return 'Single'
}

function renderExamHtml(html: string) {
  if (typeof window === 'undefined') return <span>{html}</span>

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const nodes = Array.from(doc.body.childNodes)

  const renderNode = (
    node: ChildNode,
    key: string | number,
    parentTag?: string
  ): ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? '').trim()
      if (!text) return null
      if (parentTag === 'p' || parentTag === 'li') {
        return text
      }
      return (
        <span key={key} className='leading-relaxed'>
          {text}
        </span>
      )
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null

    const el = node as Element
    const tag = el.tagName.toLowerCase()
    const children = Array.from(el.childNodes).map((child, index) =>
      renderNode(child, `${key}-${index}`, tag)
    )

    if (tag === 'p') {
      return (
        <p key={key} className='leading-relaxed'>
          {children}
        </p>
      )
    }

    if (tag === 'br') return <br key={key} />

    if (tag === 'strong') return <strong key={key}>{children}</strong>
    if (tag === 'em') return <em key={key}>{children}</em>
    if (tag === 'code') return <code key={key}>{children}</code>

    if (tag === 'ul')
      return (
        <ul key={key} className='list-disc pl-6'>
          {children}
        </ul>
      )
    if (tag === 'ol')
      return (
        <ol key={key} className='list-decimal pl-6'>
          {children}
        </ol>
      )
    if (tag === 'li') return <li key={key}>{children}</li>

    if (tag === 'img') {
      const src = resolveAssetUrl(el.getAttribute('src') ?? '')
      const alt = el.getAttribute('alt') ?? ''
      return (
        <img
          key={key}
          src={src}
          alt={alt}
          loading='lazy'
          className='max-w-full rounded-md border'
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )
    }

    return (
      <span key={key} className='whitespace-pre-wrap'>
        {children}
      </span>
    )
  }

  return (
    <div className='space-y-3'>
      {nodes.map((n, i) => renderNode(n, i, 'body'))}
    </div>
  )
}

export function StudyMode({ examId }: StudyModeProps) {
  const { user, guestId } = useAuth()
  const userId = user?.uid || guestId
  const exam = mockExams.find((e) => e.id === examId)
  const fallbackQuestions: StudyQuestion[] | null = exam
    ? exam.questions.map((q) => ({
        id: q.id,
        type: 'single' as const,
        text: q.text,
        options: q.options,
        correctAnswers: [q.correctAnswer],
        explanation: q.explanation,
      }))
    : null
  const [questions, setQuestions] = useState<StudyQuestion[] | null>(null)
  const [title, setTitle] = useState(exam?.title ?? examId)
  const [isLoading, setIsLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [settings, setSettings] = useState<StudySettings>({
    fontSize: 'normal',
  })

  useEffect(() => {
    if (questions && questions[currentQuestionIndex] && userId) {
      const qId = questions[currentQuestionIndex].id
      const progress = ProgressService.getExamProgress(userId, examId)
      setIsBookmarked(progress[qId]?.bookmarked || false)
    }
  }, [questions, currentQuestionIndex, userId, examId])

  useEffect(() => {
    if (!user?.uid) return
    const unsub = RemoteProgress.subscribeExamProgress(
      user.uid,
      examId,
      (exam) => {
        const qId = questions?.[currentQuestionIndex]?.id
        if (qId) {
          setIsBookmarked(exam[qId]?.bookmarked || false)
        }
      }
    )
    return () => unsub()
  }, [user?.uid, examId, questions, currentQuestionIndex])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setQuestions(fallbackQuestions)
      setTitle(exam?.title ?? examId)
      setCurrentQuestionIndex(0)

      try {
        const response = await fetch(`/data/${examId}.json`)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = (await response.json()) as ExamFile
        const mapped = (data.questions ?? [])
          .slice()
          .sort((a, b) => a.questionNumber - b.questionNumber)
          .map((q) => {
            const options = (q.options ?? []).slice().sort((a, b) => {
              return a.label.localeCompare(b.label)
            })
            const correctIndex = options.findIndex(
              (o) => o.label === q.correctAnswer
            )
            const correctLabels = parseCorrectLabels(q.correctAnswer)
            const correctAnswers = correctLabels
              .map((label) => options.findIndex((o) => o.label === label))
              .filter((idx) => idx >= 0)

            return {
              id: q.id,
              type: (q.type === 'multiple'
                ? 'multiple'
                : 'single') as StudyQuestion['type'],
              text: htmlToText(q.content),
              contentHtml: q.content,
              options: options.map((o) => htmlToText(o.content)),
              correctAnswers:
                correctAnswers.length > 0
                  ? correctAnswers
                  : [Math.max(correctIndex, 0)],
              explanation: (q.explanation ?? '').trim(),
            }
          })

        if (!cancelled && mapped.length > 0) {
          setQuestions(mapped)
          setTitle(examId)
        }
      } catch {
        if (!cancelled && fallbackQuestions) {
          setQuestions(fallbackQuestions)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [exam, examId, fallbackQuestions])

  if (isLoading && !questions) {
    return (
      <>
        <Header>
          <div className='flex items-center gap-4'>
            <Link to='/exams/$examId' params={{ examId }}>
              <Button variant='ghost' size='icon'>
                <ArrowLeft className='h-4 w-4' />
              </Button>
            </Link>
            <h1 className='text-lg font-semibold'>{title} - Study Mode</h1>
          </div>
          <div className='ms-auto flex items-center space-x-4'>
            <ThemeSwitch />
          </div>
        </Header>

        <Main className='mx-auto w-full max-w-3xl'>
          <div className='text-sm text-muted-foreground'>
            Loading questions…
          </div>
        </Main>
      </>
    )
  }

  if (!questions || questions.length === 0) {
    return (
      <>
        <Header>
          <div className='flex items-center gap-4'>
            <Link to='/exams/$examId' params={{ examId }}>
              <Button variant='ghost' size='icon'>
                <ArrowLeft className='h-4 w-4' />
              </Button>
            </Link>
            <h1 className='text-lg font-semibold'>{title} - Study Mode</h1>
          </div>
          <div className='ms-auto flex items-center space-x-4'>
            <ThemeSwitch />
          </div>
        </Header>

        <Main className='mx-auto w-full max-w-3xl'>
          <div className='rounded-md border p-4'>
            <div className='font-semibold'>No questions available</div>
          </div>
        </Main>
      </>
    )
  }

  const question = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleNavigate = (index: number) => {
    if (index < 0 || index >= questions.length) return
    setCurrentQuestionIndex(index)
  }

  const handleSettingsChange = (next: StudySettings) => {
    setSettings(next)
  }

  const toggleBookmark = () => {
    if (!userId) return
    const newState = !isBookmarked
    setIsBookmarked(newState)
    ProgressService.toggleBookmark(userId, examId, question.id)
    if (user?.uid) {
      void RemoteProgress.toggleBookmark(
        user.uid,
        examId,
        question.id,
        newState
      )
    } else {
      toast.message('Bookmark saved locally. Sign in to sync to cloud')
    }
  }

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <Header fixed>
        <div className='flex items-center gap-4'>
          <Link to='/exams/$examId' params={{ examId }}>
            <Button variant='ghost' size='icon'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </Link>
          <h1 className='text-lg font-semibold'>{title} - Study Mode</h1>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
        </div>
      </Header>

      <div className='flex flex-1 items-start justify-center gap-2 pt-0 sm:gap-4 px-2'>
        <div className='w-full max-w-3xl px-0 sm:px-0'>
          <Main
            className={cn(
              'w-full px-0 py-2 pb-[calc(var(--mobile-bar-height,0px)+env(safe-area-inset-bottom))] sm:py-6 lg:pr-0',
              {
                'text-xs sm:text-sm': settings.fontSize === 'small',
                'text-sm sm:text-base': settings.fontSize === 'normal',
                'text-base sm:text-lg': settings.fontSize === 'large',
              }
            )}
          >
            <Card className='gap-3 py-3 sm:gap-6 sm:py-6'>
              <CardHeader className='relative px-2 sm:px-6'>
                <CardTitle className='leading-normal font-medium'>
                  <Badge variant='outline' className='me-2 mb-2'>
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </Badge>
                  <Badge variant='secondary' className='mb-2'>
                    {formatQuestionType(question.type)}
                  </Badge>
                  <div className='mt-2'>
                    {question.contentHtml ? (
                      renderExamHtml(question.contentHtml)
                    ) : (
                      <p>{question.text}</p>
                    )}
                  </div>
                </CardTitle>
                <Button
                  variant='ghost'
                  size='sm'
                  className={cn(
                    'absolute top-0 right-2 gap-2 sm:right-6',
                    isBookmarked && 'text-yellow-500 hover:text-yellow-600'
                  )}
                  onClick={toggleBookmark}
                >
                  <Bookmark
                    className={cn(
                      'h-4 w-4 self-start',
                      isBookmarked && 'fill-current'
                    )}
                  />
                </Button>
              </CardHeader>
              <CardContent className='space-y-3 px-2 sm:space-y-6 sm:px-6'>
                <div className='space-y-3'>
                  {question.options.map((option, index) => {
                    const isCorrect = question.correctAnswers.includes(index)
                    let itemClass =
                      'flex items-center space-x-2 sm:space-x-3 rounded-md border p-2 sm:p-4'

                    if (isCorrect) {
                      itemClass +=
                        ' bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900 ring-1 ring-green-500'
                    }

                    return (
                      <div key={index} className={itemClass}>
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${isCorrect ? 'border-green-600 bg-green-600 text-white' : 'border-muted-foreground'}`}
                        >
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span
                          className={
                            isCorrect
                              ? 'font-medium text-green-900 dark:text-green-100'
                              : ''
                          }
                        >
                          {option}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className='rounded-md border border-blue-100 bg-blue-50 p-3 sm:p-4 dark:border-blue-900 dark:bg-blue-900/10'>
                  <div className='mb-2 flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-300'>
                    <Lightbulb className='h-4 w-4' />
                    <span>Explanation</span>
                  </div>
                  <div className='prose prose-sm max-w-none text-muted-foreground dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-blue-700 dark:prose-strong:text-blue-300'>
                    {question.explanation
                      ? renderExamHtml(question.explanation)
                      : 'No explanation provided.'}
                  </div>
                </div>
              </CardContent>
              <CardFooter className='flex justify-between border-t p-3 sm:p-6'>
                <Button
                  variant='outline'
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                  className='w-24'
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={isLastQuestion}
                  className='w-24'
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </CardFooter>
            </Card>
          </Main>
          <div className='h-[calc(var(--mobile-bar-height,0px)+env(safe-area-inset-bottom)+0.5rem)] lg:hidden' />
        </div>
        <div className='hidden py-6 pr-4 lg:block'>
          <StudySidebar
            questions={questions}
            currentQuestionIndex={currentQuestionIndex}
            onNavigate={handleNavigate}
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        </div>
      </div>

      <StudyMobileBar
        questions={questions ?? []}
        currentQuestionIndex={currentQuestionIndex}
        onNavigate={handleNavigate}
        isBookmarked={isBookmarked}
        onToggleBookmark={toggleBookmark}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  )
}
