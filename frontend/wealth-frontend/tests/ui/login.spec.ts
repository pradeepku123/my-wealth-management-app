import { test, expect } from '@playwright/test';

test('should register and login successfully', async ({ page }) => {
    const uniqueId = Date.now().toString();
    const username = `user_${uniqueId}`;
    const email = `user_${uniqueId}@example.com`;
    const password = 'password123';

    // 1. Register
    await page.goto('/register');

    await page.fill('#userId', username);
    await page.fill('#fullName', 'Test User');
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.fill('#confirmPassword', password);

    await page.click('button[type="submit"]');

    // Expect redirection to login page
    await expect(page).toHaveURL('/login');

    // 2. Login
    // Note: Backend expects email in the username field
    await page.fill('#username', email);
    await page.fill('#password', password);

    await page.click('button[type="submit"]');

    // Expect redirection to dashboard
    try {
        await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    } catch (e) {
        // Attempt to capture error message from UI
        const errorAlert = page.locator('.alert.alert-danger');
        if (await errorAlert.isVisible()) {
            const errorMsg = await errorAlert.textContent();
            console.error(`Login failed with UI error: ${errorMsg}`);
        }
        throw e;
    }

    // Verify dashboard content
    await expect(page.locator('h1.fw-bold.mb-1')).toContainText('Asset Portfolio');
});
