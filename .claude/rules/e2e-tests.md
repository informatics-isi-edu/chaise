---
paths:
  - "test/e2e/**"
---

## Writing E2E Tests

### Framework & Structure

Tests use **Playwright** (TypeScript) with Chromium. Test files are organized under `test/e2e/specs/` in 4 parallel groups:

| Group | Purpose | Config runs sequentially? |
|---|---|---|
| `all-features` | Full feature tests, often modify catalog state | Yes |
| `all-features-confirmation` | Read-only feature verification | No |
| `default-config` | Default configuration behavior | No |
| `delete-prohibited` | ACL-restricted scenarios | No |

### File Structure for a New Test

Each test requires these files:

```
test/e2e/
  data_setup/
    schema/record/my-feature.json          # Schema definition (tables, FKs, annotations)
    data/my-feature/*.json                 # Entity data (one JSON file per table)
    config/record/my-feature.config.json   # Maps schema path + data path
    config/record/my-feature/dev.json      # Lists schemaConfigurations
  specs/<group>/record/
    my-feature.config.ts                   # Playwright config (points to dev.json)
    my-feature.spec.ts                     # Test spec
```

Plus update:
- The parallel config: `data_setup/config/parallel-configs/<group>.dev.json`
- The `Makefile`: add a variable for the config path and include it in the appropriate test group (e.g., `RECORD_TESTS`, `RECORDSET_TESTS`)

### Data Setup Chain

1. **`my-feature.config.ts`** -- Playwright config, references `configFileName` (a dev.json)
2. **`dev.json`** -- lists `schemaConfigurations` (array of .config.json files)
3. **`.config.json`** -- references schema JSON path + entity data directory path
4. **Schema JSON** -- defines tables, columns, foreign keys, and ERMrest annotations
5. **Entity JSON** -- arrays of records, one file per table (filename must match table name)

### Playwright Config Pattern

```typescript
import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: '<group>/record/my-feature',
  configFileName: 'record/my-feature/dev.json',
  mainSpecName: '<group>',
  testMatch: ['my-feature.spec.ts']
});
```

### Schema JSON Pattern

```json
{
  "schema_name": "my-schema",
  "tables": {
    "my_table": {
      "kind": "table",
      "table_name": "my_table",
      "schema_name": "my-schema",
      "keys": [{"unique_columns": ["id"]}],
      "foreign_keys": [{
        "names": [["my-schema", "my_fk"]],
        "foreign_key_columns": [{"column_name": "fk_col", "table_name": "my_table", "schema_name": "my-schema"}],
        "referenced_columns": [{"column_name": "id", "table_name": "other_table", "schema_name": "my-schema"}]
      }],
      "column_definitions": [
        {"name": "id", "type": {"typename": "int"}, "nullok": false},
        {"name": "title", "type": {"typename": "text"}}
      ],
      "annotations": {
        "tag:isrd.isi.edu,2016:visible-columns": {"detailed": ["id", "title"]},
        "tag:isrd.isi.edu,2016:visible-foreign-keys": {"detailed": []}
      }
    }
  }
}
```

### Test Spec Pattern

```typescript
import { test, expect } from '@playwright/test';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

test.describe.configure({ mode: 'parallel' });

test.describe('My feature', () => {
  test('test case', async ({ page, baseURL }, testInfo) => {
    await page.goto(generateChaiseURL(APP_NAMES.RECORD, 'my-schema', 'my_table', testInfo, baseURL) + '/id=1');
    await RecordLocators.waitForRecordPageReady(page);

    await test.step('should verify something', async () => {
      // assertions using expect.soft() for non-blocking
    });
  });
});
```

### Parameterized Tests

Use a `for...of` loop around `test()` to run the same test with different data:

```typescript
const testCases = [
  { description: 'case 1', key: 'id=1', expected: [...] },
  { description: 'case 2', key: 'id=2', expected: [...] },
];

test.describe.configure({ mode: 'parallel' });

for (const tc of testCases) {
  test(`${tc.description}`, async ({ page, baseURL }, testInfo) => {
    // ...
  });
}
```

### Key Locators & Utilities

| Locator/Util | File | Purpose |
|---|---|---|
| `RecordLocators` | `test/e2e/locators/record.ts` | Record page selectors (columns, related tables, TOC, buttons) |
| `RecordsetLocators` | `test/e2e/locators/recordset.ts` | Table/grid selectors (rows, columns, facets) |
| `RecordeditLocators` | `test/e2e/locators/recordedit.ts` | Form input selectors |
| `ModalLocators` | `test/e2e/locators/modal.ts` | Modal dialog selectors |
| `testRelatedTablePresentation` | `test/e2e/utils/record-utils.ts` | Comprehensive related table verification |
| `testRecordMainSectionValues` | `test/e2e/utils/record-utils.ts` | Verify main section column values |
| `generateChaiseURL` | `test/e2e/utils/page-utils.ts` | Build Chaise app URLs |
| `getCatalogID` / `getEntityRow` | `test/e2e/utils/catalog-utils.ts` | Access test catalog data |

### Running a Single Test

```bash
npx playwright test --project=chromium --config test/e2e/specs/default-config/record/condition.config.ts
```
