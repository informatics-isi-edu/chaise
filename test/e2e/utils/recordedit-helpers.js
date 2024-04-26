var chaisePage = require('./chaise.page.js');
const recordEditPage = chaisePage.recordEditPage;
var moment = require('moment');
var chance = require('chance').Chance();
var exec = require('child_process').execSync;
var EC = protractor.ExpectedConditions;

/**
 * Test presentation, validation, and inputting a value for different column types in recordedit app.
 * NOTE: The title is assuming that this function is only called for create or single edit (not multi edit)
 * NOTE: tableParams structure:
 * It includes the following:
 *  schema_name
 *  table_name
 *  table_displayname
 *  primary_key: list of column names
 *  key (optional): it's used in edit mode for retrieving a record.
 *  sortColumns (optional): it's used in edit mode, if there are more than one result (only in this case it's required).
 *  columns:
 *      - it must include `name`, `title`, and `type`.
 *      - it can have `generated` (bool), `immutable` (bool), `nullok` (bool), `comment`.
 *      - if column is is a foreign key use `isForeignKey:true`, then you must provide the following:
 *          - `count`: number of fks available to select.
 *  values (optional): if you want to test the current value of inputs. (it must be a key-value of visible column title-values)
 *      - for timestamp/tz the value must be a moment object.
 *      - for date it must be in `YYYY-MM-DD` format.
 *      - for other columns the value must be a string.
 *  records: It must be a key-value of visible columnTitle-columnValue
 *      - for foreignkeys: it must include `index` (the index of forien key that you want to select) and `value` (the rowname of selected fk)
 *      - for timestamp/tz: it must be a moment object.
 *      - for date: it must be in `YYYY-MM-DD` format
 *      - for files: it must be the index of file that you want to select from provided `files`.
 *      - for other columns: it must be the url of that column.
 *  result_columns (optional) if you want to test the inputs. Array of strings.
 *  results (optional) if you want to test the inputs, it must be in the same order of expected values. It's an array and includes only value of cells.
 *  files (optional): if you want to test file upload. it's a list of objects with `name`, `size`, and `path`.
 *
 * @param  {Object}  tableParams take a look at the note above.
 * @param  {Boolean} isEditMode  true if in editmode, used for testing the title.
 */
