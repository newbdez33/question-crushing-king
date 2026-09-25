import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/context/language-provider'
import { Button } from '@/components/ui/button'
import { formatQuestionForCopy, type CopyableQuestion } from './copy-question-text'

export function CopyQuestionButton({ question }: { question: CopyableQuestion }) {
  const { t, language } = useLanguage()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        formatQuestionForCopy(question, language)
      )
      toast.success(t('practice.copied'))
    } catch {
      toast.error(t('practice.copyFailed'))
    }
  }

  return (
    <Button
      variant='ghost'
      size='sm'
      className='gap-2'
      onClick={handleCopy}
      aria-label={t('practice.copyQuestion')}
      title={t('practice.copyQuestion')}
    >
      <Copy className='h-4 w-4 self-start' />
    </Button>
  )
}
