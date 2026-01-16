import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

test.describe('Guest Join Exam with screenshots', () => {
  test('guest joins SOA-C03 and sees it in My Exams', async ({ page }) => {
    const dir = path.join('e2e', 'artifacts', 'join-guest')
    fs.mkdirSync(dir, { recursive: true })

    await page.goto('/exams/SOA-C03')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(dir, '01-details-before.png'), fullPage: true })

    const joinBtn = page.getByRole('button', { name: /Join My Exams/i })
    await expect(joinBtn).toBeVisible()
    await joinBtn.click()

    await expect(joinBtn).toBeHidden()
    await page.screenshot({ path: path.join(dir, '02-details-after.png'), fullPage: true })

    await page.goto('/exams')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /My Exams/i })).toBeVisible()
    await expect(page.getByText(/SOA-C03 \(Demo\)/i)).toBeVisible()
    await page.screenshot({ path: path.join(dir, '03-my-exams.png'), fullPage: true })

    await page.reload()
    await expect(page.getByText(/SOA-C03 \(Demo\)/i)).toBeVisible()
    await page.screenshot({ path: path.join(dir, '04-my-exams-after-reload.png'), fullPage: true })
  })
})
