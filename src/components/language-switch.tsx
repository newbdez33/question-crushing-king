import { Check, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage, type Language } from '@/context/language-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const languages: { value: Language; label: string; nativeLabel: string }[] = [
  { value: 'en', label: 'English', nativeLabel: 'English' },
  { value: 'zh', label: 'Chinese', nativeLabel: '中文' },
  { value: 'ja', label: 'Japanese', nativeLabel: '日本語' },
]

export function LanguageSwitch() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='scale-95 rounded-full'>
          <Globe className='size-[1.2rem]' />
          <span className='sr-only'>{t('language.select')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => setLanguage(lang.value)}
          >
            {lang.nativeLabel}
            <Check
              size={14}
              className={cn('ms-auto', language !== lang.value && 'hidden')}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
