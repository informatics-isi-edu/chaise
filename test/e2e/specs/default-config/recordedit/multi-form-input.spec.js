const chaisePage = require('../../../utils/chaise.page.js');
const recordEditPage = chaisePage.recordEditPage;
const recordEditHelpers = require('../../../utils/recordedit-helpers.js');

const testParams = {
  schema_table: 'multi-form-input:main',
  max_input_rows: 200,
};

describe('Regarding multi form input and clone button', () => {
  describe('Regarding multi form input,', () => {
    // TODO
  });

  describe('Regarding clone button, in create mode,', () => {
    let cloneFormInput, cloneFormSubmitButton;

    beforeAll((done) => {
      chaisePage.navigate(`${browser.params.url}/recordedit/#${browser.params.catalogId}/${testParams.schema_table}`);
      chaisePage.recordeditPageReady().then(() => {
        cloneFormInput = chaisePage.recordEditPage.getCloneFormInput();
        cloneFormSubmitButton = chaisePage.recordEditPage.getCloneFormInputSubmitButton();
        done();
      }).catch(chaisePage.catchTestError(done));
    });

    it('it should be visible.', () => {
      expect(cloneFormInput.isDisplayed()).toBeTruthy();
    });

    it('should alert the user when they try to add more forms than the limit allows.', (done) => {
      const numberGreaterThanMax = testParams.max_input_rows + 1;
      const errorMessage = `Cannot add ${numberGreaterThanMax} records. Please input a value between 1 and ${testParams.max_input_rows}, inclusive.`;

      cloneFormInput.clear().then(() => {
        return cloneFormInput.sendKeys(numberGreaterThanMax);
      }).then(() => {
        return chaisePage.clickButton(cloneFormSubmitButton);
      }).then(() => {
        return chaisePage.recordEditPage.getAlertError();
      }).then(function (err) {
        return err.getText();
      }).then(function (text) {
        expect(text.indexOf(errorMessage)).toBeGreaterThan(-1);
        done();
      }).catch(chaisePage.catchTestError(done));
    });

    it('should allow users to add the maximum amount of forms.', (done) => {
      cloneFormInput.clear().then(() => {
        return cloneFormInput.sendKeys(testParams.max_input_rows);
      }).then(() => {
        return chaisePage.clickButton(cloneFormSubmitButton);
      }).then(() => {
        // wait for dom to finish rendering the forms
        return browser.wait(() => {
          return chaisePage.recordEditPage.getRecordeditForms().count().then(function (ct) {
            return (ct == testParams.max_input_rows + 1);
          });
        }, browser.params.defaultTimeout);
      }).then(() => {

        return chaisePage.recordEditPage.submitForm();
      }).then(() => {
        return browser.driver.getCurrentUrl();
      }).then((url) => {
        expect(url.startsWith(process.env.CHAISE_BASE_URL + "/recordedit/")).toBe(true);

        // so DOM can render table
        return browser.wait(() => {
          return chaisePage.recordsetPage.getRows().count().then((ct) => {
            return (ct == testParams.max_input_rows + 1);
          });
        }, browser.params.defaultTimeout);
      }).then(() => {
        return chaisePage.recordsetPage.getRows().count();
      }).then((ct) => {
        expect(ct).toBe(testParams.max_input_rows + 1);
        done();
      }).catch(chaisePage.catchTestError(done));
    });
  });

})
