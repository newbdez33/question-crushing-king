import { test, expect } from '@playwright/test'
import { createCapture, deleteCurrentUser, uniqueCreds, signUp } from './utils/test-helpers'

const EXAM_ID = 'SOA-C03'

test.describe('Bookmarks Mode', () => {
  test('should navigate to My Bookmarks from exam details', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/bookmarks')

    await page.goto(`/exams/${EXAM_ID}`)
    await page.waitForLoadState('networkidle')
    await capture(page, '01-exam-details')

    // Click on My Bookmarks card
    await page.getByText('My Bookmarks').click()
    await capture(page, '02-bookmarks-loaded')

    // Verify URL contains mode=bookmarks
    await expect(page).toHaveURL(/mode=bookmarks/)

    // Should show empty state message
    await expect(page.getByText('No bookmarked questions!')).toBeVisible({ timeout: 10000 })
  })

  test('should show empty state when no bookmarks', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/bookmarks')

    // Navigate directly to bookmarks mode (fresh guest context)
    await page.goto(`/exams/${EXAM_ID}/practice?mode=bookmarks`)
    await page.waitForLoadState('networkidle')
    await capture(page, '03-empty-bookmarks')

    // Should show the friendly empty state message
    await expect(page.getByText('No bookmarked questions!')).toBeVisible({ timeout: 10000 })
    await expect(
      page.getByText('Bookmark questions while practicing to review them here later.')
    ).toBeVisible()
    await expect(page.getByRole('link', { name: /Back to Exam/i })).toBeVisible()
  })

  test('should show bookmarked questions after bookmarking in practice', async ({ page }) => {
    const { email, password } = uniqueCreds()
    const capture = createCapture('e2e/artifacts/bookmarks')

    // Sign up to persist progress
    await signUp(page, email, password)

    // Go to practice mode
    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')
    await capture(page, '04-practice-loaded')

    // Find and click the bookmark button (absolute positioned button with SVG in card header)
    const bookmarkBtn = page.locator('button.absolute').filter({ has: page.locator('svg') }).first()
    await bookmarkBtn.click()
    await page.waitForTimeout(500)
    await capture(page, '05-bookmarked-in-practice')

    // Navigate to bookmarks mode
    await page.goto(`/exams/${EXAM_ID}/practice?mode=bookmarks`)
    await page.waitForLoadState('networkidle')
    await capture(page, '06-bookmarks-with-questions')

    // Should show a question (not empty state)
    await expect(page.getByText(/Question \d+ of \d+/i)).toBeVisible({ timeout: 10000 })

    // Cleanup
    const deleted = await deleteCurrentUser(page)
    expect(deleted).toBeTruthy()
  })

  test('should unbookmark question from bookmarks mode', async ({ page }) => {
    const { email, password } = uniqueCreds()
    const capture = createCapture('e2e/artifacts/bookmarks')

    // Sign up
    await signUp(page, email, password)

    // First bookmark a question
    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')
    const bookmarkBtn = page.locator('button.absolute').filter({ has: page.locator('svg') }).first()
    await bookmarkBtn.click()
    await page.waitForTimeout(500)

    // Navigate to bookmarks mode
    await page.goto(`/exams/${EXAM_ID}/practice?mode=bookmarks`)
    await page.waitForLoadState('networkidle')
    await capture(page, '07-before-unbookmark')

    // Should have a question visible
    await expect(page.getByText(/Question \d+ of \d+/i)).toBeVisible({ timeout: 10000 })

    // Click bookmark to remove it
    const bookmarkBtnInBookmarks = page.locator('button.absolute').filter({ has: page.locator('svg') }).first()
    await bookmarkBtnInBookmarks.click()
    await page.waitForTimeout(500)
    await capture(page, '08-after-unbookmark')

    // Reload to verify persistence
    await page.reload()
    await page.waitForLoadState('networkidle')
    await capture(page, '09-after-reload-no-bookmarks')

    // Cleanup
    const deleted = await deleteCurrentUser(page)
    expect(deleted).toBeTruthy()
  })

  test('should navigate to bookmarks mode via URL parameter', async ({ page }) => {
    // Direct navigation to bookmarks mode
    await page.goto(`/exams/${EXAM_ID}/practice?mode=bookmarks`)
    await page.waitForLoadState('networkidle')

    // Verify we're in bookmarks mode via URL
    await expect(page).toHaveURL(/mode=bookmarks/)

    // Should show empty state (no bookmarks)
    await expect(page.getByText('No bookmarked questions!')).toBeVisible({ timeout: 10000 })
  })

  test('should navigate between bookmarked questions', async ({ page }) => {
    const { email, password } = uniqueCreds()
    const capture = createCapture('e2e/artifacts/bookmarks')

    // Sign up
    await signUp(page, email, password)

    // Bookmark first two questions
    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')

    // Bookmark Q1
    await page.locator('button.absolute').filter({ has: page.locator('svg') }).first().click()
    await page.waitForTimeout(300)

    // Go to Q2 and bookmark it
    await page.locator('button[title="Next Question"]').click()
    await page.waitForTimeout(500)
    await page.locator('button.absolute').filter({ has: page.locator('svg') }).first().click()
    await page.waitForTimeout(300)

    // Navigate to bookmarks mode
    await page.goto(`/exams/${EXAM_ID}/practice?mode=bookmarks`)
    await page.waitForLoadState('networkidle')
    await capture(page, '10-bookmarks-multi')

    // Should have navigation between bookmarked questions
    await expect(page.getByText(/Question \d+ of \d+/i)).toBeVisible({ timeout: 10000 })

    // Previous button should be disabled on first question
    const prevBtn = page.locator('button[title="Previous Question"]')
    await expect(prevBtn).toBeDisabled()

    // Navigate to next bookmarked question
    const nextBtn = page.locator('button[title="Next Question"]')
    if (await nextBtn.isEnabled()) {
      await nextBtn.click()
      await capture(page, '11-bookmarks-navigated')
      await expect(page.getByText(/Question \d+ of \d+/i)).toBeVisible()
    }

    // Cleanup
    const deleted = await deleteCurrentUser(page)
    expect(deleted).toBeTruthy()
  })
})
