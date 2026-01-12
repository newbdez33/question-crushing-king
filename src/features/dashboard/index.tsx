import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Activity, BookOpen, CheckCircle, FileText, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useAuth } from '@/context/auth-context'
import { mockExams } from '@/features/exams/data/mock-exams'
import { ProgressService } from '@/services/progress-service'

// Define demo exams locally as they are in the exams feature
const demoExams = [
  {
    id: 'SOA-C03',
    title: 'SOA-C03 (Demo)',
    description: 'Demo from /public/data/SOA-C03.json',
  },
]

export function Dashboard() {
  const { user, guestId } = useAuth()
  const userId = user?.uid || guestId

  const [demoCounts, setDemoCounts] = useState<Record<string, number>>({})
  
  // Load demo exam counts to get accurate total questions
  useEffect(() => {
    let cancelled = false
    async function loadCounts() {
      const next: Record<string, number> = {}
      await Promise.all(
        demoExams.map(async (exam) => {
          try {
            const res = await fetch(`/data/${exam.id}.json`)
            if (!res.ok) return
            const data = (await res.json()) as { questions?: unknown[] }
            const count = Array.isArray(data.questions) ? data.questions.length : 0
            next[exam.id] = count
          } catch {
            // ignore
          }
        })
      )
      if (!cancelled) setDemoCounts(next)
    }
    void loadCounts()
    return () => { cancelled = true }
  }, [])

  const allExamsMap = useMemo(() => {
    const map = new Map<string, { title: string; totalQuestions: number }>()
    
    // Add mock exams
    mockExams.forEach(e => {
      map.set(e.id, { title: e.title, totalQuestions: e.questionCount })
    })

    // Add demo exams
    demoExams.forEach(e => {
      map.set(e.id, { 
        title: e.title, 
        totalQuestions: demoCounts[e.id] || 0 
      })
    })
    
    return map
  }, [demoCounts])

  // Calculate stats
  const stats = useMemo(() => {
    if (!userId) return null

    const userProgress = ProgressService.getUserProgress(userId)
    const examIds = Object.keys(userProgress)

    let totalQuestionsAnswered = 0
    let totalCorrect = 0
    let totalExamsStarted = 0

    const examStats = examIds.map(examId => {
      const examProgress = userProgress[examId]
      const questionIds = Object.keys(examProgress)
      
      const answered = questionIds.filter(q => examProgress[q].status).length
      const correct = questionIds.filter(q => examProgress[q].status === 'correct').length
      
      if (answered > 0) {
        totalQuestionsAnswered += answered
        totalCorrect += correct
        totalExamsStarted++
      }

      const examInfo = allExamsMap.get(examId)
      
      return {
        id: examId,
        title: examInfo?.title || examId,
        totalQuestions: examInfo?.totalQuestions || 0,
        answered,
        correct,
        accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
        lastActive: Math.max(...questionIds.map(q => examProgress[q].lastAnswered || 0), 0)
      }
    }).filter(stat => stat.answered > 0)
      .sort((a, b) => b.lastActive - a.lastActive)

    const overallAccuracy = totalQuestionsAnswered > 0 
      ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) 
      : 0

    return {
      totalQuestionsAnswered,
      totalCorrect,
      totalExamsStarted,
      overallAccuracy,
      examStats
    }
  }, [userId, allExamsMap])

  return (
    <>
      <Header>
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='flex items-center justify-between space-y-2 mb-6'>
          <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
        </div>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Questions Answered</CardTitle>
              <BookOpen className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats?.totalQuestionsAnswered || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Correct Answers</CardTitle>
              <CheckCircle className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats?.totalCorrect || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Overall Accuracy</CardTitle>
              <TrendingUp className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats?.overallAccuracy || 0}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Exams Started</CardTitle>
              <Activity className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats?.totalExamsStarted || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className='space-y-4'>
          <h2 className='text-xl font-semibold'>Recent Activity</h2>
          {stats?.examStats.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No practice history yet. Start an exam to see your stats!
            </div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {stats?.examStats.map((exam) => (
                <Link key={exam.id} to='/exams/$examId' params={{ examId: exam.id }} className="block">
                  <Card className='h-full hover:bg-muted/50 transition-colors'>
                    <CardHeader className="pb-2">
                      <div className='flex items-center justify-between'>
                        <CardTitle className='text-base font-semibold truncate pr-4' title={exam.title}>
                          {exam.title}
                        </CardTitle>
                        <FileText className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {exam.answered} / {exam.totalQuestions || '?'}
                          </span>
                        </div>
                        {/* Simple Progress Bar */}
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${Math.min((exam.answered / (exam.totalQuestions || 1)) * 100, 100)}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between text-sm pt-2">
                          <span className="text-muted-foreground">Accuracy</span>
                          <span className={exam.accuracy >= 70 ? "text-green-600 font-medium" : "text-yellow-600 font-medium"}>
                            {exam.accuracy}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Main>
    </>
  )
}