exports.testPresentationAndBasicValidation = function(tableParams, isEditMode) {
    beforeAll(function () {
        chaisePage.recordeditPageReady();
    });

    var visibleFields = [];

    if (isEditMode) {
        var pageTitle = "Edit " + tableParams.table_displayname + ": " + tableParams.record_displayname;
        it("should have edit record title", function() {
            var title = chaisePage.recordEditPage.getEntityTitleElement();
            expect(title.getText()).toEqual(pageTitle, "Edit mode title is incorrect.");
        });

        it ("should have the correct head title using the heuristics for recordedit app in entry/edit mode", function (done) {
            browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                // Edit <table-name>: <row-name> | chaiseConfig.headTitle
                // not using same value as above becuase of whitespace before the `:`
                expect(browser.getTitle()).toBe(pageTitle + " | " + chaiseConfig.headTitle);

                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
        });

        it("should show reset button", function() {
            expect(chaisePage.recordEditPage.getRecordeditResetButton().isDisplayed()).toBeTruthy("Rest recordedit forms is not visible in edit mode");
        });

    } else {
        it("should have create record title", function() {
            var pageTitleText = 'Create ' + tableParams.formsOnLoad + ' ' + tableParams.table_displayname + ' record';
            expect(chaisePage.recordEditPage.getEntityTitleElement().getText()).toBe(pageTitleText, "Create mode title is incorrect.");
        });

        it ("should have the correct head title using the heuristics for recordedit app in entry/create mode", function (done) {
            var headTitleText = 'Create new ' + tableParams.table_displayname;
            browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                expect(browser.getTitle()).toBe(headTitleText + " | " + chaiseConfig.headTitle);

                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
        });

        it("should allow to add new rows/columns", function() {
            expect(chaisePage.recordEditPage.getCloneFormInputSubmitButton().isDisplayed()).toBeTruthy("Add x rows is not visible in create mode");
        });
    }

    it ("should have the tablename in the title as a link.", function () {
        var expectedLink = process.env.CHAISE_BASE_URL + "/recordset/#" +  browser.params.catalogId + "/" + tableParams.schema_name + ":" + tableParams.table_name;
        expectedLink += "?pcid=";
        var linkEl = chaisePage.recordEditPage.getEntityTitleLinkElement();

        // because of pcid and ppid we cannot test the whole url
        expect(linkEl.getAttribute("href")).toContain(expectedLink, "Title of result page doesn't have the expected link.");
        chaisePage.testTooltipReturnPromise(linkEl, tableParams.table_comment, 'recordedit');
    });

    it("should have 'Save' text for the submit button", function () {
        // test text for submit button
        expect(element(by.id('submit-record-button')).getText()).toBe("Save", "save button text is wrong");
    });

    it("should render columns which are inside the visible columns annotation if defined; Default all are visible", function() {
        var columns = tableParams.columns;
        chaisePage.recordEditPage.getAllColumnNames().then(function(pageColumns) {
            expect(pageColumns.length).toBe(columns.length, "number of visible columns is not what is expected.");
            pageColumns.forEach(function(c) {
                c.getAttribute('innerHTML').then(function(txt) {
                    txt = txt.trim();
                    var col = columns.find(function(cl) {
                        return txt == cl.title;
                    });
                    expect(col).toBeDefined("column "+ txt + " should not be visible.");
                    c.column = col;
                    visibleFields.push(c);
                });
            });
        });
    });

    it("should show line under columns which have a comment", function() {
        var columns = tableParams.columns.filter(function(c) { if (c.comment) return true; });
        chaisePage.recordEditPage.getColumnsWithUnderline().then(function(pageColumns) {
            expect(pageColumns.length).toBe(columns.length);
            pageColumns.forEach(function(c) {
                c.getText().then(function(txt) {
                    txt = txt.trim();
                    var col = columns.find(function(cl) { return txt == cl.title });
                    expect(txt).toBe(col ? col.title : " should not have underline");
                    if (col) {
                        chaisePage.testTooltipReturnPromise(c, col.comment, 'recordedit');
                    }
                });
            });
        });
    });

    it ("should properly show the inline comments for columns", (done) => {
      const columns = tableParams.columns.filter(function(c) { if (c.inline_comment) return true; });
      chaisePage.recordEditPage.getColumnInlineComments().getText().then((comments) => {
        expect(comments.length).toBe(columns.length);
        columns.forEach((c, index) => {
          expect(comments[index]).toEqual(c.inline_comment, `missmatch for ${c.title}`);
        });
        done();
      }).catch((chaisePage.catchTestError(done)));
    });

    it("should show red asterisk (*) before for fields which are required", function() {
        var columns = tableParams.columns.filter(function(c) { if (c.nullok === false && !c.generated && !c.immutable) return true; });
        columns.forEach(function(c) {
            var el = visibleFields.find(function(v) { return v.column.name == c.name });
            chaisePage.recordEditPage.getColumnWithAsterisk(el).getText().then((text) => {
                expect(text).toBe('*');
            });
        });
    });

    var testMultipleRecords = function(recordIndex) {

        // helper functions:
        var filterColumns = function (filterFn) {
            return tableParams.columns.filter(filterFn);
        }

        /**
         * returns the record input for a column.
         * if value is not defiend will return undefined, then we don't need to change the value.
         *
         * @param  {[type]} colName [description]
         * @return {[type]}         [description]
         */
        var getRecordInput = function(colName, defaultValue) {
            if (Array.isArray(tableParams.inputs) && tableParams.inputs.length > recordIndex && typeof tableParams.inputs[recordIndex][colName] !== undefined) {
                return tableParams.inputs[recordIndex][colName];
            }
            return defaultValue;
        }

        var getRecordValue = function(colName) {
            if (Array.isArray(tableParams.values) && tableParams.values.length > recordIndex && typeof tableParams.values[recordIndex][colName] !== undefined) {
                return tableParams.values[recordIndex][colName];
            }
        }

        var colError = function (colName, message) {
            return "recordIndex=" + recordIndex + ", column=" + colName + ". " + message;
        }

        /**
         * get the existing value of input, if it's in edit mode
         * otherwise will return empty string.
         */
        var getExistingValue = function (colName, input) {
            var defer = protractor.promise.defer();

            if (tableParams.primary_keys.indexOf(colName) != -1) {
                input.getAttribute("value").then(function(value) {
                    defer.fulfill(value + "");
                }).catch(function (err) {
                    defer.reject(err);
                })
            } else {
                defer.fulfill("");
            }

            return defer.promise;
        }

        /**
         * clear input and then see if required message is displayed
         */
        var clearAndTestRequired = function (col, input) {
            var defer = protractor.promise.defer();

            chaisePage.recordEditPage.clearInput(input).then(function () {
                if (col.nullok != false) {
                    return defer.fulfill(), defer.promise;
                }

                chaisePage.recordEditPage.submitForm().then(function () {
                    const errMessageSelector = chaisePage.recordEditPage.getInputErrorMessage(input);

                    expect(errMessageSelector.isDisplayed()).toBeTruthy(colError(col, "Expected to show error."));

                    return chaisePage.recordEditPage.getAlertErrorClose().click();
                }).then(() => {
                    return defer.fulfill(), defer.promise;
                }).catch(function (err) {
                    defer.reject(err);
                });

            }).catch(function (err) {
                defer.reject(err);
            });

            return defer.promise;
        }

        // values
        var title = (isEditMode ? "Editing " : "Adding") + " row with index=" + recordIndex;

        var disabledCols = filterColumns(function(c) { if (c.generated || c.immutable) return true; });
        var longTextCols = filterColumns(function(c) { if ((c.type === "longtext" ) && !c.isForeignKey) return true; });
        var textCols = filterColumns(function(c) { if ((c.type === "shorttext" || c.type === "text") && !c.isForeignKey && !c.isFile) return true; });
        var markdownCols = filterColumns(function(c) { if ((c.type === "markdown") && !c.isForeignKey) return true; });
        var booleanCols =  filterColumns(function(c) { if (c.type === "boolean" && !c.isForeignKey) return true; });
        var foreignKeyCols  = filterColumns(function(c) { if (c.isForeignKey) return true; });
        var dateCols = filterColumns(function(c) { if (c.type == "date" && !c.isForeignKey) return true; });
        var floatCols = filterColumns(function(c) { if ((c.type.startsWith('float') ||  c.type.startsWith('numeric')) && !c.isForeignKey) return true; });
        var intCols = filterColumns(function(c) { if (c.type.startsWith("int") && !c.isForeignKey && !c.generated) return true; });
        var timestampCols = filterColumns(function(c) { if (( c.type == "timestamptz" || c.type == "timestamp") && !c.isForeignKey ) return true; });;
        var fileCols = filterColumns(function(c) { if (c.type == "text" && c.isFile && !c.isForeignKey) return true; });
        var jsonCols = filterColumns(function(c) { if ((c.type === "json") && !c.isForeignKey) return true; });
        var arrayCols = filterColumns(function(c) { if ((c.type === "array") && !c.isForeignKey) return true; });
        var colorCols = filterColumns(function(c) { if ((c.type === "color")) return true; });


        var JSONDataTypeFields = [],longTextDataTypeFields = [], textDataTypeFields = [], markdownDataTypeFields = [], arrayDataTypeFields = [],
        booleanDataTypeFields = [], foreignKeyFields = [], datePickerFields = [], integerDataTypeFields = [], floatDataTypeFields = [], timeInputFields = [], colorDataTypeFields = [];

        // test cases:
        describe(title + ",",function() {
            if (recordIndex > 0) {
                it("should click add record button", function(done) {
                    chaisePage.clickButton(chaisePage.recordEditPage.getCloneFormInputSubmitButton()).then(function(button) {
                        return browser.wait(function() {
                            return chaisePage.recordEditPage.getRecordeditForms().count().then(function(ct) {
                                return (ct == recordIndex + 1);
                            });
                        }, browser.params.defaultTimeout);
                    }).then(() => {
                        done();
                    }).catch(chaisePage.catchTestError(done));
                });
            };

            if (disabledCols.length > 0) {
                it("should show columns with generated or immutable annotations as disabled", function() {
                    disabledCols.forEach(function(column) {
                        if (column.type == 'timestamp' || column.type == 'timestamptz') {
                            var timeInputs = chaisePage.recordEditPage.getTimestampInputsForAColumn(column.name, recordIndex+1);
                            var dateInput = timeInputs.date, timeInput = timeInputs.time;
                            expect(dateInput.isEnabled()).toBe(false, colError(column.name, "date input of generated timestamp column is enabled."));
                            expect(timeInput.isEnabled()).toBe(false, colError(column.name, "time input of generated timestamp column is enabled."));
                        } else {
                            const inputSelector = chaisePage.recordEditPage.getInputForAColumn(column.name, recordIndex+1);

                            expect(inputSelector.isEnabled()).toBe(false, colError(column.name, "input of generated column is enabled."));
                            if (!tableParams.key) {
                                expect(inputSelector.getAttribute('placeholder')).toBe('Automatically generated', colError(column.name, "placeholder of generated column is not correct."));
                            }
                        }
                    });
                });
            }

            if (arrayCols.length > 0) {
                describe("Array fields, ", function () {

                  it("should show ArrayField input with correct value.", async function () {
                    for(let col of arrayCols){
                        let recordVals = getRecordValue(col.name)

                        if(recordVals === null ) continue;

                        // Check if ArrayField is rendered correctly
                        const arrayField = chaisePage.recordEditPage.getArrayFieldContainer(`${col.name}`,col.baseType);
                        let arrayFieldVals = await arrayField.getArrayFieldValues();

                        arrayField.click()
                        expect(arrayField.isDisplayed()).toBeTruthy(colError(col.name, "element not visible"));
                        
                        const addNewValField = arrayField.getAddNewElementContainer()
                        
                        expect(addNewValField.isDisplayed()).toBeTruthy(colError(col.name, 'add new value field not visible'));
                        
                        expect(arrayFieldVals.length).toBe(recordVals.length, colError(col.name , "Doesn't have the expected values."))

                        if(/timestamp|timestamptz/.test(col.baseType) ){

                          for(let i = 0; i < recordVals.length; i++){
                            let testDateValue = recordVals[i].slice(0, 10)
                            let testTimeValue = recordVals[i].slice(11, 19)

                            expect(testDateValue).toBe(arrayFieldVals[i][0])
                            expect(testTimeValue).toBe(arrayFieldVals[i][1])
                          }
                        }else{

                          for(let i = 0; i < recordVals.length; i++){
                            expect(arrayFieldVals[i]).toBe(recordVals[i])
                          }
                        }
                      }
                  });

                  // test the invalid values once
                  if (recordIndex === 0) {
                      var invalidArrayValues = {
                          "time":
                              {
                                  "value": "200113",
                                  "error": "Please enter a valid time value in 24-hr HH:MM:SS format."
                              },
                          "date":
                              {
                                  "value": "200113-01",
                                  "error": "Please enter a valid date value in YYYY-MM-DD format."
                              }
                          ,
                          "integer":
                              {
                                  "value": "1.23",
                                  "error": "Please enter a valid integer value."
                              }
                          ,
                          "number":
                              {
                                  "value": "1.1h",
                                  "error": "Please enter a valid decimal value."
                              }
                          ,
                          "boolean":
                              {
                                  "value": "true",
                                  "error": "Please enter a valid array structure."
                              }
                          ,
                          "text":
                              {
                                  "value": "\"test\"",
                                  "error": "Please enter a valid array structure e.g. [\"value1\", \"value2\"]"
                              }

                      };

                      it ("should validate invalid array input.", async function(){
                        for(let col of arrayCols){

                          if (col.skipValidation) return;

                          if (col.generated || col.immutable) return;

                          const arrayField = chaisePage.recordEditPage.getArrayFieldContainer(`${col.name}`,col.baseType);

                          const addNewValField = arrayField.getAddNewElementContainer()
                          expect(addNewValField.isDisplayed()).toBeTruthy(colError(col.name, 'add new value field not visible'));

                          // Ensure Add button is disbled when input has no/null value
                          expect(arrayField.isAddButtonDisabled()).toBe(true);

                          let errorElement,clearInput;
                          switch (col.baseType) {
                            case 'date':
                            case 'integer':
                            case 'number':
                              let addNewValInput;
                              addNewValInput = arrayField.getAddNewValueInputElement();
                              clearInput = await arrayField.getClearInputButton()

                              await addNewValInput.sendKeys(invalidArrayValues[col.baseType].value)

                              errorElement = await arrayField.getErrorMessageElement()

                              expect(errorElement.getText()).toBe(invalidArrayValues[col.baseType].error)

                              // clear input after test
                              await clearInput.click()
                              break;

                            case 'timestamp':
                            case 'timestamptz':
                              let addNewValDateInput, addNewValTimeInput;

                              [addNewValDateInput, addNewValTimeInput] = await arrayField.getAddNewValueInputElement()
                              clearInput = await arrayField.getClearInputButton();

                              // Input invalid Date
                              await addNewValDateInput.sendKeys(protractor.Key.BACK_SPACE,"200113-01");

                              errorElement = await arrayField.getErrorMessageElement()

                              expect(errorElement.getText()).toBe(invalidArrayValues["date"].error)

                              // Clear DateTime field Values
                              await clearInput.click();

                              // Input valid date and invalid time
                              await addNewValDateInput.sendKeys(protractor.Key.BACK_SPACE,new Date().toISOString().slice(0, 10));
                              await addNewValTimeInput.sendKeys("11111");

                              errorElement = await arrayField.getErrorMessageElement()

                              expect(errorElement.getText()).toBe(invalidArrayValues["time"].error)

                              // Clear Input after test
                              await clearInput.click()
                              break;
                          }

                        }

                      })
                  }
                  
                  it ("should be able to set the correct value.", async function () {
                    
                    for(let col of arrayCols){
                      if (col.generated || col.immutable) continue;

                      const arrayField = chaisePage.recordEditPage.getArrayFieldContainer(`${col.name}`,col.baseType);

                      const addNewValField = arrayField.getAddNewElementContainer();
                      expect(addNewValField.isDisplayed()).toBeTruthy(colError(col.name, 'add new value field not visible'));

                      let addButton;
                      switch (col.baseType) {
                        case 'date':
                        case 'integer':
                        case 'number':
                        case 'text':
                          let addNewValInput;

                          addNewValInput = arrayField.getAddNewValueInputElement();
                          const valuesToAdd = getRecordInput(col.name);

                          if(valuesToAdd === null) continue;

                          for(let value of valuesToAdd){
                            await addNewValInput.sendKeys(value);
                            addButton = arrayField.getAddButton()
                            await addButton.click();
                          }
                          
                          const valuesRendered = await arrayField.getArrayFieldValues()
                          
                          expect(valuesRendered.length).toBeGreaterThanOrEqual(valuesToAdd.length, colError(col.name , "Doesn't have the expected values."))

                          for(let i = 0;i < valuesToAdd.length;i++){
                            expect(valuesToAdd[i]).toBe(valuesRendered[valuesRendered.length - valuesToAdd.length + i]);
                          }

                          break;
                        case 'timestamp':
                        case 'timestamptz':
                          let addNewValDateInput, addNewValTimeInput;

                          [addNewValDateInput, addNewValTimeInput] = arrayField.getAddNewValueInputElement();
                          const timeStampsToAdd = getRecordInput(col.name)
                          
                          if(timeStampsToAdd === null) continue;

                          for(let timeStamp of timeStampsToAdd){

                            let dateValue = timeStamp.slice(0, 10)
                            let timeValue = timeStamp.slice(11, 19)

                            // Input Valid Date and Time
                            await addNewValDateInput.sendKeys(protractor.Key.BACK_SPACE,dateValue);
                            await addNewValTimeInput.sendKeys(timeValue)

                            addButton = arrayField.getAddButton();
                            await addButton.click();
                          }

                          const timeStampsRendered = await arrayField.getArrayFieldValues()
                          
                          expect(timeStampsRendered.length).toBeGreaterThanOrEqual(timeStampsToAdd.length, colError(col.name , "Doesn't have the expected values."))

                          for(let i = 0;i < timeStampsToAdd.length;i++){
                            let dateValue = timeStampsToAdd[i].slice(0, 10)
                            let timeValue = timeStampsToAdd[i].slice(11, 19)

                            expect(dateValue).toBe(timeStampsRendered[timeStampsRendered.length - timeStampsToAdd.length + i][0]);
                            expect(timeValue).toBe(timeStampsRendered[timeStampsRendered.length - timeStampsToAdd.length + i][1]);
                          }
                          break;
                      }
                    }
                  })
                });
            }

            if (longTextCols.length > 0) {
                describe("longText fields, ", function () {
                    it("should show textarea input for longtext datatype and then set the value.", function() {
                        longTextCols.forEach(function(c) {
                            const txtArea = chaisePage.recordEditPage.getTextAreaForAColumn(c.name, recordIndex+1);
                            expect(txtArea.isDisplayed()).toBeTruthy();
                            longTextDataTypeFields.push(txtArea);

                            var value = getRecordValue(c.name);
                            if (value != undefined) {
                                expect(txtArea.getAttribute('value')).toBe(value, colError(c.name , "Doesn't have the expected value."));
                            }

                            if (c.generated || c.immutable) return;

                            chaisePage.recordEditPage.clearInput(txtArea);
                            browser.sleep(10);

                            txtArea.column = c;
                            var text = getRecordInput(c.name, chance.paragraph());
                            txtArea.sendKeys(text);

                            expect(txtArea.getAttribute('value')).toEqual(text, colError(c.name, "Couldn't change the value."));
                        });
                    });
                });
            }

            if (textCols.length > 0) {
                describe("Text fields, ", function () {
                    it("should show text input for text and set the value.", function() {
                        textCols.forEach(function(c) {
                            const txtInput = chaisePage.recordEditPage.getInputForAColumn(c.name, recordIndex+1)
                            expect(txtInput.isDisplayed()).toBeTruthy();
                            txtInput.column = c;

                            textDataTypeFields.push(txtInput);

                            var value = getRecordValue(c.name);
                            if (value !== undefined) {
                                expect(txtInput.getAttribute('value')).toBe(value, colError(c.name , "Doesn't have the expected value."));
                            }

                            if (c.generated || c.immutable) return;

                            chaisePage.recordEditPage.clearInput(txtInput);
                            browser.sleep(10);

                            var text = getRecordInput(c.name, c.isUrl ? chance.url() : chance.sentence({ words: 5 }));
                            txtInput.sendKeys(text);

                            expect(txtInput.getAttribute('value')).toEqual(text, colError(c.name, "Couldn't change the value."));
                        });
                    });
                });
            }

            if (jsonCols.length > 0) {
                describe("JSON fields, ", function () {
                    var JSONTestParams=[
                        { stringVal:"{}" },
                        { stringVal:"{\"name\":\"tester\"}" },
                        { stringVal:"6534.9987" },
                        { stringVal:"null" },
                        { stringVal:"\"          \""}
                    ];

                    const invalidJSONTextParams = [
                        { stringVal:"{" },
                        { stringVal:"{name\":\"tester\"}" },
                        { stringVal:"          "}
                    ];

                    it("should show textarea input for JSON datatype and then set the value", function() {
                        jsonCols.forEach(function(c) {
                            const jsonTxtArea = chaisePage.recordEditPage.getTextAreaForAColumn(c.name, recordIndex+1);
                            expect(jsonTxtArea.isDisplayed()).toBeTruthy();
                            jsonTxtArea.column = c;

                            JSONDataTypeFields.push(jsonTxtArea);
                            var value = getRecordValue(c.name);

                            if (value != undefined) {
                                expect(jsonTxtArea.getAttribute('value')).toBe(value, colError(c.name , "Doesn't have the expected value."));
                            }
                        });
                    });

                    it("should only allow valid JSON values", function(){
                        jsonCols.forEach(function(c) {
                            const jsonTxtArea = chaisePage.recordEditPage.getTextAreaForAColumn(c.name, recordIndex+1);
                            for (i = 0; i < JSONTestParams.length; i++) {
                                chaisePage.recordEditPage.clearInput(jsonTxtArea);
                                (function(input){
                                    c._value = input;
                                    jsonTxtArea.sendKeys(input);

                                    const errMessageSelector = chaisePage.recordEditPage.getJSONInputErrorMessage(jsonTxtArea, 'json');
                                    // sleep for an error to "possibly show", it shouldn't
                                    browser.sleep(20);
                                    chaisePage.waitForElementInverse(errMessageSelector);

                                    expect(true).toBeTruthy(colError(c.name , "Some Valid JSON Values were not accepted"));
                                })(JSONTestParams[i].stringVal);
                            }//for
                        });
                    });

                    it('should NOT allow invalid JSON values', () => {
                        jsonCols.forEach((c) => {
                            const jsonTxtArea = chaisePage.recordEditPage.getTextAreaForAColumn(c.name, recordIndex+1);
                            for (i = 0; i < invalidJSONTextParams.length; i++) {
                                chaisePage.recordEditPage.clearInput(jsonTxtArea);
                                ((input) => {
                                    c._value = input;
                                    jsonTxtArea.sendKeys(input);

                                    const errMessageSelector = chaisePage.recordEditPage.getJSONInputErrorMessage(jsonTxtArea, 'json');
                                    expect(errMessageSelector.getText()).toBe('Please enter a valid JSON value.', colError(c.name , 'Some Invalid JSON Values didn\'t show error'));
                                })(invalidJSONTextParams[i].stringVal);
                            }//for
                        });
                    });

                    it("set the correct value.", function () {
                        jsonCols.forEach(function(c) {
                            const jsonTxtArea = chaisePage.recordEditPage.getTextAreaForAColumn(c.name, recordIndex+1);
                            jsonTxtArea.clear();
                            var input = getRecordInput(c.name, "");
                            c._value = input;
                            jsonTxtArea.sendKeys(input);
                            expect(jsonTxtArea.getAttribute('value')).toEqual(input, colError(c.name, "Couldn't change the value."));
                        });
                    });
                });
            }

            if (markdownCols.length > 0) {
                describe("Markdown fields, ", function () {
                    //test params for markdownPreview
                    var markdownTestParams = [{
                            "raw": "RBK Project ghriwvfw nwoeifwiw qb2372b wuefiquhf pahele kabhi na phelke kabhiy gqeequhwqh",
                            "markdown": "<h3>RBK Project ghriwvfw nwoeifwiw qb2372b wuefiquhf pahele kabhi na phelke kabhiy gqeequhwqh</h3>\n",
                            "title":"Heading"
                        }, {
                            "raw":"E15.5 embryonic kidneys for sections\n" +
                                "- E18.5 embryonic kidneys for cDNA synthesis\n"+
                                "- Sterile PBS\n" +
                                "- QIAShredder columns (Qiagen, cat no. 79654)\n" +
                                "- DEPC-Treated Water",
                            "markdown":  "<ul>\n"+
                                "<li>E15.5 embryonic kidneys for sections</li>\n" +
                                "<li>E18.5 embryonic kidneys for cDNA synthesis</li>\n" +
                                "<li>Sterile PBS</li>\n" +
                                "<li>QIAShredder columns (Qiagen, cat no. 79654)</li>\n" +
                                "<li>DEPC-Treated Water</li>\n" +
                                "</ul>\n",
                            "title":"Unordered List"
                        }, {
                            "raw": "This is bold text. nuf2uh3498hcuh23uhcu29hh  nfwnfi2nfn k2mr2ijri. Strikethrough wnnfw nwn wnf wu2h2h3hr2hrf13hu u 2u3h u1ru31r 1n3r uo13ru1ru",
                            "markdown": "<p><strong>This is bold text. nuf2uh3498hcuh23uhcu29hh  nfwnfi2nfn k2mr2ijri. Strikethrough wnnfw nwn wnf wu2h2h3hr2hrf13hu u 2u3h u1ru31r 1n3r uo13ru1ru</strong></p>\n",
                            "title":"Bold"
                        }, {
                            "raw":"This is italic text fcj2ij3ijjcn 2i3j2ijc3roi2joicj. Hum ja rahal chi gaam ta pher kail aaib. Khana kha ka aib rehal chi parson tak.",
                            "markdown":"<p><em>This is italic text fcj2ij3ijjcn 2i3j2ijc3roi2joicj. Hum ja rahal chi gaam ta pher kail aaib. Khana kha ka aib rehal chi parson tak.</em></p>\n",
                            "title":"Italic"
                        }, {
                            "raw":"~~Strikethrough wnnfw nwn wnf wu2h2h3hr2hrf13hu u 2u3h u1ru31r 1n3r uo13ru1ru~~",
                            "markdown":"<p><s>Strikethrough wnnfw nwn wnf wu2h2h3hr2hrf13hu u 2u3h u1ru31r 1n3r uo13ru1ru</s></p>\n",
                            "title":" "
                        }, {
                            "raw": "X^2^+Y^2^+Z^2^=0",
                            "markdown": "<p>X<sup>2</sup>+Y<sup>2</sup>+Z<sup>2</sup>=0</p>\n",
                            "title":" "
                        }, {
                            "raw": "[[RID]]",
                            "markdown": '<p><a href="/id/RID">RID</a></p>\n',
                            "title":" "
                        }
                    ];

                    it('should have the correct value.', function () {
                        markdownCols.forEach(function(c) {
                            var inp = chaisePage.recordEditPage.getTextAreaForAColumn(c.name, recordIndex+1);
                            if (inp.isPresent()) {
                                inp.column = c;

                                markdownDataTypeFields.push(inp);

                                var value = getRecordValue(c.name);
                                if (value !== undefined) {
                                    expect(inp.getAttribute('value')).toBe(value, colError(c.name , "Doesn't have the expected value."));
                                }

                            } else {
                                expect(undefined).toBeDefined(colError(c.name, "Couldn't find the input field (type: longtext)."));
                            }
                        });
                    });

                    it('should render correct markdown with inline preview and full preview button.', function() {
                        //Both preview is being tested.
                        markdownCols.forEach(function(descCol) {
                            var markdownField = chaisePage.recordEditPage.getTextAreaForAColumn(descCol.name, recordIndex+1);
                            // lgt and markdown have these input controls, select all draws an extra for each
                            // we want the 3rd one (aka index 2 of 0-3 within that record/form column)

                            const btnIndex = recordIndex;
                            var PrevBtn = element.all(by.css('button[title="Preview"]')).get(btnIndex);       //test inline preview
                            var modalPrevBtn = element.all(by.css('button[title="Fullscreen Preview"]')).get(btnIndex);       //test modal preview
                            for (i = 0; i < markdownTestParams.length; i++) {
                                chaisePage.recordEditPage.clearInput(markdownField);
                                (function(input, markdownOut, title, btnIdx) {
                                    //If title defined found for markdown elements then send click command.
                                    if(title !=' ') {
                                        let v = "button[title='"+title+"']";
                                        element.all(by.css(v)).get(btnIdx).click();
                                    }
                                    markdownField.sendKeys(input);
                                    modalPrevBtn.click();
                                    let mdDiv = element(by.css('.chaise-preview-markdown .markdown-container'));
                                    browser.wait(EC.presenceOf(mdDiv), browser.params.defaultTimeout);
                                    expect(mdDiv.getAttribute('innerHTML')).toBe(markdownOut, colError(descCol.name, "Error during markdown preview generation"));
                                    browser.wait(EC.elementToBeClickable(element(by.className('modal-close'))), browser.params.defaultTimeout);
                                    element(by.className('modal-close')).click();
                                    browser.wait(EC.elementToBeClickable(PrevBtn), browser.params.defaultTimeout);
                                    PrevBtn.click();        //generate preview
                                    let mdPrevDiv = element(by.css('.md-preview .markdown-container'));
                                    browser.wait(EC.presenceOf(mdPrevDiv), browser.params.defaultTimeout);
                                    expect(mdPrevDiv.getAttribute('innerHTML')).toBe(markdownOut,colError(descCol.name, "Error during markdown preview generation"));
                                    PrevBtn.click();        //editing mode
                                })(markdownTestParams[i].raw, markdownTestParams[i].markdown, markdownTestParams[i].title, btnIndex);
                            } //for
                        })
                    });

                    it('should be able to change the value.', function () {
                        markdownDataTypeFields.forEach(function(markdownField) {
                            chaisePage.recordEditPage.clearInput(markdownField);
                            browser.sleep(10);

                            var input = getRecordInput(markdownField.column.name, "");
                            markdownField.sendKeys(input);

                            expect(markdownField.getAttribute('value')).toEqual(input, colError(markdownField.column.name, "Couldn't change the value."));
                        });
                    });
                });
            }

            if (booleanCols.length > 0) {
                describe("Boolean fields,", function() {
                    /**
                     * contains objects in the form of:
                     * {
                     *  column:         the column object from the params object
                     *  columnTitle:    the column title element
                     *  dropdownInput:       the dropdown element
                     * }
                     */
                     // /*
                    var dropdowns = [];

                    beforeAll(function() {
                        // gets all columns on page and cross references their inner html value with
                        // the column names in booleanCols to create new column set to test with
                        // TODO: add ID to column title TD in the RE form and select boolean columns based on the id list
                        chaisePage.recordEditPage.getAllColumnNames().then(function(nameElements) {
                            nameElements.forEach(function(nameEl) {
                                nameEl.getAttribute('innerHTML').then(function(txt) {
                                    txt = txt.trim();
                                    var col = booleanCols.find(function(cl) { return txt == cl.title });
                                    if (col) {
                                        var columnObj = {
                                            column: col,
                                            columnTitle: nameEl
                                        }
                                        dropdowns.push(columnObj);
                                    }
                                });
                            });
                        });
                    });

                    it("should show a dropdown", function() {
                        dropdowns.forEach(function(dropdown) {
                            const el = chaisePage.recordEditPage.getDropdownElementByName(dropdown.column.name, recordIndex+1);

                            expect(el.isDisplayed()).toBeTruthy();

                            var value = getRecordValue(dropdown.column.name);
                            if (value != undefined) {
                                expect(chaisePage.recordEditPage.getDropdownText(el).getText()).toBe(value.length == 0 ? 'Select a value' : (value + ""), colError(dropdown.column.name, "Doesn't have the expected value."));
                            }

                            dropdown.dropdownInput = el;
                        });
                    });

                    it("should render options for a boolean field", () => {
                        dropdowns.forEach((dropdown) => {
                            // open the dropdown
                            dropdown.dropdownInput.click().then(() => {
                                const optionsContainer = chaisePage.recordEditPage.getOpenDropdownOptionsContainer();
                                return chaisePage.waitForElement(optionsContainer);
                            }).then(() => {
                                return chaisePage.recordEditPage.getDropdownOptions();
                            }).then((items) => {
                                expect(items.length).toBe(2, colError(dropdown.column.name, "Number of available options is not as expected."));

                                // close the dropdown before next test
                                return dropdown.dropdownInput.click();
                            }).then(() => {
                                // do nothing, done() here if we use it
                            }).catch((error) => {
                                console.dir(error);
                                expect('Something went wrong in this promise chain').toBe('Please see error message.', colError(dropdown.column.name, "While counting the values in the dropdown."));
                            });
                        });
                    });

                    it("should select an option (true, false)", function() {
                        dropdowns.forEach(function(dropdown) {

                            if (isEditMode && (dropdown.column.generated || dropdown.column.immutable)) return;

                            var value = getRecordInput(dropdown.column.name, chance.bool());

                            chaisePage.recordEditPage.selectDropdownValue(dropdown.dropdownInput, value).then(function(option) {
                                expect(chaisePage.recordEditPage.getDropdownText(dropdown.dropdownInput).getText()).toBe(value + "", colError(dropdown.column.name, "Couldn't select a value."));
                            }).catch(function (error) {
                                console.dir(error);
                                expect('Something went wrong in this promise chain').toBe('Please see error message.', colError(dropdown.column.name, "While selecting the boolean value from dropdown."));
                            });
                        });
                    });
                });
            }

            if (foreignKeyCols.length > 0) {
                describe("Foreign key fields,", function() {

                    it('should show an uneditable field for each foreign key column', function() {
                        var expectedNumOfPopupFields = foreignKeyCols.length * recordIndex+1;
                        var popupFields = element.all(by.css('.popup-select-value'));
                        expect(popupFields.count()).toBe(expectedNumOfPopupFields, "number of foreignkeys is not as expected.");
                        // Ensure each field is an uneditable div element (not an input)
                        popupFields.map(function(field) {
                            expect(field.getTagName()).toBe('span', "field is not a span.");
                            expect(field.getAttribute('contenteditable')).toBe('false', "field is not uneditable.");
                        });
                    });

                    it('should have correct values.', function () {
                        foreignKeyCols.forEach(function (fkCol) {
                            if (fkCol.value === undefined) return;

                            var input = chaisePage.recordEditPage.getForeignKeyInputDisplay(fkCol.title, (recordIndex+1));

                            expect(input.getText()).toEqual(getRecordValue(fkCol.name));
                        });
                    });

                    if (isEditMode) {
                        it("clicking the 'x' should remove the value in the foreign key field.", function () {
                            var foreignKeyInput = chaisePage.recordEditPage.getForeignKeyInputDisplay(foreignKeyCols[0].title, recordIndex+1);
                            // the first foreignkey input for editing should be pre-filled
                            expect(foreignKeyInput.getText()).toBeDefined();
                            foreignKeyInput.element(by.className('remove-input-btn')).click().then(() => {
                                // value is empty string after removing it
                                expect(foreignKeyInput.getText()).toBe('Select a value');
                            });
                        });

                        it("clicking 'x' in the modal should close it without returning a value.", function () {
                            var modalClose = chaisePage.recordEditPage.getModalCloseBtn(),
                            EC = protractor.ExpectedConditions;

                            chaisePage.recordEditPage.getModalPopupBtns().then(function(popupBtns) {
                                return chaisePage.clickButton(popupBtns[0]);
                            }).then(function() {
                                // wait for the modal to open
                                browser.wait(EC.visibilityOf(modalClose), browser.params.defaultTimeout);
                                return modalClose.click();
                            }).then(function() {
                                var foreignKeyInput = chaisePage.recordEditPage.getForeignKeyInputDisplay(foreignKeyCols[0].title, recordIndex+1);
                                expect(foreignKeyInput.getText()).toBe('Select a value');
                            });
                        });
                    }

                    it("should open a modal search and select a foreign key value.", function () {
                        chaisePage.recordEditPage.getModalPopupBtns().then(function(popupBtns) {
                            var EC = protractor.ExpectedConditions;

                            // plus an extra foreignKeyCols.length because there is 1 select all input per foreign key column
                            expect(popupBtns.length).toBe(foreignKeyCols.length * (recordIndex+1), "number of foreign keys is not as expected.");

                            for (var i=0; i<foreignKeyCols.length; i++) {
                                (function(idx) {
                                    var col = foreignKeyCols[idx];
                                    var modalTitle;

                                    // this will have the index and the presentational value
                                    var fkSelectedValue = getRecordInput(col.name);

                                    var rows, searchBox;
                                    browser.sleep(100);
                                    chaisePage.clickButton(popupBtns[(foreignKeyCols.length * recordIndex) + idx]).then(function() {
                                        modalTitle = chaisePage.recordEditPage.getModalTitle();
                                        // wait for the modal to open
                                        browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);
                                        // Expect search box to have focus
                                        searchBox = chaisePage.recordsetPage.getMainSearchInput();
                                        browser.wait(EC.visibilityOf(searchBox), browser.params.defaultTimeout);

                                        return browser.wait(function() {
                                            var searchBoxId, activeElement;
                                            return searchBox.getAttribute('id').then(function(id) {
                                                searchBoxId = id;
                                                return browser.driver.switchTo().activeElement().getAttribute('id').then(function(activeId) {
                                                    activeElement = activeId;
                                                    return activeId == searchBoxId;
                                                });
                                            });
                                        }, browser.params.defaultTimeout);
                                    }).then(function() {
                                        expect(searchBox.getAttribute('id')).toEqual(browser.driver.switchTo().activeElement().getAttribute('id'), colError(col.name, "when opened the modal selector, focus was not on search input."));

                                        return modalTitle.getText();
                                    }).then(function(text) {
                                        var expectedTitle = "Select " + col.title + " for ";
                                        if (isEditMode) {
                                            expectedTitle += tableParams.table_displayname + ": " + tableParams.record_displayname;
                                        } else {
                                            expectedTitle += "new " + tableParams.table_displayname;
                                        }

                                        // make sure modal opened
                                        expect(text).toEqual(expectedTitle, colError(col.name, "foreign key modal selector title is not what was expected."));

                                        browser.wait(function () {
                                            return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                                                return (ct > 0);
                                            });
                                        });
                                        rows = chaisePage.recordsetPage.getRows();
                                        // count is needed for clicking a random row
                                        return rows.count();
                                    }).then(function(ct) {
                                        expect(ct).toBe(col.count, colError(col.name, "number of foreign key rows are not as expected."));

                                        var displayingText = "Displaying all\n" + col.count + "\nof " + col.totalCount + " records";
                                            displayingTextError = "The total count display in the foreign key popup is incorrect";


                                        expect(chaisePage.recordsetPage.getTotalCount().getText()).toBe(displayingText, displayingTextError);

                                        return rows.all(by.css(".select-action-button"));
                                    }).then(function(selectButtons) {
                                        expect(selectButtons.length).toBe(col.count, 'number of select action buttons not as expected.');

                                        return selectButtons[fkSelectedValue.index].click();
                                    }).then(function() {
                                        browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getEntityTitleElement()), browser.params.defaultTimeout);

                                        var foreignKeyInputDisplay = chaisePage.recordEditPage.getForeignKeyInputDisplay(col.title, recordIndex+1);
                                        // might still show the old value, wait for input display to have expected value
                                        expect(foreignKeyInputDisplay.getText()).toEqual(fkSelectedValue.value, colError(col.name, "Didn't select the expected foreign key."));

                                        // Open the same modal again to make sure search box is autofocused again
                                        return chaisePage.clickButton(popupBtns[idx]);
                                    }).then(function() {
                                        // Wait for the modal to open
                                        browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);
                                        // Expect search box to have focus.
                                        var searchBox = chaisePage.recordsetPage.getMainSearchInput();
                                        browser.wait(function() {
                                            var searchBoxId, activeElement;
                                            return searchBox.getAttribute('id').then(function(id) {
                                                searchBoxId = id;
                                                return browser.driver.switchTo().activeElement().getAttribute('id');
                                            }).then(function(activeId) {
                                                activeElement = activeId;
                                                return activeId == searchBoxId;
                                            });
                                        }, browser.params.defaultTimeout).then(function() {
                                            expect(searchBox.getAttribute('id')).toEqual(browser.driver.switchTo().activeElement().getAttribute('id'), "when opened the modal selector for the second time, focus was not on search input.");
                                        });
                                        // Close the modal
                                        chaisePage.recordEditPage.getModalCloseBtn().click();
                                    }).catch(function(e) {
                                        console.dir(e);
                                        expect('Something went wrong in this promise chain').toBe('Please see error message.', colError(col.name, "While selecting the foreignkey value."));
                                    });
                                })(i);
                            }
                        });

                    });
                });
            }

            if (dateCols.length > 0) {
                describe("Date fields,", function() {
                    it('should show input fields and validate for date columns', function() {
                        dateCols.forEach(function(column) {
                            const dateInputObj = chaisePage.recordEditPage.getDateInputsForAColumn(column.name, recordIndex+1);

                            dateInputObj.column = column;

                            datePickerFields.push(dateInputObj);

                            var dateInput = dateInputObj.date;

                            var value = getRecordValue(column.name);
                            if (value != undefined) {
                                expect(dateInput.getAttribute('value')).toBe(value, colError(column.name, "doesn't have the expected value."));
                            }

                            if (column.generated || column.immutable) return;

                            const error = chaisePage.recordEditPage.getErrorMessageForAColumn(column.name, recordIndex+1);

                            chaisePage.recordEditPage.clearInput(dateInput);
                            browser.sleep(10);

                            // testing partial input
                            dateInput.sendKeys('1234-1');
                            chaisePage.waitForElement(error);
                            expect(error.getText()).toBe('Please enter a valid date value in YYYY-MM-DD format.');

                            chaisePage.recordEditPage.clearInput(dateInput);
                            browser.sleep(10);

                            // send a proper value and see if the error clears up or not.
                            dateInput.sendKeys('2016-01-01');
                            expect(dateInput.getAttribute('value')).toEqual('2016-01-01', colError(column.name, "value didn't change."));
                            expect(error.isPresent()).toBeFalsy();
                        });
                    });

                    it('\"Today\" button should enter the current date into the input', function() {
                      var today = moment().format('YYYY-MM-DD');
                      datePickerFields.forEach(function(dp) {

                          if (dp.column.generated || dp.column.immutable) return;

                          dp.todayBtn.click();
                          expect(dp.date.getAttribute('value')).toEqual(today, colError(dp.column.name, "selected date is not correct."));
                      });
                  });

                    it('\"Clear\" button clear the date input respectively', function() {
                        datePickerFields.forEach(function(dp) {

                            if (dp.column.generated || dp.column.immutable) return;

                            chaisePage.recordEditPage.getInputRemoveButton(dp.column.name, recordIndex+1).click().then(function () {
                                expect(dp.date.getAttribute('value')).toBeFalsy(colError(dp.column.name, "Couldn't clear the input."));
                            });
                        });
                    });

                    // this should be the last test case
                    it('should select a valid value.', function () {
                        datePickerFields.forEach(function(dp) {
                            var column = dp.column, inp = dp.date;
                            if (column.generated || column.immutable) return;

                            chaisePage.recordEditPage.clearInput(inp);
                            browser.sleep(10);

                            const value = getRecordInput(column.name, '2016-01-01');

                            inp.sendKeys(value);
                            expect(inp.getAttribute('value')).toEqual(value, colError(column.name, "value didn't change."));
                        });
                    });
                });
            }

            if (timestampCols.length > 0) {
                describe("Timestamp fields,", function() {
                    it('should have 3 inputs with validation for each timestamp column', function() {
                        timestampCols.forEach(function(column) {
                            var timestampInputs = chaisePage.recordEditPage.getTimestampInputsForAColumn(column.name, recordIndex+1);
                            var dateInput = timestampInputs.date,
                                timeInput = timestampInputs.time;

                            expect(dateInput).toBeDefined(colError(column.name, "Date input is not defined."));
                            expect(timeInput).toBeDefined(colError(column.name, "Time input is not defined."));

                            // NOTE: value is a moment object
                            var value = getRecordValue(column.name);
                            if (value != undefined) {
                                dateInput.getAttribute('value').then(function(dateVal) {
                                    // Check date input
                                    expect(dateVal).toEqual(value.format("YYYY-MM-DD"), colError(column.name, "column date is not as expected."));
                                    return timeInput.getAttribute('value');
                                }).then(function(timeVal) {
                                    // Check time input value is within an interval
                                    let momentTime = moment(timeVal, "hh:mm:ss").format("hh:mm:ssA")
                                    expect(momentTime).toEqual(value.format("hh:mm:ssA"), colError(column.name, "column time is not as expected."));
                                }).catch(function(error) {
                                    console.log(error);
                                });
                            }

                            if (column.generated || column.immutable) return;

                            const error = chaisePage.recordEditPage.getErrorMessageForAColumn(column.name, recordIndex+1);
                            const timeErrorMessage = 'Please enter a valid time value in 24-hr HH:MM:SS format.';
                            const dateErrorMessage = 'Please enter a valid date value in YYYY-MM-DD format.';

                            // the test cases below are only checking time, so we should first add a proper date.
                            dateInput.clear();
                            dateInput.sendKeys('2016-01-01');

                            // If user enters an invalid time an error msg should appear
                            timeInput.clear();
                            timeInput.sendKeys('24:12:00'); // this is invalid because we're only accepting 24-hr time formats from 0-23
                            chaisePage.waitForElement(error);
                            expect(error.getText()).toBe(timeErrorMessage);

                            // If user enters a valid time, then error msg should disappear
                            timeInput.clear();
                            timeInput.sendKeys('12:00:00');
                            expect(error.isPresent()).toBeFalsy();

                            timeInput.clear();
                            // users can enter 1 digit in any place
                            timeInput.sendKeys('2:00:00');
                            expect(error.isPresent()).toBeFalsy();

                            timeInput.clear();
                            // users can enter just the hours
                            timeInput.sendKeys('08');
                            expect(error.isPresent()).toBeFalsy();

                            timeInput.clear();
                            // users can enter less than the full string
                            timeInput.sendKeys('2:10');
                            expect(error.isPresent()).toBeFalsy();

                            timeInput.clear();
                            // users can enter time in 24 hr format
                            timeInput.sendKeys('20:00:00');
                            expect(error.isPresent()).toBeFalsy();

                            timeInput.clear();
                            // users can enter 0 for the time
                            timeInput.sendKeys('00:00:00');
                            expect(error.isPresent()).toBeFalsy();

                            // Invalid date + good time = error
                            // If user enters a valid time but no date, an error msg should appear
                            dateInput.clear();
                            timeInput.clear();
                            timeInput.sendKeys('12:00:00');
                            chaisePage.waitForElement(error);
                            expect(error.getText()).toBe(dateErrorMessage);

                            // Good date + good time = no error
                            // Now, if user enters a valid date, then no error message should appear
                            dateInput.sendKeys('2016-01-01');
                            expect(error.isPresent()).toBeFalsy();

                            // Good date + null time = no error
                            timeInput.clear();
                            expect(error.isPresent()).toBeFalsy();

                            timeInputFields.push({
                                column: column,
                                date: timestampInputs.date,
                                time: timestampInputs.time,
                                nowBtn: timestampInputs.nowBtn,
                                clearBtn: timestampInputs.clearBtn,
                            });
                        });
                    });

                    it('should clear the input after clicking the "Clear" button', function() {
                        timeInputFields.forEach(function(obj) {
                            if (obj.column.generated || obj.column.immutable) return;

                            obj.clearBtn.click();
                            expect(obj.date.getAttribute('value')).toBeFalsy();
                            expect(obj.time.getAttribute('value')).toBeFalsy();
                        });
                    });

                    it('should have the current time after clicking the "Now" button', function() {
                        timeInputFields.forEach(function(obj) {

                            if (obj.column.generated || obj.column.immutable) return;

                            var UIdate, date = moment().format('YYYY-MM-DD');
                            var UItime, time = moment().format('x'); // in milliseconds
                            var timeDelta = 60 * 1000; // 1 minute, in milliseconds
                            var startTime = time - timeDelta, endTime = time + timeDelta;

                            obj.nowBtn.click();
                            obj.date.getAttribute('value').then(function(dateVal) {
                                // Check date input
                                UIdate = dateVal;
                                expect(dateVal).toEqual(date);
                                return obj.time.getAttribute('value');
                            }).then(function(timeVal) {
                                // Check time input value is within an interval
                                UItime = timeVal;
                                var UItimestamp = moment(UIdate + UItime, 'YYYY-MM-DDhh:mm').format('x'); // in milliseconds
                                expect(startTime < UItimestamp < endTime).toBeTruthy();
                            }).catch(function(error) {
                                console.log(error);
                            });
                        });
                    });

                    it('should select a valid value.', function () {
                        timeInputFields.forEach(function(obj) {

                            if (obj.column.generated || obj.column.immutable) return;

                            var value = getRecordInput(obj.column.name, moment());

                            // first clear both inputs
                            obj.date.clear();
                            // NOTE using a simple obj.time.clear(); wasn't working. not sure why.
                            chaisePage.recordEditPage.clearInput(obj.time);
                            browser.sleep(10);

                            // select the date
                            obj.date.sendKeys(value.format('YYYY-MM-DD'));
                            expect(obj.date.getAttribute('value')).toEqual(value.format("YYYY-MM-DD"), colError(obj.column.name, "column date didn't change."));

                            // select the time
                            const storedValue = value.format("hh:mm:ss");
                            obj.time.sendKeys(storedValue);
                            expect(obj.time.getAttribute('value')).toEqual(storedValue, colError(obj.column.name, "column time didn't change."));
                        });
                    });

                });
            }

            if (intCols.length > 0) {
                describe("Integer fields,", function() {
                    it("should render input type as number with integer attribute", function() {
                        intCols.forEach(function(column) {
                            const intInput = chaisePage.recordEditPage.getInputForAColumn(column.name, recordIndex+1)
                            expect(intInput.isDisplayed()).toBeTruthy();

                            intInput.column = column;
                            integerDataTypeFields.push(intInput);

                            var value = getRecordValue(column.name);
                            if (value != undefined) {
                                expect(intInput.getAttribute('value')).toBe(value, colError(column.name , "Doesn't have the expected value."));
                            }
                        });
                    });

                    it("should validate required and invalid text input", function() {
                        integerDataTypeFields.forEach(function(intInput) {
                            var c = intInput.column;

                            if (c.skipValidation) return;

                            if (c.generated || c.immutable) return;

                            var prevValue = "";

                            // Clear value if it is in edit mode
                            if (tableParams.primary_keys.indexOf(c.name) != -1) {
                                intInput.getAttribute("value").then(function(value) {
                                    prevValue = value + "";
                                });
                            }
                            chaisePage.recordEditPage.clearInput(intInput);

                            const errMessageSelector = chaisePage.recordEditPage.getInputErrorMessage(intInput);
                            if (c.nullok == false && !c.generated && !c.immutable) {
                                chaisePage.recordEditPage.submitForm();
                                expect(errMessageSelector.isDisplayed()).toBeTruthy(colError(c, "Expected to show error."));
                                chaisePage.recordEditPage.getAlertErrorClose().click();
                            }

                            // Invalid text value
                            var text = "1j2yu", actualValue = "12";
                            intInput.sendKeys(text);
                            expect(intInput.getAttribute('value')).toBe(text);


                            // Required Error message should disappear and show integer error
                            expect(errMessageSelector.isDisplayed()).toBeTruthy(colError(c, "Expected to show the integer error message on changing the value."));
                            expect(errMessageSelector.getText()).toBe('Please enter a valid integer value.', colError(c, 'Wrong error message text displayed'));

                            // Clear value
                            chaisePage.recordEditPage.clearInput(intInput);
                            expect(intInput.getAttribute('value')).toBe("");

                            //Restore the value to the original one
                            if (tableParams.primary_keys.indexOf(c.name) != -1) {
                                intInput.sendKeys(prevValue);
                            }

                        });
                    });

                    it("should validate int8(-9223372036854776000 < value < 9223372036854776000), int4(-2147483648 < value < 2147483647) and int2(-32768 < value < 32767) with range values", function() {
                        integerDataTypeFields.forEach(function(intInput) {
                            var c = intInput.column;

                            if (c.skipValidation) return;

                            if (c.generated || c.immutable) return;

                            var min = -9223372036854776000, max = 9223372036854776000, invalidMaxNo = "2343243243242414423243242353253253253252352", invalidMinNo = "-2343243243242414423243242353253253253252352";
                            if (c.type == 'int2') {
                                min = -32768, max = 32767, invalidMaxNo = "8375832757832", invalidMinNo = "-237587565";
                            } else if (c.type == 'int4') {
                                min = -2147483648, max = 2147483647, invalidMaxNo = "3827374576453", invalidMinNo = "-326745374576375";
                            }

                            var validNo = chaisePage.recordEditPage.getRandomInt(min, max) + "", invalidMaxNo = "2343243243242414423243242353253253253252352", invalidMinNo = "-2343243243242414423243242353253253253252352";

                            // Store original value to reset it for avoiding any conflicts or referece issues due to unique or foreign key issue
                            if (tableParams.primary_keys.indexOf(c.name) != -1) {
                                intInput.getAttribute("value").then(function(value) {
                                    validNo = value + "";
                                });
                            }

                            // Clear value if it is in edit mode
                            chaisePage.recordEditPage.clearInput(intInput);

                            // Check for invalid maximum number
                            intInput.sendKeys(invalidMaxNo);
                            const errMessageSelector = chaisePage.recordEditPage.getInputErrorMessage(intInput);
                            expect(errMessageSelector.isDisplayed()).toBeTruthy(colError(c.name ,"Expected to show error when using maximum number."));

                            // Clear value
                            chaisePage.recordEditPage.clearInput(intInput);
                            expect(intInput.getAttribute('value')).toBe("");

                            // Check for invalid minimum number
                            intInput.sendKeys(invalidMinNo);

                            expect(errMessageSelector.isDisplayed()).toBeTruthy(colError(c.name ,"Expected to show error when using minimum number."));

                            // Clear value
                            chaisePage.recordEditPage.clearInput(intInput);
                            expect(intInput.getAttribute('value')).toBe("");

                            // Check for a valid number
                            intInput.sendKeys(validNo);
                            expect(intInput.getAttribute('value')).toBe(validNo);
                        });
                    });

                    it("should input the given values.", function () {
                        integerDataTypeFields.forEach(function(intInput) {
                            var c = intInput.column;

                            if (c.generated || c.immutable) return;

                            chaisePage.recordEditPage.clearInput(intInput);
                            browser.sleep(10);

                            var text = getRecordInput(c.name, chaisePage.recordEditPage.getRandomInt(1, 100));
                            intInput.sendKeys(text);

                            expect(intInput.getAttribute('value')).toEqual(text, colError(c.name, "Couldn't change the value."));
                        });
                    });

                });
            }

            if (floatCols.length > 0) {
                describe("Float fields,", function() {
                    var numDone = 0, isDone = function (done) {
                        numDone++;
                        if (numDone === floatCols.length) {
                            done();
                        }
                    }

                    it("should render input type as number with float attribute", function(done) {
                        floatCols.forEach(function(column) {
                            const floatInput = chaisePage.recordEditPage.getInputForAColumn(column.name, recordIndex+1)
                            expect(floatInput.isDisplayed()).toBeTruthy();

                            floatInput.column = column;
                            floatDataTypeFields.push(floatInput);

                            var value = getRecordValue(column.name);
                            if (value != undefined) {
                                expect(floatInput.getAttribute('value')).toBe(value, colError(column.name, "Didn't have the expected value."));
                            }
                            isDone(done);
                        });
                    });

                    it("should validate invalid float input", function(done) {
                        // NOTE: something is happening in the execution of this `it` that cause a terminal error to be thrown
                        // writing this as chained promises might fix the issue
                        numDone = 0;
                        floatDataTypeFields.forEach(function(floatInput) {
                            var c = floatInput.column;

                            if (c.skipValidation || c.generated || c.immutable) {
                                isDone(done); return;
                            }

                            var validNo = chaisePage.recordEditPage.getRandomArbitrary() + "",
                                invalidValue = "1j2yu.5", usedValue = "12.5";

                            const errMessageselector = chaisePage.recordEditPage.getInputErrorMessage(floatInput);
                            getExistingValue(c.name, floatInput).then(function (val) {
                                validNo = val + "";

                                // NOTE: using react might have fixed these tests
                                // -------------------------------------------- //
                                // TODO the terminal happens after the sendKeys
                                // function when there's no sleep or pause in between the following

                                //test required
                                return clearAndTestRequired(c, floatInput);
                            }).then(function () {

                                // should mask the value and use the valid one:
                                return floatInput.sendKeys(invalidValue);
                            }).then (function () {

                                // the error throws before this
                                // -------------------------------------------- //

                                // float error should show up
                                expect(errMessageselector.isDisplayed()).toBeTruthy(colError(c, "Expected to show the float error message on changing the value."));

                                // Clear value
                                return chaisePage.recordEditPage.clearInput(floatInput);
                            }).then (function () {
                                expect(floatInput.getAttribute('value')).toBe("", colError(c.name, "Expected to not clear the input."));

                                //Restore the value to the original one or a valid input
                                return floatInput.sendKeys(validNo);
                            }).then (function () {
                                expect(floatInput.getAttribute('value')).toBe(validNo, colError(c.name, "Couldn't change the value."));

                                isDone(done);
                            }).catch(chaisePage.catchTestError(done));
                        });
                    });

                    it("should input the given values.", function (done) {
                        numDone = 0;
                        floatDataTypeFields.forEach(function(inp) {
                            var c = inp.column;

                            if (c.generated || c.immutable) {
                                isDone(done); return;
                            }

                            var text = getRecordInput(c.name, "1.1");
                            chaisePage.recordEditPage.clearInput(inp).then(function () {
                                return inp.sendKeys(text);
                            }).then(function () {
                                expect(inp.getAttribute('value')).toEqual(text, colError(c.name, "Couldn't change the value."));
                                isDone(done);
                            }).catch(chaisePage.catchTestError(done));
                        });
                    });
                });
            }

            if (colorCols.length > 0) {
                describe("Color fields", function () {
                    var numDone = 0, isDone = function (done) {
                        numDone++;

                        if (numDone === colorCols.length) {
                            done();
                        }
                    }

                    it ("should render color input and show the color.", function (done) {
                        colorCols.forEach(function (column) {
                            const colorInput = chaisePage.recordEditPage.getColorInputForAColumn(column.name, recordIndex+1)
                            expect(colorInput.isDisplayed()).toBeTruthy(colError(column.name, "Wasn't displayed."));

                            colorInput.column = column;
                            colorDataTypeFields.push(colorInput);

                            var value = getRecordValue(column.name);
                            if (value != undefined) {
                                // make sure the displayed value is correct
                                expect(colorInput.getAttribute('value')).toBe(value, colError(column.name , "Doesn't have the expected value."));

                                // make sure the background color is correct
                                expect(chaisePage.recordEditPage.getColorInputBackground(column.name, recordIndex+1)).toEqual(value, colError(column.name , "Doesn't have the expected background."));
                            }

                            isDone(done);
                        });
                    });

                    it ("should validate required and invalid color input.", function (done) {
                        numDone = 0;
                        colorDataTypeFields.forEach(function(colorInput) {
                            var c = colorInput.column;

                            if (c.skipValidation || c.generated || c.immutable) {
                                isDone(done);
                                return;
                            }

                            // NOTE: use valid color values that produce an invalid color option
                            var prevValue, invalidValue = "de";

                            const errMessageSelector = chaisePage.recordEditPage.getInputErrorMessage(colorInput);
                            // c.nullok === false;
                            getExistingValue(c.name, colorInput).then(function (val) {
                                prevValue = val;

                                // no value yet
                                if (!isEditMode && (recordIndex + 1) === 1) return true

                                // use remove button to clear the value
                                return chaisePage.recordEditPage.getInputRemoveButton(c.name, recordIndex+1).click();
                            }).then(function () {
                                // the input won't validate until we change focus
                                return chaisePage.recordEditPage.getRequiredInfoEl().click();
                            }).then(function () {
                                return colorInput.sendKeys(invalidValue);
                            }).then(function () {
                                // the input won't validate until we change focus
                                return chaisePage.recordEditPage.getRequiredInfoEl().click();
                            }).then(function () {
                                // I had to turn this from a simple get attribute to wait
                                // since it was throwing a terminal error
                                return browser.wait(function () {
                                    return colorInput.getAttribute('value').then(function (val) {
                                        return val === '#';
                                    });
                                });
                            }).then(() => {
                                //Restore the value to the original one
                                if (tableParams.primary_keys.indexOf(c.name) != -1) {
                                    colorInput.sendKeys(prevValue);
                                }

                                isDone(done);
                            }).catch(function (err) {
                                console.log(err);
                                done.fail(err);
                            });
                        });
                    });

                    it("clicking on input should open the color popup, clear btn should be available based on nullok, and should be able to change value", function (done) {
                        numDone = 0;
                        colorDataTypeFields.forEach(function (colorInput) {
                            var c = colorInput.column;
                            if (c.skipValidation || c.generated || c.immutable) {
                                isDone(done);
                                return;
                            }

                            var popup = chaisePage.recordEditPage.getColorInputPopup(),
                                popupInput,
                                value = "#555555";

                            // click the button to open popup
                            chaisePage.recordEditPage.getColorInputBtn(c.name, recordIndex+1).click().then(function () {

                                // make sure popup is displayed
                                chaisePage.waitForElement(popup);

                                // make sure clear btn is offered regardless of null/not-null (just like any other  input)
                                var clearBtn = chaisePage.recordEditPage.getColorInputPopupClearBtn();
                                expect(clearBtn.isDisplayed()).toEqual(true, colError(c.name, "color popup: clear btn invalid state"));

                                // write a color and submit
                                popupInput = chaisePage.recordEditPage.getColorInputPopupInput();
                                expect(popupInput.isDisplayed).toBeTruthy(colError(c.name, "color popup: input is missing"));

                                // clear the input
                                return chaisePage.recordEditPage.clearInput(popupInput);
                            }).then(function () {
                                // change the input
                                return popupInput.sendKeys(value);
                            }).then(function () {

                                // close the popup
                                return chaisePage.recordEditPage.getColorInputPopupSelectBtn().click();
                            }).then(function () {
                                chaisePage.waitForElementInverse(popup);
                                expect(colorInput.getAttribute('value')).toBe(value, colError(c.name, "color popup: value didn't change"));

                                isDone(done);
                            }).catch(function (err) {
                                done.fail(err);
                            });
                        });
                    });

                    it ("should be able to input the given values", function (done) {
                        numDone = 0;
                        colorDataTypeFields.forEach(function(colorInput, index) {
                            var c = colorInput.column;

                            if (c.generated || c.immutable) {
                                isDone(done);
                                return;
                            }

                            var text = getRecordInput(c.name, "#123456");
                            chaisePage.recordEditPage.clearInput(colorInput).then(function () {
                                return colorInput.sendKeys(text);
                            }).then(function () {
                                // the input won't validate until we press enter or change focus
                                return chaisePage.recordEditPage.getRequiredInfoEl().click();
                            }).then(function () {

                                // make sure the displayed value is correct
                                expect(colorInput.getAttribute('value')).toEqual(text, colError(c.name, "Couldn't change the value."));

                                // make sure the background color is correct
                                expect(chaisePage.recordEditPage.getColorInputBackground(recordIndex, c.name)).toEqual(text, colError(c.name , "Doesn't have the expected background."));

                                isDone(done);
                            }).catch(function (err) {
                                done.fail(err);
                            })
                        });
                    });
                })
            }

            if (!process.env.CI && tableParams.files.length > 0 && fileCols.length > 0) {
                describe("File fields,", function() {
                    it("should render input type as file input ", function() {
                        fileCols.forEach(function(column) {
                            exports.testFileInput(column.name, recordIndex, tableParams.files[getRecordInput(column.name, 0)], true, tableParams.inputs[getRecordInput(column.name, 0)].validate);
                        });
                    });

                });
            }
        });

        if (Array.isArray(tableParams.inputs) && recordIndex+1 < tableParams.inputs.length) {
            testMultipleRecords(recordIndex + 1);
        }
    };

    testMultipleRecords(0);

    return {
        visibleFields: visibleFields
    };

};

