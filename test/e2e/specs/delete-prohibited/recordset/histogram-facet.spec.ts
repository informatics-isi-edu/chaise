import { test, expect } from '@playwright/test';

// locators
import RecordsetLocators, { TimestampDateTime } from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { 
  testRangePickerInputsAfterZoom, testTimestampRangePickerInputsAfterZoom 
} from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';

const testParams = {
  schema_name: 'histogram-faceting',
  table_name: 'main',
  totalNumFacets: 4,
  facetNames: ['int_col', 'float_col', 'date_col', 'timestamp_col'],
  facets: [
    {
      name: 'int_col',
      initialMin: '1',
      initialMax: '30',
      zoom1: { min: '7', max: '25' },
      zoom2: { min: '9', max: '21' },
      allRecords: 'Displaying first25of 195 matching results',
      zoom3: { min: '11', max: '19' }
    }, {
      name: 'float_col',
      initialMin: '1.10',
      initialMax: '30.30',
      zoom1: { min: '6.94', max: '24.46' },
      zoom2: { min: '10.44', max: '20.96' },
      allRecords: 'Displaying first25of 155 matching results',
      zoom3: { min: '12.55', max: '18.85' }
    }, {
      name: 'date_col',
      initialMin: '2001-01-01',
      initialMax: '2030-06-30',
      zoom1: { min: '2006-11-27', max: '2024-08-12' },
      zoom2: { min: '2010-06-13', max: '2021-01-28' },
      allRecords: 'Displaying first25of 165 matching results',
      zoom3: { min: '2012-07-30', max: '2018-12-20' }
    }, {
      name: 'timestamp_col',
      initialMin: { date: '2007-04-06', time: '01:01:01' },
      initialMax: { date: '2007-09-30', time: '06:30:31' },
      zoom1: {
        min: { date: '2007-05-11', time: '11:42:55' },
        max: { date: '2007-08-25', time: '19:48:37' }
      },
      zoom2: {
        min: { date: '2007-06-01', time: '18:08:03' },
        max: { date: '2007-08-04', time: '13:23:28' }
      },
      allRecords: 'Displaying first25of 155 matching results',
      zoom3: {
        min: { date: '2007-06-14', time: '12:23:08' },
        max: { date: '2007-07-22', time: '19:08:23' }
      }
    }
  ]
};

