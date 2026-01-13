import { useEffect, useState, useRef, type ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle, XCircle, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/auth-context'
import { ProgressService, type ExamProgress } from '@/services/progress-service'
import * as RemoteProgress from '@/services/firebase-progress'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { mockExams } from './data/mock-exams'
import { cn } from '@/lib/utils'
import { PracticeSidebar, type PracticeSettings } from './components/practice-sidebar'
import { PracticeMobileBar } from './components/practice-mobile-bar'

interface PracticeModeProps {
  examId: string
  initialMode?: 'mistakes'
  initialQuestionIndex?: number
}

type DemoOption = {
  label: string
  content: string
}

type DemoQuestion = {
  id: string
  questionNumber: number
  type: string
  content: string
  options: DemoOption[]
  correctAnswer: string
  explanation?: string
}

type DemoFile = {
  questions: DemoQuestion[]
}

type PracticeOption = {
  text: string
  html?: string
}

type PracticeQuestion = {
  id: string
  type: 'single' | 'multiple'
  text: string
  contentHtml?: string
  options: PracticeOption[]
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

function formatQuestionType(type: string) {
  if (type === 'multiple') return 'Multiple'
  return 'Single'
}

function sameSelections(a: number[], b: number[]) {
  if (a.length !== b.length) return false
  const setB = new Set(b)
  return a.every((item) => setB.has(item))
}

function renderExamHtml(html: string) {
  if (typeof window === 'undefined') return <span>{html}</span>

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const nodes = Array.from(doc.body.childNodes)

  const renderNode = (node: ChildNode, key: string | number, parentTag?: string): ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? '').trim()
      if (!text) return null
      if (parentTag === 'p' || parentTag === 'li') {
        return text
      }
      return <span key={key} className='leading-relaxed'>{text}</span>
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

    if (tag === 'ul') return <ul key={key} className='list-disc pl-6'>{children}</ul>
    if (tag === 'ol') return <ol key={key} className='list-decimal pl-6'>{children}</ol>
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

  return <div className='space-y-3'>{nodes.map((n, i) => renderNode(n, i, 'body'))}</div>
}

export function PracticeMode({ examId, initialMode, initialQuestionIndex }: PracticeModeProps) {
  const navigate = useNavigate()
  const { user, guestId } = useAuth()
  const userId = user?.uid || guestId
  const exam = mockExams.find((e) => e.id === examId)
  const fallbackQuestions = exam
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
  const [allQuestions, setAllQuestions] = useState<PracticeQuestion[] | null>(
    fallbackQuestions
  )
  const [title, setTitle] = useState(exam?.title ?? examId)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex ?? 0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [examProgress, setExamProgress] = useState<ExamProgress>({})
  const [settings, setSettings] = useState<PracticeSettings>({
    autoNext: false,
    studyMode: false,
    consecutiveCorrect: 3,
    fontSize: 'normal',
    mistakesMode: initialMode === 'mistakes',
  })
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Filter questions for "My Mistakes" mode
  const [mistakeQuestions, setMistakeQuestions] = useState<PracticeQuestion[] | null>(null)
  const prevMistakesMode = useRef(settings.mistakesMode)

  useEffect(() => {
    if (initialQuestionIndex !== undefined) {
      setCurrentQuestionIndex(initialQuestionIndex)
    }
  }, [initialQuestionIndex])

  useEffect(() => {
    navigate({
      search: (prev: any) => ({ ...prev, q: currentQuestionIndex + 1 }),
      replace: true,
    })
  }, [currentQuestionIndex, navigate])

  useEffect(() => {
    const wasMistakesMode = prevMistakesMode.current
    prevMistakesMode.current = settings.mistakesMode

    if (settings.mistakesMode && allQuestions) {
      const filtered = allQuestions.filter((q) => {
        const p = examProgress[q.id]
        if (!p) return false // Not attempted
        
        // Include if currently incorrect OR (was wrong before AND threshold not met)
        if (p.status === 'incorrect' || (p.timesWrong && p.timesWrong > 0)) {
          if (settings.consecutiveCorrect === 0) return true
          return (p.consecutiveCorrect || 0) < settings.consecutiveCorrect
        }
        return false
      })
      setMistakeQuestions(filtered)
      
      if (settings.mistakesMode !== wasMistakesMode) {
        setCurrentQuestionIndex(0)
      } else {
        // Clamp index to ensure it's valid
        setCurrentQuestionIndex((prev) => {
          if (prev < filtered.length) return prev
          return 0
        })
      }
    } else {
        setMistakeQuestions(null)
      }
  }, [settings.mistakesMode, settings.consecutiveCorrect, allQuestions]) // Intentionally omit examProgress to avoid shifting list while practicing

  const questions = settings.mistakesMode ? mistakeQuestions : allQuestions

  // Load progress for the whole exam
  useEffect(() => {
    if (userId && examId) {
      const progress = ProgressService.getExamProgress(userId, examId)
      setExamProgress(progress)
    }
  }, [userId, examId])

  useEffect(() => {
    if (!user?.uid) return
    const unsub = RemoteProgress.subscribeExamProgress(user.uid, examId, (p) => {
      setExamProgress(p || {})
    })
    return () => unsub()
  }, [user?.uid, examId])

  // Sync current question state with progress
  useEffect(() => {
    if (questions && questions[currentQuestionIndex] && userId) {
      const qId = questions[currentQuestionIndex].id
      const progress = examProgress[qId]
      
      setIsBookmarked(progress?.bookmarked || false)
      
      if (progress?.status) {
        setIsSubmitted(true)
        if (progress.userSelection) {
          setSelectedAnswers(progress.userSelection)
        }
      } else {
        setIsSubmitted(false)
        setSelectedAnswers([])
      }
    }
  }, [questions, currentQuestionIndex, userId, examProgress])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setLoadError(null)
      setAllQuestions(fallbackQuestions)
      setTitle(exam?.title ?? examId)
      // Only reset if no questions loaded yet
      if (!allQuestions) {
        setCurrentQuestionIndex(initialQuestionIndex ?? 0)
      }

      try {
        const response = await fetch(`/data/${examId}.json`)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = (await response.json()) as DemoFile
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
            const requiredSelections =
              q.type === 'multiple'
                ? Math.max(correctLabels.length, 1)
                : 1

            return {
              id: q.id,
              type: (q.type === 'multiple' ? 'multiple' : 'single') as PracticeQuestion['type'],
              text: htmlToText(q.content),
              contentHtml: q.content,
              options: options.map((o) => {
                const raw = o.content ?? ''
                const text = htmlToText(raw)
                const html = raw.includes('<') ? raw : undefined
                return { text, html }
              }),
              correctAnswers:
                correctAnswers.length > 0 ? correctAnswers : [Math.max(correctIndex, 0)],
              requiredSelections,
              explanation: (q.explanation ?? '').trim(),
            }
          })

        if (!cancelled && mapped.length > 0) {
          setAllQuestions(mapped)
          setTitle(examId)
        }
      } catch {
        if (!cancelled && !exam) {
          setLoadError(`Demo data /data/${examId}.json not found.`)
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

  const question = questions?.[currentQuestionIndex]
  const canSubmit = !isSubmitted && selectedAnswers.length > 0
  const isCorrect = isSubmitted && question && sameSelections(selectedAnswers, question.correctAnswers)

  const didAutoNavigate = useRef(initialQuestionIndex !== undefined)
  useEffect(() => {
    if (didAutoNavigate.current) return
    if (isLoading) return
    if (settings.mistakesMode) return
    if (!questions || questions.length === 0) return
    const entries = Object.entries(examProgress).filter(([, p]) => p?.lastAnswered)
    if (entries.length === 0) return
    entries.sort((a, b) => (b[1].lastAnswered || 0) - (a[1].lastAnswered || 0))
    const targetId = entries[0][0]
    const idx = questions.findIndex((q) => q.id === targetId)
    if (idx >= 0) {
      setCurrentQuestionIndex(idx)
      didAutoNavigate.current = true
    }
  }, [questions, examProgress, isLoading, settings.mistakesMode])

  const handleSelectAnswer = (index: number) => {
    if (isSubmitted) return // Prevent changes if submitted

    if (!question) return

    if (question.type === 'single') {
      setSelectedAnswers([index])
    } else {
      setSelectedAnswers((prev) => {
        if (prev.includes(index)) {
          return prev.filter((i) => i !== index)
        }
        return [...prev, index]
      })
    }
  }

  const handleSubmit = () => {
    if (!canSubmit || !question || !userId) return
    
    const correct = sameSelections(selectedAnswers, question.correctAnswers)
    const status = correct ? 'correct' : 'incorrect'
    
    // Save to service
    ProgressService.saveAnswer(userId, examId, question.id, status, selectedAnswers)
    if (user?.uid) {
      void RemoteProgress.saveAnswer(user.uid, examId, question.id, status, selectedAnswers, examProgress[question.id])
    } else {
      toast.message('Saved locally. Sign in to sync to cloud')
    }
    
    // Update local state
    setIsSubmitted(true)
    setExamProgress(prev => ({
      ...prev,
      [question.id]: {
        ...prev[question.id],
        status,
        lastAnswered: Date.now(),
        userSelection: selectedAnswers,
        consecutiveCorrect: correct 
          ? ((prev[question.id]?.consecutiveCorrect || 0) + 1) 
          : 0,
        timesWrong: !correct
          ? ((prev[question.id]?.timesWrong || 0) + 1)
          : (prev[question.id]?.timesWrong || 0)
      }
    }))

    // Auto Next Logic
    if (settings.autoNext && correct) {
      setTimeout(() => {
        handleNext()
      }, 1000)
    }
  }

  const handleNext = () => {
    if (questions && currentQuestionIndex < questions.length - 1) {
      setSelectedAnswers([])
      setIsSubmitted(false)
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setSelectedAnswers([])
      setIsSubmitted(false)
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleNavigate = (index: number) => {
    setSelectedAnswers([])
    setIsSubmitted(false)
    setCurrentQuestionIndex(index)
  }

  const toggleBookmark = () => {
    if (!userId || !question) return
    const newState = !isBookmarked
    setIsBookmarked(newState)
    ProgressService.toggleBookmark(userId, examId, question.id)
    if (user?.uid) {
      void RemoteProgress.toggleBookmark(user.uid, examId, question.id, newState)
    } else {
      toast.message('Bookmark saved locally. Sign in to sync to cloud')
    }
    
    // Update local progress
    setExamProgress(prev => ({
      ...prev,
      [question.id]: {
        ...prev[question.id],
        bookmarked: newState
      }
    }))
  }

  const handleClearProgress = () => {
    if (!userId) return
    setShowClearConfirm(true)
  }

  const confirmClearProgress = () => {
    ProgressService.clearExamProgress(userId, examId)
    if (user?.uid) {
      void RemoteProgress.clearExamProgress(user.uid, examId)
    }
    setExamProgress({})
    setIsSubmitted(false)
    setSelectedAnswers([])
    if (settings.mistakesMode) {
      setMistakeQuestions([])
    }
    setShowClearConfirm(false)
  }

  if (isLoading && !questions) {
    return (
      <>
        <Header>
          <div className='flex items-center gap-4'>
            {exam ? (
              <Link to='/exams/$examId' params={{ examId }}>
                <Button variant='ghost' size='icon'>
                  <ArrowLeft className='h-4 w-4' />
                </Button>
              </Link>
            ) : (
              <Link to='/exams'>
                <Button variant='ghost' size='icon'>
                  <ArrowLeft className='h-4 w-4' />
                </Button>
              </Link>
            )}
            <h1 className='text-lg font-semibold'>{title} - Practice</h1>
          </div>
          <div className='ms-auto flex items-center space-x-4'>
            <ThemeSwitch />
          </div>
        </Header>
        <Main className='mx-auto w-full max-w-3xl'>
          <div className='text-sm text-muted-foreground'>Loading questions…</div>
        </Main>
      </>
    )
  }

  if (loadError || !questions || !question) {
    return (
      <Main className='mx-auto w-full max-w-3xl pt-8'>
        <div className='flex flex-col items-center gap-4 text-center'>
          <p className='text-destructive'>{loadError ?? 'Question not found'}</p>
          <Link to='/exams'>
            <Button>Back to Exams</Button>
          </Link>
        </div>
      </Main>
    )
  }

  // Determine font size class
  const fontSizeClass = {
    'small': 'text-sm',
    'normal': 'text-base',
    'large': 'text-lg',
  }[settings.fontSize]

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <Header fixed>
        <div className='flex items-center gap-4'>
          <Link to='/exams/$examId' params={{ examId }}>
            <Button variant='ghost' size='icon'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </Link>
          <h1 className='text-lg font-semibold'>{title} - Practice</h1>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
        </div>
      </Header>

      <div className='flex flex-1 pt-0 items-start justify-center gap-4'>
        <div className='w-full max-w-3xl'>
          <Main className={cn('w-full pb-24 lg:pr-0', fontSizeClass)}>
            <Card>
              <CardHeader>
                <div className='flex items-start justify-between gap-4'>
                  <CardTitle className='font-medium leading-normal'>
                    <Badge variant='outline' className='mb-2 me-2'>
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
                    className={cn('gap-2', isBookmarked && 'text-yellow-500 hover:text-yellow-600')}
                    onClick={toggleBookmark}
                  >
                    <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current')} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='space-y-6'>
                {question.type === 'single' ? (
                  <RadioGroup
                    key={question.id}
                    value={selectedAnswers[0]?.toString() ?? ''}
                    onValueChange={(val) => handleSelectAnswer(parseInt(val))}
                    disabled={isSubmitted}
                  >
                    {question.options.map((option, idx) => {
                      const isSelected = selectedAnswers.includes(idx)
                      return (
                        <div
                          key={idx}
                          className={cn(
                            'flex items-center space-x-3 rounded-lg border p-4 transition-colors cursor-pointer',
                            isSubmitted && question.correctAnswers.includes(idx) && 'border-green-500 bg-green-50 dark:bg-green-950/20',
                            isSubmitted && isSelected && !question.correctAnswers.includes(idx) && 'border-red-500 bg-red-50 dark:bg-red-950/20',
                            !isSubmitted && 'hover:bg-muted/50',
                            isSelected && !isSubmitted && 'border-primary bg-accent'
                          )}
                          onClick={() => !isSubmitted && handleSelectAnswer(idx)}
                        >
                          <RadioGroupItem value={idx.toString()} id={`option-${idx}`} className="sr-only" />
                          <div className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                            isSelected 
                              ? "border-primary bg-primary text-primary-foreground" 
                              : "border-muted-foreground"
                          )}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <Label
                            htmlFor={`option-${idx}`}
                            className={cn('flex-1 cursor-pointer font-normal leading-relaxed', fontSizeClass)}
                          >
                            {option.html ? renderExamHtml(option.html) : option.text}
                          </Label>
                        {isSubmitted && question.correctAnswers.includes(idx) && (
                          <CheckCircle className='h-5 w-5 text-green-500' />
                        )}
                        {isSubmitted && selectedAnswers.includes(idx) && !question.correctAnswers.includes(idx) && (
                          <XCircle className='h-5 w-5 text-red-500' />
                        )}
                      </div>
                    )
                  })}
                  </RadioGroup>
                ) : (
                  <div className='grid gap-3' key={question.id}>
                    {question.options.map((option, idx) => {
                      const isSelected = selectedAnswers.includes(idx)
                      return (
                        <div
                          key={idx}
                          className={cn(
                            'flex items-center space-x-3 rounded-lg border p-4 transition-colors cursor-pointer',
                            isSubmitted && question.correctAnswers.includes(idx) && 'border-green-500 bg-green-50 dark:bg-green-950/20',
                            isSubmitted && isSelected && !question.correctAnswers.includes(idx) && 'border-red-500 bg-red-50 dark:bg-red-950/20',
                            !isSubmitted && 'hover:bg-muted/50',
                            isSelected && !isSubmitted && 'border-primary bg-accent'
                          )}
                          onClick={() => !isSubmitted && handleSelectAnswer(idx)}
                        >
                          <Checkbox
                            id={`option-${idx}`}
                            checked={isSelected}
                            onCheckedChange={() => !isSubmitted && handleSelectAnswer(idx)}
                            disabled={isSubmitted}
                            className="sr-only"
                          />
                          <div className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                            isSelected 
                              ? "border-primary bg-primary text-primary-foreground" 
                              : "border-muted-foreground"
                          )}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <Label
                            htmlFor={`option-${idx}`}
                            className={cn('flex-1 cursor-pointer font-normal leading-relaxed', fontSizeClass)}
                          >
                            {option.html ? renderExamHtml(option.html) : option.text}
                          </Label>
                          {isSubmitted && question.correctAnswers.includes(idx) && (
                            <CheckCircle className='h-5 w-5 text-green-500' />
                          )}
                          {isSubmitted && isSelected && !question.correctAnswers.includes(idx) && (
                            <XCircle className='h-5 w-5 text-red-500' />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {isSubmitted && (
                  <div className={cn(
                    'rounded-lg p-4',
                    isCorrect ? 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100' : 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100'
                  )}>
                    <p className='font-semibold'>
                      {isCorrect ? 'Correct Answer!' : 'Incorrect Answer'}
                    </p>
                    <div className='mt-2 flex gap-6 text-sm'>
                      <p>
                        <span className='font-semibold'>Correct Answer: </span>
                        {question.correctAnswers.map(i => String.fromCharCode(65 + i)).join(', ')}
                      </p>
                      <p>
                        <span className='font-semibold'>Your Answer: </span>
                        {selectedAnswers.slice().sort((a, b) => a - b).map(i => String.fromCharCode(65 + i)).join(', ')}
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
              <CardFooter className='relative flex items-center justify-between border-t bg-muted/50 p-6'>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                  title="Previous Question"
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                
                {!isSubmitted && (
                  <div className="absolute left-1/2 -translate-x-1/2">
                    <Button onClick={handleSubmit} disabled={!canSubmit} className="min-w-[120px]">
                      Submit Answer
                    </Button>
                  </div>
                )}

                <Button 
                  variant='outline' 
                  size='icon'
                  onClick={handleNext} 
                  disabled={currentQuestionIndex === questions.length - 1}
                  title="Next Question"
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </CardFooter>
            </Card>
          </Main>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block py-6 pr-4">
          <PracticeSidebar 
            questions={questions}
            progress={examProgress}
            currentQuestionIndex={currentQuestionIndex}
            onNavigate={handleNavigate}
            onClearProgress={handleClearProgress}
            settings={settings}
            onSettingsChange={setSettings}
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
      />

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your progress for this exam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearProgress} className="bg-red-600 hover:bg-red-700">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