/**
 * used for checking the success page. can handle both single and multi form cases.
 *
 * expected parameters in the tableParams object:
 *  - table_displayname: The displayname of the table
 *  - results: An array of arrays. Each array encodes the expected values for each row. The values for each column
 *             can be:
 *               - string: the expected getText() of the row
 *               - an object with `link` and `value` to test the displayed link.
 *  - result_columns: the column names (an array of string).
 *  - test_results: a boolean that can be used if we want to skip test cases for non CI environment. If you want to run test cases
 *            all the time, pass `true` otherwise pass `!process.env.CI`.
 *  - files: the files that are used during test (for upload test). if you're not testing upload, pass an empty array.
 *
 * @param  {Object}  tableParams refer to the description
 * @param  {Boolean} isEditMode  whether this is in entity mode or not
 */
exports.testSubmission = function (tableParams, isEditMode) {
    var hasErrors = false;

    it("should have no errors.", function(done) {
        chaisePage.recordEditPage.submitForm().then(() => {
            return chaisePage.recordEditPage.getAlertError();
        }).then(function(err) {
            if (err) {
                expect("Page has errors").toBe("No errors", "expected page to have no errors");
                hasErrors = true;
                done.fail();
                return;
            }

            // if there is a file upload
            if (!process.env.CI && tableParams.files.length > 0) {
              var timeout =  tableParams.files.length ? (tableParams.results.length * tableParams.files.length * browser.params.defaultTimeout) : browser.params.defaultTimeout;
              browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.upload-table'))),timeout).catch(function (err) {
                  // if the element is not available (there is no file) it will return error which we should ignore.
              });
            }

            done();
        }).catch(chaisePage.catchTestError(done));


    });

    if (tableParams.results.length > 1) {  // multi edit/create
        it("should change the view to the resultset table and verify the count.", function () {
            if (hasErrors) {
                expect(undefined).toBeDefined('submission had errors.');
                return;
            }

            // verify url and ct
            browser.driver.getCurrentUrl().then(function(url) {
                expect(url.startsWith(process.env.CHAISE_BASE_URL + "/recordedit/")).toBe(true, "url has not been changed.");

                browser.wait(function () {
                    return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                        return (ct > 0);
                    });
                });

                chaisePage.recordsetPage.getRows().count().then(function (ct) {
                    expect(ct).toBe(tableParams.results.length, "number of records is not as expected.");
                });
            });
        });

        describe('result page, ', function () {
            it("should have the correct title.", function() {
                var title = tableParams.results.length + " " + tableParams.table_displayname + " records " + (isEditMode ? "updated" : "created") + " successfully";
                expect(chaisePage.recordEditPage.getEntityTitleElement().getText()).toBe(title, "Resultset page title is incorrect.");
            });

            it('should point to the correct link with caption.', function () {
                const expectedLink = process.env.CHAISE_BASE_URL + "/recordset/#" +  browser.params.catalogId + "/" + tableParams.schema_name + ":" + tableParams.table_name;
                const titleLink = chaisePage.recordEditPage.getEntityTitleLinkElement();

                expect(titleLink.getText()).toBe(tableParams.table_displayname, "Title of result page doesn't have the expected caption.");
                expect(titleLink.getAttribute("href")).toContain(expectedLink , "Title of result page doesn't have the expected link.");
            });

            //NOTE: in ci we're not uploading the file and therefore this test case will fail
            if (tableParams.test_results) {
                it('table must show correct results.', function() {

                    chaisePage.recordsetPage.getTableHeader().all(by.tagName("th")).then(function (headerCells) {
                        expect(headerCells.length).toBe(tableParams.result_columns.length, "number of cells in table header is incorrect");

                        return chaisePage.recordsetPage.getRows();
                    }).then(function(rows) {
                        // same row count
                        expect(rows.length).toBe(tableParams.results.length, "number of rows are not as expected.");

                        for (j = 0; j < rows.length; j++) {
                            (function(index) {
                                rows[index].all(by.tagName("td")).then(function(cells) {

                                    // same column count
                                    expect(cells.length).toBe(tableParams.results[index].length, "number of columns are not as expected.");

                                    var result;

                                    // cells is what is being shown
                                    // tableParams.results is what we expect
                                    for (k = 0; k < tableParams.results[index].length; k++) {
                                        result = tableParams.results[index][k];

                                        if (typeof result.link === 'string') {
                                            expect(cells[k].element(by.tagName("a")).getAttribute("href")).toContain(result.link);
                                            expect(cells[k].element(by.tagName("a")).getText()).toBe(result.value, "data missmatch in row with index=" + index + ", columns with index=" + k);
                                        } else {
                                            expect(cells[k].getText()).toBe(result, "data missmatch in row with index=" + index + ", columns with index=" + k);
                                        }
                                    }
                                });

                            })(j);
                        };
                    });
                });
            }
        });


    } else { // single edit/create
        it("should be redirected to record page", function() {
            if (hasErrors) {
                expect(undefined).toBeDefined('submission had errors.');
                return;
            }

            // wait for url change
            browser.wait(function () {
                return browser.driver.getCurrentUrl().then(function(url) {
                    return url.startsWith(process.env.CHAISE_BASE_URL + "/record/");
                });
            }, browser.params.defaultTimeout);

            // verify url
            browser.driver.getCurrentUrl().then(function(url) {
                expect(url.startsWith(process.env.CHAISE_BASE_URL + "/record/")).toBe(true);
            });
        });

        //NOTE: in ci we're not uploading the file and therefore this test case will fail
        if (!process.env.CI && tableParams.files.length > 0) {
            it('should have the correct submitted values.', function () {
                if (hasErrors) {
                    expect(undefined).toBeDefined('submission had errors.');
                    return;
                }

                var column_values = {};
                for (var i = 0; i < tableParams.result_columns.length; i++) {
                    column_values[tableParams.result_columns[i]] = tableParams.results[0][i];
                }

                exports.testRecordAppValuesAfterSubmission(tableParams.result_columns, column_values, tableParams.result_columns.length);
            });
        }
    }

}


