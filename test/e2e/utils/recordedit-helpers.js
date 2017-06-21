var chaisePage = require('./chaise.page.js'),
IGNORE = "tag:isrd.isi.edu,2016:ignore",
HIDDEN = "tag:misd.isi.edu,2015:hidden",
IMMUTABLE = "tag:isrd.isi.edu,2016:immutable",
GENERATED = "tag:isrd.isi.edu,2016:generated";
var chance = require('chance').Chance();
var moment = require('moment');
var EC = protractor.ExpectedConditions;
var exec = require('child_process').execSync;

//test params for markdownPreview
var markdownTestParams = [{
    "raw": "# RBK Project ghriwvfw nwoeifwiw qb2372b wuefiquhf",
    "markdown": "<h1>RBK Project ghriwvfw nwoeifwiw qb2372b wuefiquhf</h1>"
  },
  {
    "raw": "+ Create a list by starting a line with `+`, `-`, or `*`\n" +
      "+ Sub-lists are made by indenting 2 spaces:\n" +
      "  - Marker character change forces new list start:\n" +
      "    * Ac tristique libero volutpat at\n" +
      "    + Facilisis in pretium nisl aliquet\n" +
      "    - Nulla volutpat aliquam velit\n" +
      "+ Very easy!",
    "markdown": "<ul>\n" +
      "<li>Marker character change forces new list start:\n" +
      "<ul>\n" +
      "<li>Ac tristique libero volutpat at</li>\n" +
      "</ul>\n" +
      "<ul>\n" +
      "<li>Facilisis in pretium nisl aliquet</li>\n" +
      "</ul>\n" +
      "<ul>\n" +
      "<li>Nulla volutpat aliquam velit</li>\n" +
      "</ul>\n" +
      "</li>\n" +
      "</ul>\n" +
      "</li>\n" +
      "<li>Very easy!</li>\n" +
      "</ul>"
  },
  {
    "raw": "`inline code can be very helpful. This is why we should use them quite often. whu;ehfwuehu wifjeowhfuehuhfh`. **This is bold text. nuf2uh3498hcuh23uhcu29hh  nfwnfi2nfn k2mr2ijri**. _This is italic text fcj2ij3ijjcn 2i3j2ijc3roi2joicj_. ~~Strikethrough wnnfw nwn wnf wu2h2h3hr2hrf13hu u 2u3h u1ru31r 1n3r uo13ru1ru~~",
    "markdown": "<p><code>inline code can be very helpful. This is why we should use them quite often. whu;ehfwuehu wifjeowhfuehuhfh</code>. <strong>This is bold text. nuf2uh3498hcuh23uhcu29hh  nfwnfi2nfn k2mr2ijri</strong>. <em>This is italic text fcj2ij3ijjcn 2i3j2ijc3roi2joicj</em>. <s>Strikethrough wnnfw nwn wnf wu2h2h3hr2hrf13hu u 2u3h u1ru31r 1n3r uo13ru1ru</s></p>"
  }, {
    "raw": "X^2^+Y^2^+Z^2^=0",
    "markdown": "X<sup>2</sup>+Y<sup>2</sup>+Z<sup>2</sup>=0"
  }
];


/**
 * Test presentation, validation, and inputting a value for different column types in recordedit app.
 *
 * NOTE: tableParams structure:
 * It includes the following:
 *  table_name
 *  table_displayname 
 *  primary_key: list of column names
 *  key (optional): it's used in edit mode for retrieving a record.
 *  columns:
 *      - it must include `name`, `title`, and `type`.
 *      - it can have `generated` (bool), `immutable` (bool), `nullok` (bool), `comment`.
 *      - if column is is a foreign key use `isForeignKey:true`, then you must provide the following:
 *          - `count`: number of fks available to select.
 *          - `table_title`: displayname of fk's reference.
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
 *  results (optional) if you want to test the inputs, it must be in the same order of expected values. It's an array and includes only value of cells.
 *  TODO document results when implemented
 *  files (optional): if you want to test file upload. it's a list of objects with `name`, `size`, and `path`.
 * 
 * @param  {Object}  tableParams take a look at the note above.
 * @param  {Boolean} isEditMode  true if in editmode, used for testing the title. 
 */
