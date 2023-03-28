const chaisePage = require('../../../utils/chaise.page.js');
const EC = protractor.ExpectedConditions;

describe('Bulk delete in recordedit,', function () {

  beforeAll((done) => {
    const baseURL = browser.params.url + '/recordedit/#' + browser.params.catalogId + '/product-delete:accommodation';
    chaisePage.navigate(baseURL + '/id=2000;id=4004').then(() => {
      return chaisePage.recordeditPageReady();
    }).then(() => {
      done();
    }).catch(chaisePage.catchTestError(done));
  });

  it('Bulk delete button should be present and user should be able to click it.', (done) => {
    const bulkDeleteBtn = chaisePage.recordEditPage.getBulkDeleteButton();
    const confirmModalTitle = chaisePage.recordPage.getConfirmDeleteTitle();
    expect(bulkDeleteBtn.isDisplayed()).toBeTruthy();
    bulkDeleteBtn.click().then(() => {

      browser.wait(EC.visibilityOf(confirmModalTitle), browser.params.defaultTimeout);

      const confirmButton = chaisePage.recordPage.getConfirmDeleteButton();
      browser.wait(EC.visibilityOf(confirmButton), browser.params.defaultTimeout);

      expect(chaisePage.recordPage.getConfirmDeleteModalText().getText()).toBe('Are you sure you want to delete all 2 of the displayed records?');

      return chaisePage.clickButton(confirmButton);
    }).then(() => {
      done();
    }).catch(chaisePage.catchTestError(done));
  });

  it('After the delete is done, user should see the proper message', (done) => {
    const batchDeleteSummary = chaisePage.errorModal.getElement();
    const summaryTitle = chaisePage.errorModal.getTitle();

    chaisePage.waitForElement(batchDeleteSummary).then(() => {
      return chaisePage.waitForElement(summaryTitle);
    }).then(() => {
      expect(summaryTitle.getText()).toEqual('Batch Delete Summary', 'title missmatch');
      const expectedBody = [
        'All of the 2 displayed records successfully deleted.',
        '\nClick OK to go to the Recordset.',
      ].join('\n');
      expect(chaisePage.errorModal.getBody().getText()).toBe(expectedBody, 'body missmatch');
      done();
    }).catch(chaisePage.catchTestError(done));
  });

  it('clicking on "ok" button should redirect users to recordset page', (done) => {
    const summaryCloseBtn = chaisePage.errorModal.getOKButton();
    browser.wait(EC.elementToBeClickable(summaryCloseBtn), browser.params.defaultTimeout).then(() => {
      return summaryCloseBtn.click();
    }).then(() => {
      // wait for url change
      browser.wait(function () {
        return browser.driver.getCurrentUrl().then(function (url) {
          return url.startsWith(process.env.CHAISE_BASE_URL + "/recordset/");
        });
      }, browser.params.defaultTimeout);
      done();
    }).catch(chaisePage.catchTestError(done));
  });

});
