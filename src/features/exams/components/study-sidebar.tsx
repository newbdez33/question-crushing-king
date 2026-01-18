import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface StudySettings {
  fontSize: 'small' | 'normal' | 'large'
}

interface StudySidebarProps {
  questions: { id: string }[]
  currentQuestionIndex: number
  onNavigate: (index: number) => void
  settings: StudySettings
  onSettingsChange: (settings: StudySettings) => void
}

export function StudySidebar({
  questions,
  currentQuestionIndex,
  onNavigate,
  settings,
  onSettingsChange,
}: StudySidebarProps) {
  return (
    <Card className='hidden w-80 flex-col lg:flex'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base font-semibold'>
            Answer Sheet
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        <div className='space-y-4'>
          <div className='max-h-[278px] overflow-y-auto px-2 py-1'>
            <div className='grid grid-cols-5 gap-2'>
              {questions.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex
                return (
                  <button
                    key={q.id}
                    onClick={() => onNavigate(idx)}
                    className={cn(
                      'h-8 w-full rounded border-2 text-xs font-medium transition-colors',
                      isCurrent
                        ? 'border-transparent ring-2 ring-blue-500'
                        : 'border-transparent',
                      'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className='h-px bg-border' />

        <div className='space-y-6'>
          <h3 className='font-semibold'>Settings</h3>
          <div className='space-y-2'>
            <div className='text-sm font-normal'>Font size</div>
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
      </CardContent>
    </Card>
  )
}
