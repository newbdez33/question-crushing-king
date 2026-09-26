import { Loader2 } from 'lucide-react'
import { useLanguage } from '@/context/language-provider'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Shown while an exam's question file is being fetched. Large banks are
 * several MB, so the first load can take a few seconds; the spinner and hint
 * make it clear the page is working rather than stuck.
 */
export function QuestionsLoading() {
  const { t } = useLanguage()

  return (
    <div className='space-y-4'>
      <div role='status' aria-live='polite' className='space-y-1 text-center'>
        <div className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
          <Loader2 className='h-4 w-4 animate-spin' />
          <span>{t('practice.loadingQuestions')}</span>
        </div>
        <p className='text-xs text-muted-foreground'>
          {t('practice.loadingQuestionsHint')}
        </p>
      </div>

      <Card aria-hidden='true' className='gap-3 py-3 sm:gap-6 sm:py-6'>
        <CardHeader className='px-2 sm:px-6'>
          <div className='flex gap-2'>
            <Skeleton className='h-5 w-28' />
            <Skeleton className='h-5 w-20' />
          </div>
          <Skeleton className='mt-2 h-4 w-full' />
          <Skeleton className='h-4 w-5/6' />
          <Skeleton className='h-4 w-2/3' />
        </CardHeader>
        <CardContent className='space-y-3 px-2 sm:space-y-4 sm:px-6'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-12 w-full rounded-lg' />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
