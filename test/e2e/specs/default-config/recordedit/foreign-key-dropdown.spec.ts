import { test, expect } from '@playwright/test';

// locators
import RecordeditLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';

// utils
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { testSubmission } from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

const testParams = {
  table_name: 'fkey-dropdown',
  schema_name: 'fk-display-mode',
  table_displayname: 'fkey-dropdown',
  fk1_name: 'Y8Fm0o1t3FcHt0S8UjXs6A',
  fk2_name: 'jZz6GY0Bq-0EXpzflh6zZg',
  fk3_name: '-wCXD7GyYPDYVhTgm9in3A',
  column_names: ['fk1 dropdown', 'fk2 dropdown', 'fk3 dropdown'],
  column_values: [['two', 'five', 'six']]
};

test('Presentation and functionality of foreign key dropdown support', async ({ page, baseURL }, testInfo) => {
  await test.step('should load recordedit page', async () => {
    await page.goto(generateChaiseURL(APP_NAMES.RECORDEDIT, testParams.schema_name, testParams.table_name, testInfo, baseURL));
    await RecordeditLocators.waitForRecordeditPageReady(page);
  });

  await test.step('should have 3 fkey dropdowns on the page', async () => {
    await expect.soft(RecordeditLocators.getFkeyDropdowns(page)).toHaveCount(3);
  });

  await test.step('fk1 should have 25+ values', async () => {
    await RecordeditLocators.getDropdownElementByName(page, testParams.fk1_name, 1).click();
    await expect.soft(RecordeditLocators.getDropdownSelectableOptions(page)).toHaveCount(25);
  });

  await test.step('clicking "... load more" should load 15 more options (40 total)', async () => {
    await RecordeditLocators.getDropdownLoadMoreRow(page).click();
    await expect.soft(RecordeditLocators.getDropdownSelectableOptions(page)).toHaveCount(40);
  });

  await test.step('adding a search term of twenty should limit the displayed set to 10', async () => {
    await RecordeditLocators.getDropdownSearch(page).fill('twenty');
    await expect.soft(RecordeditLocators.getDropdownSelectableOptions(page)).toHaveCount(10);
  });

  await test.step('clearing the search term should show the first set of 25 rows again and select option 2', async () => {
    await RecordeditLocators.getDropdownSearch(page).clear();

    const dropdownOptions = RecordeditLocators.getDropdownSelectableOptions(page);
    await expect.soft(dropdownOptions).toHaveCount(25);

    await dropdownOptions.nth(1).click();
  });

  await test.step('fk2 should have 20 values and select option 5', async () => {
    await RecordeditLocators.getDropdownElementByName(page, testParams.fk2_name, 1).click();

    const dropdownOptions = RecordeditLocators.getDropdownSelectableOptions(page);
    await expect.soft(dropdownOptions).toHaveCount(20);

    await dropdownOptions.nth(4).click();
  });

  await test.step('fk3 should have 20 values and select option 6', async () => {
    await RecordeditLocators.getDropdownElementByName(page, testParams.fk3_name, 1).click();

    const dropdownOptions = RecordeditLocators.getDropdownSelectableOptions(page);
    await expect.soft(dropdownOptions).toHaveCount(20);
    await dropdownOptions.nth(5).click();
  });

  await test.step('submit the record', async () => {
    await testSubmission(page, {
      tableDisplayname: testParams.table_displayname,
      resultColumnNames: testParams.column_names,
      resultRowValues: testParams.column_values
    })
  });
});
