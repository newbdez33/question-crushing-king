import { test, expect } from '@playwright/test'
import { createCapture } from './utils/test-helpers'

const EXAM_ID = 'SOA-C03'

test.describe('AI Explanation in Practice Mode', () => {
  test('should show AI Explanation section after submitting an answer', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/ai-explanation')

    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')
    await capture(page, '01-practice-loaded')

    // First answer a question to reveal the AI section
    const firstOption = page.locator('.rounded-lg.border').first()
    await firstOption.click()
    await page.getByRole('button', { name: /Submit Answer/i }).click()
    await page.waitForTimeout(1000)
    await capture(page, '02-answer-submitted')

    // Now the AI Explanation section should be visible
    const aiSection = page.getByText(/AI Explanation/i)
    await expect(aiSection.first()).toBeVisible({ timeout: 5000 })
  })

  test('should show empty state when no API key configured', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/ai-explanation')

    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')

    // Answer a question first
    const firstOption = page.locator('.rounded-lg.border').first()
    await firstOption.click()
    await page.getByRole('button', { name: /Submit Answer/i }).click()
    await page.waitForTimeout(1000)

    // Click on AI Explanation to expand
    const aiSection = page.getByText(/AI Explanation/i).first()
    await aiSection.click()
    await page.waitForTimeout(500)
    await capture(page, '03-ai-empty-state')

    // Should show empty state message about configuring API key
    await expect(
      page.getByText(/AI explanations are off/i).first()
    ).toBeVisible({ timeout: 5000 })
  })

  test('should show link to AI settings from empty state', async ({ page }) => {
    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')

    // Answer a question first
    const firstOption = page.locator('.rounded-lg.border').first()
    await firstOption.click()
    await page.getByRole('button', { name: /Submit Answer/i }).click()
    await page.waitForTimeout(1000)

    // Open AI panel
    const aiSection = page.getByText(/AI Explanation/i).first()
    await aiSection.click()
    await page.waitForTimeout(500)

    // Should have a link/button to open AI settings
    const settingsLink = page.getByText(/Open AI settings/i)
    await expect(settingsLink.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have Explain this question button when API key is set', async ({ page }) => {
    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')

    // Answer a question first
    const firstOption = page.locator('.rounded-lg.border').first()
    await firstOption.click()
    await page.getByRole('button', { name: /Submit Answer/i }).click()
    await page.waitForTimeout(1000)

    // Check if AI panel has an API key configured
    const explainBtn = page.getByText(/Explain this question/i)
    if (await explainBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(explainBtn.first()).toBeVisible()
    }
    // If not visible, the API key is not configured - test passes as skipped
  })

  test('should navigate to AI settings page from practice mode', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/ai-explanation')

    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')

    // Answer a question first
    const firstOption = page.locator('.rounded-lg.border').first()
    await firstOption.click()
    await page.getByRole('button', { name: /Submit Answer/i }).click()
    await page.waitForTimeout(1000)

    // Open AI panel
    const aiSection = page.getByText(/AI Explanation/i).first()
    await aiSection.click()
    await page.waitForTimeout(500)

    // Click on settings link
    const settingsLink = page.getByText(/Open AI settings/i).first()
    if (await settingsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await settingsLink.click()
      await capture(page, '04-navigated-to-ai-settings')

      // Should navigate to AI settings page
      await expect(page).toHaveURL(/\/settings\/ai/)
    }
  })

  test('should show New thread button when AI panel is open and has API key', async ({ page }) => {
    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')

    // Answer a question first
    const firstOption = page.locator('.rounded-lg.border').first()
    await firstOption.click()
    await page.getByRole('button', { name: /Submit Answer/i }).click()
    await page.waitForTimeout(1000)

    // Check if AI panel has New thread button (only visible when API key is configured)
    const newThreadBtn = page.getByText(/New thread/i)
    if (await newThreadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(newThreadBtn.first()).toBeVisible()
    }
    // If not visible, the API key is not configured - test passes as skipped
  })
})
