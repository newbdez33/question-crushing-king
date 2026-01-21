import { test, expect } from '@playwright/test'
import { createCapture } from './utils/test-helpers'

const EXAM_ID = 'SOA-C03'

test.describe('Exam Mode', () => {
  test('should open exam mode dialog from exam details', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/exam-mode')

    await page.goto(`/exams/${EXAM_ID}`)
    await page.waitForLoadState('networkidle')
    await capture(page, '01-exam-details')

    // Click on Exam Mode card to open dialog
    await page.getByText('Exam Mode').click()
    await capture(page, '02-exam-dialog-open')

    // Verify dialog is open
    await expect(page.getByText('Start Exam Mode')).toBeVisible()

    // Verify dialog has question count input
    await expect(page.getByLabel('Question count')).toBeVisible()

    // Verify dialog has seed input
    await expect(page.getByLabel('Seed')).toBeVisible()

    // Verify Start and Cancel buttons are visible
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
  })

  test('should start exam with custom question count', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/exam-mode')

    await page.goto(`/exams/${EXAM_ID}`)
    await page.waitForLoadState('networkidle')

    // Open exam mode dialog
    await page.getByText('Exam Mode').click()

    // Set question count to 5
    await page.getByLabel('Question count').fill('5')
    await capture(page, '03-exam-count-set')

    // Click Start
    await page.getByRole('button', { name: 'Start' }).click()
    await capture(page, '04-exam-started')

    // Verify URL contains count parameter
    await expect(page).toHaveURL(/count=5/)

    // Verify question counter shows "X of 5"
    await expect(page.getByText(/Question \d+ of 5/i)).toBeVisible()
  })

  test('should start exam with seed parameter', async ({ page }) => {
    const seed = 'test-seed-123'
    const capture = createCapture('e2e/artifacts/exam-mode')

    await page.goto(`/exams/${EXAM_ID}`)
    await page.waitForLoadState('networkidle')

    // Open exam mode dialog
    await page.getByText('Exam Mode').click()

    // Set question count
    await page.getByLabel('Question count').fill('3')

    // Set seed
    await page.getByLabel('Seed').fill(seed)
    await capture(page, '05-seed-set')

    // Click Start
    await page.getByRole('button', { name: 'Start' }).click()

    // Verify URL contains seed parameter
    await expect(page).toHaveURL(new RegExp(`seed=${seed}`))
  })

  test('should produce same questions with same seed', async ({ page }) => {
    const seed = 'reproducible-seed'
    const count = 3

    // First exam session
    await page.goto(`/exams/${EXAM_ID}/exam?count=${count}&seed=${seed}`)
    await page.waitForLoadState('networkidle')

    // Get the first question text
    const firstQuestionText = await page.locator('.font-medium').first().textContent()

    // Reload with same parameters
    await page.goto(`/exams/${EXAM_ID}/exam?count=${count}&seed=${seed}`)
    await page.waitForLoadState('networkidle')

    // Get the question text again
    const secondQuestionText = await page.locator('.font-medium').first().textContent()

    // They should be the same
    expect(firstQuestionText).toBe(secondQuestionText)
  })

  test('should display questions in exam mode', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/exam-mode')

    // Navigate directly to exam mode with parameters
    await page.goto(`/exams/${EXAM_ID}/exam?count=5`)
    await page.waitForLoadState('networkidle')
    await capture(page, '06-exam-mode-loaded')

    // Verify question is displayed
    await expect(page.getByText(/Question \d+ of 5/i)).toBeVisible()

    // Verify options are visible
    await expect(page.locator('.rounded-full').filter({ hasText: 'A' }).first()).toBeVisible()

    // Verify navigation buttons exist
    await expect(page.locator('button[title="Previous Question"]')).toBeVisible()
    await expect(page.locator('button[title="Next Question"]')).toBeVisible()
  })

  test('should cancel exam dialog', async ({ page }) => {
    await page.goto(`/exams/${EXAM_ID}`)
    await page.waitForLoadState('networkidle')

    // Open exam mode dialog
    await page.getByText('Exam Mode').click()
    await expect(page.getByText('Start Exam Mode')).toBeVisible()

    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Dialog should close
    await expect(page.getByText('Start Exam Mode')).not.toBeVisible()

    // Should still be on exam details page
    await expect(page).toHaveURL(`/exams/${EXAM_ID}`)
  })

  test('should clamp question count to available questions', async ({ page }) => {
    await page.goto(`/exams/${EXAM_ID}`)
    await page.waitForLoadState('networkidle')

    // Open exam mode dialog
    await page.getByText('Exam Mode').click()

    // Try to set a very large question count (more than available)
    await page.getByLabel('Question count').fill('9999')

    // Click Start
    await page.getByRole('button', { name: 'Start' }).click()

    // Should be on exam page (count will be clamped)
    await expect(page).toHaveURL(/\/exam/)
  })
})
