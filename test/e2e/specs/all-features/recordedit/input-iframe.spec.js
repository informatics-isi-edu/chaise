
const chaisePage = require('../../../utils/chaise.page.js');
const recordEditPage = chaisePage.recordEditPage;
const recordEditHelpers = require('../../../utils/recordedit-helpers.js');
const path = require('path');

const testParams = {
  schema_table: 'input-iframe:main',
  columns: [
    { name: "id", title: "id", nullok: false },
    { name: "creator", title: "iframe input", nullok: false },
  ],
  idColumnName: 'id',
  iframeInputName: 'creator',
  create: {
    modalTitle: 'Select iframe input for new main',
    emptyConfirmText: [
      'You are about to close the popup without setting any values (i.e. no change will be made to the record). Do you still want to proceed?',
      'To set the values, first click Cancel to dismiss this confirmation, then click the appropriate submit button in the popup.',
      'Click OK to close the popup without setting any values.'
    ].join('\n'),
    id: '1',
    values: {
      creator: 'John Smith',
      file_content: 'the file should have this content.',
      notes: ''
    },
    secondAttemptValues: {
      creator: 'John Smith II',
      file_content: 'actually the content should be this one.',
      notes: 'some notes'
    },
    recordValuesAfterCreate: {
      'id': '1',
      'creator': 'John Smith II',
      'notes': 'some notes'
    },
    recordColumnNames: ['id', 'creator', 'notes'],
  },
  edit: {
    modalTitle: 'Select iframe input for main: 1',
    id: '1',
    existingValues: {
      creator: 'John Smith II',
      file_content: 'actually the content should be this one.',
      notes: 'some notes'
    },
    newValues: {
      creator: 'Kylan Gentry',
      file_content: 'new file content',
      // testing clearing the value
      notes: ''
    },
    recordValuesAfterEdit: {
      'id': '1',
      'creator': 'Kylan Gentry',
      // notes has been cleared, so it will not be offered.
    },
    recordColumnNames: ['id', 'creator'],
  }
}

