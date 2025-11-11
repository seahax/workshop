import { expect, test } from '@playwright/test';

test('mindbody', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('https://www.mindbodyonline.com/explore');
  await expect(page).toHaveTitle(/Mindbody/);

  await page.locator('#truste-consent-button').click();

  await page.getByRole('button', { name: 'Log In' }).click();
  await page.getByLabel('Email').fill('chris@topher.land');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Password').fill('Taekwondo6-Tiara5-Strewn1');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.getByText('Upcoming').waitFor();

  await page.goto('https://www.mindbodyonline.com/explore/locations/olympic-athletic-club-old-ballard-seattle-wa');
  await page.getByRole('button', { name: 'Appointments', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Lap Swim' }).click();
  await page.locator('ul > div')
    .filter({ hasText: '30 minutes - Shared Lap Swim' })
    .getByRole('button', { name: 'Book Now' })
    .click();
  await page.getByText('Select Staff').waitFor();
  await page.getByRole('button', { name: 'Any staff' }).click();

  await page.locator('section').filter({ hasText: 'Select Date' }).getByLabel('Nov 11 2025').click();

  await page.locator('section')
    .filter({ hasText: 'Select Time' })
    .getByRole('listitem')
    .filter({ hasText: '7:30 pm' })
    .getByRole('button', { name: 'Select' })
    .click();

  await page.getByRole('button', { name: 'Proceed' }).click();

  await page.getByText('3003').click();
  await page.getByRole('option').filter({ hasText: '3003' }).click();

  await page.getByRole('button', { name: 'Book Now' }).click();
  await page.screenshot({ path: 'test-results/mindbody-booking.png', fullPage: true });
});
