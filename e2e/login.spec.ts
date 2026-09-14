import { test, expect } from '@playwright/test'

test('should render the login page correctly', async ({ page }) => {
  page.on('console', msg => console.log('PAGE LOG:', msg.text()))
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack))
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText))

  await page.goto('/login')

  // Wait for 2 seconds to let the page load completely
  await page.waitForTimeout(2000)

  // Check that the heading 'Login' is visible
  const heading = page.locator('h1')
  await expect(heading).toHaveText('Login')
})
