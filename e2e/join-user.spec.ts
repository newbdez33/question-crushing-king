import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

function uniqueCreds() {
  const ts = Date.now()
  const rand = Math.random().toString(36).slice(2, 8)
  const email = `e2e.${ts}.${rand}@example.com`
  const password = `P@ssw0rd_${rand}_${ts}`
  return { email, password }
}

test.describe('User Join Exam with screenshots', () => {
  test('sign up → join → my exams → reload', async ({ page }) => {
    const { email, password } = uniqueCreds()
    const dir = path.join('e2e', 'artifacts', 'join-user')
    fs.mkdirSync(dir, { recursive: true })
    const capture = async (p: typeof page, name: string) => {
      const file = path.join(dir, `${name}.png`)
      await p.screenshot({ path: file, fullPage: true })
      await test.info().attach(name, { path: file, contentType: 'image/png' })
    }

    await page.goto('/sign-up')
    await capture(page, '01-signup-loaded')
    await page.getByRole('textbox', { name: 'Email' }).fill(email)
    await capture(page, '02-signup-filled-email')
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password)
    await capture(page, '03-signup-filled-password')
    await page.getByRole('textbox', { name: 'Confirm Password' }).fill(password)
    await capture(page, '04-signup-filled-confirm')
    await page.getByRole('button', { name: /sign up with email/i }).click()
    await expect(page).toHaveTitle(/刷题大王/i)
    await capture(page, '05-signup-done')

    await page.goto('/exams/SOA-C03')
    await page.waitForLoadState('networkidle')
    await capture(page, '06-details-before')
    const joinBtn = page.getByRole('button', { name: /Join My Exams/i })
    await expect(joinBtn).toBeVisible()
    await joinBtn.click()
    await expect(joinBtn).toBeHidden()
    await capture(page, '07-details-after')

    await page.goto('/exams')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /My Exams/i })).toBeVisible()
    await expect(page.getByText(/SOA-C03 \(Demo\)/i)).toBeVisible()
    await capture(page, '08-my-exams')

    await page.reload()
    await expect(page.getByRole('heading', { name: /My Exams/i })).toBeVisible()
    await expect(page.getByText(/SOA-C03 \(Demo\)/i)).toBeVisible()
    await capture(page, '09-my-exams-after-reload')

    const deleted = await page.evaluate(async () => {
      const fn = (window as unknown as { __deleteCurrentUser?: () => Promise<void> })
        .__deleteCurrentUser
      if (typeof fn === 'function') {
        await fn()
        return true
      }
      return false
    })
    expect(deleted).toBeTruthy()
  })
})
