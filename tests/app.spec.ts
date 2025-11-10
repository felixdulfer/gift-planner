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

	test('should show create group button on dashboard when user has no groups', async ({
		page,
	}) => {
		await page.goto('/dashboard')
		await page.waitForLoadState('networkidle')

		// Wait for async operations to complete
		await page.waitForTimeout(1000)

		// Should show "No events yet" message
		const noEventsMessage = page.locator('text=No events yet')
		await expect(noEventsMessage).toBeVisible({ timeout: 5000 })

		// Should show "Create your first group" message when there are no groups
		const createGroupMessage = page.locator('text=Create your first group to start planning gifts')
		await expect(createGroupMessage).toBeVisible()

		// Should show Create Group button
		const createGroupButton = page.getByRole('button', { name: 'Create Group' })
		await expect(createGroupButton).toBeVisible()
	})

	test('should add a new group', async ({ page }) => {
		const groupName = `Test Group ${Date.now()}`

		await page.goto('/groups')
		await page.waitForLoadState('networkidle')

		// Open dialog
		await page.getByRole('button', { name: 'Create Group' }).first().click()
		await expect(page.getByRole('heading', { name: 'Create New Group' })).toBeVisible()

		// Fill form using type to ensure onChange events fire
		await page.getByLabel('Group Name').clear()
		await page.getByLabel('Group Name').type(groupName)
		await page.getByLabel('Description (optional)').clear()
		await page.getByLabel('Description (optional)').type('Test description')
		
		// Wait for form state to update
		await page.waitForTimeout(500)
		
		// Click submit button
		await page.getByRole('button', { name: 'Create Group' }).last().click()
		
		// Wait for dialog to close
		await expect(page.getByRole('heading', { name: 'Create New Group' })).not.toBeVisible({ timeout: 5000 })
		
		// Wait for async operations
		await page.waitForTimeout(1000)

		// Wait for group to appear in UI
		await expect(page.getByText(groupName)).toBeVisible({ timeout: 10000 })
	})
})