/**
 * column_names - array of string column_names
 * column_values - hash of column_name: column_value
 * acceptable column_value formats:
 *   - string
 *   - {value: string, ignoreInCI: boolean}
 *   - {link: true, value: string, ignoreInCI: boolean}
 *
 * Checks for if values are defined and set properly
 */
exports.testRecordAppValuesAfterSubmission = function(column_names, column_values, num_displayed_columns) {
    chaisePage.recordPageReady();

    browser.wait(function() {
        return chaisePage.recordPage.getColumns().count().then(function(ct) {
            return (ct == num_displayed_columns);
        });
    }, browser.params.defaultTimeout);

    for (var i = 0; i < column_names.length; i++) {
        var columnName = column_names[i];
        var column = chaisePage.recordPage.getColumnValue(columnName);
        if (process.env.CI && column_values[columnName].ignoreInCI) {
            continue;
        }
        else if (column_values[columnName] && typeof column_values[columnName].link === 'string') {
            column = column.element(by.css("a"));
            expect(column.getText()).toEqual(column_values[columnName].value, "Value for " + columnName + " is not what was expected");
            expect(column.getAttribute('href')).toContain(column_values[columnName].link, "link for " + columnName + " is not what was expected");
        } else {
            var val = column_values[columnName];
            if (typeof val === 'object' && val != null && typeof val.value === "string") {
                val = val.value;
            }
            expect(column.getText()).toBe(val, "Value for " + columnName + " is not what was expected");
        }

    }
};

