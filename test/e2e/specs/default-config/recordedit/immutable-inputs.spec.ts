import { expect, Locator, test } from '@playwright/test';
import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';

import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { testInputValue, testSubmission } from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

const testParams = {
  schemaName: 'defaults',
  tableName: 'defaults-table',
  create: {
    columns: [
      { name: 'asset_disabled', displayname: 'asset_disabled', type: RecordeditInputType.FILE, value: '28110_191_z.jpg', disabled: false },
      { name: 'asset_disabled_no_default', displayname: 'asset_disabled_no_default', type: RecordeditInputType.FILE, disabled: true },

      { name: 'text', displayname: 'text', type: RecordeditInputType.TEXT, value: 'default', disabled: false },
      { name: 'text_disabled', displayname: 'text_disabled', type: RecordeditInputType.TEXT, value: 'Disabled input', disabled: true },

      { name: 'markdown', displayname: 'markdown', type: RecordeditInputType.MARKDOWN, value: '**bold**', disabled: false },
      { name: 'markdown_disabled', displayname: 'markdown_disabled', type: RecordeditInputType.MARKDOWN, value: '*italics*', disabled: true },

      {
        name: 'iKS50idGfVCGnnS6lUoZ8Q', displayname: 'foreign_key', type: RecordeditInputType.FK_POPUP,
        value: 'Default for foreign_key column', disabled: false
      },
      {
        name: '2PO3pruPa9O5g7nNztzMjQ', displayname: 'foreign_key_dropdown', type: RecordeditInputType.FK_DROPDOWN,
        value: 'Default for foreign_key_dropdown column', disabled: false
      },
      {
        name: 'WnsyE4pJ1O0IW8zsj6MDHg', displayname: 'foreign_key_disabled', type: RecordeditInputType.FK_POPUP,
        value: 'Default for foreign_key_disabled column', disabled: true
      },

      { name: 'int', displayname: 'int', type: RecordeditInputType.INT_4, value: '25', disabled: false },
      { name: 'int_disabled', displayname: 'int_disabled', type: RecordeditInputType.INT_4, value: '20', disabled: true },

      { name: 'float', displayname: 'float', type: RecordeditInputType.NUMBER, value: '1.6478', disabled: false },
      { name: 'float_disabled', displayname: 'int_disabled', type: RecordeditInputType.NUMBER, value: '93.2182', disabled: true },

      { name: 'boolean_true', displayname: 'boolean_true', type: RecordeditInputType.BOOLEAN, value: 'true', disabled: false },
      { name: 'boolean_false', displayname: 'boolean_false', type: RecordeditInputType.BOOLEAN, value: 'false', disabled: false },
      { name: 'boolean_disabled', displayname: 'boolean_disabled', type: RecordeditInputType.BOOLEAN, value: 'false', disabled: true },

      { name: 'date', displayname: 'date', type: RecordeditInputType.DATE, value: '2010-06-08', disabled: false },
      { name: 'date_disabled', displayname: 'date_disabled', type: RecordeditInputType.DATE, value: '2014-05-12', disabled: true },

      {
        name: 'timestamp', displayname: 'timestamp', type: RecordeditInputType.TIMESTAMP, disabled: false,
        value: { date_value: '2016-05-14', time_value: '17:30:00' }
      },
      {
        name: 'timestamp_disabled', displayname: 'timestamp_disabled', type: RecordeditInputType.TIMESTAMP, disabled: true,
        value: { date_value: '2012-06-22', time_value: '18:36:00' }
      },
      {
        name: 'timestamp_disabled_no_default', displayname: 'timestamp_disabled_no_default',
        type: RecordeditInputType.TIMESTAMP, disabled: true, autoGenerated: true
      },

      {
        name: 'timestamptz', displayname: 'timestamptz', type: RecordeditInputType.TIMESTAMP, disabled: false,
        value: { date_value: '2014-05-07', time_value: '14:40:00' }
      },
      {
        name: 'timestamptz_disabled', displayname: 'timestamptz_disabled', type: RecordeditInputType.TIMESTAMP, disabled: true,
        value: { date_value: '2010-06-13', time_value: '17:22:00' }
      },
      {
        name: 'timestamptz_disabled_no_default', displayname: 'timestamptz_disabled_no_default',
        type: RecordeditInputType.TIMESTAMP, disabled: true, autoGenerated: true
      },

      {
        name: 'json', displayname: 'json', type: RecordeditInputType.JSON, disabled: false,
        value: JSON.stringify({ 'name': 'testing_json' })
      },
      {
        name: 'json_disabled', displayname: 'json_disabled', type: RecordeditInputType.JSON, disabled: true,
        value: JSON.stringify(98.786)
      },
      {
        name: 'json_disabled_no_default', displayname: 'json_disabled_no_default', type: RecordeditInputType.JSON,
        disabled: true, autoGenerated: true
      },

      { name: 'color_rgb_hex', displayname: 'color_rgb_hex', type: RecordeditInputType.COLOR, value: '#123456', disabled: false },
      { name: 'color_rgb_hex_disabled', displayname: 'text_disabled', type: RecordeditInputType.COLOR, value: '#654321', disabled: true },

      { name: 'RID', displayname: 'RID', type: RecordeditInputType.TEXT, disabled: true, autoGenerated: true },
      { name: 'RCB ', displayname: 'RCB ', type: RecordeditInputType.TEXT, disabled: true, autoGenerated: true },
      { name: 'RMB ', displayname: 'RMB ', type: RecordeditInputType.TEXT, disabled: true, autoGenerated: true },
      { name: 'RCT', displayname: 'RCT', type: RecordeditInputType.TIMESTAMP, disabled: true, autoGenerated: true },
      { name: 'RMT', displayname: 'RMT', type: RecordeditInputType.TIMESTAMP, disabled: true, autoGenerated: true },
    ],
    submission: {
      tableDisplayname: 'defaults-table',
      resultColumnNames: [
        'text', 'text_disabled', 'markdown', 'markdown_disabled',
        'foreign_key', 'foreign_key_dropdown', 'foreign_key_disabled',
        'int', 'int_disabled', 'float', 'float_disabled', 'boolean_true', 'boolean_false', 'boolean_disabled',
        'date', 'date_disabled', 'timestamp', 'timestamp_disabled', 'timestamptz', 'timestamptz_disabled',
        'json', 'json_disabled', 'color_rgb_hex', 'color_rgb_hex_disabled'
      ],
      resultRowValues: [[
        'default', 'Disabled input', 'bold', 'italics',
        { caption: 'Default for foreign_key column', url: '/defaults:foreign-text-table/' },
        { caption: 'Default for foreign_key_dropdown column', url: '/defaults:foreign-dropdown-table/' },
        { caption: 'Default for foreign_key_disabled column', url: '/defaults:foreign-text-disabled-table/' },
        '25', '20', '1.6478', '93.2182', 'true', 'false', 'false', '2010-06-08', '2014-05-12', '2016-05-14 17:30:00',
        '2012-06-22 18:36:00', '2014-05-07 14:40:00', '2010-06-13 17:22:00', JSON.stringify({ 'name': 'testing_json' }, undefined, 2),
        JSON.stringify(98.786, undefined, 2), '#123456', '#654321'
      ]]
    }
  },
  edit: {
    columns: [
      { name: 'asset_disabled', displayname: 'asset_disabled', type: RecordeditInputType.FILE, value: '28110_191_z.jpg', disabled: false },
      { name: 'text_disabled', displayname: 'text_disabled', type: RecordeditInputType.TEXT, value: 'Disabled input' },
      { name: 'markdown_disabled', displayname: 'markdown_disabled', type: RecordeditInputType.MARKDOWN, value: '*italics*', disabled: true },
      {
        name: 'WnsyE4pJ1O0IW8zsj6MDHg', displayname: 'foreign_key_disabled', type: RecordeditInputType.FK_POPUP,
        value: 'Default for foreign_key_disabled column', disabled: true
      },
      { name: 'int_disabled', displayname: 'int_disabled', type: RecordeditInputType.INT_4, value: '20', disabled: true },
      { name: 'float_disabled', displayname: 'int_disabled', type: RecordeditInputType.NUMBER, value: '93.2182', disabled: true },
      { name: 'boolean_disabled', displayname: 'boolean_disabled', type: RecordeditInputType.BOOLEAN, value: 'false', disabled: true },
      { name: 'date_disabled', displayname: 'date_disabled', type: RecordeditInputType.DATE, value: '2014-05-12', disabled: true },
      {
        name: 'timestamp_disabled', displayname: 'timestamp_disabled', type: RecordeditInputType.TIMESTAMP, disabled: true,
        value: { date_value: '2012-06-22', time_value: '18:36:00' }
      },
      {
        name: 'timestamptz_disabled', displayname: 'timestamptz_disabled', type: RecordeditInputType.TIMESTAMP, disabled: true,
        value: { date_value: '2010-06-13', time_value: '17:22:00' }
      },
      {
        name: 'json_disabled', displayname: 'json_disabled', type: RecordeditInputType.JSON, disabled: true,
        value: JSON.stringify(98.786)
      },
      { name: 'color_rgb_hex_disabled', displayname: 'text_disabled', type: RecordeditInputType.COLOR, value: '#654321', disabled: true },
    ]
  }

}

