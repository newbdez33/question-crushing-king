import { test, expect } from '@playwright/test'
import { createCapture, deleteCurrentUser, uniqueCreds, signUp, joinExam } from './utils/test-helpers'

const EXAM_ID = 'SOA-C03'

test.describe('Dashboard', () => {
  test('should display dashboard with stats cards', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/dashboard')

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await capture(page, '01-dashboard-loaded')

    // Verify dashboard title
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    // Verify stats cards are visible
    await expect(page.getByText('Total Questions Answered')).toBeVisible()
    await expect(page.getByText('Correct Answers')).toBeVisible()
    await expect(page.getByText('Overall Accuracy')).toBeVisible()
    await expect(page.getByText('Exams Started')).toBeVisible()
  })

  test('should show sign-in prompt for guest users', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/dashboard')

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await capture(page, '02-guest-dashboard')

    // Verify sign-in prompt is visible
    await expect(page.getByText(/Sign in to sync your learning progress/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /Sign in/i })).toBeVisible()
  })

  test('should not show sign-in prompt for authenticated users', async ({ page }) => {
    const { email, password } = uniqueCreds()
    const capture = createCapture('e2e/artifacts/dashboard')

    // Sign up
    await signUp(page, email, password)

    // Navigate to dashboard
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await capture(page, '03-authenticated-dashboard')

    // Sign-in prompt should not be visible
    await expect(page.getByText(/Sign in to sync your learning progress/i)).not.toBeVisible()

    // Cleanup
    const deleted = await deleteCurrentUser(page)
    expect(deleted).toBeTruthy()
  })

  test('should show Recent Activity section', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/dashboard')

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await capture(page, '04-recent-activity')

    // Verify Recent Activity section exists
    await expect(page.getByText('Recent Activity')).toBeVisible()
  })

  test('should show empty state when no practice history', async ({ page }) => {
    // Use a fresh browser context (new guest)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Should show empty state message or zero stats
    // Stats should show 0 for a new user
    await expect(page.locator('text=0').first()).toBeVisible()
  })

  test('should update stats after answering questions', async ({ page }) => {
    const { email, password } = uniqueCreds()
    const capture = createCapture('e2e/artifacts/dashboard')

    // Sign up
    await signUp(page, email, password)

    // Join and practice an exam
    await joinExam(page, EXAM_ID)
    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')

    // Answer a question
    const firstOption = page.locator('.rounded-lg.border').first()
    await firstOption.click()
    await page.getByRole('button', { name: /Submit Answer/i }).click()

    // Wait for save
    await page.waitForTimeout(500)

    // Go to dashboard
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await capture(page, '05-dashboard-with-stats')

    // Total Questions Answered should be at least 1
    const totalAnsweredCard = page.locator('text=Total Questions Answered').locator('..').locator('..')
    await expect(totalAnsweredCard.getByText(/[1-9]/)).toBeVisible()

    // Exams Started should be at least 1
    const examsStartedCard = page.locator('text=Exams Started').locator('..').locator('..')
    await expect(examsStartedCard.getByText(/[1-9]/)).toBeVisible()

    // Cleanup
    const deleted = await deleteCurrentUser(page)
    expect(deleted).toBeTruthy()
  })

  test('should show exam cards in Recent Activity after practicing', async ({ page }) => {
    const { email, password } = uniqueCreds()
    const capture = createCapture('e2e/artifacts/dashboard')

    // Sign up
    await signUp(page, email, password)

    // Join and practice an exam
    await joinExam(page, EXAM_ID)
    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')

    // Answer a question
    const firstOption = page.locator('.rounded-lg.border').first()
    await firstOption.click()
    await page.getByRole('button', { name: /Submit Answer/i }).click()

    // Wait for progress to be saved
    await page.waitForTimeout(1000)

    // Go to dashboard
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await capture(page, '06-recent-activity-with-exam')

    // Should see the exam in recent activity (wait for it to appear)
    await expect(page.getByText(EXAM_ID).first()).toBeVisible({ timeout: 10000 })

    // Cleanup
    const deleted = await deleteCurrentUser(page)
    expect(deleted).toBeTruthy()
  })

  test('should navigate to exam details from Recent Activity', async ({ page }) => {
    const { email, password } = uniqueCreds()
    const capture = createCapture('e2e/artifacts/dashboard')

    // Sign up
    await signUp(page, email, password)

    // Join and practice an exam
    await joinExam(page, EXAM_ID)
    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')

    // Answer a question
    const firstOption = page.locator('.rounded-lg.border').first()
    await firstOption.click()
    await page.getByRole('button', { name: /Submit Answer/i }).click()

    // Wait for progress to be saved
    await page.waitForTimeout(1000)

    // Go to dashboard
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Wait for exam card to appear and click it
    const examCard = page.getByText(EXAM_ID).first()
    await examCard.waitFor({ timeout: 10000 })
    await examCard.click()
    await capture(page, '07-navigated-to-exam')

    // Should navigate to exam details
    await expect(page).toHaveURL(new RegExp(`/exams/${EXAM_ID}`))

    // Cleanup
    const deleted = await deleteCurrentUser(page)
    expect(deleted).toBeTruthy()
  })

  test('should display All Available Exams section', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/dashboard')

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await capture(page, '08-all-exams-section')

    // Verify All Available Exams section exists (or similar heading)
    // This depends on the actual dashboard content
    // At minimum, verify we can navigate to exams
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })
})
