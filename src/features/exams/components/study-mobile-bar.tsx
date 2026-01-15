import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { Bookmark, List } from 'lucide-react'
import { useEffect, useRef } from 'react'

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
  const barRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = barRef.current
    if (!el) return
    const setVar = () => {
      const h = el.offsetHeight
      document.documentElement.style.setProperty('--mobile-bar-height', `${h}px`)
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
    <div ref={barRef} className="fixed bottom-0 inset-x-0 z-40 border-t bg-background lg:hidden">
      <div className="mx-auto max-w-3xl px-4 py-2 grid grid-cols-2 gap-2 items-center text-xs">
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-1 justify-center', isBookmarked && 'text-yellow-500 hover:text-yellow-600')}
          onClick={onToggleBookmark}
        >
          <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current')} />
          <span className="sr-only">Bookmark</span>
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 justify-center">
              <List className="h-4 w-4" />
              <span className="sr-only">Answer Card</span>
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
                      className={cn('flex h-9 items-center justify-center rounded-md border text-xs transition-colors hover:bg-muted/50', isCurrent && 'ring-2 ring-blue-500')}
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
