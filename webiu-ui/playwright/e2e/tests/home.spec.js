import { test, expect } from '@playwright/test';
import HomePage from '../../pages/homePage';

let homePage;
let page;
let context;
let browser;

test.describe("Home Page", () => {
  test.beforeAll(async ({ browser: browserInstance }) => {
    browser = browserInstance;
    context = await browser.newContext();
    page = await context.newPage();

    homePage = new HomePage(page);
  });

  test('go to home page', async () => {
    await homePage.visit();

    // Check if URL contains port 4200
    expect(page.url()).toContain(':4200');

    // Ensure "Home" text is visible
    await expect(page.locator('div').filter({ hasText: /^Home$/ })).toBeVisible();

    // Ensure "Welcome to C2SI" heading is visible
    await expect(page.getByRole('heading', { name: 'Welcome to C2SI' })).toBeVisible();

    // Ensure the "app-homepage" component matches the snapshot
    await expect(page.locator('app-homepage')).toHaveScreenshot('home-snapshots/homepage.png');
  });

  test.afterAll(async () => {
    await context.close();
  });
});
