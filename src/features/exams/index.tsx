import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { ProgressService } from '@/services/progress-service'
import { FileText, PlusCircle } from 'lucide-react'
import { useAuth } from '@/context/auth-ctx'
import { useExams } from '@/hooks/use-exams'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

export function ExamsList() {
  const { user, guestId } = useAuth()
  const userId = user?.uid || guestId
  const { exams: allExams, loading } = useExams()

  const myExams = useMemo(() => {
    if (!userId) return []
    return allExams.filter((exam) => {
      const settings = ProgressService.getExamSettings(userId, exam.id)
      return settings.owned === true
    })
  }, [allExams, userId])

  return (
    <>
      <Header>
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>My Exams</h1>
        </div>

        {loading ? (
          <div className='py-10 text-center text-muted-foreground'>
            Loading exams...
          </div>
        ) : myExams.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20 text-center'>
            <div className='mb-4 rounded-full bg-muted p-6'>
              <FileText className='h-12 w-12 text-muted-foreground' />
            </div>
            <h3 className='text-xl font-semibold'>No exams yet</h3>
            <p className='mt-2 max-w-sm text-muted-foreground'>
              You haven't joined any exams yet. Go to the dashboard to explore
              and join exams.
            </p>
            <Button asChild className='mt-6'>
              <Link to='/'>
                <PlusCircle className='mr-2 h-4 w-4' />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        ) : (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {myExams.map((exam) => (
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
                          ? `${exam.questionCount} Questions`
                          : 'Questions: —'}
                      </span>
                      {exam.lastStudied && (
                        <span>
                          Last studied:{' '}
                          {new Date(exam.lastStudied).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Main>
    </>
  )
}
