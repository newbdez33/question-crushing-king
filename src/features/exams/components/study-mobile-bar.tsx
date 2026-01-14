import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { Bookmark, List } from 'lucide-react'

interface StudyMobileBarProps {
  questions: { id: string }[]
  currentQuestionIndex: number
  onNavigate: (index: number) => void
  isBookmarked: boolean
  onToggleBookmark: () => void
}

export function StudyMobileBar({
  questions,
  currentQuestionIndex,
  onNavigate,
  isBookmarked,
  onToggleBookmark,
}: StudyMobileBarProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t bg-background lg:hidden">
      <div className="mx-auto max-w-3xl px-4 py-2 grid grid-cols-2 gap-2 items-center text-xs">
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-2 justify-start', isBookmarked && 'text-yellow-500 hover:text-yellow-600')}
          onClick={onToggleBookmark}
        >
          <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current')} />
          Bookmark
        </Button>

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
                  const isCurrent = idx === currentQuestionIndex
                  return (
                    <button
                      key={q.id}
                      className={cn(
                        'flex h-9 items-center justify-center rounded-md border text-xs transition-colors hover:bg-muted/50',
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

