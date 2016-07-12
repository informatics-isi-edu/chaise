var chaisePage = require('../../chaise.page.js'), IGNORE = "tag:isrd.isi.edu,2016:ignore", HIDDEN = "tag:misd.isi.edu,2015:hidden";

describe('Add a new record,', function() {  

    var table;
    var visibleFields = [], longTextDataTypeFields = [], booleanDataTypeFields = [], foreignKeyFields = [], datePickerFields = [];
    var integerDataTypeFields = [], floatDataTypeFields = [];

	beforeAll(function () {
		browser.ignoreSyncronization = true;
		browser.get(browser.params.url || "");
		table = browser.params.defaultTable;
        browser.sleep(2000);
        browser.executeScript("chaiseConfig.editRecord = true;");
        browser.executeScript("$('.modal').remove();$('.modal-backdrop').remove();$('body').removeClass('modal-open')");
    });

	it("should have create record title", function() {
		chaisePage.recordEditPage.getEntityTitle().then(function(txt) {
			expect(txt).toBe("Create " + chaisePage.dataUtils.editInputs.getDisplayName(table, 'table_name', true) + " Records");
		});
	});

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
		console.log("\n    Required Fields");
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
				console.log("     ->" + c.name);
				if (el) expect(true).toBeDefined();
				else expect(undefined).toBe("Asterick");
			});
		});
	});

	it("should show columns with serial(*) datatype as disabled", function() {
		var columns = chaisePage.dataUtils.editInputs.getSerialDataTypeColumns(table, [IGNORE, HIDDEN]);
		chaisePage.recordEditPage.getAllColumnCaptions().then(function(pageColumns) {
			pageColumns.forEach(function(c) {
				c.getText().then(function(txt) {
					txt = txt.trim();
					var col = columns.find(function(cl) { return txt == cl.displayName });
					if (col) {
						chaisePage.recordEditPage.getInputForAColumn(c).then(function(i) {
							expect(i.isEnabled()).toBe(false);
							expect(i.getAttribute('value')).toBe('To be set by system');
						});
					}
				});
			});
		});
	});


	it("should show textarea input for longtext datatype", function() {
		var columns = chaisePage.dataUtils.editInputs.getLongTextDataTypeColumns(table, [IGNORE, HIDDEN]);
		columns.forEach(function(c) {
			chaisePage.recordEditPage.getTextareForAcolumn(c.name).then(function(txtArea) {
				if (txtArea) {
					expect(true).toBeDefined();
					longTextDataTypeFields.push(txtArea);
					txtArea.column = c;
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
			console.log("\n    Boolean Fields");
			pageColumns.forEach(function(pc) {
				chaisePage.recordEditPage.getDropdown(pc).then(function(dropdown) {
					console.log("     ->" + pc.column.name);
					if (dropdown) {
						expect(true).toBeDefined();
						dropdown.column = pc.column;
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
			console.log("\n    Foreign Key Fields");
			pageColumns.forEach(function(pc) {
				chaisePage.recordEditPage.getDropdown(pc).then(function(dropdown) {
					console.log("     ->" + pc.column.name);
					if (dropdown) {
						expect(true).toBeDefined();
						dropdown.column = pc.column;
						dropdowns.push(dropdown);
						foreignKeyFields.push(dropdown);
					} else {
						expect(undefined).toBeDefined();
					}
				});
			});
		});

	});

	describe("Date and timestamptz fields,", function() {
		
		it("should have a datepicker element", function() {
			console.log("\n    Date/Timestamptz fields");
			var columns = chaisePage.dataUtils.editInputs.getDateTypeColumns(table, [IGNORE, HIDDEN]);
			columns.forEach(function(column) {
				chaisePage.recordEditPage.getDateInputForAColumn(column.name).then(function(dateInput) {
					console.log("     ->" + column.name);
					if (dateInput) {
						expect(true).toBeDefined();
						dateInput.column = column;
						datePickerFields.push(dateInput);
					} else {
						expect(undefined).toBeDefined();
					}
				});
			});
		});

		it("should render open datepicker on click ", function() {
			datePickerFields.forEach(function(dp) {
				dp.click();
				browser.sleep(100);
				chaisePage.recordEditPage.getDatePicker(dp).then(function(datePicker) {
					if (datePicker) {
						expect(true).toBeDefined();
					} else {
						expect(undefined).toBeDefined();
					}
					dp.datepicker = datePicker;
				});
			});
		});

	});

	describe("Integer fields,", function() {
		
		it("should render input type as number with integer attribute", function() {
			console.log("\n   Integer Fields");
			var columns = chaisePage.dataUtils.editInputs.getIntegerDataTypeColumns(table, [IGNORE, HIDDEN]);
			columns.forEach(function(column) {
				chaisePage.recordEditPage.getIntegerInputForAColumn(column.name).then(function(intInput) {
					console.log("     ->" + column.name);
					if (intInput) {
						expect(true).toBeDefined();
						intInput.column = column;
						integerDataTypeFields.push(intInput);
					} else {
						expect(undefined).toBeDefined();
					}
				});
			});
		});

		it("should validate required and invalid text input", function() {
			integerDataTypeFields.forEach(function(intInput) {
				
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
				
				// Error message should disappear;
				if (!intInput.column.nullok) {
					chaisePage.recordEditPage.getInputErrorMessage(intInput, 'required').then(function(err) {
						if (err) {
							expect(undefined).toBe("Integer input " + intInput.column.name + " Required Error message to be hidden");
						} else {
							expect(true).toBeDefined();
						}
					});
				}

				// Clear value
				intInput.sendKeys(Array(actualValue.length + 1).join(protractor.Key.BACK_SPACE));
				expect(intInput.getAttribute('value')).toBe("");
				
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
				intInput.sendKeys(Array(invalidMaxNo.length + 1).join(protractor.Key.BACK_SPACE));
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
				intInput.sendKeys(Array(invalidMinNo.length + 1).join(protractor.Key.BACK_SPACE));
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
			console.log("\n   Float Fields");
			var columns = chaisePage.dataUtils.editInputs.getFloatDataTypeColumns(table, [IGNORE, HIDDEN]);
			columns.forEach(function(column) {
				chaisePage.recordEditPage.getFloatInputForAColumn(column.name).then(function(floatInput) {
					console.log("     ->" + column.name);
					if (floatInput) {
						expect(true).toBeDefined();
						floatInput.column = column;
						floatDataTypeFields.push(floatInput);
					} else {
						expect(undefined).toBeDefined();
					}
				});
			});
		});

		it("should validate invalid text input", function() {
			floatDataTypeFields.forEach(function(floatInput) {
				
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
				
				// Error message should disappear;
				if (!floatInput.column.nullok) {
					chaisePage.recordEditPage.getInputErrorMessage(floatInput, 'required').then(function(err) {
						if (err) {
							expect(undefined).toBe("Float input " + floatInput.column.name + " Required Error message to be hidden");
						} else {
							expect(true).toBeDefined();
						}
					});
				}

				// Clear value
				floatInput.sendKeys(Array(actualValue.length + 1).join(protractor.Key.BACK_SPACE));
				expect(floatInput.getAttribute('value')).toBe("");

			});
		});

	});

});