test.describe('Testing features for range picker facet types with histograms', () => {
  test.describe.configure({ mode: 'parallel' });

  for (const [index, facetParams] of testParams.facets.entries()) {
    test(`Testing facet: ${facetParams.name}`, async ({ page, baseURL }, testInfo) => {
      const facet = RecordsetLocators.getFacetById(page, index);
      const histogramButtons = RecordsetLocators.getFacetHistogramButtons(facet);

      await test.step('should load recordset page', async () => {
        const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}`;

        await page.goto(`${baseURL}${PAGE_URL}`);
        await RecordsetLocators.waitForRecordsetPageReady(page);
      });

      await test.step('should have rows and facets visible', async () => {
        await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(25);

        await expect.soft(RecordsetLocators.getAllFacets(page)).toHaveCount(testParams.totalNumFacets);

        await RecordsetLocators.getFacetHeaderButtonById(RecordsetLocators.getFacetById(page, 0), 0).click();
        await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(testParams.totalNumFacets);
      });

      await test.step(`should have ${testParams.totalNumFacets} facets with correct names`, async () => {
        await expect.soft(RecordsetLocators.getFacetTitles(page)).toHaveText(testParams.facetNames);
      });

      await test.step('open the facet', async () => {
        await RecordsetLocators.getFacetHeaderButtonById(facet, index).click();
      });

      if (facetParams.name === 'timestamp_col') {
        const rangeInputs = RecordsetLocators.getFacetRangeTimestampInputs(facet);
        
        await test.step('should have a histogram displayed with min/max inputs filled in.', async () => {
          // wait for facet to open
          await expect.soft(RecordsetLocators.getFacetCollapse(facet)).toBeVisible();
          await expect.soft(rangeInputs.submit).toBeVisible();

          // wait for histogram
          await expect.soft(RecordsetLocators.getFacetHistogram(facet)).toBeVisible();

          await testTimestampRangePickerInputsAfterZoom(
            rangeInputs, 
            facetParams.initialMin as TimestampDateTime, 
            facetParams.initialMax as TimestampDateTime
          );
        });

        await test.step('unzoom should be disabled, clicking zoom should zoom in and enable the unzoom button.', async () => {
          await expect.soft(histogramButtons.unzoomDisabled).toHaveCount(1);

          await histogramButtons.zoom.click();

          await expect.soft(RecordsetLocators.getFacetSpinner(facet)).not.toBeVisible();
          await testTimestampRangePickerInputsAfterZoom(
            rangeInputs, 
            facetParams.zoom1.min as TimestampDateTime, 
            facetParams.zoom1.max as TimestampDateTime
          );

          await expect.soft(histogramButtons.unzoomDisabled).toHaveCount(0);
        });

        await test.step('zoom in again and submit the range filter should display the proper resultset.', async () => {
          await histogramButtons.zoom.click();

          await expect.soft(RecordsetLocators.getFacetSpinner(facet)).not.toBeVisible();
          await testTimestampRangePickerInputsAfterZoom(
            rangeInputs, 
            facetParams.zoom2.min as TimestampDateTime, 
            facetParams.zoom2.max as TimestampDateTime
          );

          await rangeInputs.submit.click();
          // wait for request to return
          await expect.soft(RecordsetLocators.getClearAllFilters(page)).toBeVisible();

          // wait for facet filters to load
          await expect.soft(RecordsetLocators.getFacetFilters(page)).toHaveCount(1);
          await expect.soft(RecordsetLocators.getTotalCount(page)).toHaveText(facetParams.allRecords);
        });

        await test.step('zoom in once more, unzoom once, then reset the histogram.', async () => {
          await histogramButtons.zoom.click();

          await expect.soft(RecordsetLocators.getFacetSpinner(facet)).not.toBeVisible();

          await testTimestampRangePickerInputsAfterZoom(
            rangeInputs, 
            facetParams.zoom3.min as TimestampDateTime, 
            facetParams.zoom3.max as TimestampDateTime
          );

          // unzoom
          await histogramButtons.unzoom.click();

          await expect.soft(RecordsetLocators.getFacetSpinner(facet)).not.toBeVisible();
          await testTimestampRangePickerInputsAfterZoom(
            rangeInputs, 
            facetParams.zoom2.min as TimestampDateTime, 
            facetParams.zoom2.max as TimestampDateTime
          );

          // reset
          await histogramButtons.reset.click();

          await expect.soft(RecordsetLocators.getFacetSpinner(facet)).not.toBeVisible();
          await testTimestampRangePickerInputsAfterZoom(
            rangeInputs, 
            facetParams.initialMin as TimestampDateTime, 
            facetParams.initialMax as TimestampDateTime
          );
        });

        await test.step('clear all filters should reset the histogram.', async () => {
          await histogramButtons.zoom.click();

          await expect.soft(RecordsetLocators.getFacetSpinner(facet)).not.toBeVisible();
          await testTimestampRangePickerInputsAfterZoom(
            rangeInputs, 
            facetParams.zoom1.min as TimestampDateTime, 
            facetParams.zoom1.max as TimestampDateTime
          );

          const clearAll = RecordsetLocators.getClearAllFilters(page);
          await clearAll.click();
          await expect.soft(clearAll).not.toBeVisible();

          await expect.soft(RecordsetLocators.getFacetSpinner(facet)).not.toBeVisible();
          await testTimestampRangePickerInputsAfterZoom(
            rangeInputs, 
            facetParams.initialMin as TimestampDateTime, 
            facetParams.initialMax as TimestampDateTime
          );
      });

      // case for int_col, float_col, date_col
      } else {
        const isFloat = facetParams.name === 'float_col';
        const rangeInputs = RecordsetLocators.getFacetRangeInputs(facet);

        await test.step('should have a histogram displayed with min/max inputs filled in.', async () => {
          // wait for facet to open
          await expect.soft(RecordsetLocators.getFacetCollapse(facet)).toBeVisible();
          await expect.soft(rangeInputs.submit).toBeVisible();

          // wait for histogram
          await expect.soft(RecordsetLocators.getFacetHistogram(facet)).toBeVisible();

          // type with `as string` since we know only timestamp_col will be an object
          await testRangePickerInputsAfterZoom(
            rangeInputs,
            isFloat,
            facetParams.initialMin as string,
            facetParams.initialMax as string
          );
        });

        await test.step('unzoom should be disabled, clicking zoom should zoom in and enable the unzoom button.', async () => {
          await expect.soft(histogramButtons.unzoomDisabled).toHaveCount(1);

          await histogramButtons.zoom.click();

          await expect.soft(RecordsetLocators.getFacetSpinner(facet)).not.toBeVisible();
          await testRangePickerInputsAfterZoom(
            rangeInputs, 
            isFloat, 
            facetParams.zoom1.min as string, 
            facetParams.zoom1.max as string
          );

          await expect.soft(histogramButtons.unzoomDisabled).toHaveCount(0);
        });

        await test.step('zoom in again and submit the range filter should display the proper resultset.', async () => {
          await histogramButtons.zoom.click();

          await expect.soft(RecordsetLocators.getFacetSpinner(facet)).not.toBeVisible();
          await testRangePickerInputsAfterZoom(
            rangeInputs,
            isFloat,
            facetParams.zoom2.min as string,
            facetParams.zoom2.max as string
          );

          await rangeInputs.submit.click();
          // wait for request to return
          await expect.soft(RecordsetLocators.getClearAllFilters(page)).toBeVisible();

          // wait for facet filters to load
          await expect.soft(RecordsetLocators.getFacetFilters(page)).toHaveCount(1);
          await expect.soft(RecordsetLocators.getTotalCount(page)).toHaveText(facetParams.allRecords);
        });

        await test.step('zoom in once more, unzoom once, then reset the histogram.', async () => {
          await histogramButtons.zoom.click();

          await expect.soft(RecordsetLocators.getFacetSpinner(facet)).not.toBeVisible();
          await testRangePickerInputsAfterZoom(
            rangeInputs,
            isFloat,
            facetParams.zoom3.min as string,
            facetParams.zoom3.max as string
          );

          if (facetParams.name === 'int_col') {
            await expect.soft(histogramButtons.zoomDisabled).toHaveCount(1);
          }
          
          // unzoom
          await histogramButtons.unzoom.click();

          await expect.soft(RecordsetLocators.getFacetSpinner(facet)).not.toBeVisible();
          await testRangePickerInputsAfterZoom(
            rangeInputs,
            isFloat,
            facetParams.zoom2.min as string,
            facetParams.zoom2.max as string
          );

          // reset
          await histogramButtons.reset.click();

          await expect.soft(RecordsetLocators.getFacetSpinner(facet)).not.toBeVisible();
          await testRangePickerInputsAfterZoom(
            rangeInputs,
            isFloat,
            facetParams.initialMin as string,
            facetParams.initialMax as string
          );
        });

        await test.step('clear all filters should reset the histogram.', async () => {
          await histogramButtons.zoom.click();

          await expect.soft(RecordsetLocators.getFacetSpinner(facet)).not.toBeVisible();
          await testRangePickerInputsAfterZoom(
            rangeInputs, 
            isFloat, 
            facetParams.zoom1.min as string, 
            facetParams.zoom1.max as string
          );
           
          const clearAll = RecordsetLocators.getClearAllFilters(page);
          await clearAll.click();
          await expect.soft(clearAll).not.toBeVisible();

          await expect.soft(RecordsetLocators.getFacetSpinner(facet)).not.toBeVisible();
          await testRangePickerInputsAfterZoom(
            rangeInputs,
            isFloat,
            facetParams.initialMin as string,
            facetParams.initialMax as string
          );
        });
      }
    });
  };

  test('going to a page with filters that return no data', async ({ page, baseURL }, testInfo) => {
    await test.step('should load recordset page', async () => {
      const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}`;
      const filters = '/int_col::leq::0&float_col::leq::0&date_col::leq::2000-01-01&timestamp_col::leq::2000-01-01';

      await page.goto(`${baseURL}${PAGE_URL}${filters}`);
      await RecordsetLocators.waitForRecordsetPageReady(page);
    });

    await test.step('no data should be shown to the user', async () => {
      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(0);
    });

    await test.step('no histogram should be displayed', async () => {
      for(let i = 0; i < testParams.totalNumFacets; i++) {
        const facet = RecordsetLocators.getFacetById(page, i);
        await expect.soft(RecordsetLocators.getFacetHistogram(facet)).not.toBeAttached();
      }
    });
  });
});