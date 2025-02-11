// @ts-check
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/e2e', // Directory where tests are located
  timeout: 30 * 1000, // 30 seconds timeout per test
  expect: {
    timeout: 5000, // Assertion timeout
  },
  fullyParallel: true, // Run all tests in parallel
  retries: 1, // Retry failed tests twice
  workers: 2, // Run tests in two workers
  reporter: 'html', // Generates an HTML report
  use: {
    baseURL: 'http://localhost:4200', // Adjust URL if needed
    headless: true, // Run tests in headless mode
    // trace: 'on-first-retry', // Capture trace on first retry
    screenshot: 'only-on-failure', // Capture screenshot on failure
    video: 'retain-on-failure', // Record video on failure
  },
  projects: [
    {
      name: "e2e",
      testDir: "./playwright/e2e/tests",
      testMatch: "**/*.spec.js",
    },
  ],
 

});



