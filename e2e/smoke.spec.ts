import { test, expect } from '@playwright/test'

test.describe('Smoke Test - Normal Access', () => {
  test('should load the home page without env error', async ({ page }) => {
    await page.goto('/')

    // Expect the page title to contain the app name or key text
    // Assuming the home page has "Question Crushing King" or similar, or just check we are NOT on the error page
    await expect(page).toHaveTitle(/Question Crushing King/i)

    // Ensure the EnvError component is NOT visible
    const errorText = page.getByText('Configuration Missing')
    await expect(errorText).not.toBeVisible()

    // Ensure some main content is visible (e.g., sidebar or header)
    // Adjust selector based on actual UI. Assuming there is a sidebar or "Sign In" button if unauthenticated.
    // For now, let's just check we are not on 503.
  })
})