describe('input-iframe support in recordedit', () => {

  beforeAll((done) => {
    const baseURL = `${browser.params.url}/recordedit/#${browser.params.catalogId}/${testParams.schema_table}`;

    copyIframeToLocation();

    chaisePage.navigate(baseURL).then(() => {
      return chaisePage.recordeditPageReady();
    }).then(() => {
      done();
    }).catch(chaisePage.catchTestError(done));
  });

  describe('create mode', () => {
    let iframeInputContainer;

    it('should show the proper inputs.', (done) => {
      const columns = testParams.columns;
      recordEditPage.getAllColumnNames().then(function (pageColumns) {
        expect(pageColumns.length).toBe(columns.length, "number of visible columns is not what is expected.");
        // test each column
        for (var i = 0; i < pageColumns.length; i++) {
          const el = pageColumns[i];
          expect(el.getAttribute('innerHTML')).toEqual(testParams.columns[i].title, "column with index i=" + i + " is not correct");

          expect(chaisePage.recordEditPage.getColumnWithAsterisk(el).getText()).toBe('*');
        }

        done();
      }).catch(chaisePage.catchTestError(done));
    });

    it('proper input should be offered for the column with "input_iframe".', () => {
      iframeInputContainer = recordEditPage.getInputSwitchContainer(testParams.iframeInputName);
      expect(iframeInputContainer.element(by.css('.input-switch-iframe')).isDisplayed()).toBeTruthy();
    });

    it('clicking on the input should open up the iframe', (done) => {
      chaisePage.clickButton(recordEditPage.getIframeInputButton(iframeInputContainer)).then(() => {
        return chaisePage.waitForElement(chaisePage.recordEditPage.getModalTitle());
      }).then(function () {
        return chaisePage.recordEditPage.getModalTitle().getText();
      }).then(function (title) {
        expect(title).toBe(testParams.create.modalTitle, "title missmatch.");

        // make sure the spinner is hidden
        chaisePage.waitForElementInverse(recordEditPage.getIframeInputPopupSpinner());

        done();
      }).catch(chaisePage.catchTestError(done));
    });

    it('closing the iframe without submitting should show an error.', (done) => {
      let modalElements;
      chaisePage.clickButton(chaisePage.recordEditPage.getModalCloseBtn()).then(() => {
        modalElements = chaisePage.recordEditPage.getIframeInputCancelPopup();

        chaisePage.waitForElement(modalElements.element);

        expect(modalElements.body.getText()).toBe(testParams.create.emptyConfirmText, 'body missmatch');

        return chaisePage.clickButton(modalElements.cancelButton);
      }).then(() => {
        chaisePage.waitForElementInverse(modalElements.element);

        done();
      }).catch(chaisePage.catchTestError(done));
    });

    it('the iframe should be able to show alerts in the popup', (done) => {
      recordEditPage.getIframeInputPopupIframe().getWebElement().then((we) => {
        return browser.switchTo().frame(we);
      }).then(() => {
        const popupAlertBtn = recordEditPage.getIframeInputPopupAlertBtn();
        expect(popupAlertBtn.isDisplayed()).toBeTruthy();
        return chaisePage.clickButton(popupAlertBtn);
      }).then(() => {
        return browser.switchTo().defaultContent();
      }).then(() => {
        const alert = recordEditPage.getAlertErrorElement();
        expect(alert.getText()).toEqual('ErrorThis alert should be displayed on the popup.')

        const alertClose = recordEditPage.getAlertErrorClose();
        expect(alertClose.isDisplayed());
        return chaisePage.clickButton(alertClose);
      }).then(() => {
        done();
      }).catch(chaisePage.catchTestError(done));
    });

    it('submitting iframe data without providing all the information should show an alert', (done) => {
      recordEditPage.getIframeInputPopupIframe().getWebElement().then((we) => {
        return browser.switchTo().frame(we);
      }).then(() => {
        const popupSubmitBtn = recordEditPage.getIframeInputPopupSubmitBtn();
        expect(popupSubmitBtn.isDisplayed()).toBeTruthy();
        return chaisePage.clickButton(popupSubmitBtn);
      }).then(() => {
        return browser.switchTo().defaultContent();
      }).then(() => {
        const alert = recordEditPage.getAlertErrorClose();
        expect(alert.isDisplayed());
        return chaisePage.clickButton(alert);
      }).then(() => {
        done();
      }).catch(chaisePage.catchTestError(done));
    });

    it('submitting iframe data after adding all the information should close the modal and show the input.', (done) => {
      recordEditPage.getIframeInputPopupIframe().getWebElement().then((we) => {
        return browser.switchTo().frame(we);
      }).then(() => {
        const inputs = recordEditPage.getIframeInputPopupInputs();
        inputs.creator.sendKeys(testParams.create.values.creator);
        inputs.file_content.sendKeys(testParams.create.values.file_content);
        inputs.notes.sendKeys(testParams.create.values.notes);

        return chaisePage.clickButton(recordEditPage.getIframeInputPopupSubmitBtn());
      }).then(() => {
        browser.switchTo().defaultContent();
      }).then(() => {
        // modal has been closed
        chaisePage.waitForElementInverse(recordEditPage.getIframeInputPopupIframe());

        // value is displayed properly
        const val = recordEditPage.getIframeInputDisplay(iframeInputContainer);
        expect(val.getText()).toBe(testParams.create.values.creator);

        done();
      }).catch(chaisePage.catchTestError(done));
    });

    it('clicking on the input should open the modal with the previous values.', (done) => {
      // click the input
      chaisePage.clickButton(recordEditPage.getIframeInputButton(iframeInputContainer)).then(() => {
        // wait for the popup
        return chaisePage.waitForElement(chaisePage.recordEditPage.getModalTitle());
      }).then(function () {
        return chaisePage.recordEditPage.getModalTitle().getText();
      }).then(function (title) {
        expect(title).toBe(testParams.create.modalTitle, "title missmatch.");

        // make sure the spinner is hidden
        chaisePage.waitForElementInverse(recordEditPage.getIframeInputPopupSpinner());

        // switch the context to the iframe
        return recordEditPage.getIframeInputPopupIframe().getWebElement();
      }).then((we) => {
        return browser.switchTo().frame(we);
      }).then(() => {
        //  check the values
        const inputs = recordEditPage.getIframeInputPopupInputs();
        expect(inputs.creator.getAttribute('value')).toBe(testParams.create.values.creator);
        expect(inputs.file_content.getAttribute('value')).toBe(testParams.create.values.file_content);
        expect(inputs.notes.getAttribute('value')).toBe(testParams.create.values.notes);

        return setInputValues(inputs, testParams.create.secondAttemptValues);
      }).then(() => {
        return chaisePage.clickButton(recordEditPage.getIframeInputPopupSubmitBtn());
      }).then(() => {
        browser.switchTo().defaultContent();
      }).then(() => {
        // modal has been closed
        chaisePage.waitForElementInverse(recordEditPage.getIframeInputPopupIframe());

        // value is displayed properly
        const val = recordEditPage.getIframeInputDisplay(iframeInputContainer);
        expect(val.getText()).toBe(testParams.create.secondAttemptValues.creator);

        done();

      }).catch(chaisePage.catchTestError(done));
    });

    it('submitting the form should save the record.', (done) => {
      recordEditPage.getInputForAColumn(testParams.idColumnName).sendKeys(testParams.create.id).then(() => {
        testSubmission(testParams.create.recordColumnNames, testParams.create.recordValuesAfterCreate, done);
      }).catch(chaisePage.catchTestError(done));
    });

  })

  describe('edit mode', () => {
    let iframeInputContainer;
    beforeAll((done) => {
      const baseURL = `${browser.params.url}/recordedit/#${browser.params.catalogId}/${testParams.schema_table}/id=1`;
      chaisePage.navigate(baseURL).then(() => {
        return chaisePage.recordeditPageReady();
      }).then(() => {
        done();
      }).catch(chaisePage.catchTestError(done));
    });

    it('proper input with existing value should be offered.', () => {
      iframeInputContainer = recordEditPage.getInputSwitchContainer(testParams.iframeInputName);
      expect(iframeInputContainer.element(by.css('.input-switch-iframe')).isDisplayed()).toBeTruthy();

      const val = recordEditPage.getIframeInputDisplay(iframeInputContainer);
      expect(val.getText()).toBe(testParams.edit.existingValues.creator);
    });

    it('clicking on the input should open the modal with the previous values', (done) => {
      // click the input
      chaisePage.clickButton(recordEditPage.getIframeInputButton(iframeInputContainer)).then(() => {
        // wait for the popup
        return chaisePage.waitForElement(chaisePage.recordEditPage.getModalTitle());
      }).then(function () {
        return chaisePage.recordEditPage.getModalTitle().getText();
      }).then(function (title) {
        expect(title).toBe(testParams.edit.modalTitle, "title missmatch.");

        // make sure the spinner is hidden
        chaisePage.waitForElementInverse(recordEditPage.getIframeInputPopupSpinner());

        // switch the context to the iframe
        return recordEditPage.getIframeInputPopupIframe().getWebElement();
      }).then((we) => {
        return browser.switchTo().frame(we);
      }).then(() => {
        //  check the values
        const inputs = recordEditPage.getIframeInputPopupInputs();
        expect(inputs.creator.getAttribute('value')).toBe(testParams.edit.existingValues.creator);
        expect(inputs.file_content.getAttribute('value')).toBe(testParams.edit.existingValues.file_content);
        expect(inputs.notes.getAttribute('value')).toBe(testParams.edit.existingValues.notes);

        done();

      }).catch(chaisePage.catchTestError(done));
    });

    it('user should be able to update and submit the iframe data', (done) => {
      const inputs = recordEditPage.getIframeInputPopupInputs();

      setInputValues(inputs, testParams.edit.newValues).then(() => {
        return chaisePage.clickButton(recordEditPage.getIframeInputPopupSubmitBtn());
      }).then(() => {
        browser.switchTo().defaultContent();
      }).then(() => {
        // modal has been closed
        chaisePage.waitForElementInverse(recordEditPage.getIframeInputPopupIframe());

        // value is displayed properly
        const val = recordEditPage.getIframeInputDisplay(iframeInputContainer);
        expect(val.getText()).toBe(testParams.edit.newValues.creator);

        done();

      }).catch(chaisePage.catchTestError(done));
    });

    it('submitting the form should save the record.', (done) => {
      testSubmission(testParams.edit.recordColumnNames, testParams.edit.recordValuesAfterEdit, done);
    });
  });

});


