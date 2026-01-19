import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import * as RemoteProgress from '@/services/firebase-progress'
import { ProgressService, type ExamProgress } from '@/services/progress-service'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
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
import { Label } from '@/components/ui/label'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { PracticeMobileBar } from './components/practice-mobile-bar'
import {
  PracticeSidebar,
  type PracticeSettings,
} from './components/practice-sidebar'
import { mockExams } from './data/mock-exams'

interface ExamModeProps {
  examId: string
  count?: number
  seed?: string
  initialQuestionIndex?: number
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

type PracticeQuestion = {
  id: string
  type: 'single' | 'multiple'
  text: string
  contentHtml?: string
  options: { text: string; html?: string }[]
  correctAnswers: number[]
  requiredSelections: number
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

function mulberry32(seed: number) {
  let t = seed
  return function () {
    t |= 0
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function ExamMode({
  examId,
  count,
  seed,
  initialQuestionIndex,
}: ExamModeProps) {
  const navigate = useNavigate()
  const { user, guestId } = useAuth()
  const userId = user?.uid || guestId
  const exam = mockExams.find((e) => e.id === examId)
  const fallbackQuestions: PracticeQuestion[] | null = exam
    ? exam.questions.map((q) => ({
        id: q.id,
        type: 'single' as const,
        text: q.text,
        options: q.options.map((o) => ({ text: o })),
        correctAnswers: [q.correctAnswer],
        requiredSelections: 1,
        explanation: q.explanation,
      }))
    : null
  const [_allQuestions, setAllQuestions] = useState<PracticeQuestion[] | null>(
    fallbackQuestions
  )
  const [questions, setQuestions] = useState<PracticeQuestion[] | null>(null)
  const [title, setTitle] = useState(exam?.title ?? examId)
  const [isLoading, setIsLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    initialQuestionIndex ?? 0
  )
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [examProgress, setExamProgress] = useState<ExamProgress>(() => {
    if (typeof window !== 'undefined' && userId && examId) {
      try {
        return ProgressService.getExamProgress(userId, examId)
      } catch {
        return {}
      }
    }
    return {}
  })
  const [settings, setSettings] = useState<PracticeSettings>({
    autoNext: false,
    studyMode: false,
    consecutiveCorrect: 3,
    fontSize: 'normal',
    mistakesMode: false,
  })
  const userUidRef = useRef(user?.uid)
  const examIdRef = useRef(examId)

  useEffect(() => {
    if (initialQuestionIndex !== undefined) {
      setCurrentQuestionIndex(initialQuestionIndex)
    }
  }, [initialQuestionIndex])

  useEffect(() => {
    navigate({
      to: '/exams/$examId/exam',
      params: { examId: examIdRef.current },
      search: (prev) => ({
        ...prev,
        q: currentQuestionIndex + 1,
      }),
      replace: true,
    })
  }, [currentQuestionIndex, navigate])

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
      setAllQuestions(fallbackQuestions)
      setTitle(exam?.title ?? examId)
      setQuestions(null)
      try {
        const response = await fetch(`/data/${examId}.json`)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const data = (await response.json()) as ExamFile
        const mappedAll = (data.questions ?? [])
          .slice()
          .sort((a, b) => a.questionNumber - b.questionNumber)
          .map((q) => {
            const options = (q.options ?? [])
              .slice()
              .sort((a, b) => a.label.localeCompare(b.label))
            const correctLabels = parseCorrectLabels(q.correctAnswer)
            const correctAnswers = correctLabels
              .map((label) => options.findIndex((o) => o.label === label))
              .filter((idx) => idx >= 0)
            return {
              id: q.id,
              type: (q.type === 'multiple'
                ? 'multiple'
                : 'single') as PracticeQuestion['type'],
              text: htmlToText(q.content),
              contentHtml: q.content,
              options: options.map((o) => ({
                text: htmlToText(o.content),
                html: o.content,
              })),
              correctAnswers: correctAnswers.length > 0 ? correctAnswers : [0],
              requiredSelections: Math.max(correctAnswers.length, 1),
              explanation: (q.explanation ?? '').trim(),
            }
          })
        const available =
          mappedAll.length > 0 ? mappedAll : (fallbackQuestions ?? [])
        let selected = available
        if (
          typeof count === 'number' &&
          count > 0 &&
          count < available.length
        ) {
          const s = (seed ?? `${Date.now()}`)
            .split('')
            .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
          const rnd = mulberry32(s)
          const indices = new Set<number>()
          while (indices.size < count) {
            indices.add(Math.floor(rnd() * available.length))
          }
          selected = Array.from(indices)
            .map((i) => available[i])
            .sort((a, b) => {
              const na = available.findIndex((q) => q.id === a.id)
              const nb = available.findIndex((q) => q.id === b.id)
              return na - nb
            })
        }
        if (!cancelled) {
          setAllQuestions(available)
          setQuestions(selected)
        }
      } catch {
        const available = fallbackQuestions ?? []
        let selected = available
        if (
          typeof count === 'number' &&
          count > 0 &&
          count < available.length
        ) {
          const s = (seed ?? `${Date.now()}`)
            .split('')
            .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
          const rnd = mulberry32(s)
          const indices = new Set<number>()
          while (indices.size < count) {
            indices.add(Math.floor(rnd() * available.length))
          }
          selected = Array.from(indices).map((i) => available[i])
        }
        if (!cancelled) {
          setAllQuestions(available)
          setQuestions(selected)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [exam, examId, fallbackQuestions, count, seed])

  const question = useMemo(
    () => (questions ? questions[currentQuestionIndex] : undefined),
    [questions, currentQuestionIndex]
  )
  const isLastQuestion = questions
    ? currentQuestionIndex === questions.length - 1
    : true

  useEffect(() => {
    setSelectedAnswers([])
    setIsSubmitted(false)
  }, [currentQuestionIndex])

  const canSubmit = useMemo(() => {
    if (!question) return false
    if (question.type === 'single') return selectedAnswers.length === 1
    return selectedAnswers.length === question.requiredSelections
  }, [question, selectedAnswers])

  const isCorrect = useMemo(() => {
    if (!question || !isSubmitted) return false
    const a = selectedAnswers.slice().sort((x, y) => x - y)
    const b = question.correctAnswers.slice().sort((x, y) => x - y)
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false
    }
    return true
  }, [question, isSubmitted, selectedAnswers])

  const handleNext = () => {
    if (questions && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleNavigate = (index: number) => {
    if (!questions) return
    if (index < 0 || index >= questions.length) return
    setCurrentQuestionIndex(index)
  }

  const handleSettingsChange = (next: PracticeSettings) => {
    setSettings(next)
  }

  const toggleBookmark = () => {
    if (!questions || !question || !userId) return
    const newState = !isBookmarked
    setIsBookmarked(newState)
    ProgressService.toggleBookmark(userId, examId, question.id)
    if (userUidRef.current) {
      void RemoteProgress.toggleBookmark(
        userUidRef.current,
        examId,
        question.id,
        newState
      )
    } else {
      toast.message('Bookmark saved locally. Sign in to sync to cloud')
    }
  }

  const handleSelectAnswer = (idx: number) => {
    if (!question || isSubmitted) return
    if (question.type === 'single') {
      setSelectedAnswers([idx])
    } else {
      setSelectedAnswers((prev) => {
        const set = new Set(prev)
        if (set.has(idx)) set.delete(idx)
        else set.add(idx)
        return Array.from(set)
      })
    }
  }

  const handleSubmit = () => {
    if (!question || !userId || !canSubmit) return
    setIsSubmitted(true)
    const status = isCorrect ? 'correct' : 'incorrect'
    ProgressService.saveAnswer(
      userId,
      examId,
      question.id,
      status,
      selectedAnswers,
      isCorrect
    )
    setExamProgress(ProgressService.getExamProgress(userId, examId))
    if (userUidRef.current) {
      const prev = examProgress[question.id]
      void RemoteProgress.saveAnswer(
        userUidRef.current,
        examId,
        question.id,
        status,
        selectedAnswers,
        prev,
        isCorrect
      )
    }
    if (isCorrect && settings.autoNext && !isLastQuestion) {
      setTimeout(() => handleNext(), 250)
    }
  }

  const handleClearProgress = () => {
    if (!userId) return
    ProgressService.clearExamProgress(userId, examId)
    setExamProgress(ProgressService.getExamProgress(userId, examId))
    if (userUidRef.current) {
      void RemoteProgress.clearExamProgress(userUidRef.current, examId)
    } else {
      toast.message('Progress cleared locally. Sign in to sync to cloud')
    }
  }

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
            <h1 className='text-lg font-semibold'>{title} - Exam Mode</h1>
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
            <h1 className='text-lg font-semibold'>{title} - Exam Mode</h1>
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

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <Header fixed>
        <div className='flex items-center gap-4'>
          <Link to='/exams/$examId' params={{ examId }}>
            <Button variant='ghost' size='icon'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </Link>
          <h1 className='text-lg font-semibold'>{title} - Exam Mode</h1>
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
                    {question?.type === 'multiple' ? 'Multiple' : 'Single'}
                  </Badge>
                  <div className='mt-2'>
                    {question?.contentHtml ? (
                      renderExamHtml(question.contentHtml)
                    ) : (
                      <p>{question?.text}</p>
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
                {question?.type === 'single' ? (
                  <div className='space-y-2 sm:space-y-4'>
                    {question.options.map((option, idx) => {
                      const isSelected = selectedAnswers.includes(idx)
                      return (
                        <div
                          key={idx}
                          className='flex items-center gap-2 rounded-md border p-2 sm:gap-3 sm:p-4'
                        >
                          <input
                            type='radio'
                            name='options'
                            id={`option-${idx}`}
                            checked={isSelected}
                            onChange={() =>
                              !isSubmitted && handleSelectAnswer(idx)
                            }
                            disabled={isSubmitted}
                            className='sr-only'
                          />
                          <div
                            className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors',
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted-foreground'
                            )}
                          >
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <Label
                            htmlFor={`option-${idx}`}
                            className='flex-1 cursor-pointer text-xs leading-relaxed font-normal'
                          >
                            {option.html
                              ? renderExamHtml(option.html)
                              : option.text}
                          </Label>
                          {isSubmitted &&
                            question.correctAnswers.includes(idx) && (
                              <CheckCircle className='h-5 w-5 text-green-500' />
                            )}
                          {isSubmitted &&
                            isSelected &&
                            !question.correctAnswers.includes(idx) && (
                              <XCircle className='h-5 w-5 text-red-500' />
                            )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className='space-y-2 sm:space-y-4'>
                    {question?.options.map((option, idx) => {
                      const isSelected = selectedAnswers.includes(idx)
                      return (
                        <div
                          key={idx}
                          className='flex items-center gap-2 rounded-md border p-2 sm:gap-3 sm:p-4'
                        >
                          <input
                            type='checkbox'
                            id={`option-${idx}`}
                            checked={isSelected}
                            onChange={() =>
                              !isSubmitted && handleSelectAnswer(idx)
                            }
                            disabled={isSubmitted}
                            className='sr-only'
                          />
                          <div
                            className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors',
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted-foreground'
                            )}
                          >
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <Label
                            htmlFor={`option-${idx}`}
                            className='flex-1 cursor-pointer text-xs leading-relaxed font-normal'
                          >
                            {option.html
                              ? renderExamHtml(option.html)
                              : option.text}
                          </Label>
                          {isSubmitted &&
                            question.correctAnswers.includes(idx) && (
                              <CheckCircle className='h-5 w-5 text-green-500' />
                            )}
                          {isSubmitted &&
                            isSelected &&
                            !question.correctAnswers.includes(idx) && (
                              <XCircle className='h-5 w-5 text-red-500' />
                            )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {isSubmitted && question && (
                  <div
                    className={cn(
                      'rounded-lg p-3 sm:p-4',
                      isCorrect
                        ? 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100'
                        : 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100'
                    )}
                  >
                    <p className='font-semibold'>
                      {isCorrect ? 'Correct Answer!' : 'Incorrect Answer'}
                    </p>
                    <div className='mt-2 flex gap-4 text-xs sm:gap-6 sm:text-sm'>
                      <p>
                        <span className='font-semibold'>Correct Answer: </span>
                        {question.correctAnswers
                          .map((i) => String.fromCharCode(65 + i))
                          .join(', ')}
                      </p>
                      <p>
                        <span className='font-semibold'>Your Answer: </span>
                        {selectedAnswers
                          .slice()
                          .sort((a, b) => a - b)
                          .map((i) => String.fromCharCode(65 + i))
                          .join(', ')}
                      </p>
                    </div>
                    {question.explanation && (
                      <div className='mt-2'>
                        <p className='font-semibold'>Explanation:</p>
                        <p>{question.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className='relative flex items-center justify-between border-t p-3 sm:p-6'>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                  title='Previous Question'
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>

                {!isSubmitted && (
                  <div className='absolute left-1/2 -translate-x-1/2'>
                    <Button
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      className='min-w-[120px]'
                    >
                      <CheckCircle className='h-4 w-4' />
                      Submit Answer
                    </Button>
                  </div>
                )}

                <Button
                  variant='outline'
                  size='icon'
                  onClick={handleNext}
                  disabled={isLastQuestion}
                  title='Next Question'
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </CardFooter>
            </Card>
          </Main>
          <div className='h-[calc(var(--mobile-bar-height,0px)+env(safe-area-inset-bottom)+0.5rem)] lg:hidden' />
        </div>

        <div className='hidden py-6 pl-0 lg:block'>
          <PracticeSidebar
            questions={questions}
            progress={examProgress}
            currentQuestionIndex={currentQuestionIndex}
            onNavigate={handleNavigate}
            onClearProgress={handleClearProgress}
            settings={settings}
            onSettingsChange={handleSettingsChange}
            mistakesSessionStatus={{}}
          />
        </div>
      </div>

      <PracticeMobileBar
        questions={questions ?? []}
        progress={examProgress}
        currentQuestionIndex={currentQuestionIndex}
        onNavigate={handleNavigate}
        isBookmarked={isBookmarked}
        onToggleBookmark={toggleBookmark}
        mistakesMode={false}
        mistakesSessionStatus={{}}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  )
}