/**
 * create files in the given path. This should be called before test cases
 * parent directory that these files will be uploaded into is test/e2e/data_setup/uploaded_files.
 * That means the given path should be a path that is valid in uploaded_files folder.
 *
 * @param  {obj[]} files array of objects with at least path, and size as attributes.
 */
exports.createFiles = function(files) {
    files.forEach(function(f) {
        if (f.skipCreation) return;
        var path = require('path').join(__dirname , "/../data_setup/uploaded_files/" + f.path);
        exec("perl -e 'print \"1\" x " + f.size + "' > " + path);
        console.log(path + " created");
    });
};

/**
 * removes the given files. read the createFiles documentation for more info about files and path
 * @param  {obj[]} files array of objects with at least path, and size as attributes.
 */
exports.deleteFiles = function(files) {
    files.forEach(function(f) {
        if (f.skipDeletion) return;
        var path = require('path').join(__dirname , "/../data_setup/uploaded_files/" + f.path);
        exec('rm ' + path);
        console.log(path + " deleted");
    });
};

/**
 * TODO this should be replaced by selectFileReturnPromise
 */
exports.selectFile = function(file, fileInput, txtInput) {
    var filePath = require('path').join(__dirname , "/../data_setup/uploaded_files/" + file.path);

    fileInput.sendKeys(filePath);

    browser.sleep(100);

    expect(fileInput.getAttribute('value')).toContain(file.name, "didn't select the correct file.");
    expect(txtInput.getText()).toBe(file.name, "didn't show the correct file name after selection.");

    if (typeof file.tooltip === "string") {
        // test the tooltip on hover
        // move the mouse first to force any other tooltips to hide
        browser.actions().mouseMove(chaisePage.recordEditPage.getRequiredInfoEl()).perform();
        var tooltip = chaisePage.getTooltipDiv();

        chaisePage.waitForElementInverse(tooltip).then(function () {
            chaisePage.testTooltipReturnPromise(txtInput, file.tooltip, 'recordedit');
        });
    }
};

