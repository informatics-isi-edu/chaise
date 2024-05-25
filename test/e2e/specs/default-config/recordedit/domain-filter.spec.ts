import { test, expect, TestInfo, Page } from '@playwright/test';
import RecordeditLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';

import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';

const multiColName = 'multi_constrained_col';
const colWFkeys = 'col_w_fkeys';
const colWFkeysDefault = 'col_w_fkeys_default';
const colWNullFkeys = 'col_w_null_fkey_key';

test.describe('domain filter pattern support', () => {

  test('create mode', async ({ page, baseURL }, testInfo) => {
    await openRecordediPage(page, baseURL, testInfo);

    await test.step('domain filter with a static value.', async () => {
      await testModalCount(page, 'position_fixed_col', 3, true);
    })

    await test.step('should not limit the fk set before setting either values for multi constrained fk.', async () => {
      await testModalCount(page, multiColName, 7);
    });

    await test.step('domain filter with a dynamic value from a text entry box', async () => {
      await test.step('should have the full set if text input is empty.', async () => {
        await testModalCount(page, 'position_fk_col', 7)
      });

      await test.step('should limit the set if text input has value.', async () => {
        await RecordeditLocators.getInputForAColumn(page, 'position_text_col', 1).fill('relative');
        await testModalCount(page, 'position_fk_col', 1, true);
      });
    });

    await test.step('should not limit the fk set before setting the 2nd value for multi constrained fk.', async () => {
      await testModalCount(page, multiColName, 7);
    });

    await test.step('domain filter for dropdown fk with a dynamic value from a fk', async () => {
      const fkName = 'PtPzjGmWZiUNMyrIk1LA8g';

      await test.step('should have the full set if fk input is empty.', async () => {
        await testDropdownCount(page, fkName, 7);
      });

      await test.step('should limit the set if fk input has value.', async () => {
        // this will select the constraint
        await testModalCount(page, 'fk1', 4, true);
        // this will make sure the fk dropdown now is constrainted and then will pick the first
        await testDropdownCount(page, fkName, 3, true);
      });
    });

    await test.step('domain filter with a conjunction, should limit the set', async () => {
      await testModalCount(page, multiColName, 1, true, 'fk2 is 1');
    });

    await test.step('domain filter with a dynamic value from other fk tables.', async () => {

      // open col_w_fkeys
      await test.step('should not limit the set before setting the value for other foreignkey in absence of default value.', async () => {
        await testModalCount(page, colWFkeys, 7);
      });

      // open col_w_fkeys_default, select something.
      await test.step('should limit the set before setting the value if other foreignkey has default value.', async () => {
        await testModalCount(page, colWFkeysDefault, 2, true, 'other fk values: 1, fixed');
      });

      // clear col_w_fkeys_default, open col_w_fkeys
      await test.step('after clearing the foreignkey, it should not limit the set.', async () => {
        await RecordeditLocators.getForeignKeyInputClear(page, colWFkeysDefault, 1).click();
        await testModalCount(page, colWFkeys, 7);
      });
    });

    await test.step('foreign key popup where the column is nullable, only rows with non null keys should show in modal selector', async () => {
      // There are 5 rows in the table but the term column is null for 3 of the 5 rows
      await testModalCount(page, colWNullFkeys, 2);
    });
  });

  test('edit mode', async ({ page, baseURL }, testInfo) => {
    await openRecordediPage(page, baseURL, testInfo, 'id=1');

    await test.step('domain filter with a dynamic value from other fk', async () => {
      await test.step('if foreign key has value, the foreignkey that is using its value should be limited.', async () => {
        await testModalCount(page, colWFkeysDefault, 1, false, 'other fk values: 3, absolute');
      });

      await test.step('otherwise it should not be limited.', async () => {
        await testModalCount(page, colWFkeys, 7)
      });
    });

  });

});


const openRecordediPage = async (page: Page, baseURL: string | undefined, testInfo: TestInfo, filter?: string) => {
  await test.step('should load the page.', async () => {
    const url = `${baseURL}/recordedit/#${getCatalogID(testInfo.project.name)}/fk-filter-pattern:main-entity-table/${filter ? filter : ''}`;
    await page.goto(url);
    await RecordeditLocators.waitForRecordeditPageReady(page);
  });
}

const testModalCount = async (page: Page, displayname: string, expectedCount: number, choose?: boolean, filterValue?: string) => {
  const fkModal = ModalLocators.getForeignKeyPopup(page);
  await RecordeditLocators.getForeignKeyInputDisplay(page, displayname, 1).click();

  await expect.soft(fkModal).toBeVisible();
  await expect.soft(ModalLocators.getModalTitle(fkModal)).toContainText('Select');
  await expect.soft(RecordsetLocators.getRows(fkModal)).toHaveCount(expectedCount);

  //make sure the filter chiclet is displayed or not
  const filters = RecordsetLocators.getFacetFilters(page);
  if (filterValue) {
    await expect.soft(filters).toBeVisible();
    await expect.soft(filters).toHaveCount(1);
    await expect.soft(filters.first()).toHaveText(filterValue);
  } else {
    await expect.soft(filters).not.toBeAttached();
  }

  if (choose) {
    // choose the first row which will close the modal
    await RecordsetLocators.getRowSelectButton(fkModal, 0).click();
  } else {
    // close the modal if we don't need to select anything
    await ModalLocators.getCloseBtn(fkModal).click();
  }

  await expect.soft(fkModal).not.toBeAttached();
};

const testDropdownCount = async (page: Page, name: string, expectedCount: number, choose?: boolean) => {
  const fkDropdownBtn = RecordeditLocators.getDropdownElementByName(page, name, 1);
  await fkDropdownBtn.click();
  const dropdownOptions = RecordeditLocators.getDropdownSelectableOptions(page);
  await expect.soft(dropdownOptions).toHaveCount(expectedCount);
  if (choose) {
    // choose the first row which will close the dropdown
    await dropdownOptions.first().click();
  } else {
    // click it again to close it.
    await fkDropdownBtn.click();
  }
  await expect.soft(dropdownOptions).not.toBeAttached();

}
