const chaisePage = require('../../../utils/chaise.page.js');
const recordEditPage = chaisePage.recordEditPage;
const recordEditHelpers = require('../../../utils/recordedit-helpers.js');


const testParams = {
  schema_table: 'multi-form-input:main',
  max_input_rows: 200,
  apply_tests: {
    not_ci: true,
    types: [
      {
        type: "input_text",
        column_name: "markdown_col",
        appy_to_all_value: "all text",
        formIndexes: [2,3,4,5],
        apply_to_some: "some text",
      },
      {
        type: "input_text",
        column_name: "text_col",
        appy_to_all_value: "all text input",
        formIndexes: [2,3,4,5],
        apply_to_some: "some text input",
        column_name: 'text_col'
      },
      {
        type: "input_text",
        appy_to_all_value: "12.4",
        formIndexes: [2,3,4,5],
        apply_to_some:  "4.5",
        column_name: 'float_col'
      },
      {
        type: "input_text",
        appy_to_all_value: "456",
        apply_to_some: "123",
        formIndexes: [2,3,4,5],
        column_name: 'int_col'
      },
      {
        type: "input_text",
        appy_to_all_value: '2020-12-11',
        apply_to_some: "2020-11-18",
        formIndexes: [2,3,4,5],
        column_name: 'date_col'
      },
      {
        type: "timestamp_col",
        appy_to_all_value_time: '12:38:31',
        formIndexes: [2,3,4,5],
        apply_to_some_time: '11:28:41',
       
        appy_to_all_value_date: '2020-12-11',
        apply_to_some_date: '2020-11-18',
        column_name: 'timestamp_col'
      },
      {
        type: "boolean_col",
        appy_to_all_value: 'false',
        formIndexes: [2,3,4,5],
        apply_to_some: 'true',
        column_name: 'boolean_col',
        booleanOptions: ["true", "false"]
      },
      {
        type: "fk_col",
        appy_to_all_value: 'three',
        formIndexes: [2,3,4,5],
        apply_to_some: 'two',
        column_name: 'fk_col'
      },
      
    ],
    submission: {
      table_displayname: 'main',
      result_columns: [
        "id", "markdown_col", "text_col", "int_col", "float_col", "date_col", "timestamp_col", "boolean_col",
        'find the hash by looking at the th element class it will be in c_<name> format',
        "asset_col", "asset_col_filename"
      ],
      results: [
        ['1', 'some value', '', '', ''],
        [],
        [],
        [],
        []
      ]
    }
  }
}
describe('Regarding multi form input and clone button', () => {
  let cloneFormInput, cloneFormSubmitButton, checkboxLabel, checkboxInput;;
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

      it('should be displayed as soon as users added a new form.', (done) => {
        chaisePage.clickButton(cloneFormSubmitButton).then(() => {
          const toggleBtn = recordEditPage.getColumnMultiFormButton('markdown_col');
          expect(toggleBtn.isPresent()).toBeTruthy("toggle btn is present");
          done();
        }).catch(chaisePage.catchTestError(done));
      });
      

      it('it should not be offered for disabled columns.', () => {
        let input = recordEditPage.getInputForAColumn('id', 1);
        expect(input.isEnabled()).toBeFalsy("col " + 'id' + " was not disabled.");
        let toggleBtn = recordEditPage.getColumnMultiFormButton('id');
        expect(toggleBtn.isPresent()).toBeFalsy("toggle btn is present");
      });


      it('by default only the first form should be selected.', (done) => {
        let toggleBtn = recordEditPage.getColumnMultiFormButton('markdown_col');
        const inputSwitch = recordEditPage.getInputSwitchContainer('markdown_col', 1)
        const parentElement = recordEditPage.getParentElement(inputSwitch);
        chaisePage.clickButton(toggleBtn)
        .then(() => {
            expect(parentElement.getAttribute("class")).toContain('entity-active', 'Form is not selected');
            done();
          })
          .catch(chaisePage.catchTestError(done));
      });

      it('the newly cloned form should not be selected.', (done) => {
        const inputSwitch = recordEditPage.getInputSwitchContainer('markdown_col', 3)
        const parentElement = recordEditPage.getParentElement(inputSwitch);
        chaisePage.clickButton(cloneFormSubmitButton)
          .then(() => {
            expect(parentElement.getAttribute("class")).not.toContain('entity-active', 'Form is selected');
            done();
          })
          .catch(chaisePage.catchTestError(done));
      });


      it('the form should work as a toggle when selected', (done) => {
        const inputSwitch = recordEditPage.getInputSwitchContainer('markdown_col', 3);
        const parentElement = recordEditPage.getParentElement(inputSwitch);
      
        chaisePage.clickButton(parentElement)
          .then(() => {
            expect(parentElement.getAttribute("class")).toContain('entity-active', 'Form is not selected');
            return chaisePage.clickButton(parentElement);
          })
          .then(() => {
            expect(parentElement.getAttribute("class")).not.toContain('entity-active', 'Form is selected');
            done();
          })
          .catch(chaisePage.catchTestError(done));
      });
      
      it('previous selection should remain after closing and opening again', (done) => {
        const inputSwitch = recordEditPage.getInputSwitchContainer('markdown_col', 3);
        const parentElement = recordEditPage.getParentElement(inputSwitch);
      
        chaisePage.clickButton(parentElement)
          .then(() => {
            expect(parentElement.getAttribute("class")).toContain('entity-active', 'Form is not selected');
            let toggleBtn = recordEditPage.getColumnMultiFormButton('markdown_col');
            return chaisePage.clickButton(toggleBtn);
          })
          .then(() => chaisePage.clickButton(recordEditPage.getColumnMultiFormButton('markdown_col')))
          .then(() => {
            expect(parentElement.getAttribute("class")).toContain('entity-active', 'Form is not selected');
            done();
          })
          .catch(chaisePage.catchTestError(done));
      });
      

      it('the form should not be clickable', (done) => {
        let toggleBtn = recordEditPage.getColumnMultiFormButton('markdown_col');
        const inputSwitch = recordEditPage.getInputSwitchContainer('markdown_col', 1);
        const parentElement = recordEditPage.getParentElement(inputSwitch);
      
        chaisePage.clickButton(toggleBtn)
          .then(() => chaisePage.clickButton(parentElement))
          .then(() => {
            expect(parentElement.getAttribute("class")).not.toContain('entity-active', 'Form is not selected');
            done();
          })
          .catch(chaisePage.catchTestError(done));
      });
      
      describe('checkbox functionality', () => {
        it('on load the label should reflect what is selected.', (done) => {
          chaisePage.clickButton(recordEditPage.getColumnMultiFormButton('markdown_col'))
            .then(() => recordEditPage.getInputSwitchContainer('markdown_col', 1))
            .then(inputSwitch => recordEditPage.getParentElement(inputSwitch))
            .then(parentElement => {
              expect(parentElement.getAttribute("class")).toContain('entity-active', 'Form is not selected');
              return recordEditPage.getAllElementsWithClass('.form-header.entity-value');
            })
            .then(count => recordEditPage.getCheckboxLabel().getText()
              .then(checkboxLabelText => [checkboxLabelText, count]))
            .then(([checkboxLabelText, count]) => recordEditPage.getAllElementsWithClass('.entity-value.entity-active')
              .then(selected => {
                expect(checkboxLabelText).toBe(`${selected} of ${count} selected records`);
                done();
              }))
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
              }).then(() => done()).catch(chaisePage.catchTestError(done));
          })
        });

      })
      describe('apply changes', () => {
        beforeAll((done) => {
          browser.refresh();
          chaisePage.navigate(`${browser.params.url}/recordedit/#${browser.params.catalogId}/${testParams.schema_table}`);
          browser.wait(() => {
            return chaisePage.recordeditPageReady().then(() => {
              cloneFormInput = chaisePage.recordEditPage.getCloneFormInput();
              cloneFormSubmitButton = chaisePage.recordEditPage.getCloneFormInputSubmitButton();
              return true;
            }).catch(() => {
              return false;
            });
          }, browser.params.defaultTimeout).then(() => {
            // add 4 in input and click on clone
            const textToType = "4";
            cloneFormInput.sendKeys(textToType);
            chaisePage.clickButton(cloneFormSubmitButton).then(() => {
              return recordEditPage.getAllElementsWithClass('.form-header.entity-value')
                .then((count) => expect(count).toEqual(5));
            }).then(() => done());
          });
        });

        testParams.apply_tests.types.forEach((params) => {
          let type = params.type;
          let colName = params.column_name;
          describe(colName, () => {
            let multiFormTextArea;
            let dateInput;
            let timeInput;

            let textarea;
            let toggleBtn = recordEditPage.getColumnMultiFormButton(colName);
            const applybtn = recordEditPage.getApplyBtnMultiForm(colName);
            const cancelBtn = recordEditPage.getCloseBtnMultiForm(colName);
            it('when no forms are selected, apply and clear buttons should be disabled ', () => {
              let appyBtn;
              let applyButtonDisabled;

              const inputSwitch = recordEditPage.getInputSwitchContainer(colName, 1)
              const parentEl = recordEditPage.getParentElement(inputSwitch);
              chaisePage.clickButton(toggleBtn)
                .then(() => {
                  chaisePage.clickButton(parentEl);
                })
                .then(() => {
                  appyBtn = recordEditPage.getMultiFormApply(colName)
                  applyButtonDisabled = appyBtn.getAttribute('disabled');
                  expect(parentEl.getAttribute("class")).not.toContain('entity-active', 'Form is selected');
                  return chaisePage.clickButton(parentEl);
                })
                .then(() => {
                  expect(parentEl.getAttribute("class")).toContain('entity-active', 'Form is not selected');
                  expect(applyButtonDisabled).toBeTruthy();
                })
                .catch(chaisePage.catchTestError);
            });
            it('when all forms are selected, clicking on apply should apply change to all forms', () => {
              let checkboxInput = recordEditPage.getCheckboxInput();
              chaisePage.clickButton(checkboxInput);
              if (type === 'input_text') {
                if (colName === 'markdown_col') {
                  multiFormTextArea = recordEditPage.getApplySomeTextArea(colName);
                } else {
                  multiFormTextArea = recordEditPage.getApplySomeInput(colName);
                }
                const textToType = params.appy_to_all_value;

                multiFormTextArea.sendKeys(textToType);

                recordEditPage.getAllElementsWithClass('.form-header.entity-value')
                  .then(() => recordEditPage.getApplyBtnMultiForm(colName))
                  .then((applybtn) => chaisePage.clickButton(applybtn))

                  .then((count) => {
                    for (let i = 0; i < count; i++) {
                      recordEditPage.getElementForColumn(type, i, colName).getAttribute('value').then((text) => {
                        expect(text).toContain(textToType);
                      })
                    }
                  })
              } else if (type === 'timestamp_col') {
                dateInput = recordEditPage.getMultiFormTimestampDate(colName);
                timeInput = recordEditPage.getMultiFormTimestampDate(colName);
                dateInput.sendKeys(params.appy_to_all_value_date);
                timeInput.sendKeys(params.appy_to_all_value_time);
                recordEditPage.getAllElementsWithClass('.form-header.entity-value')
                  .then(() => recordEditPage.getApplyBtnMultiForm(colName))
                  .then((applybtn) => chaisePage.clickButton(applybtn))


                  .then((count) => {
                    for (let i = 0; i < count; i++) {
                      const dateObj = recordEditPage.getTimestampInputsForAColumn(colName, i);

                      dateObj.date.getAttribute('value').then((text) => {
                        expect(text).toEqual(params.appy_to_all_value_date);
                      })
                    }
                  })
              } else if (type === 'fk_col') {

                var value = params.appy_to_all_value;
                chaisePage.recordEditPage.getSelectAllPopupBtn(colName).click()
                  .then(function () {
                    // wait for modal rows to load
                    browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getRecordSetTable()), browser.params.defaultTimeout);
                    return chaisePage.recordsetPage.getRows().get(2).all(by.css(".select-action-button")).click();
                  }).then(function () {
                    // wait for modal to close
                    browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getEntityTitleElement()), browser.params.defaultTimeout);

                    return applyBtn.click();
                  }).then(function () {
                    // verify the values
                    recordEditPage.getAllElementsWithClass('.form-header.entity-value')
                      .then((count) => {
                        for (let i = 0; i < count; i++) {
                          var fkInput1 = chaisePage.recordEditPage.getForeignKeyInputDisplay(colName, i);
                          expect(fkInput1.getText()).toBe(value);
                        }
                      })

                    done();
                  }).catch(chaisePage.catchTestError);

              } else {
                const EC = protractor.ExpectedConditions;
                let dropdown = recordEditPage.getDropdownElementByNameMultiForm('boolean_col', 1);
                expect(dropdown.isPresent()).toBeTruthy();
                browser.wait(EC.elementToBeClickable(dropdown), 10000).then(() => {

                  return dropdown.click();
                }).then(() => {
                  const optionsContainer = chaisePage.recordEditPage.getOpenDropdownOptionsContainer();
                  return chaisePage.waitForElement(optionsContainer)
                    .then(() => {
                      return chaisePage.recordEditPage.getDropdownOptions();
                    }).then((options) => {
                      options.forEach(function (opt, idx) {
                        expect(opt.getAttribute("innerHTML")).toBe(params.booleanOptions[idx], "Boolean option text with idx: " + idx + " is incorrect");
                      });

                      return dropdown.click()
                    }).then(() => {
                      return chaisePage.recordEditPage.selectDropdownValue(dropdown, 'true');
                    }).then(() => {
                      expect(chaisePage.recordEditPage.getDropdownText(dropdown).getText()).toBe('true', "The truthy option was not selected");
                      recordEditPage.getAllElementsWithClass('.form-header.entity-value')
                        .then(() => recordEditPage.getApplyBtnMultiForm(colName))
                        .then((applybtn) => chaisePage.clickButton(applybtn))

                        .then((count) => {
                          for (let i = 0; i < count; i++) {
                            let dropdown1 = recordEditPage.getDropdownElementByName('boolean_col', i);
                            expect(chaisePage.recordEditPage.getDropdownText(dropdown1).getText()).toBe(option, "The truthy option was not selected");
                          }
                        })
                    })

                });


              }
            });

            it('when some forms are selected, clicking on apply should apply change to selected forms', (done) => {

              const applyBtn = recordEditPage.getApplyBtnMultiForm(colName);
              const inputSwitch = recordEditPage.getInputSwitchContainer(colName, 1)
              const parentEl = recordEditPage.getParentElement(inputSwitch);

              if (type === 'input_text') {
                const textToType = params.apply_to_some;

                chaisePage.clickButton(parentEl).then(() => {
                  expect(parentEl.getAttribute('class')).not.toContain('entity-active', 'Form is selected');
                }).then(() => {
                  multiFormTextArea.clear();
                  return browser.executeScript('arguments[0].value = "";', multiFormTextArea.getWebElement())
                })


                  .then(() => {
                     multiFormTextArea.sendKeys(textToType);
                  })
                  .then(() => chaisePage.clickButton(applybtn))
                  .then(() => {
                    params.formIndexes.forEach((i) => {
                      recordEditPage.getElementForColumn(type, i, colName).getAttribute('value').then((text) => {
                        expect(text).toEqual(textToType);
                      })
                    })
                    expect(recordEditPage.getElementForColumn(type, 1, colName).getAttribute('value')).toContain(params.appy_to_all_value);
                  }).then(() => done())
                  .catch(chaisePage.catchTestError(done));

              } else if (type === 'boolean_col') {
                const EC = protractor.ExpectedConditions;
                chaisePage.clickButton(parentEl).then(() => {
                  expect(parentEl.getAttribute('class')).not.toContain('entity-active', 'Form is selected');
                });
                let dropdown = recordEditPage.getDropdownElementByNameMultiForm('boolean_col', 1);

                expect(dropdown.isPresent()).toBeTruthy();

                browser.wait(EC.elementToBeClickable(dropdown), 10000).then(() => {

                  return dropdown.click();

                }).then(() => {

                  const optionsContainer = chaisePage.recordEditPage.getOpenDropdownOptionsContainer();
                  return chaisePage.waitForElement(optionsContainer)

                    .then(() => {
                      return chaisePage.recordEditPage.getDropdownOptions();
                    }).then((options) => {
                      options.forEach(function (opt, idx) {
                        expect(opt.getAttribute("innerHTML")).toBe(params.booleanOptions[idx], "Boolean option text with idx: " + idx + " is incorrect");
                      });

                      return dropdown.click()
                    }).then(() => {
                      return chaisePage.recordEditPage.selectDropdownValue(dropdown, 'false');
                    }).then(() => {
                      expect(chaisePage.recordEditPage.getDropdownText(dropdown).getText()).toBe('false', "The truthy option was not selected");
                      chaisePage.clickButton(applybtn)

                        .then(() => {
                          params.formIndexes.forEach((i) => {
                            let dropdown1 = recordEditPage.getDropdownElementByName(type, i);
                            expect(chaisePage.recordEditPage.getDropdownText(dropdown1).getText()).toBe('false', "The truthy option was not selected");
                          })
                          let dropdown2 = recordEditPage.getDropdownElementByName(type, 1);
                          expect(chaisePage.recordEditPage.getDropdownText(dropdown2).getText()).toBe('true', "The truthy option was not selected");
                          done();
                        })
                    })
                })
              }

              else if (type === 'fk_col') {
                var value = params.apply_to_some;

                const inputSwitch = recordEditPage.getInputSwitchContainerFK(1)
                const parentEl = recordEditPage.getParentElement(inputSwitch);
                chaisePage.clickButton(parentEl).then(() => {
                  expect(parentEl.getAttribute('class')).not.toContain('entity-active', 'Form is selected');
                }).then(() => {
                  chaisePage.recordEditPage.getMultiFormPopupBtn(colName).click()
                })
                  .then(function () {
                    // wait for modal rows to load
                    browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getRecordSetTable()), browser.params.defaultTimeout);
                    return chaisePage.recordsetPage.getRows().get(1).all(by.css(".select-action-button")).click();
                  }).then(function () {
                    // wait for modal to close
                    browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getEntityTitleElement()), browser.params.defaultTimeout);

                    return applyBtn.click();
                  }).then(function () {
                    // verify the values
                    params.formIndexes.forEach((i) => {
                      var fkInput1 = chaisePage.recordEditPage.getForeignKeyInputDisplay(colName, i);
                      expect(fkInput1.getText()).toBe(value);
                    })
                  }).then(() => done())
              } else {
                chaisePage.clickButton(parentEl).then(() => {
                  expect(parentEl.getAttribute('class')).not.toContain('entity-active', 'Form is selected');
                }).then(() => {
                  dateInput.clear();
                  timeInput.clear()
                })
                  .then(() => {
                    dateInput.sendKeys(params.apply_to_some_date);
                  })
                  .then(() => {
                    timeInput.sendKeys(params.apply_to_some_time);
                  })
                  .then(() => chaisePage.clickButton(applybtn))
                  .then(() => {
                    params.formIndexes.forEach((i) => {
                      const dateObj = recordEditPage.getTimestampInputsForAColumn(colName, i);

                      dateObj.date.getAttribute('value').then((text) => {
                        expect(text).toEqual(params.apply_to_some_date);
                      })
                    })
                    expect(recordEditPage.getElementForColumn(type, 1, colName).getAttribute('value')).toContain(params.appy_to_all_value_date);
                  }).then(() => done())
                  .catch(chaisePage.catchTestError(done));
              }
            });

            it('when some forms are selected, clicking on clear should clear values in selected forms', (done) => {

              const clearBtn = recordEditPage.getClearBtnMultiForm(colName)
              chaisePage.clickButton(clearBtn)
                .then(() => recordEditPage.getAllElementsWithClass('.form-header.entity-value'))
                .then((count) => {
                  if (colName === 'timestamp_col') {
                    params.formIndexes.forEach((i) => {
                      const dateObj = recordEditPage.getTimestampInputsForAColumn(colName, i);

                      dateObj.date.getAttribute('value').then((text) => {
                        expect(text.length).not.toBeGreaterThan(0);
                      })
                    })
                    const dateObj1 = recordEditPage.getTimestampInputsForAColumn(colName, 1);
                    expect(dateObj1.date.getAttribute('value')).toContain(params.appy_to_all_value_date);
                  } else if (type === 'boolean_col') {
                    params.formIndexes.forEach((i) => {
                      let dropdown1 = recordEditPage.getDropdownElementByName(type, i);
                      expect(chaisePage.recordEditPage.getDropdownText(dropdown1).getText()).toBe('Select a value', "The truthy option was not selected");
                    })
                    let dropdown2 = recordEditPage.getDropdownElementByName(type, 1);
                    expect(chaisePage.recordEditPage.getDropdownText(dropdown2).getText()).toBe('true', "The truthy option was not selected");
                  } else if (type === 'fk_col') {
                    params.formIndexes.forEach((i) => {
                      var fkInput1 = chaisePage.recordEditPage.getForeignKeyInputDisplay(colName, i);
                      expect(fkInput1.getText()).toBe('Select a value', "The truthy option was not selected");
                    })
                  }

                  else {
                    params.formIndexes.forEach((i) => {
                      recordEditPage.getElementForColumn(type, i, colName).getAttribute('value').then((text) => {
                        expect(text.length).not.toBeGreaterThan(0);
                      })
                    })
                    expect(recordEditPage.getElementForColumn(type, 1, colName).getAttribute('value')).toContain(params.appy_to_all_value);
                  }

                }).then(() => done())
                .catch(chaisePage.catchTestError(done));
            });
            xit('change values in the forms without affecting the other forms', () => {

              let toggleBtn = recordEditPage.getColumnMultiFormButton(colName);
              chaisePage.clickButton(toggleBtn)
                .then(() => {
                  // Edit the textarea for the second form
                  if (type === 'textarea') {
                    textArea = recordEditPage.getTextAreaForAColumn(colName, 2)
                  } else {
                    textArea = recordEditPage.getInputForAColumn(colName, 2)
                  }
                  return textarea.clear().then(() => textarea.sendKeys('new text'));
                })
            });
          })
        });

        it('should submit properly.', () => {

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
