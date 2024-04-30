import { test, expect } from '@playwright/test';

// locators
import PageLocators from '@isrd-isi-edu/chaise/test/e2e/locators/page';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';

const appName = ['recordedit', 'recordset'];
test.describe('Page Footer', () => {
    appName.forEach((name: string) => {

        test.beforeEach(async ({ page, baseURL }, testInfo) => {
            const PAGE_URL = `/${name}/#${getCatalogID(testInfo.project.name)}/product:accommodation`

            await page.goto(`${baseURL}${PAGE_URL}`);
        });

        test('Checking footer in ' + name + ' page:', async ({ page }) => {
            const footerMain = PageLocators.getFooterContainer(page);
            const footerLink = PageLocators.getFooterLink(page);
            
            await test.step('footer should be visible on load', async () => {    
                await expect.soft(footerMain).toBeVisible();
            });

            await test.step('Page footer link should be visible', async () => {
                await expect.soft(footerLink).toBeVisible();
            })

            await test.step('Page footer link should match with "privacy-policy"', async () => { 
                await expect.soft(footerLink).toHaveAttribute('href', /privacy-policy/);
            })

        });
    });
});
