import type { ExamProgress } from '@/services/progress-service'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export interface PracticeSettings {
  autoNext: boolean
  studyMode: boolean
  consecutiveCorrect: number
  fontSize: 'small' | 'normal' | 'large'
  mistakesMode: boolean
}

interface PracticeSidebarProps {
  questions: { id: string }[]
  progress: ExamProgress
  currentQuestionIndex: number
  onNavigate: (index: number) => void
  onClearProgress: () => void
  settings: PracticeSettings
  onSettingsChange: (settings: PracticeSettings) => void
  mistakesSessionStatus: Record<string, 'correct' | 'incorrect' | undefined>
}

export function PracticeSidebar({
  questions,
  progress,
  currentQuestionIndex,
  onNavigate,
  onClearProgress,
  settings,
  onSettingsChange,
  mistakesSessionStatus,
}: PracticeSidebarProps) {
  let correct = 0
  let incorrect = 0

  if (settings.mistakesMode) {
    const statuses = questions
      .map((q) => mistakesSessionStatus[q.id])
      .filter((s): s is 'correct' | 'incorrect' => !!s)
    correct = statuses.filter((s) => s === 'correct').length
    incorrect = statuses.filter((s) => s === 'incorrect').length
  } else {
    const relevantProgress = questions
      .map((q) => progress[q.id])
      .filter((p) => p && p.status)
    correct = relevantProgress.filter((p) => p?.status === 'correct').length
    incorrect = relevantProgress.filter((p) => p?.status === 'incorrect').length
  }

  const totalAnswered = correct + incorrect
  const accuracy =
    totalAnswered > 0 ? Math.round((correct / totalAnswered) * 10000) / 100 : 0

  return (
    <Card className='hidden w-80 flex-col lg:flex'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base font-semibold'>
            Answer Sheet
          </CardTitle>
          <Button
            variant='ghost'
            size='sm'
            className='h-auto p-0 text-blue-500 hover:text-blue-600'
            onClick={onClearProgress}
          >
            Clear Progress
          </Button>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Answer Grid */}
          <div className='space-y-4'>
          <div className='max-h-[260px] overflow-y-auto px-2'>
            <div className='grid grid-cols-5 gap-2'>
              {questions.map((q, idx) => {
                const status = settings.mistakesMode
                  ? mistakesSessionStatus[q.id]
                  : progress[q.id]?.status
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
                      status === 'correct'
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : status === 'incorrect'
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>

          <div className='flex justify-between text-sm'>
            <div className='font-medium text-green-600'>Correct: {correct}</div>
            <div className='font-medium text-red-600'>
              Incorrect: {incorrect}
            </div>
          </div>
          <div className='text-sm font-medium'>Accuracy: {accuracy}%</div>
        </div>

        <div className='h-px bg-border' />

        {/* Settings */}
        <div className='space-y-6'>
          <h3 className='font-semibold'>Settings</h3>

          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='auto-next' className='text-sm font-normal'>
                Auto next when correct
              </Label>
              <Switch
                id='auto-next'
                checked={settings.autoNext}
                onCheckedChange={(c) =>
                  onSettingsChange({ ...settings, autoNext: c })
                }
              />
            </div>

            {settings.mistakesMode && (
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <Label className='text-sm font-normal'>
                    Consecutive correct
                  </Label>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='icon'
                      className='h-8 w-8'
                      onClick={() =>
                        onSettingsChange({
                          ...settings,
                          consecutiveCorrect: Math.max(
                            1,
                            settings.consecutiveCorrect - 1
                          ),
                        })
                      }
                    >
                      -
                    </Button>
                    <div className='w-8 text-center text-sm'>
                      {settings.consecutiveCorrect}
                    </div>
                    <Button
                      variant='outline'
                      size='icon'
                      className='h-8 w-8'
                      onClick={() =>
                        onSettingsChange({
                          ...settings,
                          consecutiveCorrect: settings.consecutiveCorrect + 1,
                        })
                      }
                    >
                      +
                    </Button>
                  </div>
                </div>
                <p className='text-right text-xs leading-tight text-muted-foreground'>
                  Auto remove wrong questions based on consecutive correct count
                </p>
              </div>
            )}

            <div className='space-y-2'>
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
        </div>
      </CardContent>
    </Card>
  )
}
