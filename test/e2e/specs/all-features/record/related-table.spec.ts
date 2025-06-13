import { expect, Locator, Page, test } from '@playwright/test';
import moment from 'moment';

//locators
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

//utils
import { getCatalogID, getEntityRow, importACLs } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { APP_NAMES, RESTRICTED_USER_STORAGE_STATE } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { clickNewTabLink, testTooltip } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';
import {
  testAddAssociationTable, testAddRelatedTable, testAddRelatedWithForeignKeyMultiPicker,
  testBatchUnlinkAssociationTable, testRelatedTablePresentation, testShareCiteModal
} from '@isrd-isi-edu/chaise/test/e2e/utils/record-utils';
import { testModalClose, testRecordsetTableRowValues, testTotalCount } from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';
import { testInputValue } from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';


const testParams = {
  schemaName: 'product-unordered-related-tables-links',
  table_name: 'accommodation',
  key: {
    name: 'id',
    value: '2004',
    operator: '='
  },
  headers: [
    'booking', // normal
    'schedule', // has search
    'media', // has row_markdown_pattern
    'association_table', // association
    'accommodation_image', // association with page_size
    'association_table_markdown', // association with markdown
    'related_table_2', // related entity with path length 3, wait_for entity set but no markdown patt
    'table_w_aggregates', // related entity with aggregate columns
    'table_w_invalid_row_markdown_pattern', // related entity with invalid row_markdown_pattern
    'inbound related with display.wait_for entityset', //related entity with wait_for entityset and markdown patt
    'inbound related with display.wait_for agg', //related entity with wait_for agg and markdown pattern
    'inbound related with filter on main table', // related entity with filter on main table
    'inbound related with filter on related table', // related entity with filter on related table
    'association with filter on main table',
    'association with filter on related table', // association with filter on related table
    'path of length 3 with filters', // path of length 3 with filters
    'association_table_w_static_column', // "almost" pure and binary multi create foreign key with fk input modals
    'association_table_w_static_column_dropdown', // "almost" pure and binary multi create foreign key with fk input dropdowns
    'association_table_w_three_fks' // association table with 3 foreign keys and multi create foreign key with annotation
  ],
  tocHeaders: [
    'Summary', 'booking (6)', 'schedule (2)', 'media (1)', 'association_table (1)',
    'accommodation_image (2+)', 'association_table_markdown (1)', 'related_table_2 (1)',
    'table_w_aggregates (2)', 'table_w_invalid_row_markdown_pattern (1)',
    'inbound related with display.wait_for entityset (3)',
    'inbound related with display.wait_for agg (3)',
    'inbound related with filter on main table (6)',
    'inbound related with filter on related table (1)',
    'association with filter on main table (1)',
    'association with filter on related table (1)',
    'path of length 3 with filters (1)',
    'association_table_w_static_column (1)',
    'association_table_w_static_column_dropdown (1)',
    'association_table_w_three_fks (1)'
  ],
  scrollToDisplayname: 'table_w_aggregates'
};

// TODO playwright: we should break this file into at least two files

