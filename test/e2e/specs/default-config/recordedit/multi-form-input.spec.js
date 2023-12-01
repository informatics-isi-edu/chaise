const chaisePage = require('../../../utils/chaise.page.js');
const recordEditPage = chaisePage.recordEditPage;
const recordEditHelpers = require('../../../utils/recordedit-helpers.js');
const EC = protractor.ExpectedConditions;

const testParams = {
  schema_table: 'multi-form-input:main',
  max_input_rows: 200,
  apply_tests: {
    number_of_forms: 5,
    types: [
      {
        type: 'textarea',
        column_name: 'markdown_col',
        column_displayname: 'markdown_col',
        apply_to_all: {
          value: '**markdown value**',
          column_values_after: [
            '**markdown value**',
            '**markdown value**',
            '**markdown value**',
            '**markdown value**',
            '**markdown value**'
          ],
        },
        apply_to_some: {
          value: 'some **markdown**',
          deselected_forms: [1, 2],
          column_values_after: [
            '**markdown value**',
            '**markdown value**',
            'some **markdown**',
            'some **markdown**',
            'some **markdown**',
          ],
        },
        clear_some: {
          deselected_forms: [3, 4],
          column_values_after: [
            '**markdown value**',
            '**markdown value**',
            'some **markdown**',
            'some **markdown**',
            '',
          ]
        },
        manual_test: {
          value: 'manual value',
          formNumber: 4,
          column_values_after: [
            '**markdown value**',
            '**markdown value**',
            'some **markdown**',
            'manual value',
            '',
          ]
        }
      },
      {
        type: 'text',
        column_name: 'text_col',
        column_displayname: 'text_col',
        apply_to_all: {
          value: 'all text input',
          column_values_after: [
            'all text input',
            'all text input',
            'all text input',
            'all text input',
            'all text input'
          ]
        },
        apply_to_some: {
          value: 'some value',
          deselected_forms: [1, 3],
          column_values_after: [
            'all text input',
            'some value',
            'all text input',
            'some value',
            'some value'
          ]
        },
        clear_some: {
          deselected_forms: [4, 5],
          column_values_after: [
            'all text input',
            '',
            'all text input',
            'some value',
            'some value'
          ]
        },
        manual_test: {
          value: 'manual',
          formNumber: 5,
          column_values_after: [
            'all text input',
            '',
            'all text input',
            'some value',
            'manual'
          ]
        }
      },
      {
        type: 'int',
        column_name: 'int_col',
        column_displayname: 'int_col',
        apply_to_all: {
          value: '432',
          column_values_after: [
            '432',
            '432',
            '432',
            '432',
            '432'
          ]
        },
        apply_to_some: {
          value: '666',
          deselected_forms: [1, 3],
          column_values_after: [
            '432',
            '666',
            '432',
            '666',
            '666'
          ]
        },
        clear_some: {
          deselected_forms: [4, 5],
          column_values_after: [
            '432',
            '',
            '432',
            '666',
            '666'
          ]
        },
        manual_test: {
          value: '2',
          formNumber: 5,
          column_values_after: [
            '432',
            '',
            '432',
            '666',
            '2'
          ]
        }
      },
      {
        type: 'float',
        column_name: 'float_col',
        column_displayname: 'float_col',
        apply_to_all: {
          value: '12.2',
          column_values_after: [
            '12.2',
            '12.2',
            '12.2',
            '12.2',
            '12.2'
          ],
        },
        apply_to_some: {
          value: '4.65',
          deselected_forms: [1, 2],
          column_values_after: [
            '12.2',
            '12.2',
            '4.65',
            '4.65',
            '4.65',
          ],
        },
        clear_some: {
          deselected_forms: [3, 4],
          column_values_after: [
            '12.2',
            '12.2',
            '4.65',
            '4.65',
            '',
          ]
        },
        manual_test: {
          value: '5',
          formNumber: 4,
          column_values_after: [
            '12.2',
            '12.2',
            '4.65',
            '5',
            '',
          ]
        }
      },
      {
        type: 'date',
        column_name: 'date_col',
        column_displayname: 'date_col',
        apply_to_all: {
          value: '2011-10-09',
          column_values_after: [
            '2011-10-09',
            '2011-10-09',
            '2011-10-09',
            '2011-10-09',
            '2011-10-09',
          ],
        },
        apply_to_some: {
          value: '2022-06-06',
          deselected_forms: [1, 2],
          column_values_after: [
            '2011-10-09',
            '2011-10-09',
            '2022-06-06',
            '2022-06-06',
            '2022-06-06'
          ],
        },
        clear_some: {
          deselected_forms: [3, 4],
          column_values_after: [
            '2011-10-09',
            '2011-10-09',
            '2022-06-06',
            '2022-06-06',
            '',
          ]
        },
        manual_test: {
          value: '2006-06-06',
          formNumber: 4,
          column_values_after: [
            '2011-10-09',
            '2011-10-09',
            '2022-06-06',
            '2006-06-06',
            '',
          ]
        }
      },
      {
        type: 'timestamp',
        column_name: 'timestamp_col',
        column_displayname: 'timestamp_col',
        apply_to_all: {
          date_value: '2021-10-09', time_value: '18:00',
          column_values_after: [
            { date_value: '2021-10-09', time_value: '18:00' },
            { date_value: '2021-10-09', time_value: '18:00' },
            { date_value: '2021-10-09', time_value: '18:00' },
            { date_value: '2021-10-09', time_value: '18:00' },
            { date_value: '2021-10-09', time_value: '18:00' },
          ],
        },
        apply_to_some: {
          date_value: '2012-11-10', time_value: '06:00',
          deselected_forms: [1, 2],
          column_values_after: [
            { date_value: '2021-10-09', time_value: '18:00' },
            { date_value: '2021-10-09', time_value: '18:00' },
            { date_value: '2012-11-10', time_value: '06:00' },
            { date_value: '2012-11-10', time_value: '06:00' },
            { date_value: '2012-11-10', time_value: '06:00' }
          ],
        },
        clear_some: {
          deselected_forms: [3, 4],
          column_values_after: [
            { date_value: '2021-10-09', time_value: '18:00' },
            { date_value: '2021-10-09', time_value: '18:00' },
            { date_value: '2012-11-10', time_value: '06:00' },
            { date_value: '2012-11-10', time_value: '06:00' },
            { date_value: '', time_value: '' }
          ]
        },
        manual_test: {
          date_value: '2006-06-06', time_value: '06:06',
          formNumber: 4,
          column_values_after: [
            { date_value: '2021-10-09', time_value: '18:00' },
            { date_value: '2021-10-09', time_value: '18:00' },
            { date_value: '2012-11-10', time_value: '06:00' },
            { date_value: '2006-06-06', time_value: '06:06' },
            { date_value: '', time_value: '' }
          ]
        }
      },
      {
        type: 'boolean',
        column_displayname: 'boolean_col',
        column_name: 'boolean_col',
        apply_to_all: {
          value: 'true',
          column_values_after: [
            'true',
            'true',
            'true',
            'true',
            'true'
          ]
        },
        apply_to_some: {
          value: 'false',
          deselected_forms: [1, 3],
          column_values_after: [
            'true',
            'false',
            'true',
            'false',
            'false',
          ]
        },
        clear_some: {
          deselected_forms: [4, 5],
          column_values_after: [
            'true',
            'Select a value',
            'true',
            'false',
            'false',
          ]
        },
        manual_test: {
          value: 'true',
          formNumber: 5,
          column_values_after: [
            'true',
            'Select a value',
            'true',
            'false',
            'true',
          ]
        }
      },
      {
        type: 'fk',
        column_displayname: 'fk_col',
        column_name: 'lIHKX0WnQgN1kJOKR0fK5A',
        apply_to_all: {
          modal_num_rows: 4,
          modal_option_index: 0,
          column_values_after: [
            'one',
            'one',
            'one',
            'one',
            'one',
          ],
        },
        apply_to_some: {
          deselected_forms: [1, 2],
          modal_num_rows: 4,
          modal_option_index: 2,
          column_values_after: [
            'one',
            'one',
            'three',
            'three',
            'three',
          ],
        },
        clear_some: {
          deselected_forms: [3, 4],
          column_values_after: [
            'one',
            'one',
            'three',
            'three',
            'Select a value',
          ]
        },
        manual_test: {
          formNumber: 4,
          modal_num_rows: 4,
          modal_option_index: 3,
          column_values_after: [
            'one',
            'one',
            'three',
            'four',
            'Select a value',
          ]
        }
      }
    ],
    submission: {
      table_name: 'main',
      schema_name: 'multi-form-input',
      table_displayname: 'main',
      result_columns: [
        'id', 'markdown_col', 'text_col', 'int_col', 'float_col', 'date_col', 'timestamp_input', 'boolean_input',
        'lIHKX0WnQgN1kJOKR0fK5A', 'asset_col', 'asset_col_filename'
      ],
      test_results: true,
      results: [
        ['1', 'markdown value', 'all text input', '432', '12.2000', '2011-10-09', '2021-10-09 18:00:00', 'true', '1', '', ''],
        ['2', 'markdown value', '', '', '12.2000', '2011-10-09', '2021-10-09 18:00:00', '', '1', '', ''],
        ['3', 'some markdown', 'all text input', '432', '4.6500', '2022-06-06', '2012-11-10 06:00:00', 'true', '3', '', ''],
        ['4', 'manual value', 'some value', '666', '5.0000', '2006-06-06', '2006-06-06 06:06:00', 'false', '4', '', ''],
        ['5', '', 'manual', '2', '', '', '', 'true', '', '', ''],
      ],
      files: []
    }
  }
};

