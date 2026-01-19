import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExamDetails } from '../exam-details'
import { AuthContext } from '@/context/auth-ctx'

vi.mock('@tanstack/react-router', () => {
  return {
    Link: (props: any) => <a {...props} />,
    useNavigate: () => () => {},
  }
})

vi.mock('@/components/layout/header', () => {
  return { Header: (props: any) => <div>{props.children}</div> }
})
vi.mock('@/components/layout/main', () => {
  return { Main: (props: any) => <main>{props.children}</main> }
})
vi.mock('@/components/profile-dropdown', () => {
  return { ProfileDropdown: () => <div /> }
})
vi.mock('@/components/theme-switch', () => {
  return { ThemeSwitch: () => <div /> }
})

vi.mock('@/services/firebase-progress', () => {
  return {
    saveExamSettings: vi.fn(async () => {}),
    subscribeExamProgress: vi.fn(() => () => {}),
  }
})

vi.mock('@/services/progress-service', () => {
  return {
    ProgressService: {
      getExamProgress: vi.fn(() => ({})),
      getExamSettings: vi.fn(() => ({})),
      saveExamSettings: vi.fn(() => {}),
    },
  }
})

describe('ExamDetails join sync', () => {
  it('writes owned to local and cloud when logged in', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ questions: Array.from({ length: 5 }, () => ({ id: 'q' })) }),
    } as unknown as Response)

    const Remote = await import('@/services/firebase-progress')
    const Local = await import('@/services/progress-service')

    render(
      <AuthContext.Provider
        value={{
          user: { uid: 'u1' } as any,
          guestId: 'g1',
          loading: false,
          logout: vi.fn(),
        }}
      >
        <ExamDetails examId="SOA-C03" />
      </AuthContext.Provider>
    )

    await waitFor(() =>
      expect(screen.queryByText(/Loading exam/i)).toBeNull()
    )

    const btn = await screen.findByRole('button', { name: /Join My Exams/i })
    await user.click(btn)

    expect(Local.ProgressService.saveExamSettings).toHaveBeenCalledWith(
      'u1',
      'SOA-C03',
      { owned: true }
    )
    expect(Remote.saveExamSettings).toHaveBeenCalledWith(
      'u1',
      'SOA-C03',
      { owned: true }
    )
  })
})