exports.testPresentationAndBasicValidation = function(tableParams, isEditMode) {

    var visibleFields = [];

    if (isEditMode) {
        it("should have edit record title", function() {
            var EC = protractor.ExpectedConditions;

            browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getFormTitle()), browser.params.defaultTimeout);
            var title = chaisePage.recordEditPage.getFormTitle();
            expect(title.getText()).toEqual("Edit " + tableParams.table_displayname + " Record");
        });

        it("should not allow to add new rows/columns", function() {
            chaisePage.recordEditPage.getAddRowButton().then(function(button) {
                if (button) expect("Add button visible").toBe("Add Button should not be visible");
                else expect(true).toBeDefined();
            });
        });

    } else {
        it("should have create record title", function() {
            var EC = protractor.ExpectedConditions;

            browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getFormTitle()), browser.params.defaultTimeout);

            chaisePage.recordEditPage.getEntityTitle().then(function(txt) {
                expect(txt).toBe("Create " + tableParams.table_displayname + " Records");
            });
        });

        it("should allow to add new rows/columns", function() {
            chaisePage.recordEditPage.getAddRowButton().then(function(button) {
                if (!button) expect("Add button invisible").toBe("Add Button should be visible");
                else expect(true).toBeDefined();
            });
        });
    }

    it("should render columns which are inside the visible columns annotation if defined; Default all are visible", function() {
        var columns = tableParams.columns;
        chaisePage.recordEditPage.getAllColumnCaptions().then(function(pageColumns) {
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
                        expect(c.getAttribute("uib-tooltip")).toBe(col.comment);
                    }
                });
            });
        });
    });

    it("should show red asterisk (*) before for fields which are required", function() {
        var columns = tableParams.columns.filter(function(c) { if (c.nullok === false && !c.generated && !c.immutable) return true; });
        columns.forEach(function(c) {
            var el = visibleFields.find(function(v) { return v.column.name == c.name });
            chaisePage.recordEditPage.getColumnWithAsterisk(el).then(function(el) {
                if (el) expect(true).toBeDefined();
                else expect(undefined).toBe("Asterisk");
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
        
        var longTextDataTypeFields = [], textDataTypeFields = [], markdownDataTypeFields = [],
        booleanDataTypeFields = [], foreignKeyFields = [], datePickerFields = [], integerDataTypeFields = [], floatDataTypeFields = [], timeInputFields = [];
        
        // test cases:
        describe(title + ",",function() {
            if (recordIndex > 0) {
                it("should click add record button", function() {
                    chaisePage.recordEditPage.getAddRowButton().then(function(button) {
                        chaisePage.clickButton(button);
                        browser.wait(function() {
                            return chaisePage.recordEditPage.getForms().count().then(function(ct) {
                                return (ct == recordIndex + 1);
                            });
                        }, browser.params.defaultTimeout);
                    });
                });
            };
  
            if (disabledCols.length > 0) {
                it("should show columns with generated or immutable annotations as disabled", function() {
                    disabledCols.forEach(function(column) {
                        if (column.type == 'timestamp' || column.type == 'timestamptz') {
                            var timeInputs = chaisePage.recordEditPage.getTimestampInputsForAColumn(column.name, recordIndex);
                            var dateInput = timeInputs.date, timeInput = timeInputs.time, meridiemBtn = timeInputs.meridiem;
                            expect(dateInput.isEnabled()).toBe(false, colError(column.name, "date input of generated timestamp column is enabled."));
                            expect(timeInput.isEnabled()).toBe(false, colError(column.name, "time input of generated timestamp column is enabled."));
                            expect(meridiemBtn.isEnabled()).toBe(false, colError(column.name, "meridiem input of generated timestamp column is enabled."));
                        } else {
                            chaisePage.recordEditPage.getInputForAColumn(column.name, recordIndex).then(function(input) {
                                expect(input.isEnabled()).toBe(false, colError(column.name, "input of generated column is enabled."));
                                if (!tableParams.key) {
                                    expect(input.getAttribute('placeholder')).toBe('Automatically generated', colError(column.name, "placeholder of generated column is not correct."));
                                }
                            }).catch(function(e) {
                                console.log(e);
                            });
                        }
                    });
                });                
            }
            
            if (longTextCols.length > 0) {
                describe("longText fields, ", function () {
                    it("should show textarea input for longtext datatype and then set the value.", function() {                    
                        longTextCols.forEach(function(c) {
                            chaisePage.recordEditPage.getTextAreaForAcolumn(c.name, recordIndex).then(function(txtArea) {
                                if (txtArea) {
                                    expect(true).toBeDefined();
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
                                } else {
                                    expect(undefined).toBeDefined(colError(c.name, "Couldn't find the input field (type: longtext)."));
                                }
                            });
                        });
                    });
                });
            }
            
            if (textCols.length > 0) {
                describe("Text fields, ", function () {
                    it("should show text input for text and set the value.", function() {
                        textCols.forEach(function(c) {
                            chaisePage.recordEditPage.getInputForAColumn(c.name, recordIndex).then(function(txtInput) {
                                if (txtInput) {
                                    expect(true).toBeDefined();
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
                                } else {
                                    expect(undefined).toBeDefined(colError(c.name, "Couldn't find the input field (type: longtext)."));
                                }
                            });
                        });
                    });
                });
            }
            
            if (markdownCols.length > 0) {
                describe("Markdown fields, ", function () {
                    it('should have the correct value.', function () {
                        markdownCols.forEach(function(c) {
                            var inp = chaisePage.recordEditPage.getInputById(recordIndex, c.title);
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
                    
                    // TODO 
                    xit('should render correct markdown in modal box.', function() {
                        markdownDataTypeFields.forEach(function(markdownField) {
                            var livePreviewLink = element.all(by.className('live-preview'));
                            for (i = 0; i < markdownTestParams.length; i++) {
                                chaisePage.recordEditPage.clearInput(markdownField);
                                browser.sleep(10);
                                
                                (function(input, markdownOut) {
                                    markdownField.sendKeys(input);
                                    livePreviewLink.click();
                                    let mdDiv = element(by.css('[ng-bind-html="ctrl.params.markdownOut"]'));
                                    browser.wait(EC.presenceOf(mdDiv), browser.params.defaultTimeout);
                                    expect(mdDiv.getAttribute('outerHTML')).toContain(markdownOut, "Error during markdown generation");
                                    element(by.className('modal-close')).click();
                                })(markdownTestParams[i].raw, markdownTestParams[i].markdown);
                            } //for
                        });
                    }).pend("should be changed because the live-preview selector is not unique, and also it will changed");
                    
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
                    var pageColumns = [], dropdowns = [];

                    beforeAll(function() {
                        chaisePage.recordEditPage.getAllColumnCaptions().then(function(pcs) {
                            pcs.forEach(function(pc) {
                                pc.getAttribute('innerHTML').then(function(txt) {
                                    txt = txt.trim();
                                    var col = booleanCols.find(function(cl) { return txt == cl.title });
                                    if (col) {
                                        pc.column = col;
                                        pageColumns.push(pc);
                                    }
                                });
                            });
                        });
                    });

                    it("should show a dropdown", function() {
                        pageColumns.forEach(function(pc) {
                            chaisePage.recordEditPage.getDropdown(pc, recordIndex).then(function(dropdown) {
                                if (dropdown) {
                                    dropdown.column = pc.column;
                                    
                                    var value = getRecordValue(dropdown.column.name);
                                    if (value != undefined) {
                                        expect(chaisePage.recordEditPage.getDropdownText(dropdown)).toBe(value.length == 0 ? 'Select a value' : (value + ""), colError(dropdown.column.name, "Doesn't have the expected value."));
                                    }

                                    dropdowns.push(dropdown);
                                    booleanDataTypeFields.push(dropdown);
                                } else {
                                    expect(undefined).toBeDefined(colError(pc.column.name , "Couldn't find the boolean dropdown."));
                                }
                            });
                        });
                    });

                    it("should render 3 options for a boolean field if nullok is true else 2", function() {
                        dropdowns.forEach(function(dropdown) {
                            browser.executeScript("return $(arguments[0]).data().$scope.$select.items", dropdown).then(function(items) {
                                if (dropdown.column.nullok == false) {
                                    expect(items.length).toBe(2, colError(dropdown.column.name, "Number of available options is not as expected."));
                                } else {
                                    expect(items.length).toBe(3, colError(dropdown.column.name, "Number of available options is not as expected."));
                                }
                            });
                        });
                    });

                    it("should select an option (true, false, none)", function() {
                        dropdowns.forEach(function(dropdown) {

                            if (isEditMode && (dropdown.column.generated || dropdown.column.immutable)) return;

                            var value = getRecordInput(dropdown.column.name, chance.bool());
                            
                            chaisePage.recordEditPage.selectDropdownValue(dropdown, value).then(function() {
                                browser.sleep(10);
                                expect(chaisePage.recordEditPage.getDropdownText(dropdown)).toBe(value.length == 0 ? 'Select a value' : (value + ""), colError(dropdown.column.name, "Couldn't select a value."));
                            });
                        });
                    });
                });
            }
            
            if (foreignKeyCols.length > 0) {
                describe("Foreign key fields,", function() {
                    var pageColumns = [], dropdowns = [];

                    beforeAll(function() {
                        chaisePage.recordEditPage.getAllColumnCaptions().then(function(pcs) {
                            pcs.forEach(function(pc) {
                                pc.getAttribute('innerHTML').then(function(txt) {
                                    txt = txt.trim();
                                    var col = foreignKeyCols.find(function(cl) { return txt == cl.title });
                                    if (col) {
                                        pc.column = col;
                                        pageColumns.push(pc);
                                    }
                                });
                            });
                        });
                    });

                    it('should show an uneditable field for each foreign key column', function() {
                        var expectedNumOfPopupFields = foreignKeyCols.length * (recordIndex + 1);
                        var popupFields = element.all(by.css('.popup-select-value'));
                        expect(popupFields.count()).toBe(expectedNumOfPopupFields, "number of foreignkeys is not as expected.");
                        // Ensure each field is an uneditable div element (not an input)
                        popupFields.map(function(field) {
                            expect(field.getTagName()).toBe('div', "field is not a div.");
                            expect(field.getAttribute('contenteditable')).toBe('false', "field is not uneditable.");
                        });
                    });

                    // TODO test the current value.

                    // in the edit case
                    if (isEditMode) {
                        it("clicking the 'x' should remove the value in the foreign key field.", function () {
                            var foreignKeyInput = chaisePage.recordEditPage.getForeignKeyInputValue(foreignKeyCols[0].title, recordIndex);
                            //the first foreignkey input for editing should be pre-filled
                            expect(foreignKeyInput.getAttribute("value")).toBeDefined();

                            chaisePage.recordEditPage.getForeignKeyInputRemoveBtns().then(function(foreignKeyInputRemoveBtn) {
                                return chaisePage.clickButton(foreignKeyInputRemoveBtn[0]);
                            }).then(function() {
                                // value is empty string after removing it
                                expect(foreignKeyInput.getAttribute("value")).toBe('');
                            });
                        });

                        it("clicking 'x' in the model should close it without returning a value.", function () {
                            var modalClose = chaisePage.recordEditPage.getModalCloseBtn(),
                            EC = protractor.ExpectedConditions;

                            chaisePage.recordEditPage.getModalPopupBtnsUsingScript().then(function(popupBtns) {
                                return chaisePage.clickButton(popupBtns[0]);
                            }).then(function() {
                                // wait for the modal to open
                                browser.wait(EC.visibilityOf(modalClose), browser.params.defaultTimeout);
                                return modalClose.click();
                            }).then(function() {
                                var foreignKeyInput = chaisePage.recordEditPage.getForeignKeyInputValue(foreignKeyCols[0].title, recordIndex);
                                expect(foreignKeyInput.getAttribute("value")).toBe('');
                            });
                        });
                    }

                    it("should open a modal search and select a foreign key value.", function () {
                        chaisePage.recordEditPage.getModalPopupBtnsUsingScript().then(function(popupBtns) {
                            var modalTitle = chaisePage.recordEditPage.getModalTitle(),
                            EC = protractor.ExpectedConditions;

                            expect(popupBtns.length).toBe(foreignKeyCols.length * (recordIndex + 1), "number of foreign keys is not as expected.");

                            for (var i=0; i<foreignKeyCols.length; i++) {
                                (function(i) {
                                    var col = foreignKeyCols[i];
                                    
                                    // this will have the index and the presentational value
                                    var fkSelectedValue = getRecordInput(col.name);
                                    
                                    var rows;
                                    chaisePage.clickButton(popupBtns[(foreignKeyCols.length * recordIndex) + i ]).then(function() {
                                        // wait for the modal to open
                                        browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);
                                        // Expect search box to have focus
                                        var searchBox = chaisePage.recordsetPage.getSearchBox();
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
                                            expect(searchBox.getAttribute('id')).toEqual(browser.driver.switchTo().activeElement().getAttribute('id'), colError(foreignKeyCols[i].name, "when opened the modal selector, focus was not on search input."));
                                        });
                                        return modalTitle.getText();
                                    }).then(function(text) {
                                        // make sure modal opened
                                        expect(text).toEqual("Choose " + col.table_title, colError(col.name, "foreign key modal selector title is not what was expected."));
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
                                        
                                        
                                        return rows.get(fkSelectedValue.index).all(by.css(".select-action-button"));
                                    }).then(function(selectButtons) {
                                        return selectButtons[0].click();
                                    }).then(function() {
                                        browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getFormTitle()), browser.params.defaultTimeout);
                                        
                                        var foreignKeyInputDisplay = chaisePage.recordEditPage.getForeignKeyInputDisplay(col.title, recordIndex);
                                        expect(foreignKeyInputDisplay.getText()).toEqual(fkSelectedValue.value, colError(col.name, "Didn't select the expected foreign key."));
                                        
                                        // Open the same modal again to make sure search box is autofocused again
                                        return chaisePage.clickButton(popupBtns[(foreignKeyCols.length * recordIndex) + i ]);
                                    }).then(function() {
                                        // Wait for the modal to open
                                        browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);
                                        // Expect search box to have focus.
                                        var searchBox = chaisePage.recordsetPage.getSearchBox();
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
                            var dateInputs = chaisePage.recordEditPage.getDateInputsForAColumn(column.name, recordIndex);
                            
                            dateInputs.column = column;
                            
                            datePickerFields.push(dateInputs);
                            
                            var dateInput = dateInputs.date;
                            
                            var value = getRecordValue(column.name);
                            if (value != undefined) {
                                expect(dateInput.getAttribute('value')).toBe(value, colError(column.name, "doesn't have the expected value."));
                            }

                            if (column.generated || column.immutable) return;
                            
                            chaisePage.recordEditPage.clearInput(dateInput);
                            browser.sleep(10);
                            
                            dateInput.sendKeys('1234-13-31');
                            chaisePage.recordEditPage.getDateInputErrorMessage(dateInput, 'date').then(function(error) {
                                if (error) {
                                    expect(true).toBe(true);
                                } else {
                                    expect('An error message was supposed to appear.').toBe('But was not found.', colError(column.name, "Expected to show a error on invalid input."));
                                }
                            });

                            chaisePage.recordEditPage.clearInput(dateInput);
                            browser.sleep(10);

                            dateInput.sendKeys('2016-01-01');
                            expect(dateInput.getAttribute('value')).toEqual('2016-01-01', colError(column.name, "value didn't change."));
                            chaisePage.recordEditPage.getDateInputErrorMessage(dateInput, 'date').then(function(error) {
                                if (error) {
                                    expect('An error message was not supposed to appear.').toBe('But one was found.', colError(column.name, "Expected to not show any error on valid input."));
                                } else {
                                    expect(true).toBe(true);
                                }
                            });
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

                            dp.clearBtn.click();
                            expect(dp.date.getAttribute('value')).toBeFalsy(colError(dp.column.name, "Couldn't clear the input."));
                        });
                    });
                    
                    it('should select a valid value.', function () {
                        datePickerFields.forEach(function(dp) {
                            var column = dp.column, inp = dp.date;
                            if (column.generated || column.immutable) return;
                            
                            chaisePage.recordEditPage.clearInput(inp);
                            browser.sleep(10);
                            
                            var value = getRecordInput(column.name, '2016-01-01');
                            inp.sendKeys(value);
                            expect(inp.getAttribute('value')).toEqual(value, colError(column.name, "value didn't change."));
                        });
                    });
                    
                    // NOTE: the following test cases are pending (need to be changed)
                    it("should have a datepicker element", function() {
                        dateCols.forEach(function(column) {
                            chaisePage.recordEditPage.getInputValue(column.name, recordIndex).then(function(dateInput) {
                                if (dateInput) {
                                    expect(true).toBeDefined();
                                    dateInput.column = column;
                                    datePickerFields.push(dateInput);
                                    
                                    var value = getRecordValue(column.name);
                                    if (value != undefined) {
                                        expect(dateInput.getAttribute('value')).toBe(value);
                                    }
                                } else {
                                    expect(undefined).toBeDefined();
                                }
                            });
                        });
                    }).pend('Postpone test until a datepicker is re-implemented');
                    it("should render open datepicker on click", function() {
                        datePickerFields.forEach(function(dp) {

                            if (isEditMode && (dp.column.generated || dp.column.immutable)) return;

                            chaisePage.clickButton(dp);
                            browser.sleep(10);
                            chaisePage.recordEditPage.getDatePickerForAnInput(dp).then(function(datePicker) {
                                if (datePicker) {
                                    expect(true).toBeDefined();
                                } else {
                                    expect(undefined).toBeDefined();
                                }
                                dp.datePicker = datePicker;
                            });
                        });
                    }).pend('Postpone test until a datepicker is re-implemented');
                    it("should select a date , and check the value", function() {
                        datePickerFields.forEach(function(dateInput) {
                            if (isEditMode && (dateInput.column.generated || dateInput.column.immutable)) return;

                            chaisePage.clickButton(dateInput);
                            browser.sleep(10);
                            chaisePage.recordEditPage.getDayButtonsForDatePicker(dateInput.datePicker).then(function(dayBtns) {
                                var day = chaisePage.recordEditPage.getRandomInt(1, dayBtns.length);
                                dayBtns[day-1].click();

                                var month = ((new Date()).getMonth() + 1);
                                month = (month < 10) ? "0" + month : month;
                                day = (day < 10) ? "0" + day : day;

                                var date = (new Date()).getFullYear() + "-" + month + "-"  + day;
                                expect(dateInput.getAttribute('value')).toBe(date);

                                // Required error message should disappear
                                chaisePage.recordEditPage.getDateInputErrorMessage(dateInput, 'required').then(function(err) {
                                    if (err) {
                                        expect(undefined).toBe("Date input " + dateInput.column.name + " Required Error message to be hidden");
                                    } else {
                                        expect(true).toBeDefined();
                                    }
                                });
                            });
                        });
                    }).pend('Postpone test until a datepicker is re-implemented');
                });
            }
              
            if (timestampCols.length > 0) {
                describe("Timestamp fields,", function() {
                    it('should have 3 inputs with validation for each timestamp column', function() {
                        timestampCols.forEach(function(column) {
                            var timeInputs = chaisePage.recordEditPage.getTimestampInputsForAColumn(column.name, recordIndex);
                            var dateInput = timeInputs.date, timeInput = timeInputs.time, meridiemBtn = timeInputs.meridiem;
                            var nowBtn = timeInputs.nowBtn, clearBtn = timeInputs.clearBtn;

                            expect(dateInput).toBeDefined(colError(column.name, "Date input is not defined."));
                            expect(timeInput).toBeDefined(colError(column.name, "Time input is not defined."));
                            expect(meridiemBtn).toBeDefined(colError(column.name, "Meridiem button is not defined."));
                            
                            // NOTE: value is a moment object
                            var value = getRecordValue(column.name);
                            if (value != undefined) {
                                dateInput.getAttribute('value').then(function(dateVal) {
                                    // Check date input
                                    expect(dateVal).toEqual(value.format("YYYY-MM-DD"), colError(column.name, "column date is not as expected."));
                                    return timeInput.getAttribute('value');
                                }).then(function(timeVal) {
                                    // Check time input value is within an interval
                                    expect(timeVal).toEqual(value.format("hh:mm:ss"), colError(column.name, "column time is not as expected."));
                                    return meridiemBtn.getText();
                                }).then(function(meridiemVal) {
                                    // Check meridiem btn
                                    expect(meridiemVal).toEqual(value.format("A"), colError(column.name, "column meridiem is not as expected."));
                                }).catch(function(error) {
                                    console.log(error);
                                });
                            }

                            if (column.generated || column.immutable) return;

                            // Test toggling of meridiem button
                            // Testing meridiem before the time input test because toggling btn should work
                            // with or without input in the other fields (i.e. date and time input fields).
                            var initialMeridiem = '';
                            meridiemBtn.getText().then(function(text) {
                                initialMeridiem = text;
                                return meridiemBtn.click();
                            }).then(function() {
                                return meridiemBtn.getText();
                            }).then(function(newText) {
                                if (initialMeridiem == 'AM') {
                                    expect(newText).toEqual('PM', colError(column.name, "initial column meridiem is not as expected."));
                                } else {
                                    expect(newText).toEqual('AM', colError(column.name, "initial column meridiem is not as expected."));
                                }
                                return meridiemBtn.click();
                            }).then(function() {
                                return meridiemBtn.getText();
                            }).then(function(newText) {
                                expect(newText).toEqual(initialMeridiem, colError(column.name, "column meridiem did not change after clicking it."));
                            }).catch(function(error) {
                                console.log(error);
                                expect('There was an error in this promise chain.').toBe('Please see the error message.', colError(column.name, ""));
                            });

                            // If user enters an invalid time an error msg should appear
                            timeInput.clear();
                            timeInput.sendKeys('24:12:00'); // this is invalid because we're only accepting 24-hr time formats from 0-23
                            chaisePage.recordEditPage.getTimestampInputErrorMessage(timeInput, 'time').then(function(error) {
                                if (error) {
                                    expect(true).toBe(true);
                                } else {
                                    expect('An error message was supposed to appear.').toBe('But was not found.', colError(column.name, "Accepted an invalid time."));
                                }
                            });

                            // If user enters a valid time, then error msg should disappear
                            timeInput.clear();
                            timeInput.sendKeys('12:00:00');
                            chaisePage.recordEditPage.getTimestampInputErrorMessage(timeInput, 'time').then(function(error) {
                                if (error) {
                                    expect('An error message was not supposed to appear.').toBe('But one was found.', colError(column.name, ""));
                                } else {
                                    expect(true).toBe(true);
                                }
                            });
                            timeInput.clear();
                            // users can enter 1 digit in any place
                            timeInput.sendKeys('2:00:00');
                            chaisePage.recordEditPage.getTimestampInputErrorMessage(timeInput, 'time').then(function(error) {
                                if (error) {
                                    expect('An error message was not supposed to appear.').toBe('But one was found.', colError(column.name, ""));
                                } else {
                                    expect(true).toBe(true);
                                }
                            });
                            timeInput.clear();
                            // users can enter just the hours
                            timeInput.sendKeys('08');
                            chaisePage.recordEditPage.getTimestampInputErrorMessage(timeInput, 'time').then(function(error) {
                                if (error) {
                                    expect('An error message was not supposed to appear.').toBe('But one was found.', colError(column.name, ""));
                                } else {
                                    expect(true).toBe(true);
                                }
                            });
                            timeInput.clear();
                            // users can enter less than the full string
                            timeInput.sendKeys('2:10');
                            chaisePage.recordEditPage.getTimestampInputErrorMessage(timeInput, 'time').then(function(error) {
                                if (error) {
                                    expect('An error message was not supposed to appear.').toBe('But one was found.', colError(column.name, ""));
                                } else {
                                    expect(true).toBe(true);
                                }
                            });
                            timeInput.clear();
                            // users can enter time in 24 hr format
                            timeInput.sendKeys('20:00:00');
                            chaisePage.recordEditPage.getTimestampInputErrorMessage(timeInput, 'time').then(function(error) {
                                if (error) {
                                    expect('An error message was not supposed to appear.').toBe('But one was found.', colError(column.name, ""));
                                } else {
                                    expect(true).toBe(true);
                                }
                            });
                            timeInput.clear();
                            // users can enter 0 for the time
                            timeInput.sendKeys('00:00:00');
                            chaisePage.recordEditPage.getTimestampInputErrorMessage(timeInput, 'time').then(function(error) {
                                if (error) {
                                    expect('An error message was not supposed to appear.').toBe('But one was found.', colError(column.name, ""));
                                } else {
                                    expect(true).toBe(true);
                                }
                            });

                            // Invalid date + good time = error
                            // If user enters a valid time but no date, an error msg should appear
                            dateInput.clear();
                            timeInput.clear();
                            timeInput.sendKeys('12:00:00');
                            chaisePage.recordEditPage.getTimestampInputErrorMessage(timeInput, 'timestampDate').then(function(error) {
                                if (error) {
                                    expect(true).toBe(true);
                                } else {
                                    expect('An error message was supposed to appear.').toBe('But none were found.', colError(column.name, "Accepted an invalid date."));
                                }
                                // Good date + good time = no error
                                // Now, if user enters a valid date, then no error message should appear
                                return dateInput.sendKeys('2016-01-01');
                            }).then(function() {
                                return chaisePage.recordEditPage.getTimestampInputErrorMessage(timeInput, 'timestampDate');
                            }).then(function(error) {
                                if (error) {
                                    expect('An error message was not supposed to appear.').toBe('But one was found.', colError(column.name, ""));
                                } else {
                                    expect(true).toBe(true);
                                }
                                // Good date + null time = no error
                                return timeInput.clear();
                            }).then(function() {
                                return chaisePage.recordEditPage.getTimestampInputErrorMessage(timeInput, 'timestampTime');
                            }).then(function(error) {
                                if (error) {
                                    expect('An error message was not supposed to appear.').toBe('But one was found.', colError(column.name, ""));
                                } else {
                                    expect(true).toBe(true);
                                }
                            });

                            timeInputFields.push({
                                date: dateInput,
                                time: timeInput,
                                meridiem: meridiemBtn,
                                nowBtn: nowBtn,
                                clearBtn: clearBtn,
                                column: column
                            });
                        });
                    });

                    it('should clear the input after clicking the \"Clear\" button', function() {
                        timeInputFields.forEach(function(obj) {
                            if (obj.column.generated || obj.column.immutable) return;

                            obj.clearBtn.click();
                            expect(obj.date.getAttribute('value')).toBeFalsy();
                            expect(obj.time.getAttribute('value')).toBeFalsy();
                            expect(obj.meridiem.getText()).toEqual('AM');
                        });
                    });

                    it('should have the current time after clicking the \"Now\" button', function() {
                        timeInputFields.forEach(function(obj) {

                            if (obj.column.generated || obj.column.immutable) return;

                            var UIdate, date = moment().format('YYYY-MM-DD');
                            var UItime, time = moment().format('x'); // in milliseconds
                            var timeDelta = 60 * 1000; // 1 minute, in milliseconds
                            var startTime = time - timeDelta, endTime = time + timeDelta;
                            var meridiem = moment().format('A');

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
                                return obj.meridiem.getText();
                            }).then(function(meridiemVal) {
                                // Check meridiem btn
                                expect(meridiemVal).toEqual(meridiem);
                            }).catch(function(error) {
                                console.log(error);
                            });
                        });
                    });
                    
                    it('should select a valid value.', function () {
                        timeInputFields.forEach(function(obj) {

                            if (obj.column.generated || obj.column.immutable) return;
                            
                            var value = getRecordInput(obj.column.name, moment());
                            
                            obj.date.clear();
                            obj.time.clear();
                            browser.sleep(10);
                            
                            // change the date
                            obj.date.sendKeys(value.format("YYYY-MM-DD"));
                            
                            expect(obj.date.getAttribute('value')).toEqual(value.format("YYYY-MM-DD"), colError(obj.column.name, "column date didn't change."));
                                
                            // change the time
                            obj.time.sendKeys(value.format("hh:mm:ss"));
                                
                            // Check time input value is within an interval
                            expect(obj.time.getAttribute('value')).toEqual(value.format("hh:mm:ss"), colError(obj.column.name, "column time didn't change."));
                            
                            var meridiemValue = value.format("A");
                            
                            obj.meridiem.getText().then(function(initialMeridiem) {
                                if (initialMeridiem !== meridiemValue) {
                                    obj.meridiem.click();
                                }
                            }).then(function() {
                                return obj.meridiem.getText();
                            }).then(function(newText) {
                                expect(newText).toEqual(meridiemValue, colError(obj.column.name, "column meridiem didn't change."));
                            }).catch(function(error) {
                                console.log(error);
                                expect('There was an error in this promise chain.').toBe('Please see the error message.', colError(obj.column.name, ""));
                            });            
                            
                        });
                    });
                    
                });
            }    

            if (intCols.length > 0) {
                describe("Integer fields,", function() {
                    it("should render input type as number with integer attribute", function() {
                        intCols.forEach(function(column) {
                            chaisePage.recordEditPage.getIntegerInputForAColumn(column.name, recordIndex).then(function(intInput) {
                                if (intInput) {
                                    expect(true).toBeDefined();
                                    intInput.column = column;
                                    integerDataTypeFields.push(intInput);

                                    var value = getRecordValue(column.name);
                                    if (value != undefined) {
                                        expect(intInput.getAttribute('value')).toBe(value, colError(column.name , "Doesn't have the expected value."));
                                    }

                                } else {
                                    expect(undefined).toBeDefined(colError(column.name, "Couldn't find the input field."));
                                }
                            });
                        });
                    });

                    it("should validate required and invalid text input", function() {
                        integerDataTypeFields.forEach(function(intInput) {
                            var c = intInput.column;
                            
                            if (c.generated || c.immutable) return;

                            var prevValue = "";

                            // Clear value if it is in edit mode
                            if (tableParams.primary_keys.indexOf(c.name) != -1) {
                                intInput.getAttribute("value").then(function(value) {
                                    prevValue = value + "";
                                });
                            }
                            chaisePage.recordEditPage.clearInput(intInput);

                            if (c.nullok == false && !c.generated && !c.immutable) {
                                chaisePage.recordEditPage.submitForm();
                                chaisePage.recordEditPage.getInputErrorMessage(intInput, 'required').then(function(err) {
                                    if(err) {
                                        expect(true).toBeDefined();
                                    } else {
                                        expect(undefined).toBeDefined(colError(c, "Expected to show error."));
                                    }
                                });
                            }

                            // Invalid text value
                            var text = "1j2yu", actualValue = "12";
                            intInput.sendKeys(text);
                            expect(intInput.getAttribute('value')).toBe(actualValue);


                            // Required Error message should disappear;
                            chaisePage.recordEditPage.getInputErrorMessage(intInput, 'required').then(function(err) {
                                if (err) {
                                    expect(undefined).toBeDefined(colError(c, "Expected to clear the error message on changing the value."));
                                } else {
                                    expect(true).toBeDefined();
                                }
                            });

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
                            chaisePage.recordEditPage.getInputErrorMessage(intInput, 'max').then(function(err) {
                                if (err) {
                                    expect(true).toBeDefined();
                                } else {
                                    expect(undefined).toBeDefined(colError(c.name, "Expected to show error when using maximum number."));
                                }
                            });


                            // Clear value
                            chaisePage.recordEditPage.clearInput(intInput);
                            expect(intInput.getAttribute('value')).toBe("");

                            chaisePage.recordEditPage.getInputErrorMessage(intInput, 'max').then(function(err) {
                                if (err) {
                                    expect(undefined).toBeDefined(colError(c.name, "Expected to clear error message after clearing maximum number."));
                                } else {
                                    expect(true).toBeDefined();
                                }
                            });

                            // Check for invalid minimum number
                            intInput.sendKeys(invalidMinNo);
                            chaisePage.recordEditPage.getInputErrorMessage(intInput, 'min').then(function(err) {
                                if (err) {
                                    expect(true).toBeDefined();
                                } else {
                                    expect(undefined).toBeDefined(colError(c.name, "Expected to show error when using minimum number."));
                                }
                            });

                            // Clear value
                            chaisePage.recordEditPage.clearInput(intInput);
                            expect(intInput.getAttribute('value')).toBe("");

                            chaisePage.recordEditPage.getInputErrorMessage(intInput, 'min').then(function(err) {
                                if (err) {
                                    expect(undefined).toBeDefined(colError(c.name, "Expected to clear error message after clearing maximum number."));
                                } else {
                                    expect(true).toBeDefined();
                                }
                            });

                            // Check for a valid number
                            intInput.sendKeys(validNo);
                            expect(intInput.getAttribute('value')).toBe(validNo);

                            chaisePage.recordEditPage.getInputErrorMessage(intInput, 'max').then(function(err) {
                                if (err) {
                                    expect(undefined).toBeDefined(colError(c.name, "Expected to not show max error on valid number."));
                                } else {
                                    expect(true).toBeDefined();
                                }
                            });

                            chaisePage.recordEditPage.getInputErrorMessage(intInput, 'min').then(function(err) {
                                if (err) {
                                    expect(undefined).toBeDefined(colError(c.name, "Expected to not show max error on valid number."));
                                } else {
                                    expect(true).toBeDefined();
                                }
                            });

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
                    it("should render input type as number with float attribute", function() {
                        floatCols.forEach(function(column) {
                            chaisePage.recordEditPage.getFloatInputForAColumn(column.name, recordIndex).then(function(floatInput) {
                                if (floatInput) {
                                    expect(true).toBeDefined();
                                    floatInput.column = column;
                                    floatDataTypeFields.push(floatInput);
                                    
                                    var value = getRecordValue(column.name);
                                    if (value != undefined) {
                                        expect(floatInput.getAttribute('value')).toBe(value, colError(column.name, "Didn't have the expected value."));
                                    }
                                } else {
                                    expect(undefined).toBeDefined();
                                }
                            });
                        });
                    });

                    it("should validate invalid text input", function() {
                        floatDataTypeFields.forEach(function(floatInput) {
                            var c = floatInput.column;
                            
                            if (c.generated || c.immutable) return;

                            var validNo = chaisePage.recordEditPage.getRandomArbitrary() + "";

                            // Clear value if it is in edit mode
                            if (tableParams.primary_keys.indexOf(c.name) != -1) {
                                floatInput.getAttribute("value").then(function(value) {
                                    validNo = value + "";
                                });
                            }
                            chaisePage.recordEditPage.clearInput(floatInput);

                            if (c.nullok == false) {
                                chaisePage.recordEditPage.submitForm();
                                chaisePage.recordEditPage.getInputErrorMessage(floatInput, 'required').then(function(err) {
                                    if(err) {
                                        expect(true).toBeDefined();
                                    } else {
                                        expect(undefined).toBeDefined(colError(c.name, "Expected to show required error."));
                                    }
                                });
                            }

                            // Invalid text value
                            var text = "1j2yu.5", actualValue = "12.5";
                            floatInput.sendKeys(text).then(function() {
                                return floatInput.getAttribute('value');
                            }).then(function(value) {
                                expect(value).toBe(actualValue);
                            }).catch(function(error) {
                                console.log('ERROR:', error);
                                expect('Something went wrong in this promise chain to check the value of an input field.').toBe('See error msg for more info.')
                            });

                            // Required Error message should disappear;
                            chaisePage.recordEditPage.getInputErrorMessage(floatInput, 'required').then(function(err) {
                                if (err) {
                                    expect(undefined).toBeDefined(colError(c.name, "Expected to not show reqyured error."));
                                } else {
                                    expect(true).toBeDefined();
                                }
                            });

                            // Clear value
                            chaisePage.recordEditPage.clearInput(floatInput);
                            expect(floatInput.getAttribute('value')).toBe("", colError(c.name, "Expected to not clear the input."));

                            //Restore the value to the original one or a valid input
                            floatInput.sendKeys(validNo);
                            expect(floatInput.getAttribute('value')).toBe(validNo, colError(c.name, "Couldn't change the value."));

                        });
                    });
                    
                    it("should input the given values.", function () {
                        floatDataTypeFields.forEach(function(inp) {
                            var c = inp.column;
                            
                            if (c.generated || c.immutable) return;
                            
                            chaisePage.recordEditPage.clearInput(inp);
                            browser.sleep(10);
                            
                            var text = getRecordInput(c.name, "1.1");
                            inp.sendKeys(text);
                            
                            expect(inp.getAttribute('value')).toEqual(text, colError(c.name, "Couldn't change the value."));
                        });
                    });
                });
            }

            if (!process.env.TRAVIS && tableParams.files.length > 0 && fileCols.length > 0) {
                describe("File fields,", function() {
                    it("should render input type as file input ", function() {
                        fileCols.forEach(function(column) {
                            exports.testFileInput(column.name, recordIndex, tableParams.files[getRecordInput(column.name, 0)], true);
                        });
                    });

                });
            }
        });
        
        // TODO it's creating one extra!!!!!
        if (Array.isArray(tableParams.inputs) && recordIndex < tableParams.inputs.length-1) {
            testMultipleRecords(recordIndex + 1);
        }
    };

    testMultipleRecords(0);

    return {
        visibleFields: visibleFields
    };

};

/**
 * column_names - array of string column_names
 * column_values - hash of column_name: column_value
 * Checks for if values are defined and set properly
 */
exports.testRecordAppValuesAfterSubmission = function(column_names, column_values) {
    chaisePage.waitForElement(element(by.id('tblRecord')));

    for (var i = 0; i < column_names.length; i++) {
        var columnName = column_names[i];
        var column = chaisePage.recordPage.getColumnValue(columnName);
        expect(column.getText()).toBe(column_values[columnName], "Value for " + columnName + " is not what was expected");
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
        var path = require('path').join(__dirname , "/../data_setup/uploaded_files/" + f.path);
        console.log(path + " deleted");
        exec('rm ' + f.path);
    });
};

/**
 * test a file input with the given column name, and file that we want to test 
 * the file input against it.
 * @param  {string}         colName         name of the column
 * @param  {int}            recordIndex     index of record in the view
 * @param  {obj}            file            object with at least path, and name attributes.
 * @param  {string=}        currentValue    if you want to test the current value.   
 * @param  {boolean=false}  print           should it print the file names or not.
 */
exports.testFileInput = function (colName, recordIndex, file, currentValue, print) {
    chaisePage.recordEditPage.getInputForAColumn(colName, recordIndex).then(function(fileInput) {
        print = typeof print !== "boolean" ? false : print;
        
        if (fileInput) {
            chaisePage.recordEditPage.getInputForAColumn("txt" + colName, recordIndex).then(function(txtInput) {

                var selectFile = function() {
                    var filePath = require('path').join(__dirname , "/../data_setup/uploaded_files/" + file.path);
                    
                    fileInput.sendKeys(filePath);

                    browser.sleep(100);

                    expect(fileInput.getAttribute('value')).toContain(file.name, "didn't select the correct file.");
                    expect(txtInput.getAttribute('value')).toBe(file.name, "didn't show the correct file name after selection.");
                };

                txtInput.getAttribute('value').then(function(value) {
                    // Incase of edit first clear the fileinput field by pressing the dismiss button
                    // and then set new file
                    if (value.trim().length > 0) {

                        chaisePage.recordEditPage.getClearButton(txtInput).then(function(clearButton) {
                            clearButton.click();

                            browser.sleep(50);

                            expect(txtInput.getAttribute('value')).toBe("", "couldn't clear the button.");

                            selectFile();
                        });
                    } else {
                        selectFile();
                    }
                });

            });

        } else {
            expect(undefined).toBeDefined("Unable to find file input field for column " + colName);
        }
    });
};
