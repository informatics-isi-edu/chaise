import 'expect-puppeteer'
// needed for async/await to work
import 'regenerator-runtime';
import { performLogin } from '../../../utils/jest-utils';

// needed to silence the typescript error
declare const chaiseConfig: any;

const testParams = {
  table_name: "accommodation",
  key: {
    name: "id",
    value: "2002",
    operator: "="
  }
};

describe('View existing record,', () => {

  describe("For table " + testParams.table_name + ",", () => {

    // it('should be able to login', async () => {

    // });

    it('should navigate to record page', async () => {
      await performLogin(process.env.AUTH_COOKIE);

      const keys = [];
      keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
      // const url = browser.params.url + "/record/#" + browser.params.catalogId + "/product-create-btn:" + testParams.table_name + "/" + keys.join("&");
      const url = process.env.CHAISE_BASE_URL + "/record/#" + 1 + "/isa:dataset/RID=1-3X0M";

      await page.goto(url);

      await page.waitForSelector('.record-main-section-table');
    });

    it('should load chaise-config.js and have editRecord=true', async () => {
      const res = await page.evaluate(() => chaiseConfig.editRecord);
      expect(res).toEqual(true);
    });

    it('Click the header to go to recordset page, ', async () => {
      const titleSelector = '.entity-subtitle';
      await page.waitForSelector(titleSelector);

      await page.click(titleSelector);

      await page.waitForFunction('window.location.pathname.includes("recordset")');
    });

    xit("should redirect to recordedit app", async () => {
      const btnSelector = '.title-buttons .create-record-btn';
      await page.waitForSelector(btnSelector);

      await page.click(btnSelector);

      await page.waitForFunction('window.location.pathname.includes("recordedit")');
    });
  });
});
