import { expect, Locator, Page } from "@playwright/test"
import RecordsetLocators from "../locators/recordset";

export type RecordsetRowValue = string[] | {
  url: string,
  caption: string
}[]


export async function testRecordsetTableRowValues(container: Page | Locator, expectedRowValues: RecordsetRowValue[], isSoft?: boolean) {
  const expectFn = isSoft ? expect.soft : expect;

  const rows = RecordsetLocators.getRows(container);

  await expectFn(rows).toHaveCount(expectedRowValues.length);


  let index = 0;
  for (const expectedRow of expectedRowValues) {
    const cells = rows.nth(index).locator('td');

    // action-btns cell is also returned here (that's why +1)
    await expectFn(cells).toHaveCount(expectedRow.length + 1);

    const temp = expectedRow[index];

    for (let innerIndex = 0; innerIndex < expectedRow.length; innerIndex++) {
      const expectedCell = expectedRow[innerIndex];

      // action-btns cell is also returned here (that's why +1)
      const cell = cells.nth(innerIndex + 1);
      await expectFn(cell).toBeVisible();

      if (typeof expectedCell === 'string') {
        await expectFn(cell).toHaveText(expectedCell);
      } else {
        const link = cell.locator('a');
        expectFn(await link.getAttribute('href')).toContain(expectedCell.url);
        await expectFn(link).toHaveText(expectedCell.caption);
      }
    }

    index++;
  }
}
