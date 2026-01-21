import { test, expect } from '@playwright/test'
import { createCapture, deleteCurrentUser, uniqueCreds, signUp } from './utils/test-helpers'

const EXAM_ID = 'SOA-C03'

test.describe('Practice Mode', () => {
  test('should display question with options and submit button', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/practice-mode')

    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')
    await capture(page, '01-practice-loaded')

    // Verify question badge is visible
    await expect(page.getByText(/Question \d+ of \d+/i)).toBeVisible()

    // Verify question type badge (Single or Multiple)
    await expect(page.getByText('Single').or(page.getByText('Multiple')).first()).toBeVisible()

    // Verify options are visible (A, B, C, D circles)
    await expect(page.locator('.rounded-full').filter({ hasText: 'A' }).first()).toBeVisible()

    // Verify Submit button exists and is disabled initially
    const submitBtn = page.getByRole('button', { name: /Submit Answer/i })
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toBeDisabled()
  })

  test('should enable submit after selecting an answer', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/practice-mode')

    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')

    // Select first option (click on the option container)
    const firstOption = page.locator('.rounded-lg.border').first()
    await firstOption.click()
    await capture(page, '02-option-selected')

    // Submit button should now be enabled
    const submitBtn = page.getByRole('button', { name: /Submit Answer/i })
    await expect(submitBtn).toBeEnabled()
  })

  test('should show feedback after submitting answer', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/practice-mode')

    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')

    // Select first option
    const firstOption = page.locator('.rounded-lg.border').first()
    await firstOption.click()

    // Submit answer
    await page.getByRole('button', { name: /Submit Answer/i }).click()
    await capture(page, '03-answer-submitted')

    // Verify feedback is shown (either Correct or Incorrect)
    await expect(
      page.getByText(/Correct Answer!|Incorrect Answer/i).first()
    ).toBeVisible()
  })

  test('should navigate between questions', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/practice-mode')

    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')

    // Verify we're on question 1
    await expect(page.getByText(/Question 1 of/i)).toBeVisible()

    // Previous button should be disabled on first question
    const prevBtn = page.locator('button[title="Previous Question"]')
    await expect(prevBtn).toBeDisabled()

    // Click next button
    const nextBtn = page.locator('button[title="Next Question"]')
    await nextBtn.click()
    await capture(page, '04-navigated-to-q2')

    // Verify we're on question 2
    await expect(page.getByText(/Question 2 of/i)).toBeVisible()

    // Previous button should now be enabled
    await expect(prevBtn).toBeEnabled()

    // Navigate back
    await prevBtn.click()
    await expect(page.getByText(/Question 1 of/i)).toBeVisible()
  })

  test('should toggle bookmark on question', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/practice-mode')

    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')

    // Find bookmark button in the card header (absolute positioned)
    const bookmarkBtn = page.locator('button.absolute').filter({ has: page.locator('svg') }).first()
    await capture(page, '05-before-bookmark')

    // Click to bookmark
    await bookmarkBtn.click()
    await capture(page, '06-after-bookmark')

    // Verify bookmark is active (has yellow color class or fill-current)
    await expect(bookmarkBtn).toHaveClass(/text-yellow-500|fill-current/)

    // Click again to remove bookmark
    await bookmarkBtn.click()
    await page.waitForTimeout(300)

    // Verify bookmark styling changed
    await capture(page, '06b-after-unbookmark')
  })

  test('should persist progress after page reload for authenticated user', async ({ page }) => {
    const { email, password } = uniqueCreds()
    const capture = createCapture('e2e/artifacts/practice-mode')

    // Sign up first
    await signUp(page, email, password)

    // Navigate to practice mode
    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')

    // Answer a question
    const firstOption = page.locator('.rounded-lg.border').first()
    await firstOption.click()
    await page.getByRole('button', { name: /Submit Answer/i }).click()
    await capture(page, '07-answered-before-reload')

    // Wait for answer to be saved
    await page.waitForTimeout(500)

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')
    await capture(page, '08-after-reload')

    // Verify the answer feedback is still visible (question was already answered)
    await expect(
      page.getByText(/Correct Answer!|Incorrect Answer/i).first()
    ).toBeVisible()

    // Cleanup
    const deleted = await deleteCurrentUser(page)
    expect(deleted).toBeTruthy()
  })

  test('should show correct/incorrect styling on options after submit', async ({ page }) => {
    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')

    // Select first option
    const firstOption = page.locator('.rounded-lg.border').first()
    await firstOption.click()

    // Submit
    await page.getByRole('button', { name: /Submit Answer/i }).click()

    // After submission, at least one option should have green styling (correct answer)
    await expect(
      page.locator('.border-green-500, .bg-green-50, .bg-green-950\\/20').first()
    ).toBeVisible()
  })

  test('should update URL with question number', async ({ page }) => {
    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')

    // URL should contain q=1 for first question
    await expect(page).toHaveURL(/q=1/)

    // Navigate to next question
    const nextBtn = page.locator('button[title="Next Question"]')
    await nextBtn.click()

    // URL should now contain q=2
    await expect(page).toHaveURL(/q=2/)
  })

  test('should load specific question from URL parameter', async ({ page }) => {
    // Navigate directly to question 3
    await page.goto(`/exams/${EXAM_ID}/practice?q=3`)
    await page.waitForLoadState('networkidle')

    // Verify we're on question 3
    await expect(page.getByText(/Question 3 of/i)).toBeVisible()
  })
})
