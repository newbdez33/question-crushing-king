import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage, type Language } from '@/context/language-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FlagEN, FlagCN, FlagHK, FlagJP } from '@/components/icons/flags'
import { type ComponentType, type SVGProps } from 'react'

interface LanguageOption {
  value: Language
  label: string
  nativeLabel: string
  Flag: ComponentType<SVGProps<SVGSVGElement>>
}

const languages: LanguageOption[] = [
  { value: 'en', label: 'English', nativeLabel: 'English', Flag: FlagEN },
  { value: 'zh', label: 'Simplified Chinese', nativeLabel: '简体中文', Flag: FlagCN },
  { value: 'zh-TW', label: 'Traditional Chinese', nativeLabel: '繁體中文', Flag: FlagHK },
  { value: 'ja', label: 'Japanese', nativeLabel: '日本語', Flag: FlagJP },
]

export function LanguageSwitch() {
  const { language, setLanguage, t } = useLanguage()

  const currentLanguage = languages.find((lang) => lang.value === language) ?? languages[0]
  const CurrentFlag = currentLanguage.Flag

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='scale-95 rounded-full'>
          <CurrentFlag className='size-5 rounded-sm' />
          <span className='sr-only'>{t('language.select')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => setLanguage(lang.value)}
            className='gap-2'
          >
            <lang.Flag className='size-4 rounded-sm' />
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
