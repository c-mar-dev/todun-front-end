import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for Production
 *
 * Tests against https://rdx.mrtnt.xyz/
 *
 * Run tests:
 *   npm run test:e2e:prod:auth   # Set up authentication (run once)
 *   npm run test:e2e:prod        # Run production tests
 *   npm run test:e2e:prod:ui     # Run with UI mode
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/workflows.spec.ts', '**/production.spec.ts'],

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only (not in auth setup)
  retries: process.env.CI ? 2 : 0,

  // Single worker for production tests to avoid rate limiting
  workers: 1,

  // Reporter to use
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report-production' }],
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for production
    baseURL: 'https://rdx.mrtnt.xyz',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Longer timeout for production (network latency)
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // Video on failure for debugging
    video: 'on-first-retry',
  },

  // Global timeout per test
  timeout: 60000,

  // Configure projects for different browsers
  projects: [
    // Auth setup project - run this first to authenticate
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        // No storage state for auth setup
      },
    },
    // Main tests - depend on auth setup
    {
      name: 'chromium',
      testMatch: /workflows\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        // Use stored auth state
        storageState: 'playwright/.auth/user.json',
      },
    },
    // Standalone tests that handle auth themselves
    {
      name: 'chromium-standalone',
      testMatch: /workflows\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  // No webServer - we're testing against production
});
