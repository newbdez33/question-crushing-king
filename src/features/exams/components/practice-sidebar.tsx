import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { ExamProgress } from '@/services/progress-service'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

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
}

export function PracticeSidebar({
  questions,
  progress,
  currentQuestionIndex,
  onNavigate,
  onClearProgress,
  settings,
  onSettingsChange,
}: PracticeSidebarProps) {
  // Calculate stats
  const relevantProgress = questions.map(q => progress[q.id]).filter(p => p && p.status)
  const correct = relevantProgress.filter(p => p?.status === 'correct').length
  const incorrect = relevantProgress.filter(p => p?.status === 'incorrect').length
  const totalAnswered = correct + incorrect
  const accuracy = totalAnswered > 0 ? Math.round((correct / totalAnswered) * 10000) / 100 : 0

  return (
    <Card className="w-80 hidden lg:flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Answer Sheet</CardTitle>
          <Button variant="ghost" size="sm" className="text-blue-500 h-auto p-0 hover:text-blue-600" onClick={onClearProgress}>
            Clear Progress
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Answer Grid */}
        <div className="space-y-4">
          <div className="max-h-[260px] overflow-y-auto pr-2">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const status = progress[q.id]?.status
                const isCurrent = idx === currentQuestionIndex
                
                return (
                  <button
                    key={q.id}
                    onClick={() => onNavigate(idx)}
                    className={cn(
                      "h-8 w-full rounded text-xs font-medium transition-colors border-2",
                      isCurrent ? "border-primary" : "border-transparent",
                      status === 'correct' ? "bg-green-500 text-white hover:bg-green-600" :
                      status === 'incorrect' ? "bg-red-500 text-white hover:bg-red-600" :
                      "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>
          
          <div className="flex justify-between text-sm">
            <div className="text-green-600 font-medium">Correct: {correct}</div>
            <div className="text-red-600 font-medium">Incorrect: {incorrect}</div>
          </div>
          <div className="text-sm font-medium">Accuracy: {accuracy}%</div>
        </div>

        <div className="h-px bg-border" />

        {/* Settings */}
        <div className="space-y-6">
          <h3 className="font-semibold">Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-next" className="text-sm font-normal">Auto next when correct</Label>
              <Switch 
                id="auto-next" 
                checked={settings.autoNext}
                onCheckedChange={(c) => onSettingsChange({...settings, autoNext: c})}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Consecutive correct</Label>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => onSettingsChange({...settings, consecutiveCorrect: Math.max(0, settings.consecutiveCorrect - 1)})}
                  >
                    -
                  </Button>
                  <div className="w-8 text-center text-sm">{settings.consecutiveCorrect}</div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => onSettingsChange({...settings, consecutiveCorrect: settings.consecutiveCorrect + 1})}
                  >
                    +
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-right leading-tight">
                Auto remove wrong questions<br/>0 means never remove
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-normal">Font size</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'normal', 'large'] as const).map((size) => (
                  <Button
                    key={size}
                    variant={settings.fontSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => onSettingsChange({...settings, fontSize: size})}
                    className="capitalize"
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
