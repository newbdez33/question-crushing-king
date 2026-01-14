type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='container grid h-svh max-w-none items-center justify-center'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:w-[480px] sm:p-8'>
        <div className='mb-4 flex items-center justify-center gap-2'>
          <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-black text-white'>
            <svg width='32' height='32' viewBox='0 0 32 32' className='size-8'>
              <circle cx='16' cy='16' r='16' fill='black' />
              <text
                x='50%'
                y='50%'
                dominantBaseline='middle'
                textAnchor='middle'
                fill='white'
                fontSize='20'
                fontWeight='bold'
                dy='.1em'
              >
                王
              </text>
            </svg>
          </div>
          <div className='grid text-start text-sm leading-tight'>
            <span className='truncate text-lg font-bold'>刷题大王</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
