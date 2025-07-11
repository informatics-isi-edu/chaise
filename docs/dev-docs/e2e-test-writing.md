# Writing End to End Test Cases

In this section, we have summarized all the resources you need to write test cases alongside different issues that we have faced. Please make sure to follow the given instructions.

## Table of contents

- [Test Idioms](#test-idioms)
   * [Data and schema](#data-and-schema)
   * [Test structure](#test-structure)
   * [Locators](#locators)
   * [Assertions](#assertions)
   * [Actions](#actions)
   * [Managing page](#managing-page)
- [Common issues/errors](#common-issueserrors)

## Test Idioms

This section summarizes the best practices for writing test cases in Chaise.

### Data and schema

- Try to keep your schema definitions as simple as possible. It only needs to cover the cases that you want to test. Avoid duplicating other existing schemas/tables.

- Use names that describe the situation you are trying to recreate. For instance, if you are testing the annotations and want to create a table with annotation 'x', just name the table `table_w_x`. This way, we can easily examine the schema and understand which cases are covered.

- Don't rely on ERMrestJS heuristics for the parts of the code you are not testing, and define annotations. The heuristics change more regularly than the annotation won't. For example, if you are testing the presentation of the record app, define your own visible-columns and visible-foreignkeys annotation.


### Test structure

- Be specific about the scenario that you are testing. If you want to test a specific scenario, you don't have to test all the other features. For instance, if you want to test recordset page in a particular scenario, you don't have to test all the facet data and main data (The more general case should already be tested and should be separate from this specific test).

- If your test case is related to one of the currently implemented test specs,
  - If they can share the same schema, you can modify its schema to cover your case and add your test case to the corresponding test spec (Instead of creating a new configuration and test spec).

- By default, test files are run in parallel, while tests in a single file are run in order. Also, remember that each individual `test` will open its own browser.
  - Useful links:
    - https://playwright.dev/docs/api/class-test
    - https://playwright.dev/docs/test-parallel
  - The following are different ways that you can structure your tests:
    - To reduce the runtime, breaking tests into multiple files is preferable. So if these tests won't affect each other, it's best to create multiple files that the `.config.ts` will then run.
    - Another option is to keep them in the same file as two separate tests. In this case, each `test` will open a separate browser.
        ```ts
        test.describe('recordset tests', () => {
          test.beforeEach(({page}) => {
            await page.goto('https://example.com/chaise/recordset/#1/schema:table');
            await RecordsetLocators.waitForRecordsetPageReady();
          })

          test('search', async ({page}) => {
            await RecordsetLocators.getMainSearchBox(page).fill('test');
            await expect(RecordsetLocators.getRows(page)).toHaveCount(2);
          });

          test('facet', async ({page}) => {
            await RecordsetLocators.getFacetHeaderButtonById(page, facetID).click();
            await expect(RecordsetLocators.getFacetOptions(page, facetID)).toHaveCount(5);
            await RecordsetLocators.getFacetOption(page, 2).click();
            await expect(RecordsetLocators.getRows(page)).toHaveCount(5);
          });
        });
        ```
    - If your file has multiple independent `test`s that can run in parallel, you can ask playwright to run them in parallel by adding the following:
        ```ts
        test.describe.configure({ mode: 'parallel' });
        ```
      - Don't use this configuration if you have a `beforeAll` or `afterAll` that you want to run only once. Because in this case each worker will run their own `beforeAll` and `afterAll` instead of running it once (https://github.com/microsoft/playwright/issues/28201).
    - If your tests must run in order and on the same browser, use the `test.step` method.
      - Don't forget to include `await` before each `test.step`.
      - Playwright will not run the remaining steps if any of the steps fail. To get around this, you should use `expect.soft`.
        ```ts
          test('recordset search and facet', () => {
            await test.step('go to recordset page', async () => {
              await page.goto('https://example.com/chaise/recordset/#1/schema:table');
              await RecordsetLocators.waitForRecordsetPageReady();
            });

            await test.step('search', async ({page}) => {
              await RecordsetLocators.getMainSearchBox(page).fill('test');
              await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(2);
            });

            await test.step('facet', async ({page}) => {
              await RecordsetLocators.getFacetHeaderButtonById(page, facetID).click();
              await expect.soft(RecordsetLocators.getFacetOptions(page, facetID)).toHaveCount(2);
              await RecordsetLocators.getFacetOption(page, 2).click();
              await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(1);
            });
          });
          ```

- If you want to run async code inside a loop, use [for ... of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of).
  - Array
    ```ts
    const disabledRows = ['one', 'three'];

    let index = 0;
    for (const expected of disabledRows) {
      const disabledCell = RecordsetLocators.getRowFirstCell(page, index, true);
      await expect.soft(disabledCell).toHaveText(expected);
      index++;
    }
    ```
  - Object
    ```ts
    const values = {
      'col1': 1,
      'col2': 2
    }

    let index = 0;
    for (const colName of Object.keys(values)) {
      await expect(RecordeditLocators.getInputForAColumn(page, colName, 1)).toHaveValue(values[colName]);
      index++;
    }
    ```

### Locators

- While [the official documentation](https://playwright.dev/docs/locators) asks us to avoid using CSS/XPath locators, we don't see any downside to using these locators and prefer them to the purpose-built locators that Playwright has.

- To make it easier to select page elements, we've created `Locator` classes which you can find under the `locators` folder. If you want to access an element, avoid using CSS/XPath selectors directly in the spec file and create a function in the proper `Locator` class instead.

- Try to reuse locators as much as possible. For example, if you want to get the recordset rows on a search popup, instead of creating a specific function for it, do the following:
  ```ts
  const rsModal = ModalLocators.getRecordsetSearchPopup(page);
  await expect.soft(RecordsetLocators.getRows(rsModal)).toHaveCount(2);
  ```
- If you want to iterate over locators, use `.all()`: https://playwright.dev/docs/api/class-locator#locator-all

- You can get the `page` and `context` object from a `Locator` object:

  ```ts
  const locator = page.locator('.some-element');
  const samePage = locator.page()
  const context = samePage.context();
  ```

- If you want to wait for a locator, you can use `waitFor`. Although, it's better to use the `toVisible` or `toBeAttached` assertions instead.
  ```ts
  profileModal.waitFor({ state: 'visible' });
  profileModal.waitFor({ state: 'attached' });
  profileModal.waitFor({ state: 'detached' });
  ```

### Assertions

- You can find all the assertions that Playwright supports [here](https://playwright.dev/docs/test-assertions).

- If you want to test whether an element is attached to DOM or visible, avoid using `isVisible` and `isPresent` and use the special assertions instead:
  ```ts
  // ❌ bad
  expect(el.isVisible()).toBeTruthy();
  expect(el.isVisible()).toBeFalsy();
  expect(el.isPresent()).toBeTruthy();
  expect(el.isPresent()).toBeFalsy();

  // ✅ good
  epxect(el).toBeVisible();
  epxect(el).not.toBeVisible();
  epxect(el).toBeAttached();
  epxect(el).not.toBeAttached();
  ```

- Testing the inner text of an element ([reference](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-text)):
  ```ts
  // partial regex match
  await expect.soft(title).toHaveText(/Collections/);

  // full match
  await expect.soft(title).toHaveText('Data Collections');

  // when the locator returns multiple items:
  await expect(page.locator('ul > li')).toHaveText(['Text 1', 'Text 2', 'Text 3']);
  ```

- Alternative for testing inner text of an element ([reference](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-contain-text)):
  ```ts
  // partial match using contains
  await expect.soft(title).toContainText('Data Collect');
  ```

- If you want to test element classes ([reference](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-contain-class)):

  ```ts
  // one class
  await expect.soft(input).toContainClass('input-disabled');

  // multiple classes
  await expect.soft(input).toContainClass('chaise-input-control has-feedback input-disabled');
  ```

- If you want to test value inside of an input ([reference](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-value)):

  ```ts
  // partial regex match
  await expect.soft(input).toHaveValue(/input\-value/);

  // full match
  await expect.soft(input).toHaveValue('input-value');

  // this works too but avoid using it if possible
  await expect.soft(input).toHaveAttribute('value', 'input-value');
  ```

- Test DOM attributes ([reference](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-attribute)):

  ```ts
  // prefered
  await expect(link).toHaveAttribute('href', regexOrFullString);

  // if you cannot come up with a proper regex, do this. but generally toHaveAttribute is much better
  expect(await link.getAttribute('href')).toContain(partialExpected)
  ```

- Test `innerHTML`:

  ```ts
  expect(await link.innerHTML()).toContain(partialExpected);
  expect(await link.innerHTML()).toBe(expected);
  ```

- Testing page URL:

  ```ts
  // source: https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-url

  // Check for the page URL to contain '/recordset/'
  await expect(page).toHaveURL(/\/recordset\//);

  // testing if the URL contains some string
  await expect(page).toHaveURL(url => {
    return url.href.includes('@sort(my_column)')
  });
  ```


### Actions

In here we've listed all the actions that we encountered and we found useful. Please refer to [this link](https://playwright.dev/docs/input) for the complete list of available actions.

- To change value of a input
  ```ts
  // set the value of an input or textarea
  // https://playwright.dev/docs/api/class-locator#locator-fill
  await locator.fill('new value');

  // clear the value of input or textaraea (PREFERRED)
  // https://playwright.dev/docs/api/class-locator#locator-clear
  await locator.clear();

  // will accomplish the same thing as `clear()`
  await locator.fill('');
  ```

- When filling a value in an input, we want to ensure it is filled afterwards:
  ```ts
  await locator.fill(value);
  await expect.soft(locator).toHaveValue(value);
  ```

- Mouse actions:

  ```ts
  await locator.click();
  await locator.hover();
  ```

- Checkbox specific:
  ```ts
  // https://playwright.dev/docs/input#checkboxes-and-radio-buttons
  await locator.check();
  ```

### Managing page

- Useful links
  - https://playwright.dev/docs/pages

- Use `generateChaiseURL` for creating a chaise url:
  ```ts
  await page.goto(generateChaiseURL(APP_NAMES.RECORD, 'schema', 'table', testInfo, baseURL) + '/id=12');
  ```

- Use `clickNewTabLink` function in `page-utils.ts` for testing buttons that open a new tab:
  ```ts
  const newPage = await PageLocators.clickNewTabLink(someButton, context);
  await newPage.waitForURL('someURL');

  await newPage.waitForURL(`**/recordedit/**`);
  await expect.soft(newPage).toHaveURL(/prefill\=/);

  await newPage.close();
  ```

- In Playwright, each page behaves like a focused, active page. Bringing the page to front is not required. But this also
  means that the pages will never go out of focus (`blur`) and so when you switch back to a page, it will not automatically
  create a `focus` event. For tests that rely on `focus` event, call `manuallyTriggerFocus` function in `page-utils.ts` to
  manually trigger this event.

## Common issues/errors

### `Error: locator.click: Target closed`

This means that you didn't wait for the asynchronous event. So make sure `await` is consistently everywhere. It's needed for step, outside of it, and expects.

```ts
test.describe('feature', () => {
  const PAGE_URL = `/recordset/#${process.env.CATALOG_ID!}/product-navbar:accommodation`;

  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}${PAGE_URL}`);
  })

  test('basic features,', async ({ page }) => {
    const navbar = NavbarLocators.getContainer(page);

    await test.step('navbar should be visible on load.', async () => {
      await navbar.waitFor({ state: 'visible' });
    });
  });
})
```
