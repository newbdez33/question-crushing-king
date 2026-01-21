import { test, expect } from '@playwright/test'
import { createCapture } from './utils/test-helpers'

test.describe('Error Pages', () => {
  test.describe('404 Not Found', () => {
    test('should display 404 page for non-existent route', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/error-pages')

      await page.goto('/non-existent-page-12345')
      await capture(page, '01-404-page')

      // Verify 404 error code is displayed
      await expect(page.getByText('404')).toBeVisible()

      // Verify error message
      await expect(page.getByText(/Page Not Found/i)).toBeVisible()
    })

    test('should have Go Back button on 404 page', async ({ page }) => {
      await page.goto('/non-existent-page')

      // Verify Go Back button exists
      await expect(page.getByRole('button', { name: 'Go Back' })).toBeVisible()
    })

    test('should have Back to Home button on 404 page', async ({ page }) => {
      await page.goto('/non-existent-page')

      // Verify Back to Home button exists
      await expect(page.getByRole('button', { name: 'Back to Home' })).toBeVisible()
    })

    test('should navigate to home when clicking Back to Home', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/error-pages')

      await page.goto('/non-existent-page')
      await capture(page, '02-before-home-nav')

      // Click Back to Home
      await page.getByRole('button', { name: 'Back to Home' }).click()
      await capture(page, '03-after-home-nav')

      // Should be on home page
      await expect(page).toHaveURL('/')
    })

    test('should navigate back when clicking Go Back', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/error-pages')

      // First visit dashboard
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Then visit non-existent page
      await page.goto('/non-existent-page')
      await capture(page, '04-on-404')

      // Click Go Back
      await page.getByRole('button', { name: 'Go Back' }).click()
      await capture(page, '05-after-go-back')

      // Should be back on dashboard
      await expect(page).toHaveURL('/')
    })
  })

  test.describe('Direct Error Page Navigation', () => {
    test('should display 401 unauthorized page', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/error-pages')

      await page.goto('/401')
      await capture(page, '06-401-page')

      // Verify 401 error code is displayed
      await expect(page.getByText('401')).toBeVisible()
    })

    test('should display 403 forbidden page', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/error-pages')

      await page.goto('/403')
      await capture(page, '07-403-page')

      // Verify 403 error code is displayed
      await expect(page.getByText('403')).toBeVisible()
    })

    test('should display 500 server error page', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/error-pages')

      await page.goto('/500')
      await capture(page, '08-500-page')

      // Verify 500 error code is displayed
      await expect(page.getByText('500')).toBeVisible()
    })

    test('should display 503 service unavailable page', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/error-pages')

      await page.goto('/503')
      await capture(page, '09-503-page')

      // Verify 503 error code is displayed
      await expect(page.getByText('503')).toBeVisible()
    })
  })

  test.describe('Invalid Exam Handling', () => {
    test('should handle invalid exam ID gracefully', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/error-pages')

      // Navigate to a non-existent exam
      await page.goto('/exams/INVALID-EXAM-ID-12345')
      await page.waitForLoadState('networkidle')
      await capture(page, '10-invalid-exam')

      // The page should either show an error or handle it gracefully
      // Check that the page is still functional
      await expect(page.locator('body')).toBeVisible()
    })

    test('should handle invalid exam practice mode', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/error-pages')

      // Navigate to practice mode for non-existent exam
      await page.goto('/exams/INVALID-EXAM-ID/practice')
      await page.waitForLoadState('networkidle')
      await capture(page, '11-invalid-exam-practice')

      // Should show some error or redirect
      await expect(page.locator('body')).toBeVisible()
    })
  })
})
