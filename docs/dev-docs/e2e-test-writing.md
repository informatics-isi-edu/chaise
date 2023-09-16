#
# Writing End to End Test Cases

In this section we have summarized all the resources that you need for writing test cases alongside different issues that we have faced. Please make sure to follow the given instructions.

## Test Idioms

In this document we try to summarize what are the best practices while writing test cases in Chaise.

- Try to keep your schema definitions as simple as possible. It only needs to cover the cases that you want to test. Avoid duplicating other existing schemas/tables.
- Don't rely on ERMrestJS heuristics for the parts of the code that you are not testing, and define annotations. The heuristics change more regularly than the annotation won't. For example if you are testing the presentation of record app, define your own visible-columns and visible-foreignkeys annotation.
- Be specific about the scenario that you are testing. If you want to test a very specific scenario, you don't have to test all the other features. For instance, if you want to test recordset page in a specific scenario, you don't have to test all the facet data and main data (The more general case should already be tested and should be separate from this specific test).
- Use names that describe the situation you are trying to recreate. For instance if you are testing the annotations and you want to create a table with annotation 'x' just name the table `table_w_x`. This way we can easily look at the schema and understand which cases are covered in that schema.
- If your test case is related to one of the currently implemented test specs,
	- If they can share the same schema, you can modify its schema to cover your case too and add your test case to the corresponding test spec (Instead of creating a new configuration and test spec).
	- (More applicable in ERMrestJS)Although it's preferable to not modify other schemas and create your very own schema that covers some specific test cases.
- If you have multiple expect in your `it`, make sure they have their own error message.

- Use `expect.soft` if this is one of steps and we should be able to run the next steps even if it fails.

- Common wait-fors:

```
profileModal.waitFor({ state: 'visible' });

profileModal.waitFor({ state: 'attached' });

profileModal.waitFor({ state: 'detached' });
```


## Test FAQ

- `toHaveText` is prefered to direct `innerText` or `textContent()`, but it doesn't handle calling on a parent element. So you have call it on the child.

### Common errors


**`Error: locator.click: Target closed`**

Make sure `await` is consistently everywhere. It's needed for step, outside of it, and expects

```
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

## Managing page

https://playwright.dev/docs/pages

```ts
// Start waiting for new page before clicking. Note no await.
const pagePromise = context.waitForEvent('page');
await page.getByText('open new tab').click();
const newPage = await pagePromise;
await newPage.waitForLoadState();
console.log(await newPage.title());
```


## Locators

TODO explain how to add locator classes to `locators` folder.

## Assertions

https://playwright.dev/docs/test-assertions

