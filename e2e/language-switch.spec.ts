import { test, expect } from '@playwright/test'
import { createCapture } from './utils/test-helpers'

const EXAM_ID = 'SOA-C03'

test.describe('Language Switching', () => {
  test('should display language switch button', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/language-switch')

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await capture(page, '01-language-switch-visible')

    // Language switch button should be visible in the header
    const langBtn = page.getByRole('button', { name: /Language/i })
    await expect(langBtn).toBeVisible()
  })

  test('should switch to Chinese (Simplified)', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/language-switch')

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await capture(page, '02-before-zh-switch')

    // Click language switch button
    const langBtn = page.getByRole('button', { name: /Language/i })
    await langBtn.click()
    await page.waitForTimeout(300)

    // Select Chinese Simplified
    const zhOption = page.getByText('简体中文').first()
    await zhOption.click()
    await page.waitForTimeout(500)
    await capture(page, '03-after-zh-switch')

    // Dashboard title should now be in Chinese
    await expect(page.getByRole('heading', { name: '仪表盘' })).toBeVisible({ timeout: 5000 })

    // Verify other UI elements are translated
    await expect(page.getByText('总体正确率')).toBeVisible()
  })

  test('should switch to Traditional Chinese', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/language-switch')

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Click language switch button
    const langBtn = page.getByRole('button', { name: /Language/i })
    await langBtn.click()
    await page.waitForTimeout(300)

    // Select Traditional Chinese
    const zhTcOption = page.getByText('繁體中文').first()
    await zhTcOption.click()
    await page.waitForTimeout(500)
    await capture(page, '04-after-zh-TC-switch')

    // Dashboard title should now be in Traditional Chinese
    await expect(page.getByRole('heading', { name: '儀表板' })).toBeVisible({ timeout: 5000 })
  })

  test('should switch to Japanese', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/language-switch')

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Click language switch button
    const langBtn = page.getByRole('button', { name: /Language/i })
    await langBtn.click()
    await page.waitForTimeout(300)

    // Select Japanese
    const jaOption = page.getByText('日本語').first()
    await jaOption.click()
    await page.waitForTimeout(500)
    await capture(page, '05-after-ja-switch')

    // Dashboard title should now be in Japanese
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible({ timeout: 5000 })
  })

  test('should switch back to English', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/language-switch')

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Switch to Chinese first
    const langBtn = page.getByRole('button', { name: /Language/i })
    await langBtn.click()
    await page.waitForTimeout(300)
    await page.getByText('简体中文').first().click()
    await page.waitForTimeout(500)

    // Switch back to English - find the flag button (any button with an SVG flag)
    // After switching to Chinese, the button's accessible name becomes "语言"
    await page.locator('button').filter({ has: page.locator('svg[viewBox="0 0 32 24"]') }).first().click()
    await page.waitForTimeout(500)
    await page.getByText('English').first().click()
    await page.waitForTimeout(500)
    await capture(page, '06-back-to-en')

    // Dashboard title should be back to English
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 5000 })
  })

  test('should persist language preference after page reload', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/language-switch')

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Switch to Chinese
    const langBtn = page.getByRole('button', { name: /Language/i })
    await langBtn.click()
    await page.waitForTimeout(300)
    await page.getByText('简体中文').first().click()
    await page.waitForTimeout(500)

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')
    await capture(page, '07-language-persisted')

    // Language should persist after reload
    await expect(page.getByRole('heading', { name: '仪表盘' })).toBeVisible({ timeout: 5000 })
  })

  test('should apply language to practice mode', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/language-switch')

    // Switch to Chinese first
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const langBtn = page.getByRole('button', { name: /Language/i })
    await langBtn.click()
    await page.waitForTimeout(300)
    await page.getByText('简体中文').first().click()
    await page.waitForTimeout(500)

    // Navigate to practice mode
    await page.goto(`/exams/${EXAM_ID}/practice`)
    await page.waitForLoadState('networkidle')
    await capture(page, '08-practice-zh')

    // Practice mode UI should be in Chinese
    // "Submit Answer" should be translated to "提交答案"
    await expect(page.getByRole('button', { name: /提交答案/i })).toBeVisible()
  })

  test('should apply language to study mode', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/language-switch')

    // Switch to Japanese first
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const langBtn = page.getByRole('button', { name: /Language/i })
    await langBtn.click()
    await page.waitForTimeout(300)
    await page.getByText('日本語').first().click()
    await page.waitForTimeout(500)

    // Navigate to study mode
    await page.goto(`/exams/${EXAM_ID}/study`)
    await page.waitForLoadState('networkidle')
    await capture(page, '09-study-ja')

    // Study mode UI should be in Japanese
    await expect(page.getByText(/学習モード/i).first()).toBeVisible()
  })

  test('should apply language to exam details page', async ({ page }) => {
    const capture = createCapture('e2e/artifacts/language-switch')

    // Switch to Simplified Chinese (persists correctly on navigation)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const langBtn = page.getByRole('button', { name: /Language/i })
    await langBtn.click()
    await page.waitForTimeout(300)
    await page.getByText('简体中文').first().click()
    await page.waitForTimeout(500)

    // Navigate to exam details
    await page.goto(`/exams/${EXAM_ID}`)
    await page.waitForLoadState('networkidle')
    await capture(page, '10-exam-details-zh')

    // Exam details UI should be in Simplified Chinese
    await expect(page.getByText(/练习/i).first()).toBeVisible({ timeout: 10000 })
  })
})
