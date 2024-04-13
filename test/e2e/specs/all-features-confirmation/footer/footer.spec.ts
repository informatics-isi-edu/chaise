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
                await footerMain.waitFor({ state: 'visible' });
            });

            await test.step('Page footer link should be visible', async () => {
                await footerLink.waitFor({ state: 'visible' });
            })

            await test.step('Page footer link should match with "privacy-policy"', async () => { 
                const prevLink = await footerLink.getAttribute('href') || '';

                // slice off the last
                const plink = prevLink.slice(0, -1);
                expect.soft(plink.substring(plink.lastIndexOf('/') + 1)).toEqual('privacy-policy');
            })

        });
    });
});
