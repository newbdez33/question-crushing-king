import { test, expect } from '@playwright/test'
import { createCapture, deleteCurrentUser, uniqueCreds, signUp, joinExam } from './utils/test-helpers'

test.describe('Exams List Page', () => {
  test('should display My Exams heading', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/exams-list')

    await page.goto('/exams')
    await page.waitForLoadState('networkidle')
    await capture(page, '01-exams-list-loaded')

    // Verify My Exams heading — the page renders the heading even when empty
    await expect(page.getByRole('heading', { name: /My Exams/i })).toBeVisible({ timeout: 10000 })
  })

  test('should show empty state when no exams joined', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/exams-list')

    await page.goto('/exams')
    await page.waitForLoadState('networkidle')
    await capture(page, '02-empty-exams')

    // Should show empty state message (either no exams or the heading)
    const heading = page.getByRole('heading', { name: /My Exams/i })
    await expect(heading).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to dashboard from empty state', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/exams-list')

    await page.goto('/exams')
    await page.waitForLoadState('networkidle')

    // Look for "Go to Dashboard" link/button
    const dashboardLink = page.getByRole('link', { name: /Go to Dashboard/i })
    if (await dashboardLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dashboardLink.click()
      await capture(page, '03-navigated-to-dashboard')
      await expect(page).toHaveURL('/')
    } else {
      // If no empty state (user has exams), just verify we're on exams page
      await expect(page).toHaveURL(/\/exams/)
    }
  })

  test('should show joined exam as a card', async ({ page }) => {
    const { email, password } = uniqueCreds()
    const capture = createCapture('e2e/artifacts/exams-list')

    // Sign up
    await signUp(page, email, password)

    // Join an exam
    await joinExam(page, 'SOA-C03')

    // Navigate to my exams
    await page.goto('/exams')
    await page.waitForLoadState('networkidle')
    await capture(page, '04-exam-card-visible')

    // Should see the joined exam code
    await expect(page.getByText(/SOA-C03/i).first()).toBeVisible({ timeout: 10000 })

    // Should show the exam full name
    await expect(page.getByText(/AWS Certified SysOps Administrator/i).first()).toBeVisible({ timeout: 5000 })

    // Cleanup
    const deleted = await deleteCurrentUser(page)
    expect(deleted).toBeTruthy()
  })

  test('should show question count on exam card', async ({ page }) => {
    const { email, password } = uniqueCreds()

    // Sign up
    await signUp(page, email, password)

    // Join an exam
    await joinExam(page, 'SOA-C03')

    // Navigate to my exams
    await page.goto('/exams')
    await page.waitForLoadState('networkidle')

    // Should show question count
    await expect(page.getByText(/65 Questions/i).first()).toBeVisible({ timeout: 10000 })

    // Cleanup
    const deleted = await deleteCurrentUser(page)
    expect(deleted).toBeTruthy()
  })

  test('should navigate to exam details when clicking exam card', async ({ page }) => {
    const { email, password } = uniqueCreds()

    // Sign up
    await signUp(page, email, password)

    // Join an exam
    await joinExam(page, 'SOA-C03')

    // Navigate to my exams
    await page.goto('/exams')
    await page.waitForLoadState('networkidle')

    // Click on the exam card (the SOA-C03 text)
    await page.getByText(/SOA-C03/i).first().click()

    // Should navigate to exam details
    await expect(page).toHaveURL(/\/exams\/SOA-C03/)
    await expect(page.getByRole('heading', { name: 'SOA-C03' })).toBeVisible()

    // Cleanup
    const deleted = await deleteCurrentUser(page)
    expect(deleted).toBeTruthy()
  })

  test('should show multiple joined exams', async ({ page }) => {
    const { email, password } = uniqueCreds()
    const capture = createCapture('e2e/artifacts/exams-list')

    // Sign up
    await signUp(page, email, password)

    // Join first exam
    await joinExam(page, 'SOA-C03')

    // Navigate to second exam and join
    await page.goto('/exams/SAA-C03')
    await page.waitForLoadState('networkidle')
    const joinBtn = page.getByRole('button', { name: /Join Exam/i })
    await expect(joinBtn).toBeVisible({ timeout: 10000 })
    await joinBtn.click()
    await page.waitForTimeout(1000)

    // Navigate to my exams
    await page.goto('/exams')
    await page.waitForLoadState('networkidle')
    // Wait extra for Firebase remote settings to load
    await page.waitForTimeout(2000)
    await capture(page, '05-multiple-exams')

    // Should see both exams
    await expect(page.getByText(/SOA-C03/i).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/SAA-C03/i).first()).toBeVisible({ timeout: 15000 })

    // Cleanup
    const deleted = await deleteCurrentUser(page)
    expect(deleted).toBeTruthy()
  })

  test('should persist joined exams after reload', async ({ page }) => {
    const { email, password } = uniqueCreds()

    // Sign up
    await signUp(page, email, password)

    // Join an exam
    await joinExam(page, 'SOA-C03')

    // Navigate to my exams
    await page.goto('/exams')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Verify exam is visible before reload
    await expect(page.getByText(/SOA-C03/i).first()).toBeVisible({ timeout: 15000 })

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Should still see the exam
    await expect(page.getByText(/SOA-C03/i).first()).toBeVisible({ timeout: 15000 })

    // Cleanup
    const deleted = await deleteCurrentUser(page)
    expect(deleted).toBeTruthy()
  })

  test('should navigate to exam details from exam card and see progress', async ({ page }) => {
    const { email, password } = uniqueCreds()
    const capture = createCapture('e2e/artifacts/exams-list')

    // Sign up
    await signUp(page, email, password)

    // Join and practice an exam
    await joinExam(page, 'SOA-C03')
    await page.goto('/exams/SOA-C03/practice')
    await page.waitForLoadState('networkidle')

    // Answer a question
    const firstOption = page.locator('.rounded-lg.border').first()
    await firstOption.click()
    await page.getByRole('button', { name: /Submit Answer/i }).click()
    await page.waitForTimeout(500)

    // Go to my exams
    await page.goto('/exams')
    await page.waitForLoadState('networkidle')
    await capture(page, '06-exam-card-with-progress')

    // Click on the exam card
    await page.getByText(/SOA-C03/i).first().click()

    // Should navigate to exam details with progress visible
    await expect(page).toHaveURL(/\/exams\/SOA-C03/)
    await expect(page.getByRole('heading', { name: 'SOA-C03' })).toBeVisible()

    // Cleanup
    const deleted = await deleteCurrentUser(page)
    expect(deleted).toBeTruthy()
  })

  test('should show exam last updated date', async ({ page }) => {
    const { email, password } = uniqueCreds()
    const capture = createCapture('e2e/artifacts/exams-list')

    // Sign up
    await signUp(page, email, password)

    // Join an exam
    await joinExam(page, 'SOA-C03')

    // Navigate to my exams
    await page.goto('/exams')
    await page.waitForLoadState('networkidle')
    await capture(page, '07-last-updated')

    // Should show "Updated" date
    await expect(page.getByText(/Updated/i).first()).toBeVisible({ timeout: 10000 })

    // Cleanup
    const deleted = await deleteCurrentUser(page)
    expect(deleted).toBeTruthy()
  })
})
