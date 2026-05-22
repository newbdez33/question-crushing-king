import { useLanguage } from '@/context/language-provider'
import { ContentSection } from '../components/content-section'
import { AiSettingsForm } from './ai-form'

export function SettingsAi() {
  const { t } = useLanguage()
  return (
    <ContentSection
      title={t('settings.ai.title')}
      desc={t('settings.ai.description')}
    >
      <AiSettingsForm />
    </ContentSection>
  )
}