describe('Regarding multi form input and clone button', () => {
  describe('Regarding multi form input,', () => {
    const testFormInputCellSelected = (name, index, isSelected, message) => {
      if (isSelected) {
        expect(recordEditPage.getFormInputCell(name, index).getAttribute('class')).toContain('entity-active', message);
      } else {
        expect(recordEditPage.getFormInputCell(name, index).getAttribute('class')).not.toContain('entity-active', message);
      }
    }

    describe('in create mode', () => {

      xdescribe('general features', () => {
        let cloneFormSubmitButton;

        beforeAll((done) => {
          chaisePage.navigate(`${browser.params.url}/recordedit/#${browser.params.catalogId}/${testParams.schema_table}`).then(() => {
            return chaisePage.recordeditPageReady();
          }).then(() => {
            cloneFormSubmitButton = chaisePage.recordEditPage.getCloneFormInputSubmitButton();
            done();
          }).catch(chaisePage.catchTestError(done));
        });

        it('it should not be offered in single mode.', () => {
          let toggleBtn = recordEditPage.getMultiFormToggleButton('markdown_col');
          expect(toggleBtn.isPresent()).toBeFalsy('toggle btn is present');
        });

        it('should be displayed as soon as users added a new form.', (done) => {
          chaisePage.clickButton(cloneFormSubmitButton).then(() => {
            const toggleBtn = recordEditPage.getMultiFormToggleButton('markdown_col');
            expect(toggleBtn.isPresent()).toBeTruthy('toggle btn is present');
            done();
          }).catch(chaisePage.catchTestError(done));
        });

        it('it should not be offered for disabled columns.', (done) => {
          let input = recordEditPage.getInputForAColumn('id', 1);
          expect(input.isEnabled()).toBeFalsy('col was not disabled.');
          let toggleBtn = recordEditPage.getMultiFormToggleButton('id');
          expect(toggleBtn.isPresent()).toBeFalsy('toggle btn is present');

          done();
        });

        it('by default only the first form should be selected.', (done) => {
          let toggleBtn = recordEditPage.getMultiFormToggleButton('markdown_col');
          chaisePage.clickButton(toggleBtn).then(() => {
            return chaisePage.waitForElement(recordEditPage.getMultiFormApplyBtn());
          }).then(() => {
            testFormInputCellSelected('markdown_col', 1, true);
            done();
          }).catch(chaisePage.catchTestError(done));
        });

        it('the newly cloned form should not be selected.', (done) => {
          chaisePage.clickButton(cloneFormSubmitButton).then(() => {
            testFormInputCellSelected('markdown_col', 3, false);
            done();
          }).catch(chaisePage.catchTestError(done));
        });

        it('clicking on each cell in the form should toggle the selection.', (done) => {
          const formInputCell = recordEditPage.getFormInputCell('markdown_col', 3);

          chaisePage.clickButton(formInputCell).then(() => {
            testFormInputCellSelected('markdown_col', 3, true, 'form is not selected');
            return chaisePage.clickButton(formInputCell);
          }).then(() => {
            testFormInputCellSelected('markdown_col', 3, false, 'form is selected');
            done();
          }).catch(chaisePage.catchTestError(done));
        });

        it('previous selection should remain after closing and opening again.', (done) => {
          const formInputCell = recordEditPage.getFormInputCell('markdown_col', 3);

          let toggleBtn;
          chaisePage.clickButton(formInputCell).then(() => {
            expect(formInputCell.getAttribute('class')).toContain('entity-active', 'Form is not selected');
            toggleBtn = recordEditPage.getMultiFormToggleButton('markdown_col');
            // close the multi-form-row
            return chaisePage.clickButton(toggleBtn);
          }).then(() => {
            // wait for it to close
            return chaisePage.waitForElementInverse(recordEditPage.getMultiFormApplyBtn());
          }).then(() => {
            // open the multi-form-row
            return chaisePage.clickButton(toggleBtn)
          }).then(() => {
            // wait for it to open
            return chaisePage.waitForElement(recordEditPage.getMultiFormApplyBtn());
          }).then(() => {
            expect(formInputCell.getAttribute('class')).toContain('entity-active', 'Form is not selected');
            done();
          }).catch(chaisePage.catchTestError(done));
        });

        it('after closing the multi form input, clicking on cell should not have any effect.', (done) => {
          const formInputCell = recordEditPage.getFormInputCell('markdown_col', 1);

          // also testing the close button
          chaisePage.clickButton(recordEditPage.getMultiFormCloseBtn()).then(() => {
            return chaisePage.clickButton(formInputCell)
          }).then(() => {
            testFormInputCellSelected('markdown_col', 1, false);
            done();
          }).catch(chaisePage.catchTestError(done));
        });

        describe('checkbox functionality', () => {
          it('the label should reflect what is selected.', (done) => {
            chaisePage.clickButton(recordEditPage.getMultiFormToggleButton('markdown_col')).then(() => {
              testFormInputCellSelected('markdown_col', 1, true);
            }).then(() => {
              expect(recordEditPage.getMultiFormInputCheckboxLabel().getText()).toEqual('2 of 3 selected records');
              done();
            }).catch(chaisePage.catchTestError(done));
          });

          it('the label should update after adding a new form', (done) => {
            chaisePage.clickButton(cloneFormSubmitButton).then(() => {
              expect(recordEditPage.getMultiFormInputCheckboxLabel().getText()).toEqual('2 of 4 selected records');
              done();
            }).catch(chaisePage.catchTestError(done));
          });

          it('when partially selected, clicking on the checkbox should select all forms', (done) => {
            chaisePage.clickButton(recordEditPage.getMultiFormInputCheckbox()).then(() => {
              expect(recordEditPage.getMultiFormInputCheckboxLabel().getText()).toBe('4 of 4 selected records');
              testFormInputCellSelected('markdown_col', 1, true, '1 is not selected');
              testFormInputCellSelected('markdown_col', 2, true, '2 is not selected');
              testFormInputCellSelected('markdown_col', 3, true, '3 is not selected');
              testFormInputCellSelected('markdown_col', 4, true, '4 is not selected');
              done();
            }).catch(chaisePage.catchTestError(done));
          })


          it('when all selected, clicking on the checkbox should dselect all forms', (done) => {
            expect(recordEditPage.getMultiFormInputCheckboxLabel().getText()).toBe('4 of 4 selected records');
            chaisePage.clickButton(recordEditPage.getMultiFormInputCheckbox()).then(() => {
              expect(recordEditPage.getMultiFormInputCheckboxLabel().getText()).toBe('Select All');
              testFormInputCellSelected('markdown_col', 1, false, '4 is selected');
              testFormInputCellSelected('markdown_col', 2, false, '4 is selected');
              testFormInputCellSelected('markdown_col', 3, false, '4 is selected');
              testFormInputCellSelected('markdown_col', 4, false, '4 is selected');
              done();
            }).catch(chaisePage.catchTestError(done));
          });

          it('when none are selected, clicking on the checkbox should select all forms', (done) => {
            expect(recordEditPage.getMultiFormInputCheckboxLabel().getText()).toBe('Select All');
            chaisePage.clickButton(recordEditPage.getMultiFormInputCheckbox()).then(() => {
              expect(recordEditPage.getMultiFormInputCheckboxLabel().getText()).toBe('4 of 4 selected records');
              testFormInputCellSelected('markdown_col', 1, true, '1 is not selected');
              testFormInputCellSelected('markdown_col', 2, true, '2 is not selected');
              testFormInputCellSelected('markdown_col', 3, true, '3 is not selected');
              testFormInputCellSelected('markdown_col', 4, true, '4 is not selected');
              done();
            }).catch(chaisePage.catchTestError(done));
          })

        });
      })

      describe('for different column types', () => {
        let cloneFormInput, cloneFormSubmitButton;

        beforeAll((done) => {
          browser.refresh();
          chaisePage.navigate(`${browser.params.url}/recordedit/#${browser.params.catalogId}/${testParams.schema_table}`);

          chaisePage.recordeditPageReady().then(() => {
            cloneFormInput = chaisePage.recordEditPage.getCloneFormInput();
            cloneFormSubmitButton = chaisePage.recordEditPage.getCloneFormInputSubmitButton();
            done();
          }).catch(chaisePage.catchTestError(done));
        });

        it('should be able to add more forms to the page', (done) => {
          return cloneFormInput.sendKeys((testParams.apply_tests.number_of_forms - 1).toString()).then(() => {
            return chaisePage.clickButton(cloneFormSubmitButton)
          }).then(() => {
            expect(recordEditPage.getRecordeditForms().count()).toEqual(testParams.apply_tests.number_of_forms);
            done();
          }).catch(chaisePage.catchTestError(done));
        })

        testParams.apply_tests.types.forEach((params) => {
          const colDisplayname = params.column_displayname;

          describe(colDisplayname, () => {
            let toggleBtn = recordEditPage.getMultiFormToggleButton(colDisplayname);
            let applybtn = recordEditPage.getMultiFormApplyBtn();
            let clearBtn = recordEditPage.getMultiFormClearBtn()

            it('when no forms are selected, apply and clear buttons should be disabled ', (done) => {
              const formInputCell = recordEditPage.getFormInputCell(params.column_name, 1);

              // open the multi-form-row
              chaisePage.clickButton(toggleBtn).then(() => {
                // wait for multi-form-row to show up
                return chaisePage.waitForElement(recordEditPage.getMultiFormApplyBtn());
              }).then(() => {
                // deselect the first form that is selected by default
                return chaisePage.clickButton(formInputCell);
              }).then(() => {
                expect(formInputCell.getAttribute('class')).not.toContain('entity-active', 'Form is selected');
                expect(applybtn.getAttribute('disabled')).toBeTruthy('apply btn is not disabled');
                expect(clearBtn.getAttribute('disabled')).toBeTruthy('clear btn is not disabled');
                done();
              }).catch(chaisePage.catchTestError(done));
            });

            it('when all forms are selected, clicking on apply should apply change to all forms', (done) => {
              let checkboxInput = recordEditPage.getMultiFormInputCheckbox();
              // select all
              chaisePage.clickButton(checkboxInput).then(() => {
                // set the value
                return recordEditHelpers.setInputValue(-1, params.column_name, params.column_displayname, params.type, params.apply_to_all);
              }).then(() => {
                // apply the value
                return chaisePage.clickButton(applybtn);
              }).then(() => {
                // TODO create the values
                return recordEditHelpers.testFormValuesForAColumn(params.column_name, params.column_displayname, params.type, true, params.apply_to_all.column_values_after);
              }).then(() => {
                done();
              }).catch(chaisePage.catchTestError(done));
            });

            it('when some forms are selected, clicking on apply should apply change to selected forms', (done) => {
              // deselect some forms
              Promise.all(params.apply_to_some.deselected_forms.map((f) => {
                const formInputCell = recordEditPage.getFormInputCell(params.column_name, f);
                return chaisePage.clickButton(formInputCell);
              })).then(() => {
                // set the value
                return recordEditHelpers.setInputValue(-1, params.column_name, params.column_displayname, params.type, params.apply_to_some);
              }).then(() => {
                // apply the value
                return chaisePage.clickButton(applybtn);
              }).then(() => {
                // check the values
                return recordEditHelpers.testFormValuesForAColumn(params.column_name, params.column_displayname, params.type, true, params.apply_to_some.column_values_after);
              }).then(() => {
                done();
              }).catch(chaisePage.catchTestError(done));
            });

            it('when some forms are selected, clicking on clear should clear values in selected forms', (done) => {
              // deselect more forms
              Promise.all(params.clear_some.deselected_forms.map((f) => {
                const formInputCell = recordEditPage.getFormInputCell(params.column_name, f);
                return chaisePage.clickButton(formInputCell);
              })).then(() => {
                // click on the clear button
                chaisePage.clickButton(clearBtn);
              }).then(() => {
                // check the values
                return recordEditHelpers.testFormValuesForAColumn(params.column_name, params.column_displayname, params.type, true, params.clear_some.column_values_after);
              }).then(() => {
                done();
              }).catch(chaisePage.catchTestError(done));
            });

            it('change values in the forms without affecting the other forms', (done) => {
              // close the multi-form-row
              chaisePage.clickButton(toggleBtn).then(() => {
                return chaisePage.waitForElementInverse(recordEditPage.getMultiFormApplyBtn());
              }).then(() => {
                // change one value manually
                return recordEditHelpers.setInputValue(params.manual_test.formNumber, params.column_name, params.column_displayname, params.type, params.manual_test);
              }).then(() => {
                // check the values
                return recordEditHelpers.testFormValuesForAColumn(params.column_name, params.column_displayname, params.type, false, params.manual_test.column_values_after);
              }).then(() => {
                done();
              }).catch(chaisePage.catchTestError(done));
            });
          })
        });

        describe('submission', () => {
          recordEditHelpers.testSubmission(testParams.apply_tests.submission);
        });

      });

    });

    /**
     * the tests below are just to make sure edit works as well. the bulk of test cases are added above
     */
    xdescribe('in edit mode', () => {
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
        expect(url.startsWith(process.env.CHAISE_BASE_URL + '/recordedit/')).toBe(true);

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