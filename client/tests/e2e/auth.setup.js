import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const authFile = path.join('tests', '.auth', 'user.json');
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

setup('authenticate the dedicated PathPilot QA account once', async ({ page }) => {
  if (!email || !password) {
    throw new Error('Set E2E_EMAIL and E2E_PASSWORD to a dedicated PathPilot QA account before running E2E tests.');
  }

  await page.goto('/login');
  await page.getByLabel(/email address/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator('main.main-area')).toBeVisible();

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