/**
 * TODO this should replace the selectFile function
 */
exports.selectFileReturnPromise = (file, fileInput, txtInput) => {
  return new Promise((resolve, reject) => {
    const filePath = require('path').join(__dirname , "/../data_setup/uploaded_files/" + file.path);

    fileInput.sendKeys(filePath).then(() => {
      return browser.sleep(100);
    }).then(() => {
      expect(fileInput.getAttribute('value')).toContain(file.name, "didn't select the correct file.");
      expect(txtInput.getText()).toBe(file.name, "didn't show the correct file name after selection.");

      if (typeof file.tooltip === "string") {
        // test the tooltip on hover
        // move the mouse first to force any other tooltips to hide
        browser.actions().mouseMove(chaisePage.recordEditPage.getRequiredInfoEl()).perform().then(() => {
          return chaisePage.waitForElementInverse(chaisePage.getTooltipDiv());
        }).then(() => {
          return chaisePage.testTooltipReturnPromise(txtInput, file.tooltip, 'recordedit');
        }).then(() => {
          resolve();
        }).catch(err => reject(err));

      } else {
        resolve();
      }
    }).then(() => {
      resolve();
    }).catch(err => reject(err));
  });
}

/**
 * test a file input with the given column name, and file that we want to test
 * the file input against it.
 *
 * TODO in playwright version don't use this. use `selectFile` or `setInputValue`.
 * @param  {string}         colName         name of the column
 * @param  {int}            recordIndex     index of record in the view
 * @param  {obj}            file            object with at least path, and name attributes.
 * @param  {string=}        currentValue    if you want to test the current value.
 * @param  {boolean=false}  print           should it print the file names or not.
 */
