import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const authFile = path.join('tests', '.auth', 'user.json');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      testMatch: /.*\.spec\.js/,
      dependencies: ['auth-setup'],
      use: { ...devices['Desktop Chrome'], storageState: authFile },
    },
  ],
});
