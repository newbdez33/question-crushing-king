import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { ProgressService } from '@/services/progress-service'
import {
  Activity,
  BookOpen,
  CheckCircle,
  FileText,
  TrendingUp,
  Cloud,
} from 'lucide-react'
import { useAuth } from '@/context/auth-ctx'
import { useLanguage } from '@/context/language-provider'
import { useExams } from '@/hooks/use-exams'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { LanguageSwitch } from '@/components/language-switch'

export function Dashboard() {
  const { user, guestId } = useAuth()
  const { t } = useLanguage()
  const userId = user?.uid || guestId

  const { exams: allExams, loading: examsLoading } = useExams()

  const safeExams = useMemo(
    () => (Array.isArray(allExams) ? allExams : []),
    [allExams]
  )

  const allExamsMap = useMemo(() => {
    const map = new Map<string, { title: string; totalQuestions: number }>()

    safeExams.forEach((e) => {
      map.set(e.id, {
        title: e.title,
        totalQuestions: e.questionCount || 0,
      })
    })

    return map
  }, [safeExams])

  // Calculate stats
  const stats = useMemo(() => {
    if (!userId) return null

    const userProgress = ProgressService.getUserProgress(userId)
    const examIds = Object.keys(userProgress)

    let totalQuestionsAnswered = 0
    let totalCorrect = 0
    let totalExamsStarted = 0

    const examStats = examIds
      .map((examId) => {
        const examProgress = userProgress[examId]
        const questionIds = Object.keys(examProgress)

        const answered = questionIds.filter(
          (q) => examProgress[q].status
        ).length
        const correct = questionIds.filter(
          (q) => examProgress[q].status === 'correct'
        ).length

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
          lastActive: Math.max(
            ...questionIds.map((q) => examProgress[q].lastAnswered || 0),
            0
          ),
        }
      })
      .filter((stat) => stat.answered > 0)
      .sort((a, b) => b.lastActive - a.lastActive)

    const overallAccuracy =
      totalQuestionsAnswered > 0
        ? Math.round((totalCorrect / totalQuestionsAnswered) * 100)
        : 0

    return {
      totalQuestionsAnswered,
      totalCorrect,
      totalExamsStarted,
      overallAccuracy,
      examStats,
    }
  }, [userId, allExamsMap])

  return (
    <>
      <Header>
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <LanguageSwitch />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-6 flex items-center justify-between space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight'>{t('dashboard.title')}</h1>
        </div>

        {!user && (
          <Alert className='mb-6'>
            <Cloud />
            <AlertTitle>{t('dashboard.syncPromptTitle')}</AlertTitle>
            <AlertDescription>
              <div className='flex flex-wrap items-center gap-3'>
                <span>
                  {t('dashboard.syncPromptDesc')}
                </span>
                <Button asChild size='sm'>
                  <Link from='/' to='/sign-in' search={{ redirect: '/' }}>
                    {t('nav.signIn')}
                  </Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className='mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {t('dashboard.totalQuestionsAnswered')}
              </CardTitle>
              <BookOpen className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {stats?.totalQuestionsAnswered || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {t('dashboard.correctAnswers')}
              </CardTitle>
              <CheckCircle className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {stats?.totalCorrect || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {t('dashboard.overallAccuracy')}
              </CardTitle>
              <TrendingUp className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {stats?.overallAccuracy || 0}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {t('dashboard.examsStarted')}
              </CardTitle>
              <Activity className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {stats?.totalExamsStarted || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='space-y-4'>
          <h2 className='text-xl font-semibold'>{t('dashboard.recentActivity')}</h2>
          {stats?.examStats.length === 0 ? (
            <div className='py-10 text-center text-muted-foreground'>
              {t('dashboard.noHistory')}
            </div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {stats?.examStats.map((exam) => (
                <Link
                  key={exam.id}
                  to='/exams/$examId'
                  params={{ examId: exam.id }}
                  className='block'
                >
                  <Card className='h-full transition-colors hover:bg-muted/50'>
                    <CardHeader className='pb-2'>
                      <div className='flex items-center justify-between'>
                        <CardTitle
                          className='truncate pr-4 text-base font-semibold'
                          title={exam.title}
                        >
                          {exam.title}
                        </CardTitle>
                        <FileText className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-2'>
                        <div className='flex justify-between text-sm'>
                          <span className='text-muted-foreground'>
                            {t('common.progress')}
                          </span>
                          <span className='font-medium'>
                            {exam.answered} / {exam.totalQuestions || '?'}
                          </span>
                        </div>
                        {/* Simple Progress Bar */}
                        <div className='h-2 w-full overflow-hidden rounded-full bg-secondary'>
                          <div
                            className='h-full bg-primary'
                            style={{
                              width: `${Math.min((exam.answered / (exam.totalQuestions || 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>

                        <div className='flex justify-between pt-2 text-sm'>
                          <span className='text-muted-foreground'>
                            {t('common.accuracy')}
                          </span>
                          <span
                            className={
                              exam.accuracy >= 70
                                ? 'font-medium text-green-600'
                                : 'font-medium text-yellow-600'
                            }
                          >
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

        <div className='mt-8 space-y-4'>
          <h2 className='text-xl font-semibold'>{t('dashboard.allExams')}</h2>
          {examsLoading ? (
            <div className='py-10 text-center text-muted-foreground'>
              {t('dashboard.loadingExams')}
            </div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {safeExams.map((exam) => (
                <Link
                  key={exam.id}
                  to='/exams/$examId'
                  params={{ examId: exam.id }}
                  className='block'
                >
                  <Card className='h-full transition-colors hover:bg-muted/50'>
                    <CardHeader>
                      <div className='flex items-center justify-between'>
                        <CardTitle className='text-lg'>{exam.title}</CardTitle>
                        <FileText className='h-5 w-5 text-muted-foreground' />
                      </div>
                      <CardDescription>{exam.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='flex justify-between text-sm text-muted-foreground'>
                        <span>
                          {typeof exam.questionCount === 'number'
                            ? `${exam.questionCount} ${t('common.questions')}`
                            : `${t('common.questions')}: —`}
                        </span>
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