exports.testFileInput = function (colName, recordIndex, file, currentValue, print, testValidation) {
    const fileInput = chaisePage.recordEditPage.getInputForAColumn(colName, recordIndex+1);
    print = typeof print !== "boolean" ? false : print;

    const textInput = chaisePage.recordEditPage.getTextFileInputForAColumn(colName, recordIndex+1)
    textInput.getAttribute('value').then(function(value) {
        // Incase of edit first clear the fileinput field by pressing the dismiss button
        // and then set new file
        if (value && value.trim().length > 0) {
            chaisePage.recordEditPage.getInputRemoveButton(colName, recordIndex+1).then(function(clearButton) {
                return clearButton.click();
            }).then(function () {

                browser.sleep(50);

                expect(txtInput.getAttribute('value')).toBe("", "couldn't clear the button.");
                exports.selectFile(file, fileInput, textInput);
            });
        } else {
            exports.selectFile(file, fileInput, textInput);
        }

        if (testValidation) {
          const error = chaisePage.recordEditPage.getErrorMessageForAColumn(colName, recordIndex+1);
          // this is just making sure the error shows up
          chaisePage.waitForElement(error);
        }
    });
};


/**
 *
 * expected types: 'timestamp', 'boolean', 'fk', 'fk-dropdown', any other string
 *
 * expected valueProps:
 * {
 *
 * // general:
 *  value,
 *
 * // time stamp props:
 *  date_value,
 *  time_value,
 *
 * // fk props:
 *  modal_num_rows,
 *  modal_option_index,
 *
 * // array props (currently only supports array of text):
 *  value: string[]
 *
 * }
 *
 * @param {string} name input name
 * @param {string} displayname the displayed name
 * @param {string} displayType type of the input
 * @param {Object} valueProps expected values
 * @returns
 */
