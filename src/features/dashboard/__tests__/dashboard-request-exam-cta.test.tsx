import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { AuthContext } from '@/context/auth-ctx'
import { Dashboard } from '..'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}))
vi.mock('@/components/layout/header', () => ({
  Header: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/layout/main', () => ({
  Main: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}))
vi.mock('@/components/profile-dropdown', () => ({ ProfileDropdown: () => null }))
vi.mock('@/components/theme-switch', () => ({ ThemeSwitch: () => null }))
vi.mock('@/components/language-switch', () => ({ LanguageSwitch: () => null }))
vi.mock('@/components/search', () => ({ Search: () => null }))
vi.mock('@/services/progress-service', () => ({
  ProgressService: {
    getUserProgress: () => ({}),
  },
}))
vi.mock('@/hooks/use-exams', () => ({
  useExams: () => ({
    exams: [{ id: 'SOA-C03', title: 'SOA-C03', description: 'd', questionCount: 65 }],
    loading: false,
  }),
}))

const ISSUE_URL = 'https://github.com/newbdez33/question-crushing-king/issues/new'

function renderDashboard(user: { uid: string; email: string | null } | null) {
  return render(
    <AuthContext.Provider
      value={{
        user: user as unknown as import('firebase/auth').User | null,
        guestId: 'guest-1',
        loading: false,
        logout: async () => {},
      }}
    >
      <Dashboard />
    </AuthContext.Provider>
  )
}

describe('Dashboard request-exam entry points', () => {
  afterEach(() => cleanup())

  it('shows the call to action and the grid tile, both opening the GitHub issue form in a new tab', () => {
    renderDashboard(null)
    expect(screen.getByText("Can't find your exam? Request it!")).toBeInTheDocument()
    expect(screen.getByText("Missing one? Upload the files and we'll add it.")).toBeInTheDocument()

    const links = screen.getAllByRole('link', { name: /Request an Exam/ })
    expect(links).toHaveLength(2)
    for (const link of links) {
      const url = new URL(link.getAttribute('href') ?? '')
      expect(`${url.origin}${url.pathname}`).toBe(ISSUE_URL)
      expect(url.searchParams.get('template')).toBe('exam-request.yml')
      expect(url.searchParams.has('contact')).toBe(false)
      expect(link).toHaveAttribute('target', '_blank')
    }
  })

  it('prefills the contact field with the signed-in email', () => {
    renderDashboard({ uid: 'u1', email: 'me@example.com' })
    const [link] = screen.getAllByRole('link', { name: /Request an Exam/ })
    const url = new URL(link.getAttribute('href') ?? '')
    expect(url.searchParams.get('contact')).toBe('me@example.com')
  })
})
