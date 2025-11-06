import { test, expect } from '@playwright/test'

test.describe('Gift Planner App', () => {
	test('should load the home page without errors', async ({ page }) => {
		// Listen for console errors
		const errors: string[] = []
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				errors.push(msg.text())
			}
		})

		// Listen for page errors
		page.on('pageerror', (error) => {
			errors.push(error.message)
		})

		// Navigate to home page
		await page.goto('/')
		await page.waitForLoadState('networkidle')

		// Check that there are no critical errors
		const criticalErrors = errors.filter(
			(error) =>
				!error.includes('favicon') &&
				!error.includes('404') &&
				!error.includes('DevTools'),
		)

		expect(criticalErrors.length).toBe(0)
	})

	test('should load the groups page without query compilation errors', async ({
		page,
	}) => {
		// Listen for console errors
		const errors: string[] = []
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				errors.push(msg.text())
			}
		})

		// Listen for page errors
		page.on('pageerror', (error) => {
			errors.push(error.message)
		})

		// Navigate to groups page
		await page.goto('/groups')
		await page.waitForLoadState('networkidle')

		// Wait a bit for any async operations to complete
		await page.waitForTimeout(1000)

		// Check for specific errors we fixed
		const queryErrors = errors.filter(
			(error) =>
				error.includes('QueryCompilationError') ||
				error.includes('Unknown expression type') ||
				error.includes('removeChild'),
		)

		expect(queryErrors.length).toBe(0)

		// Verify the page loaded successfully
		await expect(page.getByRole('heading', { name: 'My Groups' })).toBeVisible()
	})

	test('should handle empty groups state', async ({ page }) => {
		await page.goto('/groups')
		await page.waitForLoadState('networkidle')

		// Should show "No groups yet" message when there are no groups
		const noGroupsMessage = page.locator('text=No groups yet')
		await expect(noGroupsMessage).toBeVisible({ timeout: 5000 })
	})
})