exports.setInputValue = (formNumber, name, displayname, displayType, valueProps) => {
  return new Promise((resolve, reject) => {
    switch (displayType) {
      case 'boolean':
        let dropdown = chaisePage.recordEditPage.getDropdownElementByName(name, formNumber);
        browser.wait(EC.elementToBeClickable(dropdown)).then(() => {
          return chaisePage.recordEditPage.selectDropdownValue(dropdown, valueProps.value);
        }).then(() => {
          expect(chaisePage.recordEditPage.getDropdownText(dropdown).getText()).toBe(valueProps.value);
          resolve();
        }).catch(err => reject(err));
        break;
      case 'fk':
        chaisePage.clickButton(recordEditPage.getForeignKeyInputButton(displayname, formNumber)).then(() => {
          return chaisePage.waitForElement(chaisePage.recordEditPage.getModalTitle());
        }).then(() => {
          return browser.wait(function () {
            return chaisePage.recordsetPage.getModalRows().count().then(function (ct) {
              return (ct == valueProps.modal_num_rows);
            });
          });
        }).then(() => {
          // select the option
          return chaisePage.recordsetPage.getRows().get(valueProps.modal_option_index).element(by.css('.select-action-button'));
        }).then((el) => {
          return chaisePage.clickButton(el);
        }).then(() => {
          // wait for modal to close
          return browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getEntityTitleElement()));
        }).then(() => {
          resolve();
        }).catch(err => reject(err));
        break;
      case 'fk-dropdown':
        let dropdownOptions;
        chaisePage.clickButton(recordEditPage.getDropdownElementByName(name, formNumber)).then(() => {
          return browser.wait(() => {
            return chaisePage.recordEditPage.getDropdownSelectableOptions().count().then((ct) => {
                return ct === valueProps.modal_num_rows;
            });
          });
        }).then(() => {
          dropdownOptions = dropdownOptions = chaisePage.recordEditPage.getDropdownSelectableOptions();
          expect(dropdownOptions.count()).toEqual(valueProps.modal_num_rows);
          //select the option
          return chaisePage.clickButton(dropdownOptions.get(valueProps.modal_option_index));
        }).then(() => {
          // wait for the dropdown to close
          return chaisePage.waitForElementInverse(dropdownOptions);
        }).then(() => {
          resolve();
        }).catch(err => reject(err));
        break;
      case 'timestamp':
        const inputs = recordEditPage.getTimestampInputsForAColumn(name, formNumber);
        chaisePage.clickButton(inputs.clearBtn).then(() => {
          return inputs.date.clear();
        }).then(() => {
          return inputs.time.clear();
        }).then(() => {
          return inputs.time.sendKeys(valueProps.time_value);
        }).then(() => {
          return inputs.date.sendKeys(valueProps.date_value);
        }).then(() => {
          resolve();
        }).catch(err => reject(err));
        break;
      case 'upload':
        const fileInput = recordEditPage.getInputForAColumn(name, formNumber);
        const fileTextInput = recordEditPage.getTextFileInputForAColumn(name, formNumber);
        exports.selectFileReturnPromise(valueProps.value, fileInput, fileTextInput).then(() => {
          resolve();
        }).catch(err => reject(err));
        break;
      case 'array':
        // NOTE we're assuming it's array of text
        const arrayField = chaisePage.recordEditPage.getArrayFieldContainer(`${formNumber}-${displayname}`,valueProps.baseType);

        arrayField.getArrayItem().isPresent().then((isPresent)=>{

          if(isPresent){

            const arrayFieldItem = arrayField.getArrayItem();

            arrayFieldItem.sendKeys(
              protractor.Key.chord(protractor.Key.CONTROL, 'a'),
              protractor.Key.BACK_SPACE,
              valueProps.value
              ).then(()=>{
              resolve();
            })

          }else{

            arrayField.getAddNewValueInputElement().sendKeys(valueProps.value).then(()=>{
              return arrayField.getAddButton().click()
            }).then(()=>{
              resolve();
            });
          }
        })

        break;
      default:
        let inputEl;
        if (displayType === 'textarea') {
          inputEl = recordEditPage.getTextAreaForAColumn(name, formNumber);
        } else {
          inputEl = recordEditPage.getInputForAColumn(name, formNumber);
        }

        recordEditPage.clearInput(inputEl).then(() => {
         return inputEl.sendKeys(valueProps.value);
        }).then(() => {
          resolve();
        }).catch(err => reject(err));
        break;
    }

  });
}


/**
 * test the values displayed on the forms for a column
 *
 * expectedValues expected type will be different depending on the input type. for all the types expect the following
 * it should be an array of strings.
 * - timestamp: array of objects with date_value and time_value props
 *
 * @param {string} name the column name
 * @param {string}} displayname the column displayname
 * @param {string} displayType the display type (boolean, fk, timestamp, upload, "any other string")
 * @param {boolean} allDisabled whether we should test that all the inputs are disabled or not
 * @param {any[]} expectedValues the expected values
 * @returns
 */
exports.testFormValuesForAColumn = (name, displayname, displayType, allDisabled, expectedValues) => {
  return new Promise((resolve) => {
    let input, inputControl, formNumber, message;

    expectedValues.forEach((value, i) => {
      formNumber = i + 1;
      message = `col ${displayname}, formNumber=${formNumber}`;

      switch (displayType) {
        case 'boolean':
          inputControl = recordEditPage.getInputControlForAColumn(name, formNumber);
          input = recordEditPage.getDropdownElementByName(name, formNumber);
          if (allDisabled) {
            expect(inputControl.getAttribute('class')).toContain('input-disabled',`${message}: was not disabled.`);
          }
          expect(input.getText()).toBe(value, `${message}: value missmatch.`);
          break;
        case 'fk':
          input = recordEditPage.getForeignKeyInputDisplay(displayname, formNumber);
          if (allDisabled) {
            expect(input.getAttribute('class')).toContain('input-disabled', `${message}: was not disabled.`);
          }
          expect(input.getText()).toBe(value, `${message}: value missmatch.`);
          break;
        case 'timestamp':
          input = recordEditPage.getTimestampInputsForAColumn(name, formNumber);
          if (allDisabled) {
            expect(input.date.isEnabled()).toBeFalsy(`${message}: date was not disabled.`);
            expect(input.time.isEnabled()).toBeFalsy(`${message}: time was not disabled.`);
          }
          expect(input.date.getAttribute('value')).toBe(value.date_value, `${message}: date value missmatch.`);
          expect(input.time.getAttribute('value')).toBe(value.time_value, `${message}: time value missmatch.`);
          break;
        case 'upload':
          inputControl = recordEditPage.getInputControlForAColumn(name, formNumber);
          input = recordEditPage.getTextFileInputForAColumn(name, formNumber);
          if (allDisabled) {
            expect(inputControl.getAttribute('class')).toContain('input-disabled', `${message}: was not disabled.`);
          }
          expect(input.getText()).toBe(value, `${message}: value missmatch.`);
          break;
        case 'array':

          const arrayField = chaisePage.recordEditPage.getArrayFieldContainer(`${formNumber}-${displayname}`,'text');

          arrayField.getArrayItem().isPresent().then((isPresent)=>{
            if(isPresent){
              const arrItem = arrayField.getArrayItem();
              expect(arrItem.getAttribute('value')).toBe(value)
            }else{
              expect(value).toBe('')
            }
          })

          break;
        default:
          const isTextArea = displayType === 'textarea';
          input = isTextArea ? recordEditPage.getTextAreaForAColumn(name, formNumber) : recordEditPage.getInputForAColumn(name, formNumber);
          if (allDisabled) {
            expect(input.isEnabled()).toBeFalsy(`${message}: was not disabled.`);
          }
          expect(input.getAttribute('value')).toBe(value, `${message}: value missmatch.`);
          break;
      }

      if (i === expectedValues.length-1) {
        resolve();
      }
    });

  });
}