/**
 * copy the iframe example into proper location
 */
const copyIframeToLocation = () => {
  const iframeLocation = path.resolve(__dirname, './../../../utils/input-iframe-test.html');

  const remoteChaiseDirPath = process.env.REMOTE_CHAISE_DIR_PATH;
  // The tests will take this path when it is not running on CI and remoteChaseDirPath is not null
  let cmd;
  if (typeof remoteChaiseDirPath === 'string') {
    cmd = `scp ${iframeLocation} ${remoteChaiseDirPath}/input-iframe-test.html`;
  } else {
    cmd = `sudo cp ${iframeLocation} /var/www/html/chaise/input-iframe-test.html`;
  }

  try {
    var execSync = require('child_process').execSync;
    execSync(cmd);
    console.log('copied the iframe into proper location');
  } catch (exp) {
    console.log(exp);
    console.log('Unable to copy the iframe into proper location');
    process.exit(1);
  }
}

const setInputValues = (inputs, values) => {
  return new Promise((resolve, reject) => {
    inputs.creator.clear().then(() => {
      return inputs.creator.sendKeys(values.creator);
    }).then(() => {
      return inputs.file_content.clear();
    }).then(() => {
      return inputs.file_content.sendKeys(values.file_content);
    }).then(() => {
      return inputs.notes.clear();
    }).then(() => {
      return inputs.notes.sendKeys(values.notes);
    }).then(() => {
      resolve();
    }).catch((err) => reject(err));
  })
}

const testSubmission = (recordColumnNames, recordValues, done) => {
  let hasErrors = false;

  chaisePage.recordEditPage.submitForm().then(() => {
    return chaisePage.recordEditPage.getAlertError();
  }).then(function (err) {
    if (err) {
      hasErrors = true;
      done.fail('page has errors');
      return;
    }

    return browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.upload-table')))).catch(function (err) {
      // if the element is not available (there is no file) it will return error which we should ignore.
    });
  }).then(() => {
    if (hasErrors) return;

    const redirectUrl = `${browser.params.url}/record/#${browser.params.catalogId}/${testParams.schema_table}/RID=`;
    browser.wait(() => {
      return browser.driver.getCurrentUrl().then((url) => {
        return url.startsWith(redirectUrl);
      });
    });

    expect(browser.driver.getCurrentUrl()).toContain(redirectUrl);
    recordEditHelpers.testRecordAppValuesAfterSubmission(recordColumnNames, recordValues, recordColumnNames.length);

    done();
  }).catch(chaisePage.catchTestError(done));
}
