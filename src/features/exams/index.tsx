import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { FileText } from 'lucide-react'
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
import { mockExams } from './data/mock-exams'

type DemoExam = {
  id: string
  title: string
  description: string
  questionCount?: number
}

export function ExamsList() {
  const demoExams = useMemo<DemoExam[]>(
    () => [
      {
        id: 'SOA-C03',
        title: 'SOA-C03 (Demo)',
        description: 'Demo from /public/data/SOA-C03.json',
      },
    ],
    []
  )

  const [demoCounts, setDemoCounts] = useState<Record<string, number>>({})

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
    return () => {
      cancelled = true
    }
  }, [demoExams])

  const allExams = useMemo(() => {
    return [
      ...demoExams.map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        questionCount: demoCounts[d.id] ?? d.questionCount,
        lastStudied: undefined as string | undefined,
      })),
      ...mockExams,
    ]
  }, [demoCounts, demoExams])

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

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {allExams?.map((exam) => (
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
                        Last studied: {new Date(exam.lastStudied).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </Main>
    </>
  )
}
