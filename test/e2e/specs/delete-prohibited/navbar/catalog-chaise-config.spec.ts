import { test, expect, Page, TestInfo } from '@playwright/test';
import { resolve } from 'path';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';

import NavbarLocators from '@isrd-isi-edu/chaise/test/e2e/locators/navbar';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';
import { copyFileToChaiseDir, getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { clickNewTabLink } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';
import { PW_PROJECT_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';

const NAVBAR_TEST_W_DYNAMIC_DEPS = 'navbar-test-w-dynamic-deps.html';
const NAVBAR_TEST_W_STATIC_DEPS = 'navbar-test-w-static-deps.html';

/**
 * NOTES:
 *
 * 1. Since we're testing "static" navbar on this spec, you must build chaise prior to running this test. the "static"
 *   pages are generated by referring to the content of "dist" folder.
 *
 * 2. while each test inside this describe is independent of the other ones, we cannot do fullyParalell here because of
 * beforeAll and afterAll. We want beforeAll and afterAll to run only once, but when we use fullyParallel,
 * those functions will be called by each worker.
 *
 *
 */
test.describe('Navbar with chaise-config annotation', () => {

  // prepare the html files needed for testing
  test.beforeAll(({ baseURL }, testInfo) => {
    if (allowNavbarStaticTest(testInfo)) prepareNavbarFiles(baseURL);

    prepareNavbarFiles(baseURL);
  });

  test('should hide the navbar bar if the hideNavbar query parameter is set to true', async ({ page, baseURL }, testInfo) => {
    const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/catalog-config-navbar:config-table`;
    await page.goto(`${baseURL}${PAGE_URL}?hideNavbar=true`);
    await RecordsetLocators.waitForRecordsetPageReady(page);
    await expect.soft(NavbarLocators.getContainer(page)).not.toBeAttached();
  });

  test('on a chaise page', async ({ page, baseURL }, testInfo) => {
    await testNavbarFunctionalities(page, `${baseURL}/recordset/#${getCatalogID(testInfo.project.name)}/catalog-config-navbar:config-table`);
  });

  test('on a static page with dynamic navbar-dependencies', async ({ page, baseURL }, testInfo) => {
    const res = allowNavbarStaticTest(testInfo);
    test.skip(!res.condition, res.reason);
    await testNavbarFunctionalities(page, `${baseURL}/${NAVBAR_TEST_W_DYNAMIC_DEPS}`, true);
  });

  test('on a static page with dynamic navbar-dependencies and hash fragments', async ({ page, baseURL }, testInfo) => {
    const res = allowNavbarStaticTest(testInfo);
    test.skip(!res.condition, res.reason);
    await testNavbarFunctionalities(page, `${baseURL}/${NAVBAR_TEST_W_DYNAMIC_DEPS}#example-of-a-hash-fragment`, true);
  });

  test('on a static page with dynamic navbar-dependencies and query parameters', async ({ page, baseURL }, testInfo) => {
    const res = allowNavbarStaticTest(testInfo);
    test.skip(!res.condition, res.reason);
    await testNavbarFunctionalities(page, `${baseURL}/${NAVBAR_TEST_W_DYNAMIC_DEPS}?example-of-a-query-fragment=1`, true);
  });

  test('on a static page with static navbar-dependencies', async ({ page, baseURL }, testInfo) => {
    const res = allowNavbarStaticTest(testInfo);
    test.skip(!res.condition, res.reason);
    await testNavbarFunctionalities(page, `${baseURL}/${NAVBAR_TEST_W_STATIC_DEPS}`, true);
  });

  test('on a static page with static navbar-dependencies and hash fragments', async ({ page, baseURL }, testInfo) => {
    const res = allowNavbarStaticTest(testInfo);
    test.skip(!res.condition, res.reason);
    await testNavbarFunctionalities(page, `${baseURL}/${NAVBAR_TEST_W_STATIC_DEPS}#example-of-a-hash-fragment`, true);
  });

  test('on a static page with static navbar-dependencies and query parameters', async ({ page, baseURL }, testInfo) => {
    const res = allowNavbarStaticTest(testInfo);
    test.skip(!res.condition, res.reason);
    await testNavbarFunctionalities(page, `${baseURL}/${NAVBAR_TEST_W_STATIC_DEPS}?example-of-a-query-fragment=1`, true);
  });

  // remove the html files needed for testing
  test.afterAll(({ }, testInfo) => {
    if (allowNavbarStaticTest(testInfo)) removeExtraNavbarFiles();
  });
});

/********************** helper functions ************************/
const TEST_UTILS_FOLDER = resolve(__dirname, './../../../utils');
const NAVBAR_DEPENDENCIES = resolve(__dirname, './../../../../../dist/react/lib/navbar/navbar-dependencies.html');
const REPLACE_STRING = '<!--{%navbar-dependencies%}-->';

/**
 * afterAll and beforeAll are called multiple times. these booleans will avoid creating/removing files multiple times
 */
let alreadyCreated = false;
let alreadyRemoved = false;

/**
 * since we're adding alias using the project name, we cannot run this test on all projects.
 */
const allowNavbarStaticTest = (testInfo: TestInfo) => {
  return {
    condition: testInfo.project.name === PW_PROJECT_NAMES.CHROME,
    reason: 'defaultCatalog is based on the project name. so only running on chrome'
  };
}

/**
 * create the navbar files needed for static testing (it will generate the files and rsync to location)
 */
const prepareNavbarFiles = (baseURL?: string) => {
  if (alreadyCreated) return;
  alreadyCreated = true;

  try {
    // get the template file
    const navbarTemplateStr = readFileSync(resolve(TEST_UTILS_FOLDER, './navbar-test.html')).toString();
    if (!navbarTemplateStr) throw new Error('unable to find navbar-test.html');

    createNavbarFile(navbarTemplateStr, NAVBAR_TEST_W_DYNAMIC_DEPS,
      `<script src='${baseURL}/lib/navbar/navbar.dependencies.js'></script>`
    );

    // get the dependencies
    const staticDependencies = readFileSync(NAVBAR_DEPENDENCIES).toString();
    if (!staticDependencies) throw new Error('unable to find navbar-dependencies.html');

    createNavbarFile(navbarTemplateStr, NAVBAR_TEST_W_STATIC_DEPS, staticDependencies);

  } catch (err) {
    console.log('something went wrong while creating the navbar test files');
    console.log(err);
  }
};

/**
 *
 * @param navbarTemplateStr the content of the file
 * @param filename the filename that we should use
 * @param dependenciesStr the dependencies string that should replace the REPLACE_STRING
 */
const createNavbarFile = (navbarTemplateStr: string, filename: string, dependenciesStr: string) => {
  // create the dynamic dep file
  const dynamicDepsContent = navbarTemplateStr.replace(REPLACE_STRING, dependenciesStr);
  const navbarTestFileWDynamicDeps = resolve(TEST_UTILS_FOLDER, `./${filename}`);
  writeFileSync(navbarTestFileWDynamicDeps, dynamicDepsContent);

  // copy the file into location
  copyFileToChaiseDir(navbarTestFileWDynamicDeps, filename);
}


/**
 * remove the navbar files that were created.
 * (will only create the local files and not the ones that were moved to the remote location)
 */
const removeExtraNavbarFiles = () => {
  if (alreadyRemoved) return;
  alreadyRemoved = true;

  try {
    console.log('removing the files');
    unlinkSync(resolve(TEST_UTILS_FOLDER, `./${NAVBAR_TEST_W_STATIC_DEPS}`));
    unlinkSync(resolve(TEST_UTILS_FOLDER, `./${NAVBAR_TEST_W_DYNAMIC_DEPS}`));
  } catch (exp) {
    console.log('something went wrong while removing the navbar test files')
    console.log(exp);
  }
}


/**
 * make sure navbar shows up as expected.
 *
 * NOTE: on static sites the .../images/logo.png location doesn't work, so the brandImage will not be visible.
 *
 * @param {boolean?} isStatic whether this is a static page
 */
const testNavbarFunctionalities = async (page: Page, pageURL: string, isStatic?: boolean) => {
  const navbar = NavbarLocators.getContainer(page);
  const loginMenuOption = NavbarLocators.getLoginMenuContainer(page);

  await test.step('navbar should be visible on load.', async () => {
    await page.goto(pageURL);
    await expect(navbar).toBeVisible();
  });

  await test.step('should display the right title from catalog annotation.', async () => {
    await expect.soft(NavbarLocators.getBrandText(page)).toHaveText('override test123');
  });

  await test.step('should use the brand image of catalog annotation', async () => {
    const brandImage = NavbarLocators.getBrandImage(page)
    await expect.soft(brandImage).toHaveAttribute('src', '../images/logo.png');
    if (!isStatic) {
      await expect.soft(brandImage).toBeVisible();
    }
  });

  await test.step('should show a banner on top of the navbar', async () => {
    const banner = NavbarLocators.getBannerContent('', page);
    await expect.soft(banner).toBeVisible();
    await expect.soft(banner).toHaveText('This is a banner with link');
  });

  await test.step('should show a link for the login information since chaiseConfig.loggedInMenu is an object', async () => {
    await expect.soft(loginMenuOption).toHaveText('Outbound Profile Link')
  });

  if (!process.env.CI) {
    await test.step('should open a new tab when clicking the link for the login information', async () => {
      const newPage = await clickNewTabLink(loginMenuOption);

      await newPage.close();
    });
  }
}
