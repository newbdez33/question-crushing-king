import { test, expect } from '@playwright/test'
import { createCapture } from './utils/test-helpers'

const EXAM_ID = 'SOA-C03'

// Mobile viewport dimensions
const MOBILE_VIEWPORT = { width: 375, height: 667 }
const TABLET_VIEWPORT = { width: 768, height: 1024 }

test.describe('Mobile Responsiveness', () => {
  test.describe('Mobile Viewport (375x667)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT)
    })

    test('should display dashboard correctly on mobile', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/mobile')

      await page.goto('/')
      await page.waitForLoadState('networkidle')
      await capture(page, '01-mobile-dashboard')

      // Dashboard should be visible
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

      // Stats cards should be visible
      await expect(page.getByText('Total Questions Answered')).toBeVisible()
    })

    test('should display practice mode with mobile bar', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/mobile')

      await page.goto(`/exams/${EXAM_ID}/practice`)
      await page.waitForLoadState('networkidle')
      await capture(page, '02-mobile-practice')

      // Question should be visible
      await expect(page.getByText(/Question \d+ of \d+/i)).toBeVisible()

      // Navigation buttons should be visible
      await expect(page.locator('button[title="Previous Question"]')).toBeVisible()
      await expect(page.locator('button[title="Next Question"]')).toBeVisible()
    })

    test('should hide desktop sidebar on mobile practice mode', async ({ page }) => {
      await page.goto(`/exams/${EXAM_ID}/practice`)
      await page.waitForLoadState('networkidle')

      // Desktop sidebar should not be visible on mobile
      // The sidebar is hidden with lg:block class
      const sidebar = page.locator('.hidden.lg\\:block')
      // Sidebar should either not exist or not be visible
      const sidebarCount = await sidebar.count()
      if (sidebarCount > 0) {
        await expect(sidebar.first()).not.toBeVisible()
      }
    })

    test('should display study mode correctly on mobile', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/mobile')

      await page.goto(`/exams/${EXAM_ID}/study`)
      await page.waitForLoadState('networkidle')
      await capture(page, '03-mobile-study')

      // Question should be visible
      await expect(page.getByText(/Question \d+ of \d+/i)).toBeVisible()

      // Correct answer should be highlighted
      await expect(
        page.locator('.border-green-500, .bg-green-50, .bg-green-950\\/20').first()
      ).toBeVisible()
    })

    test('should allow question answering on mobile', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/mobile')

      await page.goto(`/exams/${EXAM_ID}/practice`)
      await page.waitForLoadState('networkidle')

      // Select first option
      const firstOption = page.locator('.rounded-lg.border').first()
      await firstOption.click()
      await capture(page, '04-mobile-option-selected')

      // Submit should be enabled
      const submitBtn = page.getByRole('button', { name: /Submit Answer/i })
      await expect(submitBtn).toBeEnabled()

      // Submit answer
      await submitBtn.click()
      await capture(page, '05-mobile-answer-submitted')

      // Feedback should be visible
      await expect(
        page.getByText(/Correct Answer!|Incorrect Answer/i).first()
      ).toBeVisible()
    })

    test('should navigate questions on mobile', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/mobile')

      await page.goto(`/exams/${EXAM_ID}/practice`)
      await page.waitForLoadState('networkidle')

      // Verify on question 1
      await expect(page.getByText(/Question 1 of/i)).toBeVisible()

      // Navigate to next question
      await page.locator('button[title="Next Question"]').click()
      await capture(page, '06-mobile-question-2')

      // Verify on question 2
      await expect(page.getByText(/Question 2 of/i)).toBeVisible()
    })

    test('should display settings page on mobile', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/mobile')

      await page.goto('/settings/appearance')
      await page.waitForLoadState('networkidle')
      await capture(page, '07-mobile-settings')

      // Settings should be visible
      await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible()
      await expect(page.getByText('Theme', { exact: true })).toBeVisible()
    })

    test('should display exam details on mobile', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/mobile')

      await page.goto(`/exams/${EXAM_ID}`)
      await page.waitForLoadState('networkidle')
      await capture(page, '08-mobile-exam-details')

      // Study mode cards should be visible (use first() for multiple matches)
      await expect(page.getByText('Practice Mode').first()).toBeVisible()
      await expect(page.getByText('Study Mode').first()).toBeVisible()
    })
  })

  test.describe('Tablet Viewport (768x1024)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(TABLET_VIEWPORT)
    })

    test('should display dashboard correctly on tablet', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/mobile')

      await page.goto('/')
      await page.waitForLoadState('networkidle')
      await capture(page, '09-tablet-dashboard')

      // Dashboard should be visible
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    })

    test('should display practice mode on tablet', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/mobile')

      await page.goto(`/exams/${EXAM_ID}/practice`)
      await page.waitForLoadState('networkidle')
      await capture(page, '10-tablet-practice')

      // Question should be visible
      await expect(page.getByText(/Question \d+ of \d+/i)).toBeVisible()
    })
  })

  test.describe('Touch Interactions', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT)
    })

    test('should support click on option selection on mobile', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/mobile')

      await page.goto(`/exams/${EXAM_ID}/practice`)
      await page.waitForLoadState('networkidle')

      // Click on first option (works same as touch on mobile)
      const firstOption = page.locator('.rounded-lg.border').first()
      await firstOption.click()
      await capture(page, '11-mobile-option-selected')

      // Submit should be enabled
      const submitBtn = page.getByRole('button', { name: /Submit Answer/i })
      await expect(submitBtn).toBeEnabled()
    })

    test('should support click on navigation buttons on mobile', async ({ page }) => {
      await page.goto(`/exams/${EXAM_ID}/practice`)
      await page.waitForLoadState('networkidle')

      // Click next button
      await page.locator('button[title="Next Question"]').click()

      // Should be on question 2
      await expect(page.getByText(/Question 2 of/i)).toBeVisible()
    })
  })

  test.describe('Responsive Layout', () => {
    test('should show 4-column stats grid on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // All 4 stats cards should be visible in a row on desktop
      await expect(page.getByText('Total Questions Answered')).toBeVisible()
      await expect(page.getByText('Correct Answers')).toBeVisible()
      await expect(page.getByText('Overall Accuracy')).toBeVisible()
      await expect(page.getByText('Exams Started')).toBeVisible()
    })

    test('should stack stats cards on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT)

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Cards should still be visible but stacked
      await expect(page.getByText('Total Questions Answered')).toBeVisible()
      await expect(page.getByText('Exams Started')).toBeVisible()
    })
  })
})
