var chaisePage = require('../chaise.page.js'), IGNORE = "tag:isrd.isi.edu,2016:ignore", HIDDEN = "tag:misd.isi.edu,2015:hidden";
var chance = require('chance').Chance();

exports.testPresentationAndBasicValidation = function(tableParams) {

    var visibleFields = [], table;

    beforeAll(function() {
    	table = browser.params.defaultSchema.content.tables[tableParams.table_name];
    });

	if (tableParams.keys) {
		it("should have edit record title", function() {
			chaisePage.recordEditPage.getEntityTitle().then(function(txt) {
				expect(txt).toBe("Edit " + chaisePage.dataUtils.editInputs.getDisplayName(table, 'table_name', false) + " Record");
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

	it("should show red asterick (*) before for fields which are required", function() {
		var columns = chaisePage.dataUtils.editInputs.getColumnsWithRequired(table, [IGNORE, HIDDEN]);
		columns.forEach(function(c) {
			var el = visibleFields.find(function(v) { return v.column.name == c.name });
			chaisePage.recordEditPage.getColumnWithAsterick(el).then(function(el) {
				console.log("         ->" + c.name);
				if (el) expect(true).toBeDefined();
				else expect(undefined).toBe("Asterick");
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

			it("should show columns with serial(*) datatype as disabled", function() {
				var columns = chaisePage.dataUtils.editInputs.getSerialDataTypeColumns(table, [IGNORE, HIDDEN]);
				chaisePage.recordEditPage.getAllColumnCaptions().then(function(pageColumns) {
					pageColumns.forEach(function(c) {
						c.getText().then(function(txt) {
							txt = txt.trim();
							var col = columns.find(function(cl) { return txt == cl.displayName });
							if (col) {
								chaisePage.recordEditPage.getInputForAPageColumn(c, recordIndex).then(function(i) {
									expect(i.isEnabled()).toBe(false);
									if (!tableParams.keys) {
										expect(i.getAttribute('value')).toBe('To be set by system');
									}
								});
							}
						});
					});
				});
			});

			it("should show textarea input for longtext datatype and then set the value", function() {
				var columns = chaisePage.dataUtils.editInputs.getLongTextDataTypeColumns(table, [IGNORE, HIDDEN]);
				columns.forEach(function(c) {
					chaisePage.recordEditPage.getTextAreaForAcolumn(c.name, recordIndex).then(function(txtArea) {
						if (txtArea) {
							expect(true).toBeDefined();
							longTextDataTypeFields.push(txtArea);

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

				it("should show a dropdown", function() {
					console.log("\n        Foreign Key Fields");
					pageColumns.forEach(function(pc) {
						chaisePage.recordEditPage.getDropdown(pc, recordIndex).then(function(dropdown) {
							console.log("         ->" + pc.column.name);
							if (dropdown) {
								expect(true).toBeDefined();
								dropdown.column = pc.column;
								dropdowns.push(dropdown);

								if (dropdown.column._value != undefined) {
									expect(chaisePage.recordEditPage.getDropdownText(dropdown)).toBe(dropdown.column._value);
								}

								foreignKeyFields.push(dropdown);
							} else {
								expect(undefined).toBeDefined();
							}
						});
					});
				});

				if (tableParams.records) {

					it("should select any random option", function() {
						dropdowns.forEach(function(dropdown) {
							chaisePage.recordEditPage.selectDropdownValue(dropdown).then(function(value) {
								chaisePage.recordEditPage.getDropdownText(dropdown).then(function(value) {
									dropdown.column._value = value;
									expect(value.length ? true : false).toBe(true);
								});
							});
						});
					});
				}

			});

			describe("Date and timestamptz fields,", function() {
				
				it("should have a datepicker element", function() {
					console.log("\n        Date/Timestamptz fields");
					var columns = chaisePage.dataUtils.editInputs.getDateTypeColumns(table, [IGNORE, HIDDEN]);
					columns.forEach(function(column) {
						chaisePage.recordEditPage.getDateInputForAColumn(column.name, recordIndex).then(function(dateInput) {
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
				});

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
				});

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

						if (!intInput.column.nullok) {
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