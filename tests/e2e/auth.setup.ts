import { test as setup, expect } from '@playwright/test';

/**
 * Authentication Setup for Production E2E Tests
 *
 * This script performs interactive Google OAuth login and saves the auth state
 * for use by other tests. Run this once before running production tests.
 *
 * Usage:
 *   npm run test:e2e:prod:auth
 *
 * This will:
 * 1. Open a browser to the production site
 * 2. Wait for you to complete Google OAuth login manually
 * 3. Save the auth state to playwright/.auth/user.json
 *
 * After running this, all other tests will use the saved auth state.
 */

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to the site - will redirect to Google OAuth
  await page.goto('/');

  console.log('\n');
  console.log('='.repeat(60));
  console.log('MANUAL AUTHENTICATION REQUIRED');
  console.log('='.repeat(60));
  console.log('');
  console.log('1. A browser window has opened');
  console.log('2. Complete the Google OAuth login');
  console.log('3. Once you see the Decision Queue page, the test will continue');
  console.log('');
  console.log('Waiting for authentication...');
  console.log('');

  // Wait for the user to complete authentication
  // We know we're authenticated when we see the Decision Queue header
  await page.waitForSelector('h1:has-text("Decision Queue")', {
    timeout: 120000, // 2 minutes to complete login
  });

  console.log('Authentication successful!');
  console.log('Saving auth state to:', authFile);

  // Save the auth state
  await page.context().storageState({ path: authFile });

  console.log('');
  console.log('Auth state saved. You can now run:');
  console.log('  npm run test:e2e:prod');
  console.log('');
});