test.describe('Immutable and Generated columns', () => {
  test.describe.configure({ mode: 'parallel' });

  test('Create mode', async ({ page, baseURL }, testInfo) => {
    await test.step('open recordedit page', async () => {
      await page.goto(generateChaiseURL(APP_NAMES.RECORDEDIT, testParams.schemaName, testParams.tableName, testInfo, baseURL));
      await RecordeditLocators.waitForRecordeditPageReady(page);
    });

    for await (const col of testParams.create.columns) {
      await test.step(`${col.displayname}`, async () => {
        await test.step(`display ${col.disabled ? 'disabled' : ''} input with proper value`, async () => {
          await testInputValue(page, 1, col.name, col.displayname, col.type, col.disabled, col.value);
        });

        if (col.autoGenerated) {
          await test.step('display the "Automatically generated" placeholder', async () => {
            switch (col.type) {
              case RecordeditInputType.TIMESTAMP:
                const props = RecordeditLocators.getTimestampInputsForAColumn(page, col.name, 1);
                await testAutomaticallyGenerated(props.time, col.displayname);
                await testAutomaticallyGenerated(props.date, col.displayname);
                break;
              case RecordeditInputType.FILE:
              case RecordeditInputType.FK_DROPDOWN:
              case RecordeditInputType.FK_POPUP:
              case RecordeditInputType.BOOLEAN:
                await expect.soft(RecordeditLocators.getInputPlaceholderMessage(page, col.name, 1)).toHaveText('Automatically generated');
                break;
              default:
                await testAutomaticallyGenerated(RecordeditLocators.getInputForAColumn(page, col.name, 1), col.displayname);
                break;
            }
          });
        }
      })
    }

    await test.step('submit and save the data', async () => {
      await testSubmission(page, testParams.create.submission);
    });
  });

  test('Edit mode', async ({ page, baseURL }, testInfo) => {
    await test.step('open recordedit page', async () => {
      await page.goto(generateChaiseURL(APP_NAMES.RECORDEDIT, testParams.schemaName, testParams.tableName, testInfo, baseURL) + '/id=2');
      await RecordeditLocators.waitForRecordeditPageReady(page);
    });

    await test.step('display immutable inputs properly with their values.', async () => {
      for await (const col of testParams.edit.columns) {
        await test.step(`${col.displayname}`, async () => {
          await testInputValue(page, 1, col.name, col.displayname, col.type, true, col.value);
        });
      }
    });
  });

})

const testAutomaticallyGenerated = async (inp: Locator, displayname: string) => {
  await expect.soft(inp, displayname).toHaveAttribute('placeholder', 'Automatically generated');
}

