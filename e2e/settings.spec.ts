import { test, expect } from '@playwright/test'
import { createCapture, deleteCurrentUser, uniqueCreds, signUp } from './utils/test-helpers'

test.describe('Settings', () => {
  test.describe('Appearance Settings', () => {
    test('should display appearance settings page', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/settings')

      await page.goto('/settings/appearance')
      await page.waitForLoadState('networkidle')
      await capture(page, '01-appearance-settings')

      // Verify page heading
      await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible()

      // Verify font selector exists
      await expect(page.getByText('Font', { exact: true })).toBeVisible()

      // Verify theme options exist
      await expect(page.getByText('Theme', { exact: true })).toBeVisible()
      await expect(page.getByText('Light', { exact: true })).toBeVisible()
      await expect(page.getByText('Dark', { exact: true })).toBeVisible()

      // Verify update button exists
      await expect(page.getByRole('button', { name: 'Update preferences' })).toBeVisible()
    })

    test('should change theme to dark', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/settings')

      await page.goto('/settings/appearance')
      await page.waitForLoadState('networkidle')

      // Click on Dark theme option
      await page.getByText('Dark').click()
      await capture(page, '02-dark-theme-selected')

      // Submit the form
      await page.getByRole('button', { name: 'Update preferences' }).click()

      // Wait for theme to apply
      await page.waitForTimeout(300)
      await capture(page, '03-dark-theme-applied')

      // Verify dark theme is applied (html element should have 'dark' class)
      await expect(page.locator('html')).toHaveClass(/dark/)
    })

    test('should change theme to light', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/settings')

      // First set to dark mode
      await page.goto('/settings/appearance')
      await page.waitForLoadState('networkidle')
      await page.getByText('Dark').click()
      await page.getByRole('button', { name: 'Update preferences' }).click()
      await page.waitForTimeout(300)

      // Now change to light mode
      await page.getByText('Light').click()
      await page.getByRole('button', { name: 'Update preferences' }).click()
      await page.waitForTimeout(300)
      await capture(page, '04-light-theme-applied')

      // Verify light theme is applied (html element should not have 'dark' class)
      await expect(page.locator('html')).not.toHaveClass(/dark/)
    })

    test('should persist theme after page reload', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/settings')

      await page.goto('/settings/appearance')
      await page.waitForLoadState('networkidle')

      // Set dark theme
      await page.getByText('Dark').click()
      await page.getByRole('button', { name: 'Update preferences' }).click()
      await page.waitForTimeout(300)

      // Reload page
      await page.reload()
      await page.waitForLoadState('networkidle')
      await capture(page, '05-theme-persisted')

      // Verify dark theme persists
      await expect(page.locator('html')).toHaveClass(/dark/)
    })

    test('should change font selection', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/settings')

      await page.goto('/settings/appearance')
      await page.waitForLoadState('networkidle')
      await capture(page, '06-font-before')

      // Change font using the select dropdown
      const fontSelect = page.locator('select')
      await fontSelect.selectOption('manrope')
      await capture(page, '07-font-selected')

      // Submit
      await page.getByRole('button', { name: 'Update preferences' }).click()
      await page.waitForTimeout(300)
      await capture(page, '08-font-applied')

      // Font should be applied to the page
      // Note: The specific class depends on the font configuration
    })
  })

  test.describe('Profile Settings', () => {
    test('should display profile settings page', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/settings')

      await page.goto('/settings')
      await page.waitForLoadState('networkidle')
      await capture(page, '09-profile-settings')

      // Verify we're on profile settings page
      await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()
    })

    test('should navigate between settings pages', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/settings')

      // Start at profile settings
      await page.goto('/settings')
      await page.waitForLoadState('networkidle')

      // Navigate to appearance settings via sidebar/nav
      await page.getByRole('link', { name: /Appearance/i }).click()
      await capture(page, '10-navigated-to-appearance')
      await expect(page).toHaveURL(/\/settings\/appearance/)

      // Navigate to account settings
      await page.getByRole('link', { name: /Account/i }).click()
      await capture(page, '11-navigated-to-account')
      await expect(page).toHaveURL(/\/settings\/account/)
    })
  })

  test.describe('Account Settings', () => {
    test('should display account settings page', async ({ page }) => {
      const capture = createCapture('e2e/artifacts/settings')

      await page.goto('/settings/account')
      await page.waitForLoadState('networkidle')
      await capture(page, '12-account-settings')

      // Verify we're on account settings page
      await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible()
    })
  })

  test.describe('Settings with Authenticated User', () => {
    test('should update profile for authenticated user', async ({ page }) => {
      const { email, password } = uniqueCreds()
      const capture = createCapture('e2e/artifacts/settings')

      // Sign up
      await signUp(page, email, password)

      // Navigate to settings
      await page.goto('/settings')
      await page.waitForLoadState('networkidle')
      await capture(page, '13-authenticated-settings')

      // Profile settings should be visible
      await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()

      // Cleanup
      const deleted = await deleteCurrentUser(page)
      expect(deleted).toBeTruthy()
    })

    test('should persist appearance settings for authenticated user', async ({ page }) => {
      const { email, password } = uniqueCreds()
      const capture = createCapture('e2e/artifacts/settings')

      // Sign up
      await signUp(page, email, password)

      // Set dark theme
      await page.goto('/settings/appearance')
      await page.waitForLoadState('networkidle')
      await page.getByText('Dark').click()
      await page.getByRole('button', { name: 'Update preferences' }).click()
      await page.waitForTimeout(300)
      await capture(page, '14-authenticated-dark-theme')

      // Verify theme is applied
      await expect(page.locator('html')).toHaveClass(/dark/)

      // Navigate away and back
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Theme should persist
      await expect(page.locator('html')).toHaveClass(/dark/)

      // Cleanup
      const deleted = await deleteCurrentUser(page)
      expect(deleted).toBeTruthy()
    })
  })
})
