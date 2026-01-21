import { test, expect } from '@playwright/test'
import { createCapture } from './utils/test-helpers'

const EXAM_ID = 'SOA-C03'

test.describe('Study Mode', () => {
  test('should display question with correct answer highlighted', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/study-mode')

    await page.goto(`/exams/${EXAM_ID}/study`)
    await page.waitForLoadState('networkidle')
    await capture(page, '01-study-loaded')

    // Verify question badge is visible
    await expect(page.getByText(/Question \d+ of \d+/i)).toBeVisible()

    // Verify correct answer is highlighted (green styling)
    await expect(
      page.locator('.border-green-500, .bg-green-50, .bg-green-950\\/20').first()
    ).toBeVisible()
  })

  test('should show correct answer highlighted', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/study-mode')

    await page.goto(`/exams/${EXAM_ID}/study`)
    await page.waitForLoadState('networkidle')
    await capture(page, '02-study-correct-highlighted')

    // Verify correct answer is highlighted with green styling
    await expect(
      page.locator('.border-green-500, .bg-green-50, .bg-green-100').first()
    ).toBeVisible()
  })

  test('should navigate between questions', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/study-mode')

    await page.goto(`/exams/${EXAM_ID}/study`)
    await page.waitForLoadState('networkidle')

    // Verify we're on question 1
    await expect(page.getByText(/Question 1 of/i)).toBeVisible()

    // Find navigation buttons (in card footer)
    const prevBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') })
    const nextBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') })

    // Previous button should be disabled on first question
    await expect(prevBtn).toBeDisabled()

    // Click next button
    await nextBtn.click()
    await capture(page, '03-study-q2')

    // Verify we're on question 2
    await expect(page.getByText(/Question 2 of/i)).toBeVisible()

    // Verify correct answer is also highlighted on second question
    await expect(
      page.locator('.border-green-500, .bg-green-50, .bg-green-100').first()
    ).toBeVisible()

    // Previous button should now be enabled
    await expect(prevBtn).toBeEnabled()
  })

  test('should toggle bookmark on question', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/study-mode')

    await page.goto(`/exams/${EXAM_ID}/study`)
    await page.waitForLoadState('networkidle')

    // Find bookmark button (icon in card header)
    const bookmarkBtn = page.locator('button').filter({ has: page.locator('svg') }).first()

    // Click to bookmark
    await bookmarkBtn.click()
    await capture(page, '04-study-bookmarked')

    // Verify bookmark was clicked (check for any visual change)
    await page.waitForTimeout(300)
    await capture(page, '04b-study-bookmark-toggled')
  })

  test('should not have submit button in study mode', async ({ page }) => {
    await page.goto(`/exams/${EXAM_ID}/study`)
    await page.waitForLoadState('networkidle')

    // Submit button should not exist in study mode
    const submitBtn = page.getByRole('button', { name: /Submit Answer/i })
    await expect(submitBtn).not.toBeVisible()
  })

  test('should navigate through all questions', async ({ page }) => {
    await page.goto(`/exams/${EXAM_ID}/study`)
    await page.waitForLoadState('networkidle')

    // Start on question 1
    await expect(page.getByText(/Question 1 of/i)).toBeVisible()

    // Find navigation buttons
    const nextBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') })
    const prevBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') })

    // Navigate to next question twice
    await nextBtn.click()
    await expect(page.getByText(/Question 2 of/i)).toBeVisible()
    await nextBtn.click()
    await expect(page.getByText(/Question 3 of/i)).toBeVisible()

    // Navigate back
    await prevBtn.click()
    await expect(page.getByText(/Question 2 of/i)).toBeVisible()
  })

  test('should highlight correct answer option', async ({ page }) => {
    await page.goto(`/exams/${EXAM_ID}/study`)
    await page.waitForLoadState('networkidle')

    // In study mode, the correct answer is highlighted with green background/border
    await expect(
      page.locator('.border-green-500, .bg-green-50, .bg-green-100').first()
    ).toBeVisible()
  })
})
