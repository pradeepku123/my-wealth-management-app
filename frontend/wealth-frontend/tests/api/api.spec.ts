import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8000';

test.describe('Wealth Management API', () => {

    test('Health Check', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/`);
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body).toEqual({ message: "Welcome to the Wealth Management API" });
    });

    test('User Registration and Login Flow', async ({ request }) => {
        const uniqueId = Date.now().toString();
        const email = `api_user_${uniqueId}@example.com`;
        const password = 'password123';
        const fullName = 'API Test User';

        // 1. Register
        const registerResponse = await request.post(`${BASE_URL}/api/v1/auth/register`, {
            data: {
                user_id: `user_${uniqueId}`, // Not used by backend for auth but required by schema? Let's check schema.
                // Schema UserRegistration: user_id, password, full_name, email.
                // Backend uses email for login.
                email: email,
                password: password,
                full_name: fullName
            }
        });

        // Note: If user_id is required by schema but not used for uniqueness check (email is), we just provide it.
        expect(registerResponse.ok()).toBeTruthy();
        const registerBody = await registerResponse.json();
        expect(registerBody.message).toBe("User registered successfully");

        // 2. Login
        const loginResponse = await request.post(`${BASE_URL}/api/v1/auth/login/access-token`, {
            form: {
                username: email, // OAuth2PasswordRequestForm expects 'username' field, which we map to email
                password: password
            }
        });

        expect(loginResponse.ok()).toBeTruthy();
        const loginBody = await loginResponse.json();
        expect(loginBody).toHaveProperty('access_token');
        expect(loginBody.token_type).toBe('bearer');

        const token = loginBody.access_token;

        // 3. Get Portfolio Summary (Should be empty)
        const summaryResponse = await request.get(`${BASE_URL}/api/v1/portfolio/summary`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        expect(summaryResponse.ok()).toBeTruthy();
        const summaryBody = await summaryResponse.json();
        expect(summaryBody.data.total_invested).toBe(0);

        // 4. Add Investment
        const investmentData = {
            investment_type: 'mutual_fund',
            fund_name: 'Test Fund (123456)',
            invested_amount: 10000,
            current_value: 11000
        };

        const addFundResponse = await request.post(`${BASE_URL}/api/v1/portfolio/funds`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            data: investmentData
        });
        expect(addFundResponse.ok()).toBeTruthy();
        const addFundBody = await addFundResponse.json();
        expect(addFundBody.message).toBe("Investment added successfully");

        // 5. Get Portfolio Summary Again (Should reflect investment)
        const summaryResponse2 = await request.get(`${BASE_URL}/api/v1/portfolio/summary`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        expect(summaryResponse2.ok()).toBeTruthy();
        const summaryBody2 = await summaryResponse2.json();
        expect(Number(summaryBody2.data.total_invested)).toBe(10000);
        expect(Number(summaryBody2.data.total_current)).toBe(11000);
    });
});
