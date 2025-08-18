import { test, expect, TestInfo, Page } from '@playwright/test';

import AlertLocators from '@isrd-isi-edu/chaise/test/e2e/locators/alert';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';

import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { createFiles, deleteFiles, RecordeditFile, setInputValue, testSubmission } from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

const testParams = {
  schemaName: 'product-record',
  tableName: 'file_preview_table',
  types: [
    {
      type: 'text',
      file: {
        path: 'text-01.txt',
        content: 'This is a text file that should show up properly.',
      },
      inputs: {
        id: '1',
        file: {
          name: 'text-01.txt',
          path: 'text-01.txt',
          size: 1024 // this is just to silence the error
        }
      },
      downloadBtn: {
        caption: 'text-01.txt',
        url: '/hatrac/js/chaise/filepreview/1/1/',
      },
    },
    {
      type: 'csv',
      file: {
        path: 'csv-01.csv',
        content: 'name,age\nAlice,30\nBob,25'
      },
      inputs: {
        id: '2',
        file: {
          name: 'csv-01.csv',
          path: 'csv-01.csv',
          size: 1024 // this is just to silence the error
        }
      },
      downloadBtn: {
        caption: 'csv-01.csv',
        url: '/hatrac/js/chaise/filepreview/1/2/',
      },
      renderedContent: 'name age Alice 30 Bob 25',
    },
    {
      type: 'markdown',
      file: {
        path: 'md-01.md',
        content: '# Markdown File\nThis is a _markdown_ file that should **show** up properly.'
      },
      inputs: {
        id: '3',
        file: {
          name: 'md-01.md',
          path: 'md-01.md',
          size: 1024 // this is just to silence the error
        },
      },
      downloadBtn: {
        caption: 'md-01.md',
        url: '/hatrac/js/chaise/filepreview/1/3/',
      },
      renderedContent: 'Markdown File\nThis is a markdown file that should show up properly.',
    },
    {
      type: 'json',
      file: {
        path: 'json-01.json',
        content: '{"name": "Alice", "age": 30}'
      },
      inputs: {
        id: '4',
        file: {
          name: 'json-01.json',
          path: 'json-01.json',
          size: 1024 // this is just to silence the error
        },
      },
      downloadBtn: {
        caption: 'json-01.json',
        url: '/hatrac/js/chaise/filepreview/1/4/',
      },
      renderedContent: JSON.stringify({ 'name': 'Alice', 'age': 30 }, undefined, 2),
    },
    {
      type: 'html',
      file: {
        path: 'html-01.html',
        content: '<h1>HTML File</h1><p>This is an HTML file that should not be rendered!</p>'
      },
      inputs: {
        id: '5',
        file: {
          name: 'html-01.html',
          path: 'html-01.html',
          size: 1024 // this is just to silence the error
        },
      },
      downloadBtn: {
        caption: 'html-01.html',
        url: '/hatrac/js/chaise/filepreview/1/5/',
      },
    }
  ],
};

test.describe('file preview', () => {
  test.describe.configure({ mode: 'parallel' });

  for (const params of testParams.types) {
    test(params.type, async ({ page, baseURL }, testInfo) => {
      await test.step('create the file', async () => {
        await createFiles([params.file]);
      });

      await createRecord(
        page,
        generateChaiseURL(APP_NAMES.RECORDEDIT, testParams.schemaName, testParams.tableName, testInfo, baseURL),
        params.inputs.id,
        params.inputs.file
      );

      const container = RecordLocators.getFilePreviewContainer(page, 'uri');
      await test.step('the preview should be available.', async () => {
        await expect.soft(container).toBeVisible();
      });

      await test.step('the download button should be displayed.', async () => {
        const downloadBtn = RecordLocators.getFilePreviewDownloadBtn(container);
        await expect.soft(downloadBtn).toBeVisible();
        const link = downloadBtn.locator('a');
        expect.soft(await link.getAttribute('href')).toContain(params.downloadBtn.url);
        await expect.soft(link).toHaveText(params.downloadBtn.caption);
      });


      switch (params.type) {
        case 'csv':
        case 'markdown':
          await test.step('the preview should show the rendered value.', async () => {
            await expect.soft(RecordLocators.getFilePreviewContent(container)).toHaveText(params.renderedContent!);
          });

          await test.step('toggle should show the raw content', async () => {
            const btn = RecordLocators.getFilePreviewToggleBtn(container);
            await expect.soft(btn).toBeVisible();
            await expect.soft(btn).toHaveText('Display content');
            await btn.click();
            await expect.soft(btn).toHaveText(params.type === 'csv' ? 'Display table' : 'Display markdown');
            await expect.soft(RecordLocators.getFilePreviewContent(container)).toHaveText(params.file.content);
          });

          break;
        default:
          await test.step('the preview should match the file content.', async () => {
            await expect.soft(RecordLocators.getFilePreviewContent(container)).toHaveText(
              params.renderedContent ? params.renderedContent : params.file.content
            );
          });
          break;
      }

      await test.step('delete the file', async () => {
        await deleteFiles([params.file]);
      });

    });
  }
});

const createRecord = async (page: Page, pageURL: string, fileid: string, file: RecordeditFile) => {
  await test.step('open recordedit and upload the file.', async () => {
    await page.goto(pageURL);
    await RecordeditLocators.waitForRecordeditPageReady(page);

    await setInputValue(page, 1, 'id', 'id', RecordeditInputType.TEXT, fileid);
    await setInputValue(page, 1, 'uri', 'uri', RecordeditInputType.FILE, file);

    await RecordeditLocators.getSubmitRecordButton(page).click();
    try {
      await expect(AlertLocators.getErrorAlert(page)).not.toBeAttached();
    } catch (exp) {
      // provide more information about what went wrong
      const alertContent = await AlertLocators.getErrorAlert(page).textContent();
      expect(alertContent).toEqual('');
      return;
    }

    const timeout = 30_000;
    await expect.soft(RecordeditLocators.getSubmitSpinner(page)).not.toBeAttached({ timeout });
    await expect.soft(ModalLocators.getUploadProgressModal(page)).not.toBeAttached({ timeout });

    await page.waitForURL('**/record/**', { timeout: timeout });
    await RecordLocators.waitForRecordPageReady(page);
  });
}
