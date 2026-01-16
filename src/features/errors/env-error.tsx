import { cn } from '@/lib/utils'
import { useEffect } from 'react'

type EnvErrorProps = React.HTMLAttributes<HTMLDivElement> & {
  minimal?: boolean
}

export function EnvError({ className, minimal = false }: EnvErrorProps) {
  useEffect(() => {
    document.title = 'Configuration Error'
  }, [])

  return (
    <div className={cn('h-svh w-full', className)}>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        {!minimal && (
          <h1 className='text-[7rem] leading-tight font-bold'>503</h1>
        )}
        <span className='font-medium'>Configuration Missing</span>
        <p className='text-center text-muted-foreground'>
          The application environment variables are missing. <br />
          Please check your <code className='font-mono font-bold'>.env</code>{' '}
          file.
        </p>
      </div>
    </div>
  )
}
