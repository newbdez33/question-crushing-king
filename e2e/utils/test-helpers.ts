import { test, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Generate unique credentials for test users
 * Pattern: e2e.{timestamp}.{random}@example.com
 */
export function uniqueCreds() {
  const ts = Date.now()
  const rand = Math.random().toString(36).slice(2, 8)
  const email = `e2e.${ts}.${rand}@example.com`
  const password = `P@ssw0rd_${rand}_${ts}`
  return { email, password }
}

/**
 * Create a screenshot capture helper for a test
 */
export function createCapture(artifactDir: string) {
  fs.mkdirSync(artifactDir, { recursive: true })

  return async (page: Page, name: string) => {
    const project = test.info().project.name
    const file = path.join(artifactDir, `${project}-${name}.png`)
    await page.screenshot({ path: file, fullPage: true })
    await test.info().attach(name, { path: file, contentType: 'image/png' })
  }
}

/**
 * Delete the current user via window function exposed in the app
 */
export async function deleteCurrentUser(page: Page): Promise<boolean> {
  const deleted = await page.evaluate(async () => {
    const fn = (window as unknown as { __deleteCurrentUser?: () => Promise<void> })
      .__deleteCurrentUser
    if (typeof fn === 'function') {
      await fn()
      return true
    }
    return false
  })
  return deleted
}

/**
 * Sign up a new user with email/password
 */
export async function signUp(page: Page, email: string, password: string) {
  await page.goto('/sign-up')
  await page.getByRole('textbox', { name: 'Email' }).fill(email)
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password)
  await page.getByRole('textbox', { name: 'Confirm Password' }).fill(password)
  await page.getByRole('button', { name: /sign up with email/i }).click()
  // Wait for the Dashboard heading to appear (indicates successful signup)
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ timeout: 30000 })
  await page.waitForLoadState('networkidle')
}

/**
 * Sign in an existing user with email/password
 */
export async function signIn(page: Page, email: string, password: string) {
  await page.goto('/sign-in')
  await page.getByRole('textbox', { name: 'Email' }).fill(email)
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password)
  await page.getByRole('button', { name: /sign in with email/i }).click()
  // Wait for the Dashboard heading to appear (indicates successful signin)
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ timeout: 30000 })
  await page.waitForLoadState('networkidle')
}

/**
 * Join an exam by navigating to its details page and clicking Join
 */
export async function joinExam(page: Page, examId: string) {
  await page.goto(`/exams/${examId}`)
  await page.waitForLoadState('networkidle')
  const joinBtn = page.getByRole('button', { name: /Join My Exams/i })
  await joinBtn.click()
  await joinBtn.waitFor({ state: 'hidden' })
}
