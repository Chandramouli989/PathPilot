import { test, expect } from '@playwright/test';

test.describe('PathPilot browser smoke tests', () => {
  test('root redirects an unauthenticated visitor to login', async ({ page }) => {
    // This test intentionally removes the authenticated storage state supplied
    // by the setup project, so it exercises the public/unauthenticated path.
    await page.goto('/login');
    await page.evaluate(() => localStorage.removeItem('token'));
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /sign in to your account/i })).toBeVisible();
  });

  test('the saved QA session reaches the dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('link', { name: /overview/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
  });

  test('authenticated workspace routes render without redirecting to login', async ({ page }) => {
    const routes = [
      '/assessment', '/recommendations', '/roadmaps', '/progress', '/intelligence',
      '/opportunities', '/applications', '/interview-studio', '/github-portfolio',
      '/project-evidence', '/profile', '/skill-checks', '/coding-challenges'
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`${route.replaceAll('/', '\\/')}\\/?$`));
      await expect(page.locator('main.main-area')).toBeVisible();
      await expect(page.locator('main.main-area .page-content')).toBeVisible();
    }
  });

  test('sign out returns the visitor to login and protects the dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });
});
