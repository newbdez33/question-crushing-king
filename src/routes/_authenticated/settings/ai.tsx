import { createFileRoute } from '@tanstack/react-router'
import { SettingsAi } from '@/features/settings/ai'

export const Route = createFileRoute('/_authenticated/settings/ai')({
  component: SettingsAi,
})
