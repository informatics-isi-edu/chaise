const chaisePage = require('../../../utils/chaise.page.js');
const recordEditPage = chaisePage.recordEditPage;
const recordEditHelpers = require('../../../utils/recordedit-helpers.js');

const testParams = {
  schema_table: 'multi-form-input:main',
  max_input_rows: 200,
  tables: [{
    comment: "general case",
    schema_name: "multi-form-input",
    table_name: "main",
    table_displayname: "main",
    table_comment: "List of different types of accommodations",
    not_ci: true,
    primary_keys: ["id"],
    inputs: [
      {
        "markdown_col": "textarea"
      },
      {
        "markdown_col": "new text"
      },
      {
        "markdown_col": ""
      },
      {
        "markdown_col": ""
      },
      {
        "markdown_col": ""
      },
    ],
    formsOnLoad: 1,
    formsAfterInput: 5,
    result_columns: [
      "id", "markdown_col", "text_col", "int_col", "float_col", "date_col", "timestamp_col",
      "boolean_col", ["multi-form-input", "main_fk1"], "asset_col", "asset_col_filename"
    ],
    results: [
      ["textarea"], ["new text"], [""], [""], [""]
    ],
    files: []
  },
  ]
};

describe('Regarding multi form input and clone button', () => {
  let cloneFormInput, cloneFormSubmitButton, inputSwitch, checkboxLabel, checkboxInput;;
  describe('Regarding multi form input,', () => {
    describe('in create mode', () => {
      const EC = protractor.ExpectedConditions;
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

      it('it should be displayed as soon as users added a new form.', (done) => {
        chaisePage.clickButton(cloneFormSubmitButton).then(() => {
          return recordEditPage.getColumnMultiFormButton('markdown_col')
        }).then((toggleBtn) => {
          expect(toggleBtn.isPresent()).toBeTruthy("toggle btn is present")
          done();
        }).catch(chaisePage.catchTestError(done));
      });

      it('it should not be offered for disabled columns.', (done) => {
        let input = recordEditPage.getInputForAColumn('id', 1);
        expect(input.isEnabled()).toBeFalsy("col " + 'id' + " was not disabled.");
        let toggleBtn = recordEditPage.getColumnMultiFormButton('id');
        expect(toggleBtn.isPresent()).toBeFalsy("toggle btn is present");
        done();
      });


      it('by default only the first form should be selected.', (done) => {
        let toggleBtn = recordEditPage.getColumnMultiFormButton('markdown_col');
        chaisePage.clickButton(toggleBtn)
          .then(() => recordEditPage.getInputSwitchContainer('markdown_col', 1))
          .then((inputSwitch) => recordEditPage.getParentElement(inputSwitch))
          .then((parentElement) => {
            expect(parentElement.getAttribute("class")).toContain('entity-active', 'Form is not selected');
            done();
          })
          .catch(chaisePage.catchTestError(done));
      });


      it('the newly cloned form should not be selected.', (done) => {
        chaisePage.clickButton(cloneFormSubmitButton)
          .then(() => recordEditPage.getInputSwitchContainer('markdown_col', 3))
          .then((inputSwitch) => recordEditPage.getParentElement(inputSwitch))
          .then((parentElement) => {
            expect(parentElement.getAttribute("class")).not.toContain('entity-active', 'Form is selected');
            done();
          })
          .catch(chaisePage.catchTestError(done));
      });


      it('the form should work as a toggle when selected', (done) => {
        inputSwitch = recordEditPage.getInputSwitchContainer('markdown_col', 3);
        const parentElement = recordEditPage.getParentElement(inputSwitch);
        chaisePage.clickButton(parentElement).then(() => {
          expect(parentElement.getAttribute("class")).toContain('entity-active', 'Form is not selected');
        }).then(() => {
          return chaisePage.clickButton(parentElement).then(() => {
            expect(parentElement.getAttribute("class")).not.toContain('entity-active', 'Form is selected');
            done();
          }).catch(chaisePage.catchTestError(done));
        })

      });
      it('previous selection should remain after closing and opening again', (done) => {
        inputSwitch = recordEditPage.getInputSwitchContainer('markdown_col', 3);
        const parentElement = recordEditPage.getParentElement(inputSwitch);
        chaisePage.clickButton(parentElement).then(() => {
          expect(parentElement.getAttribute("class")).toContain('entity-active', 'Form is not selected');
        }).then(() => {
          let toggleBtn = recordEditPage.getColumnMultiFormButton('markdown_col');
          chaisePage.clickButton(toggleBtn)
            .then(() => chaisePage.clickButton(toggleBtn))
            .then(() => recordEditPage.getInputSwitchContainer('markdown_col', 3))
            .then((inputSwitch) => recordEditPage.getParentElement(inputSwitch))
            .then((parentElement) => {
              expect(parentElement.getAttribute("class")).toContain('entity-active', 'Form is not selected');
              done();
            })
        }).catch(chaisePage.catchTestError(done));
      })

      it('the form should not be clickable', () => {
        let toggleBtn = recordEditPage.getColumnMultiFormButton('markdown_col');
        const parentElement = recordEditPage.getParentElement(inputSwitch);
        chaisePage.clickButton(toggleBtn).then(() => {
          return chaisePage.clickButton(parentElement).then(() => {
            expect(parentElement.getAttribute("class")).not.toContain('entity-active', 'Form is not selected');
          })
        });
      });
      xdescribe('checkbox functionality', () => {
        let elementsWithClass;
        it('on load the label should reflect what is selected.', (done) => {
          let toggleBtn;
          chaisePage.clickButton(recordEditPage.getColumnMultiFormButton('markdown_col'))
            .then(() => {
              toggleBtn = recordEditPage.getColumnMultiFormButton('markdown_col', 1);
              return recordEditPage.getInputSwitchContainer('markdown_col', 1);
            })
            .then((inputSwitch) => recordEditPage.getParentElement(inputSwitch))
            .then((parentElement) => {
              expect(parentElement.getAttribute("class")).toContain('entity-active', 'Form is not selected');
            })
            .then(() => recordEditPage.getAllElementsWithClass('.form-header.entity-value'))
            .then((count) => {
              return recordEditPage.getCheckboxLabel().getText()
                .then((checkboxLabelText) => {
                  return recordEditPage.getAllElementsWithClass('.entity-value.entity-active')
                    .then((selected) => {
                      expect(checkboxLabelText).toBe(`${selected} of ${count} selected records`);
                      done();
                    });
                });
            })
            .catch(chaisePage.catchTestError(done));
        });



        it('the label should update after adding a new form', (done) => {
          chaisePage.clickButton(cloneFormSubmitButton)
            .then(() => recordEditPage.getAllElementsWithClass('.form-header.entity-value'))
            .then((count) => {
              return recordEditPage.getAllElementsWithClass('.entity-value.entity-active')
                .then((selected) => {
                  expect(recordEditPage.getCheckboxLabel().getText()).toBe(`${selected} of ${count} selected records`);
                  done();
                });
            })
            .catch(chaisePage.catchTestError(done));
        });


        it('when partially selected, clicking on the checkbox should select all forms', (done) => {
          checkboxInput = recordEditPage.getCheckboxInput();
          chaisePage.clickButton(checkboxInput).then(() => {
            return recordEditPage.getAllElementsWithClass('.form-header.entity-value')
          }).then((count) => {
            expect(recordEditPage.getCheckboxLabel().getText()).toBe(`${count} of ${count} selected records`);
            done();
          }).catch(chaisePage.catchTestError(done));
        })


        it('when all selecting, clicking on the checkbox should dselect all forms', (done) => {
          chaisePage.clickButton(checkboxInput)
            .then(() => {
              expect(recordEditPage.getCheckboxLabel().getText()).toBe('Select All');
              done();
            })
            .catch(chaisePage.catchTestError(done));
        });
        it('when none are selected, clicking on the checkbox should select all forms', (done) => {
          expect(recordEditPage.getCheckboxLabel().getText()).toBe('Select All');
          checkboxInput = recordEditPage.getCheckboxInput();
          chaisePage.clickButton(checkboxInput).then(() => {
            return recordEditPage.getAllElementsWithClass('.form-header.entity-value')
              .then((count) => {
                expect(recordEditPage.getCheckboxLabel().getText()).toBe(`${count} of ${count} selected records`);
                done();
              }).catch(chaisePage.catchTestError(done));
          })
        });

      })
      describe('apply changes', () => {
        beforeAll((done) => {
          chaisePage.navigate(`${browser.params.url}/recordedit/#${browser.params.catalogId}/${testParams.schema_table}`);
          chaisePage.recordeditPageReady().then(() => {
            cloneFormInput = chaisePage.recordEditPage.getCloneFormInput();
            cloneFormSubmitButton = chaisePage.recordEditPage.getCloneFormInputSubmitButton();
            // add 4 in input and click on clone
            const textToType = "4";
            cloneFormInput.sendKeys(textToType);
            chaisePage.clickButton(cloneFormSubmitButton).then(() => {
              return recordEditPage.getAllElementsWithClass('.form-header.entity-value')
                .then((count) => expect(count.toEqual(5)))
            });
            done();
          }).catch(chaisePage.catchTestError(done));

        });
        describe('text area', () => {
          let multiFormTextArea;
          it('when no forms are selected, apply and clear buttons should be disabled ', () => {
            let applyButtonDisabled;
            let toggleBtn = recordEditPage.getColumnMultiFormButton('markdown_col');
            chaisePage.clickButton(toggleBtn)
              .then(() => recordEditPage.getMultiFormApply('markdown_col'))
              .then((applyButtonElement) => {
                return applyButtonElement.getAttribute('disabled');
              })
              .then((value) => {
                applyButtonDisabled = value;
                return recordEditPage.getInputSwitchContainer('markdown_col', 1);
              })
              .then((inputSwitch) => recordEditPage.getParentElement(inputSwitch))
              .then((parentElement) => {
                return chaisePage.clickButton(parentElement);
              })
              .then(() => {
                expect(parentElement.getAttribute("class")).not.toContain('entity-active', 'Form is selected');
                return chaisePage.clickButton(parentElement);
              })
              .then(() => {
                expect(parentElement.getAttribute("class")).toContain('entity-active', 'Form is not selected');
                expect(applyButtonDisabled).toBeTruthy();
              })
              .catch(chaisePage.catchTestError);
          });
          it('when all forms are selected, clicking on apply should apply change to all forms', () => {
            // come up with more easier text
            multiFormTextArea = recordEditPage.getApplySomeTextArea('markdown_col');
            const textToType = "textarea";
            multiFormTextArea.sendKeys(textToType);
            let checkboxInput = recordEditPage.getCheckboxInput();

            chaisePage.clickButton(checkboxInput)
              .then(() => {

                recordEditPage.getAllElementsWithClass('.form-header.entity-value')
                  .then(() => recordEditPage.getApplyBtnMultiForm('markdown_col'))
                  .then((applybtn) => chaisePage.clickButton(applybtn))

                  .then((count) => {
                    for (let i = 0; i < count; i++) {
                      const textArea = recordEditPage.getTextAreaForAColumn('markdown_col', i);
                      textArea.getAttribute('value').then((text) => {
                        expect(text).toContain(textToType);
                      });
                    }
                  })
              })
          });
          it('when some forms are selected, clicking on apply should apply change to selected forms', (done) => {
            const textToType = "the text is changed";
            let count;
            multiFormTextArea.sendKeys('')
              .then(() => recordEditPage.getInputSwitchContainer('markdown_col', 1))
              .then((inputSwitch) => recordEditPage.getParentElement(inputSwitch))
              .then((parentElement) => {
                // Perform the first action
                return chaisePage.clickButton(parentElement)
                  .then(() => {
                    // Check the class attribute here if needed
                    expect(parentElement.getAttribute("class")).not.toContain('entity-active', 'Form is selected');
                    return parentElement; // Return the parentElement to the next `then`
                  });
              })
              .then(() => recordEditPage.getApplyBtnMultiForm('markdown_col'))
              .then(() => multiFormTextArea.sendKeys(textToType))
              .then(() => recordEditPage.getApplyBtnMultiForm('markdown_col'))
              .then((applybtn) => chaisePage.clickButton(applybtn))
              .then(() => recordEditPage.getAllElementsWithClass('.form-header.entity-value'))
              .then((resultCount) => {
                count = resultCount;
                for (let i = 2; i < count; i++) {
                  expect(recordEditPage.getTextAreaForAColumn('markdown_col', i).getAttribute('value')).toContain(textToType)
                }
                expect(recordEditPage.getTextAreaForAColumn('markdown_col', 1).getAttribute('value')).toContain('textarea')
              })
              .then(() => done())
              .catch(chaisePage.catchTestError(done));
          });
          it('when some forms are selected, clicking on clear should clear values in selected forms', (done) => {

            const clearBtn = recordEditPage.getClearBtnMultiForm('markdown_col')
            chaisePage.clickButton(clearBtn)
              .then(() => recordEditPage.getAllElementsWithClass('.form-header.entity-value'))
              .then((count) => {
                for (let i = 2; i < count; i++) {
                  recordEditPage.getTextAreaForAColumn('markdown_col', i).getAttribute('value').then((text) => {
                    expect(text.length).not.toBeGreaterThan(0);
                  })
                }
                expect(recordEditPage.getTextAreaForAColumn('markdown_col', 1).getAttribute('value')).toContain('textarea')
              }).then(() => done())
              .catch(chaisePage.catchTestError(done));
          });
        })
        it('change values in the forms without affecting the other forms', () => {

          let toggleBtn = recordEditPage.getColumnMultiFormButton('markdown_col');
          chaisePage.clickButton(toggleBtn)
            .then(() => {
              // Edit the textarea for the second form
              let textarea = recordEditPage.getTextAreaForAColumn('markdown_col', 2);
              return textarea.clear().then(() => textarea.sendKeys('new text'));
            })
            .then(() => {
              recordEditHelpers.testSubmission(testParams.tables[0]);
            })
        });

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
