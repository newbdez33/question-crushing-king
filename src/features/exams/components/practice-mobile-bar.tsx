import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { ExamProgress } from '@/services/progress-service'
import { Bookmark, List, CheckCircle, XCircle } from 'lucide-react'

interface PracticeMobileBarProps {
  questions: { id: string }[]
  progress: ExamProgress
  currentQuestionIndex: number
  onNavigate: (index: number) => void
  isBookmarked: boolean
  onToggleBookmark: () => void
}

export function PracticeMobileBar({
  questions,
  progress,
  currentQuestionIndex,
  onNavigate,
  isBookmarked,
  onToggleBookmark,
}: PracticeMobileBarProps) {
  const relevant = questions.map((q) => progress[q.id]).filter((p) => p && p.status)
  const correct = relevant.filter((p) => p?.status === 'correct').length
  const incorrect = relevant.filter((p) => p?.status === 'incorrect').length

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t bg-background lg:hidden">
      <div className="mx-auto max-w-3xl px-4 py-2 grid grid-cols-4 gap-2 items-center text-xs">
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-2 justify-start', isBookmarked && 'text-yellow-500 hover:text-yellow-600')}
          onClick={onToggleBookmark}
        >
          <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current')} />
          Bookmark
        </Button>

        <div className="flex items-center justify-start gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="font-semibold text-green-600">{correct}</span>
          <span className="text-muted-foreground">Correct</span>
        </div>

        <div className="flex items-center justify-start gap-2">
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="font-semibold text-red-600">{incorrect}</span>
          <span className="text-muted-foreground">Wrong</span>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 justify-start">
              <List className="h-4 w-4" />
              Answer Card
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Answer Sheet</SheetTitle>
            </SheetHeader>
            <div className="mx-auto w-full max-w-3xl px-4 py-4">
              <div className="grid grid-cols-6 gap-2">
                {questions.map((q, idx) => {
                  const status = progress[q.id]?.status
                  const isCurrent = idx === currentQuestionIndex
                  return (
                    <button
                      key={q.id}
                      className={cn(
                        'flex h-9 items-center justify-center rounded-md border text-xs transition-colors',
                        status === 'correct' && 'border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-200',
                        status === 'incorrect' && 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-200',
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
