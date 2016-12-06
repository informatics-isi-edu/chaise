var chaisePage = require('../../utils/chaise.page.js'),
IGNORE = "tag:isrd.isi.edu,2016:ignore",
HIDDEN = "tag:misd.isi.edu,2015:hidden",
IMMUTABLE = "tag:isrd.isi.edu,2016:immutable",
GENERATED = "tag:isrd.isi.edu,2016:generated";
var chance = require('chance').Chance();
var moment = require('moment');

exports.testPresentationAndBasicValidation = function(tableParams) {

    var visibleFields = [], table;

    beforeAll(function() {
    	table = browser.params.defaultSchema.content.tables[tableParams.table_name];
    });

	if (tableParams.keys) {
		it("should have edit record title", function() {
            var EC = protractor.ExpectedConditions;

            browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getFormTitle()), 5000);

			chaisePage.recordEditPage.getEntityTitle().then(function(txt) {
				expect(txt).toBe("Edit " + tableParams.edit_entity_displayname + " Records");
			});
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

            browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getFormTitle()), 5000);

			chaisePage.recordEditPage.getEntityTitle().then(function(txt) {
				expect(txt).toBe("Create " + chaisePage.dataUtils.editInputs.getDisplayName(table, 'table_name', false) + " Records");
			});
		});

		it("should allow to add new rows/columns", function() {
			chaisePage.recordEditPage.getAddRowButton().then(function(button) {
				if (!button) expect("Add button invisible").toBe("Add Button should be visible");
				else expect(true).toBeDefined();
			});
		});
	}

	it("should render columns which don't have ignore or hidden annotation", function() {
		var columns = chaisePage.dataUtils.editInputs.getVisibleColumns(table, [IGNORE, HIDDEN]);
		chaisePage.recordEditPage.getAllColumnCaptions().then(function(pageColumns) {
			expect(pageColumns.length).toBe(columns.length);
			pageColumns.forEach(function(c) {
				c.getInnerHtml().then(function(txt) {
					txt = txt.trim();
					var col = columns.find(function(cl) { return txt == cl.displayName });
					expect(col).toBeDefined();
					c.column = col;
					visibleFields.push(c);
				});
			});
		});
	});

	it("should show line under columns which have a comment", function() {
		var columns = chaisePage.dataUtils.editInputs.getColumnsWithComment(table, [IGNORE, HIDDEN]);
		console.log("\n        Required Fields");
		chaisePage.recordEditPage.getColumnsWithUnderline().then(function(pageColumns) {
			expect(pageColumns.length).toBe(columns.length);
			pageColumns.forEach(function(c) {
				c.getText().then(function(txt) {
					txt = txt.trim();
					var col = columns.find(function(cl) { return txt == cl.displayName });
					expect(txt).toBe(col ? col.displayName : " should not have underline");
					if (col) {
						chaisePage.recordEditPage.getColumnComment(c).then(function(comment) {
							var exists = comment ? true : undefined;
							expect(exists).toBeDefined();
							expect(comment.getInnerHtml()).toBe(col.comment);
						});
					}
				});
			});
		});
	});

	it("should show red asterisk (*) before for fields which are required", function() {
		var columns = chaisePage.dataUtils.editInputs.getColumnsWithRequired(table, [IGNORE, HIDDEN]);
		columns.forEach(function(c) {
            var el = visibleFields.find(function(v) { return v.column.name == c.name });
			chaisePage.recordEditPage.getColumnWithAsterisk(el).then(function(el) {
				console.log("         ->" + c.name);
				if (el) expect(true).toBeDefined();
				else expect(undefined).toBe("Asterisk");
			});
		});
	});

	var testMultipleRecords = function(recordIndex) {

		var title = tableParams.records ? "Record " + (recordIndex + 1) : "Editing";

		describe(title + ",",function() {

			if (recordIndex > 0) {
				it("should click add record button", function() {
					chaisePage.recordEditPage.getAddRowButton().then(function(button) {
						chaisePage.clickButton(button);
						browser.sleep(2000);
					});
				});
			};

			var longTextDataTypeFields = [], textDataTypeFields = [], booleanDataTypeFields = [], foreignKeyFields = [], datePickerFields = [], integerDataTypeFields = [], floatDataTypeFields = [];

            it("should show columns with generated or immutable annotations as disabled", function() {
                var visibleCols = chaisePage.dataUtils.editInputs.getVisibleColumns(table, [IGNORE, HIDDEN]);
                var disabledCols = chaisePage.dataUtils.editInputs.getDisabledColumns(visibleCols, [IMMUTABLE, GENERATED]);

                // Sample results stucture:
                // disableCols = {
                //     "tag:isrd.isi.edu,2016:immutable": [col1, col2],
                //     "tag:isrd.isi.edu,2016:generated": [col3, col4]
                // }

                for (var annotationKey in disabledCols) {
                    disabledCols[annotationKey].forEach(function(column) {
                        if (column.type.typename == 'timestamp' || column.type.typename == 'timestamptz') {
                            var timeInputs = chaisePage.recordEditPage.getTimestampInputsForAColumn(column.name, recordIndex);
                            var dateInput = timeInputs.date, timeInput = timeInputs.time, meridiemInput = timeInputs.meridiem;
                            expect(dateInput.isEnabled()).toBe(false);
                            expect(timeInput.isEnabled()).toBe(false);
                            expect(meridiemInput.isEnabled()).toBe(false);
                        } else {
                            chaisePage.recordEditPage.getInputForAColumn(column.name, recordIndex).then(function(input) {
                                expect(input.isEnabled()).toBe(false);
                                if (!tableParams.keys) {
                                    expect(input.getAttribute('placeholder')).toBe('Automatically generated');
                                }
                            }).catch(function(e) {
                                console.log(e);
                            });
                        }
                    });
                }
            });

			it("should show textarea input for longtext datatype and then set the value", function() {
				var columns = chaisePage.dataUtils.editInputs.getLongTextDataTypeColumns(table, [IGNORE, HIDDEN]);
				columns.forEach(function(c) {
					chaisePage.recordEditPage.getTextAreaForAcolumn(c.name, recordIndex).then(function(txtArea) {
						if (txtArea) {
							expect(true).toBeDefined();
							longTextDataTypeFields.push(txtArea);

                            if (c.type.typename === 'markdown') {
                                chaisePage.recordEditPage.getHelpTextBlock(txtArea).then(function(text) {
                                    expect(text).toBeDefined();
                                }).catch(function(error) {
                                    console.log(error);
                                });
                            }

							if (c._value != undefined) {
								expect(txtArea.getAttribute('value')).toBe(c._value);
							}

							chaisePage.recordEditPage.clearInput(txtArea);
							browser.sleep(10);

							txtArea.column = c;
							var text = chance.paragraph();
							c._value = text;
							txtArea.sendKeys(text);

							expect(txtArea.getAttribute('value')).toBeDefined(text);
						} else {
							expect(undefined).toBeDefined();
						}
					});
				});
			});

			it("should show text input for shorttext and text datatype", function() {
				var columns = chaisePage.dataUtils.editInputs.getTextDataTypeColumns(table, [IGNORE, HIDDEN]);
				columns.forEach(function(c) {
					chaisePage.recordEditPage.getInputForAColumn(c.name, recordIndex).then(function(txtInput) {
						if (txtInput) {
							expect(true).toBeDefined();
							textDataTypeFields.push(txtInput);
							txtInput.column = c;

							if (c._value != undefined) {
								expect(txtInput.getAttribute('value')).toBe(c._value);
							}

							chaisePage.recordEditPage.clearInput(txtInput);
							browser.sleep(10);

							var text = (chaisePage.dataUtils.editInputs.isUrl(c)) ? chance.url() : chance.sentence({ words: 5 });
							c._value = text;
							txtInput.sendKeys(text);

							expect(txtInput.getAttribute('value')).toBeDefined(text);
						} else {
							expect(undefined).toBeDefined();
						}
					});
				});
			});

			describe("Boolean fields,", function() {

				var pageColumns = [], columns = [], dropdowns = [];

				beforeAll(function() {
					columns = chaisePage.dataUtils.editInputs.getBooleanDataTypeColumns(table, [IGNORE, HIDDEN]);

					chaisePage.recordEditPage.getAllColumnCaptions().then(function(pcs) {
						pcs.forEach(function(pc) {
							pc.getInnerHtml().then(function(txt) {
								txt = txt.trim();
								var col = columns.find(function(cl) { return txt == cl.displayName });
								if (col) {
									pc.column = col;
									pageColumns.push(pc);
								}
							});
						});
					});
				});


				it("should show a dropdown", function() {
					console.log("\n        Boolean Fields");
					pageColumns.forEach(function(pc) {
						chaisePage.recordEditPage.getDropdown(pc, recordIndex).then(function(dropdown) {
							console.log("         ->" + pc.column.name);
							if (dropdown) {
								expect(true).toBeDefined();
								dropdown.column = pc.column;

								if (dropdown.column._value != undefined) {
									expect(chaisePage.recordEditPage.getDropdownText(dropdown)).toBe(dropdown.column._value.length == 0 ? 'Select a value' : (dropdown.column._value + ""));
								}

								dropdowns.push(dropdown);
								booleanDataTypeFields.push(dropdown);
							} else {
								expect(undefined).toBeDefined();
							}
						});
					});
				});

				it("should render 3 options for a boolean field if nullok is true else 2", function() {
					dropdowns.forEach(function(dropdown) {
						browser.executeScript("return $(arguments[0]).data().$scope.$select.items", dropdown).then(function(items) {
							if (dropdown.column.nullok == true) {
								expect(items.length).toBe(3);
							} else {
								expect(items.length).toBe(2);
							}
						});
					});
				});

				it("should select an option (true, false, none)", function() {
					dropdowns.forEach(function(dropdown) {
						var value = chance.bool();
						/*if (dropdown.column.nullok == true) {
							if (chance.bool()) value = "";
						} */
						dropdown.column._value = value;
						chaisePage.recordEditPage.selectDropdownValue(dropdown, value).then(function() {
							browser.sleep(10);
							expect(chaisePage.recordEditPage.getDropdownText(dropdown)).toBe(value.length == 0 ? 'Select a value' : (value + ""));
						});
					});
				});

			});

			describe("Foreign key fields,", function() {

				var pageColumns = [], columns = [], dropdowns = [];

				beforeAll(function() {
					columns = chaisePage.dataUtils.editInputs.getForeignKeyColumns(table, [IGNORE, HIDDEN]);

					chaisePage.recordEditPage.getAllColumnCaptions().then(function(pcs) {
						pcs.forEach(function(pc) {
							pc.getInnerHtml().then(function(txt) {
								txt = txt.trim();
								var col = columns.find(function(cl) { return txt == cl.displayName });
								if (col) {
									pc.column = col;
									pageColumns.push(pc);
								}
							});
						});
					});
				});

                it('should show an uneditable field for each foreign key column', function() {
                    var expectedNumOfPopupFields = columns.length * (recordIndex + 1);
                    var popupFields = element.all(by.css('.popup-select-value'));
                    expect(popupFields.count()).toBe(expectedNumOfPopupFields);
                    // Ensure each field is an uneditable div element (not an input)
                    popupFields.map(function(field) {
                        expect(field.getTagName()).toBe('div');
                        expect(field.getAttribute('contenteditable')).toBe('false');
                    });
                });

                // in the edit case
                if (!tableParams.records) {

                    it("clicking the 'x' should remove the value in the foreign key field.", function () {
                        var foreignKeyInput = chaisePage.recordEditPage.getForeignKeyInputValue(columns[0].displayName, recordIndex);
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
                            browser.wait(EC.visibilityOf(modalClose), 5000);
                            return modalClose.click();
                        }).then(function() {
                            var foreignKeyInput = chaisePage.recordEditPage.getForeignKeyInputValue(columns[0].displayName, recordIndex);
                            expect(foreignKeyInput.getAttribute("value")).toBe('');
                        });
                    });
				}

                it("should open a modal search and select a foreign key value.", function () {

                    chaisePage.recordEditPage.getModalPopupBtnsUsingScript().then(function(popupBtns) {
                    	var modalTitle = chaisePage.recordEditPage.getModalTitle(),
                        	EC = protractor.ExpectedConditions;

                    	expect(popupBtns.length).toBe(columns.length * (recordIndex + 1));

	                    for (var i=0; i<columns.length; i++) {
	                        (function(i) {
	                            var rows;
	                            chaisePage.clickButton(popupBtns[(columns.length * recordIndex) + i ]).then(function() {
	                                // wait for the modal to open
	                                browser.wait(EC.visibilityOf(modalTitle), 5000);

	                                return modalTitle.getText();
	                            }).then(function(text) {
	                                // make sure modal opened
	                                expect(text.indexOf("Choose")).toBeGreaterThan(-1);

	                                rows = chaisePage.recordsetPage.getRows();
	                                // count is needed for clicking a random row
	                                return rows.count();
	                            }).then(function(ct) {
	                                expect(ct).toBeGreaterThan(0);

	                                var index = Math.floor(Math.random() * ct);
	                                return rows.get(index).click();
	                            }).then(function() {
	                                browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getFormTitle()), 5000);

	                                var foreignKeyInput = chaisePage.recordEditPage.getForeignKeyInputValue(columns[i].displayName, recordIndex);
	                                expect(foreignKeyInput.getAttribute("value")).toBeDefined();
	                            });
	                        })(i);
	                    }
                    });

                });

				it("should have a `create new` button that opens a new tab", function(){
                    var handles;
					var createBtns = chaisePage.recordEditPage.getCreateBtns();
					expect(createBtns.count()).toBe(columns.length * (recordIndex + 1));
                    var fkc = columns[0];
                    browser.executeScript('arguments[0].click();', createBtns.get(recordIndex)).then(function(){
                        return browser.getAllWindowHandles();
                    }).then(function(h){
                        handles = h;
                        return browser.switchTo().window(handles[1]);
                    }).then(function(){
                        return browser.getCurrentUrl();
                    }).then(function(currentUrl) {
                        var url = '/recordedit/#' + browser.params.catalogId + "/" + fkc.referencedColumn.schema_name + ":" + fkc.referencedColumn.table_name;
                        expect(currentUrl.indexOf(url)).toBeGreaterThan(-1);
                        return browser.close();
                    }).then(function() {
                        browser.switchTo().window(handles[0]);
                    });
				});
			});

			describe("Date fields,", function() {
                it('should show input fields and validate for date columns', function() {
                    var columns = chaisePage.dataUtils.editInputs.getDateTypeColumns(table, [IGNORE, HIDDEN]);
                    columns.forEach(function(column) {
                        var dateInput = chaisePage.recordEditPage.getInputValue(column.name, recordIndex);
                        datePickerFields.push(dateInput);
                        if (column._value != undefined) {
							expect(dateInput.getAttribute('value')).toBe(column._value);
						}

                        chaisePage.recordEditPage.clearInput(dateInput);

                        dateInput.sendKeys('1234-13-31');
                        expect(dateInput.getAttribute('value')).toBeFalsy();

                        chaisePage.recordEditPage.clearInput(dateInput);

                        dateInput.sendKeys('2016-01-01');
                        expect(dateInput.getAttribute('value')).toEqual('2016-01-01');
                    });
                });

                it('\"Today\" button should enter the current date into the input', function() {
                    var today = moment().format('YYYY-MM-DD');
                    datePickerFields.forEach(function(dp) {
                        var todayBtn = dp.all(by.css('.input-group-btn > button'))[0];
                        todayBtn.click();
                        expect(dp.getAttribute('value')).toEqual(today);
                    });
                });

                it('\"Clear\" button clear the date input respectively', function() {
                    datePickerFields.forEach(function(dp) {
                        var clearBtn = dp.all(by.css('.input-group-btn > button'))[1];
                        expect(dp.getAttribute('value')).toBeFalsy();
                    });
                });

				xit("should have a datepicker element", function() {
					console.log("\n        Date/Timestamptz fields");
					var columns = chaisePage.dataUtils.editInputs.getDateTypeColumns(table, [IGNORE, HIDDEN]);
					columns.forEach(function(column) {
						chaisePage.recordEditPage.getInputValue(column.name, recordIndex).then(function(dateInput) {
							console.log("         ->" + column.name);
							if (dateInput) {
								expect(true).toBeDefined();
								dateInput.column = column;
								datePickerFields.push(dateInput);

								if (column._value != undefined) {
									expect(dateInput.getAttribute('value')).toBe(column._value);
								}
							} else {
								expect(undefined).toBeDefined();
							}
						});
					});
				}).pend('Postpone test until a datepicker is re-implemented');

				it("should render open datepicker on click", function() {
					datePickerFields.forEach(function(dp) {
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
						chaisePage.clickButton(dateInput);
						browser.sleep(10);
						chaisePage.recordEditPage.getDayButtonsForDatePicker(dateInput.datePicker).then(function(dayBtns) {
							var day = chaisePage.recordEditPage.getRandomInt(1, dayBtns.length);
							console.log(dayBtns.length);
							dayBtns[day-1].click();

							var month = ((new Date()).getMonth() + 1);
							month = (month < 10) ? "0" + month : month;
							day = (day < 10) ? "0" + day : day;

							var date = (new Date()).getFullYear() + "-" + month + "-"  + day;
							expect(dateInput.getAttribute('value')).toBe(date);

							dateInput.column._value = date;

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

            describe("Timestamp fields,", function() {
                var timeInputFields = [];
                var columns;
                // beforeAll(function() {
                //     jasmine.DEFAULT_TIMEOUT_INTERVAL = 3600000;
                // });
                it('should have 3 inputs with validation for each timestamp column', function() {
                    columns = chaisePage.dataUtils.editInputs.getTimestampTypeColumns(table, [IGNORE, HIDDEN]);
                    columns.forEach(function(column) {
                        var timeInputs = chaisePage.recordEditPage.getTimestampInputsForAColumn(column.name, recordIndex);
                        var dateInput = timeInputs.date, timeInput = timeInputs.time, meridiemInput = timeInputs.meridiem;

                        expect(dateInput).toBeDefined();
                        expect(timeInput).toBeDefined();
                        expect(meridiemInput).toBeDefined();

                        // Test time input validation; date input tested in earlier describe block
                        var defaultTimeValue = '12:00:00';
                        timeInput.clear();
                        timeInput.sendKeys(chance.word());
                        expect(timeInput.getAttribute('value')).toEqual(defaultTimeValue);

                        timeInputFields.push({
                            date: dateInput,
                            time: timeInput,
                            meridiem: meridiemInput,
                            column: column
                        });
                    });
                });

                it('should clear the input after clicking the \"Clear\" button', function() {
                    timeInputFields.forEach(function(obj) {
                        var clearBtn = element.all(by.css('button[name="' + obj.column.name + '"]')).get(2);
                        clearBtn.click();
                        expect(obj.date.getAttribute('value')).toBeFalsy();
                        expect(obj.time.getAttribute('value')).toBeFalsy();
                        expect(obj.meridiem.getText()).toEqual('AM');
                    });
                });

                it('should have the current time after clicking the \"Now\" button', function() {
                    timeInputFields.forEach(function(obj) {
                        var nowBtn = element.all(by.css('button[name="' + obj.column.name + '"]')).get(1);
                        var UIdate, date = moment().format('YYYY-MM-DD');
                        var UItime, time = moment().format('x'); // in milliseconds
                        var timeDelta = 60 * 1000; // 1 minute, in milliseconds
                        var startTime = time - timeDelta, endTime = time + timeDelta;
                        var meridiem = moment().format('A');

                        nowBtn.click();
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
            });

			describe("Integer fields,", function() {
				it("should render input type as number with integer attribute", function() {
					console.log("\n       Integer Fields");
					var columns = chaisePage.dataUtils.editInputs.getIntegerDataTypeColumns(table, [IGNORE, HIDDEN]);
					columns.forEach(function(column) {
						chaisePage.recordEditPage.getIntegerInputForAColumn(column.name, recordIndex).then(function(intInput) {
							console.log("         ->" + column.name);
							if (intInput) {
								expect(true).toBeDefined();
								intInput.column = column;
								integerDataTypeFields.push(intInput);

								if (column._value != undefined) {
									expect(intInput.getAttribute('value')).toBe(column._value);
								}

							} else {
								expect(undefined).toBeDefined();
							}
						});
					});
				});

				it("should validate required and invalid text input", function() {
					integerDataTypeFields.forEach(function(intInput) {

						var prevValue = "";

						// Clear value if it is in edit mode
						if (chaisePage.dataUtils.editInputs.isKey(intInput.column.name, tableParams.keys)) {
							el.getAttribute(value).then(function(value) {
								prevValue = value + "";
							});
						}
						chaisePage.recordEditPage.clearInput(intInput);

						if (!intInput.column.nullok && !chaisePage.dataUtils.editInputs.isDisabled(intInput.column, [IMMUTABLE, GENERATED])) {
							chaisePage.recordEditPage.submitForm();
							chaisePage.recordEditPage.getInputErrorMessage(intInput, 'required').then(function(err) {
								if(err) {
									expect(true).toBeDefined();
								} else {
									expect(undefined).toBe("Integer input " + intInput.column.name + " Required Error message to be displayed");
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
								expect(undefined).toBe("Integer input " + intInput.column.name + " Required Error message to be hidden");
							} else {
								expect(true).toBeDefined();
							}
						});

						// Clear value
						chaisePage.recordEditPage.clearInput(intInput);
						expect(intInput.getAttribute('value')).toBe("");

						//Restore the value to the original one
						if (chaisePage.dataUtils.editInputs.isKey(intInput.column.name, tableParams.keys)) {
							intInput.sendKeys(prevValue);
						}
					});
				});

				it("should validate int8(-9223372036854776000 < value < 9223372036854776000), int4(-2147483648 < value < 2147483647) and int2(-32768 < value < 32767) with range values", function() {

					integerDataTypeFields.forEach(function(intInput) {
						var min = -9223372036854776000, max = 9223372036854776000, invalidMaxNo = "2343243243242414423243242353253253253252352", invalidMinNo = "-2343243243242414423243242353253253253252352";
						if (intInput.column.type.typename == 'int2') {
							min = -32768, max = 32767, invalidMaxNo = "8375832757832", invalidMinNo = "-237587565";
						} else if (intInput.column.type.typename == 'int4') {
							min = -2147483648, max = 2147483647, invalidMaxNo = "3827374576453", invalidMinNo = "-326745374576375";
						}

						var validNo = chaisePage.recordEditPage.getRandomInt(min, max) + "", invalidMaxNo = "2343243243242414423243242353253253253252352", invalidMinNo = "-2343243243242414423243242353253253253252352";

						// Store original value to reset it for avoiding any conflicts or referece issues due to unique or foreign key issue
						if (chaisePage.dataUtils.editInputs.isKey(intInput.column.name, tableParams.keys)) {
							el.getAttribute(value).then(function(value) {
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
								expect(undefined).toBe("Integer input " + intInput.column.name + " Max Error message to be displayed");
							}
						});


						// Clear value
						chaisePage.recordEditPage.clearInput(intInput);
						expect(intInput.getAttribute('value')).toBe("");

						chaisePage.recordEditPage.getInputErrorMessage(intInput, 'max').then(function(err) {
							if (err) {
								expect(undefined).toBe("Integer input " + intInput.column.name + " Max Error message to be hidden");
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
								expect(undefined).toBe("Integer input " + intInput.column.name + " Min Error message to be displayed");
							}
						});

						// Clear value
						chaisePage.recordEditPage.clearInput(intInput);
						expect(intInput.getAttribute('value')).toBe("");

						chaisePage.recordEditPage.getInputErrorMessage(intInput, 'min').then(function(err) {
							if (err) {
								expect(undefined).toBe("Integer input " + intInput.column.name + " Min Error message to be hidden");
							} else {
								expect(true).toBeDefined();
							}
						});

						// Check for a valid number
						intInput.sendKeys(validNo);
						expect(intInput.getAttribute('value')).toBe(validNo);

						intInput.column._value = validNo;

						chaisePage.recordEditPage.getInputErrorMessage(intInput, 'max').then(function(err) {
							if (err) {
								expect(undefined).toBe("Integer input " + intInput.column.name + " Max Error message to be hidden");
							} else {
								expect(true).toBeDefined();
							}
						});

						chaisePage.recordEditPage.getInputErrorMessage(intInput, 'min').then(function(err) {
							if (err) {
								expect(undefined).toBe("Integer input " + intInput.column.name + " Min Error message to be hidden");
							} else {
								expect(true).toBeDefined();
							}
						});

					});

				});

			});

			describe("Float fields,", function() {

				it("should render input type as number with float attribute", function() {
					console.log("\n       Float Fields");
					var columns = chaisePage.dataUtils.editInputs.getFloatDataTypeColumns(table, [IGNORE, HIDDEN]);
					columns.forEach(function(column) {
						chaisePage.recordEditPage.getFloatInputForAColumn(column.name, recordIndex).then(function(floatInput) {
							console.log("         ->" + column.name);
							if (floatInput) {
								expect(true).toBeDefined();
								floatInput.column = column;
								floatDataTypeFields.push(floatInput);
								if (column._value != undefined) {
									expect(floatInput.getAttribute('value')).toBe(column._value);
								}
							} else {
								expect(undefined).toBeDefined();
							}
						});
					});
				});

				it("should validate invalid text input", function() {
					floatDataTypeFields.forEach(function(floatInput) {

						var validNo = chaisePage.recordEditPage.getRandomArbitrary() + "";

						// Clear value if it is in edit mode
						if (chaisePage.dataUtils.editInputs.isKey(floatInput.column.name, tableParams.keys)) {
							el.getAttribute(value).then(function(value) {
								validNo = value + "";
							});
						}
						chaisePage.recordEditPage.clearInput(floatInput);

						if (!floatInput.column.nullok) {
							chaisePage.recordEditPage.submitForm();
							chaisePage.recordEditPage.getInputErrorMessage(floatInput, 'required').then(function(err) {
								if(err) {
									expect(true).toBeDefined();
								} else {
									expect(undefined).toBe("Float input " + floatInput.column.name + " Required Error message to be displayed");
								}
							});
						}

						// Invalid text value
						var text = "1j2yu.5", actualValue = "12.5";
						floatInput.sendKeys(text);
						expect(floatInput.getAttribute('value')).toBe(actualValue);

						// Required Error message should disappear;
						chaisePage.recordEditPage.getInputErrorMessage(floatInput, 'required').then(function(err) {
							if (err) {
								expect(undefined).toBe("Float input " + floatInput.column.name + " Required Error message to be hidden");
							} else {
								expect(true).toBeDefined();
							}
						});

						// Clear value
						chaisePage.recordEditPage.clearInput(floatInput);
						expect(floatInput.getAttribute('value')).toBe("");

						//Restore the value to the original one or a valid input
						floatInput.sendKeys(validNo);
						expect(floatInput.getAttribute('value')).toBe(validNo);

						floatInput.column._value = validNo;

					});
				});

			});

		});

		if (tableParams.records && recordIndex < (tableParams.records > 1 ? tableParams.records : 0)) {
			testMultipleRecords(recordIndex + 1);
		}
	};

	testMultipleRecords(0);

	return {
		visibleFields: visibleFields,
   	    table: table
	};

};
