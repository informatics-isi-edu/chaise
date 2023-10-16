const chaisePage = require('../../../utils/chaise.page.js');
const recordEditPage = chaisePage.recordEditPage;
const recordEditHelpers = require('../../../utils/recordedit-helpers.js');

const testParams = {
  schema_table: 'multi-form-input:main',
  max_input_rows: 200
};

describe('Regarding multi form input and clone button', () => {
  let cloneFormInput, cloneFormSubmitButton,inputSwitch;
  describe('Regarding multi form input,', () => {
    describe('in create mode', () => {
      beforeAll((done) => {
        chaisePage.navigate(`${browser.params.url}/recordedit/#${browser.params.catalogId}/${testParams.schema_table}`);
        chaisePage.recordeditPageReady().then(() => {
          cloneFormInput = chaisePage.recordEditPage.getCloneFormInput();
          cloneFormSubmitButton = chaisePage.recordEditPage.getCloneFormInputSubmitButton();
          done();
        }).catch(chaisePage.catchTestError(done));
      });

      it('it should not be offered in single mode.', () => {
        let toggleBtn = recordEditPage.getColumnMultiFormButton('markdown_col');
        expect(toggleBtn.isPresent()).toBeFalsy("toggle btn is present");
      });      

      it('it should not be offered for disabled columns.', (done) => {
        let input = recordEditPage.getInputForAColumn('id', 1);
        expect(input.isEnabled()).toBeFalsy("col " + 'id' + " was not disabled.");
        let toggleBtn = recordEditPage.getColumnMultiFormButton('id');
        expect(toggleBtn.isPresent()).toBeFalsy("toggle btn is present");
        done();
      });
      it('it should be displayed as soon as users added a new form.', (done) => {
        chaisePage.clickButton(cloneFormSubmitButton).then(() => {
        let toggleBtn = recordEditPage.getColumnMultiFormButton('markdown_col');
        expect(toggleBtn.isPresent()).toBeTruthy("toggle btn is present");
        done();
      });
      });

      it('by default only the first form should be selected.', (done) => {
        let toggleBtn = recordEditPage.getColumnMultiFormButton('markdown_col');
        chaisePage.clickButton(toggleBtn).then(() => {
          inputSwitch = recordEditPage.getInputSwitchContainer('markdown_col', 1);
          const parentElement = inputSwitch.element(by.xpath('..'));
          expect(parentElement.getAttribute("class")).toContain('entity-active', 'Form is not selected');
          done();
        });
      });

      it('the newly cloned form should not be selected.', (done) => {
        chaisePage.clickButton(cloneFormSubmitButton).then(() => {
          inputSwitch = recordEditPage.getInputSwitchContainer('markdown_col', 3);
          const parentElement = inputSwitch.element(by.xpath('..'));
          expect(parentElement.getAttribute("class")).not.toContain('entity-active', 'Form is selected');
          done();
        });
      });
      
      it('the form should work as a toggle when selected', (done) => {
        inputSwitch = recordEditPage.getInputSwitchContainer('markdown_col', 3);
        const parentElement = inputSwitch.element(by.xpath('..'));
        chaisePage.clickButton(parentElement).then(() => {
          expect(parentElement.getAttribute("class")).toContain('entity-active', 'Form is not selected');
        });
        chaisePage.clickButton(parentElement).then(() => {
          expect(parentElement.getAttribute("class")).not.toContain('entity-active', 'Form is selected');
          done();
        });
      });
      it('the form should not be clickable', () => {
        let toggleBtn = recordEditPage.getColumnMultiFormButton('markdown_col');
        const parentElement = inputSwitch.element(by.xpath('..'));
        chaisePage.clickButton(toggleBtn).then(() => {
          expect(parentElement.getAttribute("class")).not.toContain('form-overlay', 'Form is clickable');
        });
      });
      describe('checkbox functionality',() => {
        let checkboxLabel, checkboxInput;
        it('on load the as the first form is selected by default checkbox text should reflect that', (done) => {
          let toggleBtn = recordEditPage.getColumnMultiFormButton('markdown_col');
          chaisePage.clickButton(toggleBtn).then(() => {
            inputSwitch = recordEditPage.getInputSwitchContainer('markdown_col', 1);
            const parentElement = inputSwitch.element(by.xpath('..'));
            expect(parentElement.getAttribute("class")).toContain('entity-active', 'Form is not selected');
            
            const elementsWithClass = element.all(by.css('.form-header.entity-value'));
            
            elementsWithClass.count().then((count) => {
              checkboxLabel = element(by.id('checkbox-label'));
              expect(checkboxLabel.getText()).toBe(`1 of ${count} selected records`);
              done();
            });
          });
        });

        it('when we click on clone the checkbox text should reflect', (done) => {
          chaisePage.clickButton(cloneFormSubmitButton).then(() => {
            
            const elementsWithClass = element.all(by.css('.form-header.entity-value'));
            
            elementsWithClass.count().then((count) => {
              expect(checkboxLabel.getText()).toBe(`1 of ${count} selected records`);
              done();
            });
          });
        });
        it('click on checkbox then all forms are selected and checkbox text should change', (done) => {
            
            const elementsWithClass = element.all(by.css('.form-header.entity-value'));
            
            elementsWithClass.count().then((count) => {
              checkboxInput = element(by.id('checkbox-input'));
              chaisePage.clickButton(checkboxInput).then(() => {
              expect(checkboxLabel.getText()).toBe(`${count} of ${count} selected records`);
              done();
            });
          })
        });
        it('deselecting the checkbox and checkbox text should change', (done) => {
            
            const elementsWithClass = element.all(by.css('.form-header.entity-value'));
            
            elementsWithClass.count().then((count) => {
              chaisePage.clickButton(checkboxInput).then(() => {
              expect(checkboxLabel.getText()).toBe('Select All');
              done();
            });
          })
        });
      })
      describe('apply functionality for textarea',() => {
        // apply to all, clear all, apply to some, clear to some
        // TODO second phase
      })
      

      /**
       * TODO more test cases should be added here...
       * feel free to change any of the tests that I mentioned above. as long as you've covered all the features,
       * it's ok to not go exactly how I described this.
       *
       * You can also take a look at add-x-forms.spec.ignored.js which was the previous test cases for this feature.
       * In there you can see that we're testing select-all for multiple column types. you should do something
       * similar here. we should remove that spec when you're done with the changes. I just left it so you can take a
       * look at an example.
       */
    });

    /**
     * the tests below are just to make sure edit works as well. the bulk of test cases should be added above.
     */
    describe('in edit mode', () => {
      it('in single edit the toggle button should not be available.', () => {
        // TODO
        // go to a single edit page and make sure the button is not available.
      });

      describe('in multi edit', () => {
        beforeAll(() => {
          // TODO go to a multiedit page
        });

        it('the toggle button should be offered on all non-disabled columns.', () => {
          // TODO
          // make sure it's not available for the disabled column
          // make sure it's available it's availbale for one of the columns
        });

        it('user should be able to use this control to change all values for a column.', () => {
          // TODO
          // click on the toggle for that one column, select all, change value, and then submit.
        });
       
      });
    });
  });

  // TODO x should be removed when the tests above are added
  xdescribe('Regarding clone button, in create mode,', () => {
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
