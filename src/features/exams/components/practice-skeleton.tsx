import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function PracticeSkeleton() {
  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <Header fixed>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' disabled>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <Skeleton className='h-6 w-48' />
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <Skeleton className='h-9 w-9 rounded-full' />
        </div>
      </Header>

      <div className='flex flex-1 pt-0 items-start justify-center gap-4'>
        <div className='w-full max-w-3xl'>
          <Main className='w-full pb-24 lg:pr-0'>
            <Card>
              <CardHeader>
                <div className='flex items-start justify-between gap-4'>
                  <div className='space-y-2'>
                    <div className='flex gap-2'>
                      <Skeleton className='h-5 w-24' />
                      <Skeleton className='h-5 w-16' />
                    </div>
                    <Skeleton className='h-6 w-full max-w-md' />
                    <Skeleton className='h-4 w-full max-w-sm' />
                  </div>
                  <Skeleton className='h-8 w-8' />
                </div>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Options Skeleton */}
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className='flex items-center space-x-3 rounded-lg border p-4'
                  >
                    <Skeleton className='h-4 w-4 rounded-full' />
                    <Skeleton className='h-4 flex-1' />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Navigation Skeleton */}
            <div className='fixed bottom-0 left-0 right-0 border-t bg-background p-4 lg:sticky lg:bottom-auto lg:mt-6 lg:border-none lg:bg-transparent lg:p-0'>
              <div className='mx-auto flex max-w-3xl items-center justify-between gap-4'>
                <Skeleton className='h-10 w-24' />
                <Skeleton className='h-10 w-32' />
                <Skeleton className='h-10 w-24' />
              </div>
            </div>
          </Main>
        </div>

        {/* Sidebar Skeleton */}
        <Card className='hidden w-80 flex-col lg:flex'>
          <CardHeader className='pb-4'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-5 w-24' />
              <Skeleton className='h-8 w-24' />
            </div>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-4'>
              <div className='grid grid-cols-5 gap-2'>
                {Array.from({ length: 20 }).map((_, i) => (
                  <Skeleton key={i} className='h-8 w-full' />
                ))}
              </div>
              <div className='flex justify-between'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-4 w-20' />
              </div>
              <Skeleton className='h-4 w-24' />
            </div>
            <div className='h-px bg-border' />
            <div className='space-y-6'>
              <Skeleton className='h-5 w-16' />
              <div className='space-y-4'>
                {[1, 2, 3].map((i) => (
                  <div key={i} className='flex items-center justify-between'>
                    <Skeleton className='h-4 w-32' />
                    <Skeleton className='h-5 w-10' />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
