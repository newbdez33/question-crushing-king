import { useEffect, useRef } from 'react'
import type { ExamProgress } from '@/services/progress-service'
import { Bookmark, List, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface PracticeMobileBarProps {
  questions: { id: string }[]
  progress: ExamProgress
  currentQuestionIndex: number
  onNavigate: (index: number) => void
  isBookmarked: boolean
  onToggleBookmark: () => void
  mistakesMode: boolean
  mistakesSessionStatus: Record<string, 'correct' | 'incorrect' | undefined>
}

export function PracticeMobileBar({
  questions,
  progress,
  currentQuestionIndex,
  onNavigate,
  isBookmarked,
  onToggleBookmark,
  mistakesMode,
  mistakesSessionStatus,
}: PracticeMobileBarProps) {
  let correct = 0
  let incorrect = 0
  const barRef = useRef<HTMLDivElement | null>(null)

  if (mistakesMode) {
    const statuses = questions
      .map((q) => mistakesSessionStatus[q.id])
      .filter((s): s is 'correct' | 'incorrect' => !!s)
    correct = statuses.filter((s) => s === 'correct').length
    incorrect = statuses.filter((s) => s === 'incorrect').length
  } else {
    const relevant = questions
      .map((q) => progress[q.id])
      .filter((p) => p && p.status)
    correct = relevant.filter((p) => p?.status === 'correct').length
    incorrect = relevant.filter((p) => p?.status === 'incorrect').length
  }

  useEffect(() => {
    const el = barRef.current
    if (!el) return
    const setVar = () => {
      const h = el.offsetHeight
      document.documentElement.style.setProperty(
        '--mobile-bar-height',
        `${h}px`
      )
    }
    setVar()
    const ro = new ResizeObserver(() => setVar())
    ro.observe(el)
    const onResize = () => setVar()
    window.addEventListener('resize', onResize)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div
      ref={barRef}
      className='fixed inset-x-0 bottom-0 z-40 border-t bg-background lg:hidden'
    >
      <div className='mx-auto grid max-w-3xl grid-cols-4 items-center gap-2 px-4 py-2 text-xs'>
        <Button
          variant='ghost'
          size='sm'
          className={cn(
            'justify-center gap-1',
            isBookmarked && 'text-yellow-500 hover:text-yellow-600'
          )}
          onClick={onToggleBookmark}
        >
          <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current')} />
          <span className='sr-only'>Bookmark</span>
        </Button>

        <div
          className='flex h-8 items-center justify-center gap-1'
          aria-label='Correct count'
        >
          <CheckCircle className='h-4 w-4 text-green-600' />
          <span className='font-semibold text-green-600'>{correct}</span>
        </div>

        <div
          className='flex h-8 items-center justify-center gap-1'
          aria-label='Wrong count'
        >
          <XCircle className='h-4 w-4 text-red-600' />
          <span className='font-semibold text-red-600'>{incorrect}</span>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant='ghost' size='sm' className='justify-center gap-1'>
              <List className='h-4 w-4' />
              <span className='sr-only'>Answer Card</span>
            </Button>
          </SheetTrigger>
          <SheetContent side='bottom'>
            <SheetHeader>
              <SheetTitle>Answer Sheet</SheetTitle>
            </SheetHeader>
            <div className='mx-auto w-full max-w-3xl px-4 py-4'>
              <div className='grid grid-cols-6 gap-2'>
                {questions.map((q, idx) => {
                  const status = mistakesMode
                    ? mistakesSessionStatus[q.id]
                    : progress[q.id]?.status
                  const isCurrent = idx === currentQuestionIndex
                  return (
                    <button
                      key={q.id}
                      className={cn(
                        'flex h-9 items-center justify-center rounded-md border text-xs transition-colors',
                        status === 'correct' &&
                          'border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-200',
                        status === 'incorrect' &&
                          'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-200',
                        !status && 'hover:bg-muted/50',
                        isCurrent && 'ring-2 ring-blue-500'
                      )}
                      onClick={() => onNavigate(idx)}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
