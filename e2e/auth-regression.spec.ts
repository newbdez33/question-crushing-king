import { test, expect } from '@playwright/test'

function uniqueCreds() {
  const ts = Date.now()
  const rand = Math.random().toString(36).slice(2, 8)
  const email = `e2e.${ts}.${rand}@example.com`
  const password = `P@ssw0rd_${rand}_${ts}`
  return { email, password }
}

 

test('@regression user sign-up then sign-in success and cleanup', async ({
  page,
  browser,
}) => {
  const { email, password } = uniqueCreds()
  const capture = async (p: typeof page, name: string) => {
    const project = test.info().project.name
    const dir = 'test-results/steps'
    const file = `${dir}/${project}-${name}.png`
    await p.screenshot({ path: file, fullPage: true })
    await test.info().attach(name, { path: file, contentType: 'image/png' })
  }

  await page.goto('/sign-up')
  await capture(page, 'signup-loaded')
  await page.getByRole('textbox', { name: 'Email' }).fill(email)
  await capture(page, 'signup-filled-email')
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password)
  await capture(page, 'signup-filled-password')
  await page.getByRole('textbox', { name: 'Confirm Password' }).fill(password)
  await capture(page, 'signup-filled-confirm')
  await page.getByRole('button', { name: /sign up with email/i }).click()
  await expect(page).toHaveTitle(/刷题大王/i)
  await capture(page, 'signup-done')

  // New context for clean login state
  const ctx = await browser.newContext()
  const page2 = await ctx.newPage()

  // Sign in via UI form, then validate UI state switches from Guest → User
  await page2.goto('/sign-in')
  await capture(page2, 'signin-loaded')
  await page2.getByRole('textbox', { name: 'Email' }).fill(email)
  await capture(page2, 'signin-filled-email')
  await page2.getByRole('textbox', { name: 'Password', exact: true }).fill(password)
  await capture(page2, 'signin-filled-password')
  await page2.getByRole('button', { name: /sign in with email/i }).click()
  await expect(page2).toHaveTitle(/刷题大王/i)
  await capture(page2, 'after-login')
  await expect(page2.getByText('Guest User')).not.toBeVisible()
  await expect(page2.getByText('User')).toBeVisible()
  await capture(page2, 'ui-user-visible')
  const del = await page2.evaluate(async () => {
    const fn = (window as unknown as { __deleteCurrentUser?: () => Promise<void> })
      .__deleteCurrentUser
    if (typeof fn === 'function') {
      await fn()
      return true
    }
    return false
  })
  expect(del).toBeTruthy()
  await capture(page2, 'user-deleted')
  await expect(page2.getByText('Guest User')).toBeVisible()

  await ctx.close()
})
