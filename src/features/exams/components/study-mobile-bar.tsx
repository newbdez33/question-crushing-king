import { useEffect, useRef, useState } from 'react'
import { Bookmark, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { StudySettings } from './study-sidebar'

interface StudyMobileBarProps {
  questions: { id: string }[]
  currentQuestionIndex: number
  onNavigate: (index: number) => void
  isBookmarked: boolean
  onToggleBookmark: () => void
  settings: StudySettings
  onSettingsChange: (settings: StudySettings) => void
}

export function StudyMobileBar({
  questions,
  currentQuestionIndex,
  onNavigate,
  isBookmarked,
  onToggleBookmark,
  settings,
  onSettingsChange,
}: StudyMobileBarProps) {
  const barRef = useRef<HTMLDivElement | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const sheetContentRef = useRef<HTMLDivElement | null>(null)
  const dragStartY = useRef<number | null>(null)
  const dragCurrentY = useRef<number>(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only start drag from the drag handle area (top 50px of sheet)
    const target = e.target as HTMLElement
    const rect = sheetContentRef.current?.getBoundingClientRect()
    if (!rect) return
    const touchY = e.touches[0].clientY
    const relativeY = touchY - rect.top
    // Only initiate drag if touching the top 50px (drag handle area)
    if (relativeY <= 50 || target.closest('[data-drag-handle]')) {
      dragStartY.current = e.touches[0].clientY
      dragCurrentY.current = 0
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return
    const deltaY = e.touches[0].clientY - dragStartY.current
    // Only track downward movement
    if (deltaY > 0) {
      dragCurrentY.current = deltaY
      if (sheetContentRef.current) {
        sheetContentRef.current.style.transform = `translateY(${deltaY}px)`
        sheetContentRef.current.style.transition = 'none'
      }
    }
  }

  const handleTouchEnd = () => {
    if (sheetContentRef.current) {
      sheetContentRef.current.style.transform = ''
      sheetContentRef.current.style.transition = ''
    }
    // Close if dragged more than 100px down
    if (dragCurrentY.current > 100) {
      setSheetOpen(false)
    }
    dragStartY.current = null
    dragCurrentY.current = 0
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
      <div className='mx-auto grid max-w-3xl grid-cols-2 items-center gap-2 px-4 py-2 text-xs'>
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

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant='ghost' size='sm' className='justify-center gap-1'>
              <List className='h-4 w-4' />
              <span className='sr-only'>Answer Card</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side='bottom'
            ref={sheetContentRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className='max-h-[70vh] flex flex-col'
          >
            <div data-drag-handle className='mx-auto mb-2 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30' />
            <SheetHeader className='shrink-0'>
              <SheetTitle>Answer Sheet</SheetTitle>
            </SheetHeader>
            <div className='mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-4'>
              <div className='grid grid-cols-6 gap-2'>
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

              {/* Font Size Settings */}
              <div className='mt-6 space-y-2'>
                <Label className='text-sm font-normal'>Font size</Label>
                <div className='grid grid-cols-3 gap-2'>
                  {(['small', 'normal', 'large'] as const).map((size) => (
                    <Button
                      key={size}
                      variant={settings.fontSize === size ? 'default' : 'outline'}
                      size='sm'
                      onClick={() =>
                        onSettingsChange({ ...settings, fontSize: size })
                      }
                      className='capitalize'
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
