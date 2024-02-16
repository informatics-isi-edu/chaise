const chaisePage = require('../../../utils/chaise.page.js');
const recordEditPage = chaisePage.recordEditPage;
const recordEditHelpers = require('../../../utils/recordedit-helpers.js');
const EC = protractor.ExpectedConditions;

const MULI_FORM_INPUT_FORM_NUMBER = -1;

const testFiles = [
  {
    name: "testfile128kb_1.png",
    size: "12800",
    path: "testfile128kb_1.png"
  },
  {
    name: "testfile128kb_2.png",
    size: "12800",
    path: "testfile128kb_2.png"
  },
  {
    name: "testfile128kb_3.png",
    size: "12800",
    path: "testfile128kb_3.png",
  }
];

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
      },
      {
        type: 'upload',
        column_displayname: 'asset_col',
        column_name: 'asset_col',
        apply_to_all: {
          value: testFiles[0],
          column_values_after: [
            testFiles[0].name,
            testFiles[0].name,
            testFiles[0].name,
            testFiles[0].name,
            testFiles[0].name,
          ],
        },
        apply_to_some: {
          deselected_forms: [1, 2],
          value: testFiles[1],
          column_values_after: [
            testFiles[0].name,
            testFiles[0].name,
            testFiles[1].name,
            testFiles[1].name,
            testFiles[1].name,
          ],
        },
        clear_some: {
          deselected_forms: [3, 4],
          column_values_after: [
            testFiles[0].name,
            testFiles[0].name,
            testFiles[1].name,
            testFiles[1].name,
            'No file Selected'
          ]
        },
        manual_test: {
          formNumber: 4,
          value: testFiles[2],
          column_values_after: [
            testFiles[0].name,
            testFiles[0].name,
            testFiles[1].name,
            testFiles[2].name,
            ''
          ]
        }
      }
    ],
    submission_results: [
      ['1', 'markdown value', 'all text input', '432', '12.2000', '2011-10-09', '2021-10-09 18:00:00', 'true', '1', process.env.CI ? '' : 'testfile128kb_1.png'],
      ['2', 'markdown value', '', '', '12.2000', '2011-10-09', '2021-10-09 18:00:00', '', '1', process.env.CI ? '' : 'testfile128kb_1.png'],
      ['3', 'some markdown', 'all text input', '432', '4.6500', '2022-06-06', '2012-11-10 06:00:00', 'true', '3', process.env.CI ? '' : 'testfile128kb_2.png'],
      ['4', 'manual value', 'some value', '666', '5.0000', '2006-06-06', '2006-06-06 06:06:00', 'false', '4', process.env.CI ? '' : 'testfile128kb_3.png'],
      ['5', '', 'manual', '2', '', '', '', 'true', '', ''],
    ]
  },
  submission: {
    table_name: 'main',
    schema_name: 'multi-form-input',
    table_displayname: 'main',
    result_columns: [
      'id', 'markdown_col', 'text_col', 'int_col', 'float_col', 'date_col', 'timestamp_input', 'boolean_input',
      'lIHKX0WnQgN1kJOKR0fK5A', 'asset_col'
    ],
    test_results: true,
    files: testFiles
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
      describe('general features', () => {
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
            expect(toggleBtn.isPresent()).toBeTruthy();
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

            if (!process.env.CI && testFiles.length > 0) {
              recordEditHelpers.createFiles(testFiles);
            }

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

          // on CI don't run the upload tests
          if (process.env.CI && params.type === 'upload') return;

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

            // select all is clicked here
            it ('the apply button should be disabled if the value is empty', (done) => {
              // select all
              chaisePage.clickButton(recordEditPage.getMultiFormInputCheckbox()).then(() => {
                expect(applybtn.getAttribute('disabled')).toBeTruthy('apply btn is not disabled');
                done();
              }).catch(chaisePage.catchTestError(done));
            });

            it('when all forms are selected, clicking on apply should apply change to all forms', (done) => {
              // we've already selected all forms, so set the value
              recordEditHelpers.setInputValue(
                MULI_FORM_INPUT_FORM_NUMBER,
                params.column_name,
                params.column_displayname,
                params.type,
                params.apply_to_all
              ).then(() => {
                // apply the value
                return chaisePage.clickButton(applybtn);
              }).then(() => {
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
                return recordEditHelpers.setInputValue(
                  MULI_FORM_INPUT_FORM_NUMBER,
                  params.column_name,
                  params.column_displayname,
                  params.type,
                  params.apply_to_some
                );
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
          recordEditHelpers.testSubmission({
            ...testParams.submission,
            results: testParams.apply_tests.submission_results
          });
        });

        if (!process.env.CI && testFiles.length > 0) {
          afterAll(function (done) {
            recordEditHelpers.deleteFiles(testFiles);
            done();
          });
        }

      });
    });

    /**
     * the tests below are just to make sure edit works as well. the bulk of test cases are added above
     */
    describe('in edit mode', () => {
      it('in single edit the toggle button should not be available.', (done) => {
        chaisePage.navigate(`${browser.params.url}/recordedit/#${browser.params.catalogId}/${testParams.schema_table}/id=9001`).then(() => {
          return chaisePage.recordeditPageReady();
        }).then(() => {
          expect(recordEditPage.getMultiFormToggleButton('markdown_col').isPresent()).toBeFalsy();
          done();
        }).catch(chaisePage.catchTestError(done));
      });

      describe('in multi edit', () => {
        beforeAll((done) => {
          const url = `${browser.params.url}/recordedit/#${browser.params.catalogId}/${testParams.schema_table}/id=9001;id=9002@sort(id)`;
          chaisePage.navigate(url).then(() => {
            return chaisePage.recordeditPageReady();
          }).then(() => {
            done();
          }).catch(chaisePage.catchTestError(done));
        });

        it('the toggle button should be offered on all non-disabled columns.', (done) => {
          expect(recordEditPage.getMultiFormToggleButton('id').isPresent()).toBeFalsy();
          expect(recordEditPage.getMultiFormToggleButton('markdown_col').isPresent()).toBeTruthy();
          expect(recordEditPage.getMultiFormToggleButton('text_col').isPresent()).toBeTruthy();
          expect(recordEditPage.getMultiFormToggleButton('int_col').isPresent()).toBeTruthy();
          expect(recordEditPage.getMultiFormToggleButton('float_col').isPresent()).toBeTruthy();
          expect(recordEditPage.getMultiFormToggleButton('date_col').isPresent()).toBeTruthy();
          expect(recordEditPage.getMultiFormToggleButton('timestamp_col').isPresent()).toBeTruthy();
          expect(recordEditPage.getMultiFormToggleButton('boolean_col').isPresent()).toBeTruthy();
          expect(recordEditPage.getMultiFormToggleButton('fk_col').isPresent()).toBeTruthy();

          done();
        });

        it('user should be able to use this control to change some values for columns.', (done) => {
          const applyBtn = recordEditPage.getMultiFormApplyBtn();

          // I'm testing only one column here as we're doing all the tests in create mode already
          // we could add more tests similar to create mode here, but I don't think it's needed.
          chaisePage.clickButton(recordEditPage.getMultiFormToggleButton('int_col')).then(() => {
            // wait for multi-form-row to show up
            return chaisePage.waitForElement(applyBtn);
          }).then(() => {
            return recordEditHelpers.setInputValue(MULI_FORM_INPUT_FORM_NUMBER, 'int_col', 'int_col', 'int', { value: '666' });
          }).then(() => {
            return chaisePage.waitForElementCondition(EC.elementToBeClickable(applyBtn));
          }).then(() => {
            // apply the value
            return chaisePage.clickButton(applyBtn);
          }).then(() => {
            done();
          }).catch(chaisePage.catchTestError(done));
        });

        describe('submission', () => {
          recordEditHelpers.testSubmission({
            ...testParams.submission,
            results: [
              ['9001', 'markdown value 9001', 'text value 9001', '666', '', '', '', '', '', ''],
              ['9002', 'markdown value 9002', '', '9,002', '', '2023-11-11', '', '', '', ''],
            ]
          }, true)
        })

      });
    });

    describe('domain-filter support', () => {
      let applyBtn;
      beforeAll((done) => {
        chaisePage.navigate(`${browser.params.url}/recordedit/#${browser.params.catalogId}/multi-form-input:table_w_domain_filter/id=1;id=2`).then(() => {
          return chaisePage.recordeditPageReady();
        }).then(() => {
          done();
        }).catch(chaisePage.catchTestError(done));
      });

      it ('if there was just one form is selected, the domain-filter of that form should be honored in the popup', (done) => {
        chaisePage.clickButton(recordEditPage.getMultiFormToggleButton('fk_col')).then(() => {
          applyBtn = recordEditPage.getMultiFormApplyBtn();
          // wait for multi-form-row to show up
          return chaisePage.waitForElement(applyBtn);
        }).then(() => {
          return recordEditHelpers.setInputValue(MULI_FORM_INPUT_FORM_NUMBER, 'fk_col', 'fk_col', 'fk', {modal_num_rows: 1, modal_option_index: 0});
        }).then(() => {
          return chaisePage.waitForElementCondition(EC.elementToBeClickable(applyBtn));
        }).then(() => {
          // apply the value
          return chaisePage.clickButton(applyBtn);
        }).then(() => {
          done();
        }).catch(chaisePage.catchTestError(done));
      });

      it('if multiple selected, after clicking the fk popup, chaise should compute domain-filters for selected forms and complain if they don\'t match', (done) => {
        let errorEl;
        chaisePage.clickButton(recordEditPage.getMultiFormInputCheckbox()).then(() => {
          return chaisePage.clickButton(recordEditPage.getForeignKeyInputButton('fk_col', MULI_FORM_INPUT_FORM_NUMBER));
        }).then(() => {
          errorEl = chaisePage.recordEditPage.getErrorMessageForAColumn('ryb03_WTq7RSmwG7_gNXgw', MULI_FORM_INPUT_FORM_NUMBER);
          return chaisePage.waitForElement(errorEl);
        }).then(() => {
          expect(errorEl.getText()).toBe('This feature is constrained by Text column. Make sure all the records you want to set fk_col for, have the same values for those fields. Try again after upadting those fields.');
          done();
        }).catch(chaisePage.catchTestError(done));
      });

      it('after fixing the issue, fk popup should open properly and the error should be hidden.', (done) => {
        recordEditHelpers.setInputValue(1, 'text_col', 'Text column', 'text', {value: 'val2' }).then(() => {
          return recordEditHelpers.setInputValue(MULI_FORM_INPUT_FORM_NUMBER, 'ryb03_WTq7RSmwG7_gNXgw', 'fk_col', 'fk', {modal_num_rows: 2, modal_option_index: 0});
        }).then(() => {
          errorEl = chaisePage.recordEditPage.getErrorMessageForAColumn('ryb03_WTq7RSmwG7_gNXgw', MULI_FORM_INPUT_FORM_NUMBER);
          expect(errorEl.isPresent()).toBeFalsy();
          done();
        }).catch(chaisePage.catchTestError(done));
      });
    });
  });

  describe('Regarding clone button, in create mode,', () => {
    let cloneFormInput, cloneFormSubmitButton;

    beforeAll((done) => {
      chaisePage.navigate(`${browser.params.url}/recordedit/#${browser.params.catalogId}/${testParams.schema_table}`).then(() => {
        return chaisePage.recordeditPageReady();
      }).then(() => {
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