test.describe('Related tables', () => {
  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    const keys = [];
    keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
    await page.goto(generateChaiseURL(APP_NAMES.RECORD, testParams.schemaName, testParams.table_name, testInfo, baseURL) + `/${keys.join('&')}`)

    await RecordLocators.waitForRecordPageReady(page);
  });

  test('overal structure of the page', async ({ page }) => {
    await test.step('table of contents should be displayed properly and in correct order', async () => {
      const tocHeaders = RecordLocators.getSidePanelHeadings(page);
      await expect.soft(tocHeaders).toHaveCount(testParams.tocHeaders.length);
      await expect.soft(tocHeaders).toHaveText(testParams.tocHeaders);
    });

    await test.step('related entities should show in the expected order', async () => {
      const headers = RecordLocators.getDisplayedRelatedTableTitles(page);
      await expect.soft(headers).toHaveCount(testParams.headers.length);
      await expect.soft(headers).toHaveText(testParams.headers);
    });
  });

  test('share popup when the citation annotation has wait_for of all-outbound', async ({ page, baseURL }, testInfo) => {
    const keyValues = [{ column: testParams.key.name, value: testParams.key.value }];
    const ridValue = getEntityRow(testInfo, testParams.schemaName, testParams.table_name, keyValues).RID;
    const link = generateChaiseURL(APP_NAMES.RECORD, testParams.schemaName, testParams.table_name, testInfo, baseURL) + `/RID=${ridValue}`;
    await testShareCiteModal(
      page,
      testInfo,
      {
        title: 'Share and Cite',
        link,
        // the table has history-capture: false
        hasVersionedLink: false,
        verifyVersionedLink: false,
        citation: [
          'Super 8 North Hollywood Motel, accommodation_outbound1_outbound1 two ',
          'https://www.kayak.com/hotels/Super-8-North-Hollywood-c31809-h40498/2016-06-09/2016-06-10/2guests ',
          `(${moment().format('YYYY')}).`,
        ].join(''),
        // we don't need to test this here as well (it has been tested in record presentation)
        bibtextFile: `accommodation_${ridValue}.bib`,
      }
    );
  });

  test('for a one-hop away related entity', async ({ page, baseURL }, testInfo) => {
    await testRelatedTablePresentation(
      page,
      testInfo,
      {
        tableName: 'booking',
        schemaName: 'product-unordered-related-tables-links',
        displayname: 'booking',
        baseTableName: 'Accommodations',
        count: 6,
        canDelete: true,
        canEdit: true,
        inlineComment: 'booking inline comment',
        bulkEditLink: [
          generateChaiseURL(APP_NAMES.RECORDEDIT, 'product-unordered-related-tables-links', 'booking', testInfo, baseURL),
          // we cannot test the actual facet blob since it's based on RID
          // and we also don't have access to ermrestjs here to encode it for us
          '*::facets::'
        ].join('/'),
        viewMore: {
          displayname: 'booking',
          filter: 'AccommodationsSuper 8 North Hollywood Motel'
        },
        rowValues: [
          ['125.0000', '2016-03-12 00:00:00'], // will be deleted
          ['100.0000', '2016-06-01 00:00:00'],
          ['110.0000', '2016-05-19 01:00:00'],
          ['120.0000', '2015-11-10 00:00:00'],
          ['180.0000', '2016-09-04 01:00:00'],
          ['80.0000', '2016-01-01 00:00:00'],
        ],
        rowViewPaths: [
          [{ column: 'accommodation_id', value: '2004' }, { column: 'id', value: '8' }],
          [{ column: 'accommodation_id', value: '2004' }, { column: 'id', value: '9' }],
          [{ column: 'accommodation_id', value: '2004' }, { column: 'id', value: '10' }],
          [{ column: 'accommodation_id', value: '2004' }, { column: 'id', value: '11' }],
          [{ column: 'accommodation_id', value: '2004' }, { column: 'id', value: '12' }],
          [{ column: 'accommodation_id', value: '2004' }, { column: 'id', value: '13' }]
        ]
      }
    );

    await testAddRelatedTable(
      page,
      async (newPage: Page) => {
        const inp = RecordeditLocators.getInputForAColumn(newPage, 'price', 1);
        await inp.fill('247.00');
      },
      {
        tableName: 'booking',
        schemaName: 'product-unordered-related-tables-links',
        displayname: 'booking',
        tableDisplayname: 'booking',
        prefilledValues: {
          'fk_1': { value: 'Super 8 North Hollywood Motel', inputType: RecordeditInputType.FK_POPUP, isDisabled: true }, // the same fk
          'fk_2': { value: 'Super 8 North Hollywood Motel', inputType: RecordeditInputType.FK_POPUP, isDisabled: true }, // superset fk
          'fk2_col': { value: '4', inputType: RecordeditInputType.TEXT, isDisabled: true }, // the second column of fk_2
          'fk_3': { value: 'Select a value', inputType: RecordeditInputType.FK_POPUP, isDisabled: false }, // supserset fk but nullok
          'fk3_col1': { value: '', inputType: RecordeditInputType.TEXT, isDisabled: false },
          'fk_4': { value: 'Super 8 North Hollywood Motel', inputType: RecordeditInputType.FK_POPUP, isDisabled: true }, // supserset fk
          'fk_5': { value: '4: four', inputType: RecordeditInputType.FK_POPUP, isDisabled: true } // the second column of fk_2 that is a fk to another table
        },
        rowValuesAfter: [
          ['247.0000', ''], // 125 is deleted and this one is added
          ['100.0000', '2016-06-01 00:00:00'],
          ['110.0000', '2016-05-19 01:00:00'],
          ['120.0000', '2015-11-10 00:00:00'],
          ['180.0000', '2016-09-04 01:00:00'],
          ['80.0000', '2016-01-01 00:00:00'],
        ]
      }
    );
  });

  test('for a related entity with search applink', async ({ page }, testInfo) => {
    await testRelatedTablePresentation(
      page,
      testInfo,
      {
        schemaName: 'product-unordered-related-tables-links',
        displayname: 'schedule',
        tableName: 'schedule',
        baseTableName: 'Accommodations',
        count: 2,
        viewMore: {
          displayname: 'schedule',
          filter: 'AccommodationsSuper 8 North Hollywood Motel'
        }
      }
    )
  });

  test('for a related entity with row_markdown_pattern', async ({ page }, testInfo) => {
    await testRelatedTablePresentation(
      page,
      testInfo,
      {
        schemaName: 'product-unordered-related-tables-links',
        displayname: 'media',
        tableName: 'media',
        baseTableName: 'Accommodations',
        count: 1,
        canDelete: true,
        canEdit: false,
        markdownValue: '<p>2004</p>\n',
        isMarkdown: true
      }
    )
  });

  test('for a pure and binary association', async ({ page }, testInfo) => {
    await testRelatedTablePresentation(
      page,
      testInfo,
      {
        schemaName: 'product-unordered-related-tables-links',
        displayname: 'association_table',
        tableName: 'association_table',
        associationLeafTableName: 'related_table',
        baseTableName: 'Accommodations',
        isAssociation: true,
        viewMore: {
          displayname: 'related_table',
          filter: 'base table association relatedSuper 8 North Hollywood Motel'
        },
        rowValues: [
          ['Television']
        ],
        rowViewPaths: [
          [{ column: 'id', value: '1' }]
        ],
        count: 1,
        canEdit: true,
      }
    );

    await testAddAssociationTable(page, {
      displayname: 'association_table',
      modalTitle: 'Link association_table to Accommodations: Super 8 North Hollywood Motel',
      totalCount: 5,
      disabledRows: ['1'],
      search: {
        term: 'television|Coffee',
        afterSearchCount: 2,
        afterSearchDisabledRows: ['1']
      },
      selectOptions: [1, 2, 3, 4],
      rowValuesAfter: [
        ['Television'],
        ['Air Conditioning'],
        ['Coffee Maker'],
        ['UHD TV'],
        ['Space Heater']
      ]
    });

    await testBatchUnlinkAssociationTable(page, {
      // we unlink rows 2 and 4 ('Air Conditioning' and 'UHD TV')
      displayname: 'association_table',
      modalTitle: 'Unlink association_table from Accommodations: Super 8 North Hollywood Motel',
      totalCount: 5,
      selectOptions: [1, 3],
      postDeleteMessage: 'All of the 2 chosen records successfully unlinked.',
      rowValuesAfter: [
        ['Television'],
        ['Coffee Maker'],
        ['Space Heater']
      ]
    })
  });

  /**
   * test trying to unlink 2 rows where 1 is allowed and 1 is not
   * verifies the error case works as expected and rows are still selected after failure
   * need to attach a 'postLogin' function to reload the record page we are testing
   */
  test.describe('batch unlink with dynamic acls', () => {
    const params = {
      displayname: 'association_table',
      modalTitle: 'Unlink association_table from Accommodations: Super 8 North Hollywood Motel',
      // 2 have been unlinked by previous test
      totalCount: 3,
      failedPostDeleteMessage: [
        'None of the 2 chosen records could be unlinked. Check the error details below to see more information.',
        'Show Error Details'
      ].join(''),
      successPostDeleteMessage: 'The chosen record successfully unlinked.',
      countAfterUnlink: 2,
      rowValuesAfter: [
        ['Television'],
        ['Coffee Maker']
      ]
    };

    // run with the restricted user
    test.use({ storageState: RESTRICTED_USER_STORAGE_STATE });

    // add acls
    test.beforeAll(async ({ }, testInfo) => {
      const restrictedUserId = process.env.RESTRICTED_AUTH_COOKIE_ID;
      const catalogId = getCatalogID(testInfo.project.name);
      await importACLs({
        'catalog': {
          'id': catalogId,
          'schemas': {
            'product-unordered-related-tables-links': {
              'tables': {
                'accommodation': {
                  'acls': {
                    'select': [restrictedUserId]
                  }
                },
                'related_table': {
                  'acls': {
                    'select': [restrictedUserId],
                    'delete': [restrictedUserId]
                  }
                },
                'association_table': {
                  'acls': {
                    'select': [restrictedUserId]
                  },
                  'acl_bindings': {
                    'can_delete_row': {
                      'types': ['delete'],
                      'projection': [
                        { 'filter': 'id_related', 'operand': 5 }, 'id_related' // 'Space Heater'
                      ],
                      'projection_type': 'nonnull'
                    }
                  }
                }
              }
            }
          }
        }
      });
    });

    test('restricted user', async ({ page }) => {
      const rsModal = ModalLocators.getRecordsetSearchPopup(page);

      await test.step('should fail to unlink rows that can\'t be unlinked with an error message in the batch remove summary', async () => {
        const unlinkBtn = RecordLocators.getRelatedTableUnlinkButton(page, params.displayname);
        await unlinkBtn.click();

        await expect.soft(rsModal).toBeVisible();
        await expect.soft(ModalLocators.getModalTitle(rsModal)).toHaveText(params.modalTitle);
        await expect.soft(RecordsetLocators.getRows(rsModal)).toHaveCount(params.totalCount);

        const expectedText = `Displaying all${params.totalCount}of ${params.totalCount} records`;
        await testTotalCount(rsModal, expectedText);

        // select 'Television' (not deletable)
        await RecordsetLocators.getRowCheckboxInput(rsModal, 0).click();
        // select 'Space Heater' (deletable)
        await RecordsetLocators.getRowCheckboxInput(rsModal, 2).click();

        // click on submit
        await ModalLocators.getSubmitButton(rsModal).click();

        // confirm the unlink
        const confirmModal = ModalLocators.getConfirmDeleteModal(page);
        await expect.soft(confirmModal).toBeVisible();
        await expect.soft(ModalLocators.getModalTitle(confirmModal)).toHaveText('Confirm Unlink');
        await expect.soft(ModalLocators.getModalText(confirmModal)).toHaveText('Are you sure you want to unlink 2 records?');
        const okBtn = ModalLocators.getOkButton(confirmModal);
        await expect.soft(okBtn).toHaveText('Unlink');
        await okBtn.click();
        await expect.soft(confirmModal).not.toBeAttached();

        // make sure summary modal shows up
        const summaryModal = ModalLocators.getErrorModal(page);
        await expect.soft(summaryModal).toBeVisible();
        await expect.soft(ModalLocators.getModalTitle(summaryModal)).toHaveText('Batch Unlink Summary');
        await expect.soft(ModalLocators.getModalText(summaryModal)).toHaveText(params.failedPostDeleteMessage);

        // close the summary modal
        await ModalLocators.getCloseBtn(summaryModal).click();
        await expect.soft(summaryModal).not.toBeAttached();
      });

      await test.step('should have rows still selected after failed delete', async () => {
        // make sure the recordset modal rows don't update
        await expect.soft(RecordsetLocators.getRows(rsModal)).toHaveCount(params.totalCount);

        await expect.soft(RecordsetLocators.getSelectedRowsFilters(rsModal)).toHaveCount(2);
      });

      await test.step('should deselect the 2nd row and resubmit delete', async () => {
        // deselect 'Television' (not deletable)
        await RecordsetLocators.getRowCheckboxInput(rsModal, 0).click();

        // click on submit
        await ModalLocators.getSubmitButton(rsModal).click();

        // confirm the unlink
        const confirmModal = ModalLocators.getConfirmDeleteModal(page);
        await expect.soft(confirmModal).toBeVisible();
        await expect.soft(ModalLocators.getModalTitle(confirmModal)).toHaveText('Confirm Unlink');
        await expect.soft(ModalLocators.getModalText(confirmModal)).toHaveText('Are you sure you want to unlink 1 record?');
        const okBtn = ModalLocators.getOkButton(confirmModal);
        await expect.soft(okBtn).toHaveText('Unlink');
        await okBtn.click();
        await expect.soft(confirmModal).not.toBeAttached();

        // make sure correct values are displayed
        const currentEl = RecordLocators.getRelatedTableAccordion(page, params.displayname);
        await testRecordsetTableRowValues(currentEl, params.rowValuesAfter, true);
      });
    });

    // remove acls
    test.afterAll((async ({ }, testInfo) => {
      const catalogId = getCatalogID(testInfo.project.name);
      await importACLs({
        'catalog': {
          'id': catalogId,
          'schemas': {
            'product-unordered-related-tables-links': {
              'tables': {
                'accommodation': {
                  'acls': {
                    'select': []
                  }
                },
                'related_table': {
                  'acls': {
                    'select': [],
                    'delete': []
                  }
                },
                'association_table': {
                  'acls': {
                    'select': []
                  }
                }
              }
            }
          }
        }
      });
    }));

  });

  test('for a pure and binary association with page_size and hide_row_count', async ({ page }, testInfo) => {
    await testRelatedTablePresentation(
      page,
      testInfo,
      {
        schemaName: 'product-unordered-related-tables-links',
        displayname: 'accommodation_image',
        tableName: 'accommodation_image',
        associationLeafTableName: 'related_name',
        baseTableName: 'Accommodations',
        count: 3,
        pageSize: 2,
        isAssociation: true,
        canEdit: true
      }
    );

    await test.step('Opened modal by `Link` button should honor the page_size and hide_row_count.', async () => {
      const addRelatedRecordLink = RecordLocators.getRelatedTableAddButton(page, 'accommodation_image', false);
      await addRelatedRecordLink.click();

      const rsModal = ModalLocators.getRecordsetSearchPopup(page);
      await expect.soft(rsModal).toBeVisible();
      await expect.soft(ModalLocators.getModalTitle(rsModal)).toHaveText('Link accommodation_image to Accommodations: Super 8 North Hollywood Motel');
      await expect.soft(RecordsetLocators.getRows(rsModal)).toHaveCount(2);

      await testTotalCount(rsModal, 'Displaying first2records');

      await ModalLocators.getCloseBtn(rsModal).click();
      await expect.soft(rsModal).not.toBeAttached();
    });
  });

  test('for a pure and binary association with row_markdown_pattern', async ({ page }, testInfo) => {
    await testRelatedTablePresentation(
      page,
      testInfo,
      {
        schemaName: 'product-unordered-related-tables-links',
        displayname: 'association_table_markdown',
        tableName: 'association_table_markdown',
        entityMarkdownName: ' 1:Television', // space added in markdown name since this is only tested in tooltips and some other tooltips don't have the space
        associationLeafTableName: 'related_table',
        baseTableName: 'Accommodations',
        isAssociation: true,
        isMarkdown: true,
        count: 1,
        canEdit: true,
        canDelete: true
      }
    );
  });

  test('for a related entity with a path of length 3', async ({ page }, testInfo) => {
    await testRelatedTablePresentation(
      page,
      testInfo,
      {
        schemaName: 'product-unordered-related-tables-links',
        displayname: 'related_table_2',
        tableName: 'related_table_2',
        baseTableName: 'Accommodations',
        viewMore: {
          displayname: 'related_table_2',
          filter: 'base table association relatedSuper 8 North Hollywood Motel'
        },
        rowValues: [
          ['one'],
          ['three'],
        ],
        rowViewPaths: [
          [{ column: 'id', value: '1' }], [{ column: 'id', value: '3' }]
        ],
        count: 2, // by load time it's one but when we add another related for the other table this should be updated too.
        canEdit: true,
        canCreate: false,
        canDelete: true
      }
    );
  });

  test('for a related entity with aggregate columns', async ({ page }, testInfo) => {
    await testRelatedTablePresentation(
      page,
      testInfo,
      {
        schemaName: 'product-unordered-related-tables-links',
        displayname: 'table_w_aggregates',
        tableName: 'table_w_aggregates',
        baseTableName: 'Accommodations',
        viewMore: {
          displayname: 'table_w_aggregates',
          filter: 'fk_to_accommodationSuper 8 North Hollywood Motel'
        },
        rowValues: [
          ['1', '100', '100', '1', '1', 'virtual 100 with Super 8 North Hollywood Motel'],
          ['2', '101', '101', '1', '1', 'virtual 101 with Super 8 North Hollywood Motel'],
        ],
        rowViewPaths: [
          [{ column: 'id', value: '1' }], [{ column: 'id', value: '2' }]
        ],
        count: 2,
        canEdit: true,
        canCreate: true,
        canDelete: true
      }
    )
  });

  test('for a related table with invalid row_markdown_pattern', async ({ page }, testInfo) => {
    await testRelatedTablePresentation(
      page,
      testInfo,
      {
        schemaName: 'product-unordered-related-tables-links',
        displayname: 'table_w_invalid_row_markdown_pattern',
        tableName: 'table_w_invalid_row_markdown_pattern',
        baseTableName: 'Accommodations',
        viewMore: {
          displayname: 'table_w_invalid_row_markdown_pattern',
          filter: 'AccommodationsSuper 8 North Hollywood Motel'
        },
        rowValues: [
          ['four']
        ],
        rowViewPaths: [
          [{ column: 'id', value: '2004' }]
        ],
        count: 1,
        canEdit: true
      }
    )
  });

  test('for a related entity with wait_for entity set and markdown_pattern', async ({ page }, testInfo) => {
    await testRelatedTablePresentation(
      page,
      testInfo,
      {
        inlineComment: 'related table, has waitfor entityset and markdown_pattern (has markdown comment)',
        schemaName: 'product-unordered-related-tables-links',
        displayname: 'inbound related with display.wait_for entityset',
        tableName: 'accommodation_inbound1',
        baseTableName: 'Accommodations',
        markdownValue: [
          '<p>accommodation_inbound1 seven, accommodation_inbound1 eight, ',
          'accommodation_inbound1 nine (accommodation_inbound2 seven, accommodation_inbound2 eight, accommodation_inbound2 nine)</p>\n'
        ].join(''),
        isMarkdown: true,
        count: 3,
        canEdit: true,
        canDelete: true
      }
    );
  });

  test('for a related entity with wait_for aggregate and markdown_pattern', async ({ page }, testInfo) => {
    await testRelatedTablePresentation(
      page,
      testInfo,
      {
        schemaName: 'product-unordered-related-tables-links',
        displayname: 'inbound related with display.wait_for agg',
        tableName: 'accommodation_inbound3',
        baseTableName: 'Accommodations',
        markdownValue: '<p>accommodation_inbound3 seven, accommodation_inbound3 eight, accommodation_inbound3 nine (3)</p>\n',
        isMarkdown: true,
        count: 3,
        canEdit: true,
        canDelete: true
      }
    );
  });

  /**
   * these test cases rely on the previous related and assoc tests
   * since they are basically the same path with just added filters
   */
  test.describe('regarding usage of filter in source', () => {

    test('for a related entity with filter on main table', async ({ page }, testInfo) => {
      await testRelatedTablePresentation(page, testInfo, {
        inlineComment: 'inbound related, filter on main (comment _markdown_ is turned off)',
        schemaName: 'product-unordered-related-tables-links',
        displayname: 'inbound related with filter on main table',
        tableName: 'booking',
        baseTableName: 'Accommodations',
        count: 2,
        rowValues: [
          ['247.0000', ''],
          ['100.0000', '2016-06-01 00:00:00'],
          ['110.0000', '2016-05-19 01:00:00'],
          ['120.0000', '2015-11-10 00:00:00'],
          ['180.0000', '2016-09-04 01:00:00'],
          ['80.0000', '2016-01-01 00:00:00'],
        ],
        canCreate: true
      }
      );
    });

    test('for a related entity with filter on related table', async ({ page }, testInfo) => {
      await testRelatedTablePresentation(page, testInfo, {
        schemaName: 'product-unordered-related-tables-links',
        displayname: 'inbound related with filter on related table',
        tableName: 'booking',
        baseTableName: 'Accommodations',
        count: 2,
        viewMore: {
          displayname: 'booking',
          filter: 'AccommodationsSuper 8 North Hollywood Motel'
        },
        rowValues: [
          ['247.0000', ''], // created by another test case
          ['80.0000', '2016-01-01 00:00:00']
        ],
        canCreate: false
      });
    });

    test('pure and binary association with filter on main table', async ({ page }, testInfo) => {
      await testRelatedTablePresentation(page, testInfo, {
        schemaName: 'product-unordered-related-tables-links',
        displayname: 'association with filter on main table',
        tableName: 'association_table',
        associationLeafTableName: 'related_table',
        baseTableName: 'Accommodations',
        isAssociation: true,
        count: 2,
        viewMore: {
          displayname: 'related_table',
          filter: 'base table association relatedSuper 8 North Hollywood Motel'
        },
        rowValues: [
          ['Television'],
          ['Coffee Maker']
        ],
        canCreate: true
      }
      );
    });

    test('pure and binary association with filter on association table', async ({ page }, testInfo) => {
      await testRelatedTablePresentation(page, testInfo, {
        schemaName: 'product-unordered-related-tables-links',
        displayname: 'association with filter on assoc table',
        tableName: 'association_table',
        associationLeafTableName: 'related_table',
        baseTableName: 'Accommodations',
        isAssociation: true,
        count: 1,
        viewMore: {
          displayname: 'related_table',
          filter: 'base table association relatedSuper 8 North Hollywood Motel'
        },
        rowValues: [
          ['Coffee Maker']
        ],
        canCreate: false
      });
    });

    test('for a pure and binary association with filter on related table', async ({ page }, testInfo) => {
      await testRelatedTablePresentation(page, testInfo, {
        schemaName: 'product-unordered-related-tables-links',
        displayname: 'association with filter on related table',
        tableName: 'association_table',
        associationLeafTableName: 'related_table',
        baseTableName: 'Accommodations',
        isAssociation: true,
        count: 1,
        rowValues: [
          ['Television']
        ],
        rowViewPaths: [
          [{ column: 'id', value: '1' }]
        ],
        canCreate: true,
      });

      await testAddAssociationTable(page, {
        displayname: 'association with filter on related table',
        modalTitle: 'Link association with filter on related table to Accommodations: Super 8 North Hollywood Motel',
        totalCount: 2,
        disabledRows: ['1'],
        selectOptions: [1],
        rowValuesAfter: [
          ['Television'],
          ['Air Conditioning']
        ]
      });
    });

    test('for a related entity with a path of length 3 with filter', async ({ page }, testInfo) => {
      await testRelatedTablePresentation(page, testInfo, {
        schemaName: 'product-unordered-related-tables-links',
        displayname: 'path of length 3 with filters',
        tableName: 'related_table_2',
        baseTableName: 'Accommodations',
        viewMore: {
          displayname: 'related_table_2',
          filter: 'base table association relatedSuper 8 North Hollywood Motel'
        },
        rowValues: [
          ['two'],
          ['three']
        ],
        rowViewPaths: [
          [{ column: 'id', value: '2' }],
          [{ column: 'id', value: '3' }]
        ],
        count: 2, // one row is deleted by unlink test, another is added by add p&b filter on assoc
      });

      await test.step('add button should not be available', async () => {
        await expect.soft(RecordLocators.getRelatedTableAddButton(page, 'path of length 3 with filters')).not.toBeAttached();
      });
    });

  });

  test('for a pure and binary association with a null value for the key on main', async ({ page }) => {
    const linkBtn = RecordLocators.getRelatedTableAddButton(page, 'association_table_null_keys', true);

    await test.step('should disable the "Link records" button', async () => {
      // the table doesn't have any rows, so we have to first click on show all
      await RecordLocators.getShowAllRelatedEntitiesButton(page).click();
      await expect.soft(linkBtn).toBeVisible();
      await expect.soft(linkBtn).toBeDisabled();
    });

    await test.step('"Link records" should have the proper tooltip', async () => {
      const expected = 'Unable to connect to association_table_null_keys records until nullable_assoc_key in this Accommodations is set.'
      await testTooltip(linkBtn, expected, APP_NAMES.RECORD, true);
    });
  });

  test('for an inbound fk with a null value for the key on main', async ({ page }) => {
    const addBtn = RecordLocators.getRelatedTableAddButton(page, 'inbound_null_key', true);

    await test.step('should disable the "Add records" button', async () => {
      // the table doesn't have any rows, so we have to first click on show all
      await RecordLocators.getShowAllRelatedEntitiesButton(page).click();

      await expect.soft(addBtn).toBeVisible();
      await expect.soft(addBtn).toBeDisabled();
    });

    await test.step('"Add records" should have the proper tooltip', async () => {
      const expected = 'Unable to create inbound_null_key records for this Accommodations until nullable_assoc_key in this Accommodations is set.'
      await testTooltip(addBtn, expected, APP_NAMES.RECORD, true);
    });
  });


  test('for a pure and binary association with a null value for the key on the leaf table', async ({ page }) => {
    await test.step('should add a not null filter and only show 2 of the 5 rows for related_table_null_key', async () => {
      // the table doesn't have any rows, so we have to first click on show all
      await RecordLocators.getShowAllRelatedEntitiesButton(page).click();

      const addBtn = RecordLocators.getRelatedTableAddButton(page, 'association_table_null_keys2', true);
      await expect.soft(addBtn).toBeVisible();
      await expect.soft(addBtn).not.toBeDisabled();

      const rsModal = ModalLocators.getRecordsetSearchPopup(page);
      await addBtn.click();
      await expect.soft(rsModal).toBeVisible();
      await expect.soft(RecordsetLocators.getRows(rsModal)).toHaveCount(2);

    });
  });

  /**
   * The following tests are for testing the prefill functionality when the inbound foreign key is part of a table that is "almost" pure and binary
   *
   * For the first 3 tests, this means there are 2 foreign keys that are part of the same key (making the pair unique) and there are other columns that are not foreign keys
   *
   * For the 4th test, there are still 2 foreign keys that are part of the same key but there is another foreign key on this table. This means the heuristics won't trigger
   *   for the bulk create foreign key functionality requiring an annotation to be defined instead.
   */
  test.describe('for a table that is almost pure and binary and the foreign keys are a unique key', async () => {
    const params = {
      table_name: 'association_table_w_static_column',
      prefill_col: 'main_fk_col',
      leaf_col: 'leaf_fk_col',
      leaf_fk_name: 'leaf_fk_col',
      prefill_value: 'Super 8 North Hollywood Motel',
      column_names: ['static1', 'main_fk_col', 'leaf_fk_col'],
      resultset_values: [['', '2004', '10'], ['', '2004', '7']],
      related_table_values: [['2', 'Leaf 2'], ['', 'Leaf 10'], ['', 'Leaf 7']],
      bulk_modal_title: 'Select a set of leaf_fk_col for association_table_w_static_column'
    }

    test('with fk inputs as modals', async ({ page }) => {
      await testAddRelatedWithForeignKeyMultiPicker(page, params, RecordeditInputType.FK_POPUP);
    });

    /**
     * this test verifies the functionality when the first modal is closed and does NOT fill in the first form
     * subsequent actions in add more should continue to add new forms without filling the first form
     *
     * This test ensures the tracking of bulkForeignKeySelectedRows is done right when the first form has no value filled in by the initial modal
     */
    test('closing the initial modal and using "Add more" to add more forms with values', async ({ page }) => {
      let newPage: Page, bulkFKModal: Locator;

      await test.step('should open recordedit with a modal picker showing', async () => {
        const addBtn = RecordLocators.getRelatedTableAddButton(page, params.table_name);

        newPage = await clickNewTabLink(addBtn);
        await RecordeditLocators.waitForRecordeditPageReady(newPage);

        bulkFKModal = ModalLocators.getRecordeditBulkFKPopup(newPage);
        await expect.soft(bulkFKModal).toBeAttached();
      });

      await test.step('modal should have 3 disabled rows', async () => {
        const rows = RecordsetLocators.getRows(bulkFKModal);
        await expect.soft(rows).toHaveCount(10);
        await expect.soft(RecordsetLocators.getCheckedCheckboxInputs(bulkFKModal)).toHaveCount(3);

        await expect.soft(RecordsetLocators.getDisabledRows(bulkFKModal)).toHaveCount(3);
        await expect.soft(rows.nth(1)).toContainClass('disabled-row'); // Leaf 2
        await expect.soft(rows.nth(6)).toContainClass('disabled-row'); // Leaf 7
        await expect.soft(rows.nth(9)).toContainClass('disabled-row'); // Leaf 10
      });

      await test.step('closing the initial modal should not add any new forms AND not fill the first form', async () => {
        await testModalClose(bulkFKModal);

        await expect.soft(RecordeditLocators.getRecordeditForms(newPage)).toHaveCount(1);
        await testInputValue(newPage, 1, params.prefill_col, params.prefill_col, RecordeditInputType.FK_POPUP, false, params.prefill_value);
        await testInputValue(newPage, 1, params.leaf_col, params.leaf_col, RecordeditInputType.FK_POPUP, false, 'Select a value');
      });

      await test.step('clicking "add more" should have 3 rows disabled', async () => {
        await RecordeditLocators.getAddMoreButton(newPage).click();
        // The same modal when the page loaded should show again
        await expect.soft(bulkFKModal).toBeAttached();

        const rows = RecordsetLocators.getRows(bulkFKModal);
        await expect.soft(rows).toHaveCount(10);
        await expect.soft(RecordsetLocators.getCheckedCheckboxInputs(bulkFKModal)).toHaveCount(3);

        await expect.soft(RecordsetLocators.getDisabledRows(bulkFKModal)).toHaveCount(3);
        await expect.soft(rows.nth(1)).toContainClass('disabled-row'); // Leaf 2
        await expect.soft(rows.nth(6)).toContainClass('disabled-row'); // Leaf 7
        await expect.soft(rows.nth(9)).toContainClass('disabled-row'); // Leaf 10
      });

      await test.step('select 2 more rows and submit the selection', async () => {
        await RecordsetLocators.getRowCheckboxInput(bulkFKModal, 0).click();
        await RecordsetLocators.getRowCheckboxInput(bulkFKModal, 4).click();

        await ModalLocators.getSubmitButton(bulkFKModal).click();
        await expect.soft(bulkFKModal).not.toBeAttached();

        await expect.soft(RecordeditLocators.getRecordeditForms(newPage)).toHaveCount(3);
      });

      await test.step('first form should still not be filled in', async () => {
        await testInputValue(newPage, 1, params.leaf_col, params.leaf_col, RecordeditInputType.FK_POPUP, false, 'Select a value');
      });

      await test.step('2 new forms should have expected values filled in for prefill and new modal selections', async () => {
        await testInputValue(newPage, 2, params.prefill_col, params.prefill_col, RecordeditInputType.FK_POPUP, false, params.prefill_value);
        await testInputValue(newPage, 3, params.prefill_col, params.prefill_col, RecordeditInputType.FK_POPUP, false, params.prefill_value);

        await testInputValue(newPage, 2, params.leaf_col, params.leaf_col, RecordeditInputType.FK_POPUP, false, 'Leaf 1');
        await testInputValue(newPage, 3, params.leaf_col, params.leaf_col, RecordeditInputType.FK_POPUP, false, 'Leaf 5');
      });

      await test.step('removing the 2nd form should have the correct rows disabled in the "Add more" modal', async () => {
        await RecordeditLocators.getDeleteRowButton(newPage, 1).click();

        await RecordeditLocators.getAddMoreButton(newPage).click();
        // The same modal when the page loaded should show again
        await expect.soft(bulkFKModal).toBeAttached();

        const rows = RecordsetLocators.getRows(bulkFKModal);
        await expect.soft(rows).toHaveCount(10);
        await expect.soft(RecordsetLocators.getCheckedCheckboxInputs(bulkFKModal)).toHaveCount(4);

        await expect.soft(RecordsetLocators.getDisabledRows(bulkFKModal)).toHaveCount(4);
        await expect.soft(rows.nth(0)).not.toContainClass('disabled-row'); // Leaf 1 - the row that was just removed
        await expect.soft(rows.nth(1)).toContainClass('disabled-row'); // Leaf 2
        await expect.soft(rows.nth(4)).toContainClass('disabled-row'); // Leaf 5
        await expect.soft(rows.nth(6)).toContainClass('disabled-row'); // Leaf 7
        await expect.soft(rows.nth(9)).toContainClass('disabled-row'); // Leaf 10
      });
    });

    test('with fk inputs as dropdowns', async ({ page }) => {
      params.table_name = 'association_table_w_static_column_dropdown';
      params.leaf_fk_name = 'U0KYeFQJ-lwuLEaGb2RNRg';
      params.bulk_modal_title = 'Select a set of leaf_fk_col for association_table_w_static_column_dropdown'

      await testAddRelatedWithForeignKeyMultiPicker(page, params, RecordeditInputType.FK_DROPDOWN);
    });

    test('with a third foreign key and an annotation on main_fk_col', async ({ page }) => {
      params.table_name = 'association_table_w_three_fks';
      params.leaf_fk_name = 'leaf_fk_col';
      params.bulk_modal_title = 'Select a set of leaf_fk_col for association_table_w_three_fks'

      params.column_names = ['static1', 'main_fk_col', 'leaf_fk_col', 'third_fk_col'];
      params.resultset_values = [['', '2004', '10', ''], ['', '2004', '7', '']];
      params.related_table_values = [['2', 'Leaf 2', 'Other Leaf 2'], ['', 'Leaf 10', ''], ['', 'Leaf 7', '']];
      await testAddRelatedWithForeignKeyMultiPicker(page, params, RecordeditInputType.FK_POPUP);
    });
  });
});

test.describe('Scroll to query parameter', () => {
  test('after page load should scroll to the related table', async ({ page, baseURL }, testInfo) => {
    const keys = [];
    keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
    const url = generateChaiseURL(APP_NAMES.RECORD, testParams.schemaName, testParams.table_name, testInfo, baseURL) + `/${keys.join('&')}`;
    await page.goto(`${url}?scrollTo=${testParams.scrollToDisplayname}`);

    await RecordLocators.waitForRecordPageReady(page);

    const heading = RecordLocators.getRelatedTableAccordionContent(page, testParams.scrollToDisplayname);

    // make sure it exists
    await expect.soft(heading).toBeVisible();

    // make sure it scrolls into view
    await expect.soft(heading).toBeInViewport();

    // make sure it is open
    await expect.soft(heading).toContainClass('show');
  });
});
