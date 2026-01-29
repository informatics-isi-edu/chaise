import { test, expect, Page } from '@playwright/test';

import AlertLocators from '@isrd-isi-edu/chaise/test/e2e/locators/alert';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordeditLocators, {
  RecordeditInputType,
} from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';

import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import {
  createFiles,
  deleteFiles,
  RecordeditFile,
  setInputValue,
} from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

const mvsjContent = {
  root: {
    kind: 'root',
    children: [
      {
        kind: 'download',
        params: {
          url: 'https://example.com/files/test.bcif',
        },
        children: [
          {
            kind: 'parse',
            params: {
              format: 'mmcif',
            },
            children: [
              {
                kind: 'structure',
                params: {
                  type: 'model',
                },
                children: [
                  {
                    kind: 'component',
                    params: {
                      selector: 'all',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  metadata: {
    description: '- **red**: predicted structure',
    timestamp: '202r-04-14T19:05:11.202265+00:00',
    version: '1.4',
  },
};

const testParams: {
  schemaName: string;
  tableName: string;
  types: Array<{
    skipInCI?: boolean;
    type: string;
    file: RecordeditFile | { content: string; path: string };
    inputs: {
      id: string;
      file: RecordeditFile;
    };
    downloadBtn: {
      caption: string;
      url: string;
    };
    renderedContent?: string;
    errorMessage?: string;
  }>;
} = {
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
          size: 1024, // this is just to silence the error
        },
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
        content: 'name,age\nAlice,30\nBob,25',
      },
      inputs: {
        id: '2',
        file: {
          name: 'csv-01.csv',
          path: 'csv-01.csv',
          size: 1024, // this is just to silence the error
        },
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
        content: '# Markdown File\nThis is a _markdown_ file that should **show** up properly.',
      },
      inputs: {
        id: '3',
        file: {
          name: 'md-01.md',
          path: 'md-01.md',
          size: 1024, // this is just to silence the error
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
        content: '{"name": "Alice", "age": 30}',
      },
      inputs: {
        id: '4',
        file: {
          name: 'json-01.json',
          path: 'json-01.json',
          size: 1024, // this is just to silence the error
        },
      },
      downloadBtn: {
        caption: 'json-01.json',
        url: '/hatrac/js/chaise/filepreview/1/4/',
      },
      renderedContent: JSON.stringify({ name: 'Alice', age: 30 }, undefined, 2),
    },
    {
      type: 'html',
      file: {
        path: 'html-01.html',
        content: '<h1>HTML File</h1><p>This is an HTML file that should not be rendered!</p>',
      },
      inputs: {
        id: '5',
        file: {
          name: 'html-01.html',
          path: 'html-01.html',
          size: 1024, // this is just to silence the error
        },
      },
      downloadBtn: {
        caption: 'html-01.html',
        url: '/hatrac/js/chaise/filepreview/1/5/',
      },
    },
    {
      type: 'tsv',
      file: {
        path: 'tsv-01.tsv',
        content:
          'first name\tage, or other info\nAlice\t[30, 25]\nBob\t("25","30")?\nJohn-Doe\tN/A\nJoe\t["10_1", "12 mg"]\nBrian\t["10","20"]',
      },
      inputs: {
        id: '6',
        file: {
          name: 'tsv-01.tsv',
          path: 'tsv-01.tsv',
          size: 1024, // this is just to silence the error
        },
      },
      downloadBtn: {
        caption: 'tsv-01.tsv',
        url: '/hatrac/js/chaise/filepreview/1/6/',
      },
      renderedContent:
        'first name age, or other info Alice [30, 25] Bob ("25","30")? John-Doe N/A Joe ["10_1", "12 mg"] Brian ["10","20"]',
    },
    {
      type: 'mvsj',
      file: {
        path: 'mvsj-01.mvsj',
        content: JSON.stringify(mvsjContent),
      },
      inputs: {
        id: '7',
        file: {
          name: 'mvsj-01.mvsj',
          path: 'mvsj-01.mvsj',
          size: 1024, // this is just to silence the error
        },
      },
      downloadBtn: {
        caption: 'mvsj-01.mvsj',
        url: '/hatrac/js/chaise/filepreview/1/7/',
      },
      renderedContent: JSON.stringify(mvsjContent, undefined, 2),
    },
    {
      type: 'image',
      file: {
        path: 'image-01.svg',
        content: [
          '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50">',
          '<circle cx="20" cy="25" r="20" fill="red"/>',
          '<rect x="50" y="5" width="40" height="40" fill="blue"/>',
          '</svg>',
        ].join('\n'),
      },
      inputs: {
        id: '8',
        file: {
          name: 'image-01.svg',
          path: 'image-01.svg',
          size: 1024, // this is just to silence the error
        },
      },
      downloadBtn: {
        caption: 'image-01.svg',
        url: '/hatrac/js/chaise/filepreview/1/8/',
      },
    },
    {
      type: 'custom-type-json',
      file: {
        path: 'json-09.customjson',
        content: '["1", "2"]',
      },
      inputs: {
        id: '9',
        file: {
          name: 'json-09.customjson',
          path: 'json-09.customjson',
          size: 1024, // this is just to silence the error
        },
      },
      downloadBtn: {
        caption: 'json-09.customjson',
        url: '/hatrac/js/chaise/filepreview/1/9/',
      },
      renderedContent: JSON.stringify(['1', '2'], undefined, 2),
    },
    {
      type: 'custom-type-markdown',
      file: {
        path: 'md-01.custommarkdown',
        content: '_this_ is a **markdown** file [here](https://example.com).',
      },
      inputs: {
        id: '10',
        file: {
          name: 'md-01.custommarkdown',
          path: 'md-01.custommarkdown',
          size: 1024, // this is just to silence the error
        },
      },
      downloadBtn: {
        caption: 'md-01.custommarkdown',
        url: '/hatrac/js/chaise/filepreview/1/10/',
      },
      renderedContent: 'this is a markdown file here.',
    },
    {
      type: 'disabled',
      skipInCI: true,
      file: {
        name: 'file_larger_than_32kb.txt',
        size: 64000,
        path: 'file_larger_than_32kb.txt',
      },
      inputs: {
        id: '11',
        file: {
          name: 'file_larger_than_32kb.txt',
          size: 34000,
          path: 'file_larger_than_32kb.txt',
        },
      },
      errorMessage: 'Warning:This file is too large to preview. Download it to view the content.',
      downloadBtn: {
        caption: 'file_larger_than_32kb.txt',
        url: '/hatrac/js/chaise/filepreview/1/11/',
      },
    },
    {
      type: 'truncated',
      skipInCI: true,
      file: {
        name: 'file_larger_than_20kb.txt',
        size: 29000,
        path: 'file_larger_than_20kb.txt',
      },
      inputs: {
        id: '12',
        file: {
          name: 'file_larger_than_20kb.txt',
          size: 24000,
          path: 'file_larger_than_20kb.txt',
        },
      },
      errorMessage:
        'Warning:The displayed content is truncated. Download the file to view the full content.',
      downloadBtn: {
        caption: 'file_larger_than_20kb.txt',
        url: '/hatrac/js/chaise/filepreview/1/12/',
      },
    },
  ],
};

test.describe('file preview', () => {
  test.describe.configure({ mode: 'parallel' });

  for (const params of testParams.types) {
    test(params.type, async ({ page, baseURL }, testInfo) => {
      test.skip(!!(process.env.CI && params.skipInCI), 'skipped in CI environment (file size not properly reported)');


      await test.step('create the file', async () => {
        await createFiles([params.file]);
      });

      await createRecord(
        page,
        generateChaiseURL(
          APP_NAMES.RECORDEDIT,
          testParams.schemaName,
          testParams.tableName,
          testInfo,
          baseURL
        ),
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
        case 'tsv':
        case 'csv':
        case 'markdown':
          await test.step('the preview should show the rendered value.', async () => {
            await expect
              .soft(RecordLocators.getFilePreviewContent(container))
              .toHaveText(params.renderedContent!);
          });

          await test.step('toggle should show the raw content', async () => {
            const btn = RecordLocators.getFilePreviewToggleBtn(container);
            await expect.soft(btn).toBeVisible();
            await expect.soft(btn).toHaveText('Show raw');
            await btn.click();
            await expect
              .soft(btn)
              .toHaveText(params.type === 'markdown' ? 'Show rendered' : 'Show table');
            if ('content' in params.file) {
              await expect
                .soft(RecordLocators.getFilePreviewContent(container))
                .toHaveText(params.file.content);
            }
          });

          break;
        case 'image':
          const image = RecordLocators.getFilePreviewImage(container);
          await test.step('the image should be visible.', async () => {
            await expect.soft(image).toBeVisible();
          });

          await test.step('clicking the image should open the lightbox.', async () => {
            await image.click();

            const lightbox = RecordLocators.getFilePreviewImageLightbox(page);
            await expect.soft(lightbox).toBeVisible();

            // close the lightbox
            const btn = RecordLocators.getFilePreviewImageLightboxCloseBtn(page);
            await expect.soft(btn).toBeVisible();
            await btn.click();
            await expect.soft(lightbox).not.toBeVisible();
          });
          break;
        case 'disabled':
          await test.step('the preview should show an error message.', async () => {
            await expect.soft(RecordLocators.getFilePreviewContent(container)).not.toBeVisible();

            const error = RecordLocators.getFilePreviewError(container);
            await expect.soft(error).toBeVisible();
            if (params.errorMessage) {
              await expect.soft(error).toHaveText(params.errorMessage);
            }
          });
          break;
        // cases that by default we're not supporting
        case 'html':
          await test.step('the preview should not be visible.', async () => {
            await expect.soft(RecordLocators.getFilePreviewContent(container)).not.toBeVisible();

            const error = RecordLocators.getFilePreviewError(container);
            await expect.soft(error).not.toBeVisible();
          });
          break;
        // simple text based previews
        default:
          await test.step('the preview should be displayed.', async () => {
            await expect.soft(RecordLocators.getFilePreviewContent(container)).toBeVisible();

            if (params.renderedContent || 'content' in params.file) {
              let expectedContent = '';
              if (params.renderedContent) {
                expectedContent = params.renderedContent;
              } else if ('content' in params.file) {
                expectedContent = params.file.content;
              }

              await expect
                .soft(RecordLocators.getFilePreviewContent(container))
                .toHaveText(expectedContent);
            }
          });

          if (params.errorMessage) {
            await test.step('the preview should show a warning message.', async () => {
              const error = RecordLocators.getFilePreviewError(container);
              await expect.soft(error).toBeVisible();
              await expect.soft(error).toHaveText(params.errorMessage!);
            });
          }
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
};
