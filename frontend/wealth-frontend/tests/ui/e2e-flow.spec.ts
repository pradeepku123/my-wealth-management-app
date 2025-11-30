import { test, expect } from '@playwright/test';

test('Full User Flow: Register, Login, Portfolio, Goals, and Profile', async ({ page }) => {
    const uniqueId = Date.now().toString();
    const username = `user_${uniqueId}`;
    const email = `user_${uniqueId}@example.com`;
    const password = 'password123';

    // --- 1. Registration ---
    await test.step('Register new user', async () => {
        await page.goto('/register');
        await page.fill('#userId', username);
        await page.fill('#fullName', 'Test User');
        await page.fill('#email', email);
        await page.fill('#password', password);
        await page.fill('#confirmPassword', password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/login');
    });

    // --- 2. Login ---
    await test.step('Login with new user', async () => {
        await page.fill('#username', email);
        await page.fill('#password', password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/dashboard');
        await expect(page.locator('h1.fw-bold.mb-1')).toContainText('Asset Portfolio');
    });

    // --- 3. Portfolio Management ---
    await test.step('Add Investment to Portfolio', async () => {
        await page.click('a[href="/portfolio"]');
        await expect(page).toHaveURL('/portfolio');

        // Click Add Investment button
        await page.click('button:has-text("Add Investment")');

        // Wait for modal to appear
        const modal = page.locator('#addFundModal');
        await expect(modal).toBeVisible();

        // Fill investment details
        await modal.locator('#investmentType').selectOption('mutual_fund');
        await modal.locator('#investmentName').fill('Test Mutual Fund');
        await modal.locator('#investedAmount').fill('50000');
        await modal.locator('#currentValue').fill('55000');

        // Save
        await modal.locator('button:has-text("Save")').click();

        // Verify investment appears in table
        await expect(page.locator('table')).toContainText('Test Mutual Fund');
        await expect(page.locator('table')).toContainText('₹50,000.00');
        await expect(page.locator('table')).toContainText('₹55,000.00');
    });

    // --- 4. Goals Management ---
    await test.step('Create Financial Goal', async () => {
        await page.click('a[href="/goals"]');
        await expect(page).toHaveURL('/goals');

        // Click New Goal button
        await page.click('button:has-text("New Goal")');

        // Wait for modal (assuming standard bootstrap modal structure or similar)
        // Note: Based on goals.component.html, the modal uses ng-template, so we look for the dialog content
        const modal = page.locator('.modal-content').filter({ hasText: 'Add New Goal' });
        await expect(modal).toBeVisible();

        // Fill goal details
        await modal.locator('#name').fill('Retirement Plan');
        await modal.locator('#target_amount').fill('10000000');

        // Set target date to next year
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        const dateStr = nextYear.toISOString().split('T')[0];
        await modal.locator('#target_date').fill(dateStr);

        await modal.locator('#expected_return').fill('12');

        // Check if SIP amount is calculated (read-only field)
        await expect(modal.locator('#monthly_sip_amount')).not.toBeEmpty();

        // Save
        await modal.locator('button:has-text("Save Goal")').click();

        // Verify goal appears in list
        await expect(page.locator('.card-body')).toContainText('Retirement Plan');
    });

    // --- 5. Mutual Funds Search ---
    await test.step('Search Mutual Funds', async () => {
        await page.click('a[href="/mutual-funds"]');
        await expect(page).toHaveURL('/mutual-funds');

        // Perform search
        await page.fill('input[placeholder*="Search"]', 'SBI');
        await page.click('button.search-btn');

        // Verify results appear
        // Note: This depends on external API or mock. If real API, it might be flaky. 
        // Assuming backend proxies to real API or has mock data.
        // We'll check if results container appears or "No results" message, but ideally we see results.
        // For stability, we might just check if the search UI state updates.

        // Wait for either results or no results message
        await expect(page.locator('.search-results-section').or(page.locator('text=No mutual funds available'))).toBeVisible();
    });

    // --- 6. Profile ---
    await test.step('View Profile', async () => {
        // Navigate via dropdown or direct link if available. 
        // Assuming there is a user menu or sidebar link.
        // If not visible, we can try direct URL navigation.
        await page.goto('/profile');

        // Verify profile details
        await expect(page.locator('input[formControlName="email"]')).toHaveValue(email);
        await expect(page.locator('input[formControlName="full_name"]')).toHaveValue('Test User');
    });

    // --- 7. Logout ---
    await test.step('Logout', async () => {
        // Logout button is in the sidebar
        const logoutBtn = page.locator('button:has-text("Logout")');

        // Ensure sidebar is visible if needed (though usually visible on desktop)
        if (!await logoutBtn.isVisible()) {
            // Try to toggle sidebar if button is not visible
            const toggleBtn = page.locator('button i.bi-list').first();
            if (await toggleBtn.isVisible()) {
                await toggleBtn.click();
            }
        }

        await logoutBtn.click();
        await expect(page).toHaveURL('/login');
    });
});
