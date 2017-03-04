var chaisePage = require('../../utils/chaise.page.js');

exports.testPresentation = function (tableParams) {
    var recEditUrl =  '';
	it("should have '" + tableParams.title +  "' as title", function() {
		var title = chaisePage.recordsetPage.getPageTitleElement();
        expect(title.getText()).toEqual(tableParams.title);
	});

    it("should autofocus on search box", function() {
        var searchBox = chaisePage.recordsetPage.getSearchBox();
        expect(searchBox.getAttribute('id')).toEqual(browser.driver.switchTo().activeElement().getAttribute('id'));
    });

	it("should use annotated page size", function() {
		var EC = protractor.ExpectedConditions;
		var e = element(by.id('custom-page-size'));
		browser.wait(EC.presenceOf(e), browser.params.defaultTimeout);
		chaisePage.recordsetPage.getCustomPageSize().then(function(text) {
			expect(text).toBe("15 (Custom)");
		})
	});

	it("should show correct table rows", function() {
		chaisePage.recordsetPage.getRows().then(function(rows) {
			expect(rows.length).toBe(4);
			for (var i = 0; i < rows.length; i++) {
				(function(index) {
					rows[index].all(by.tagName("td")).then(function (cells) {
						expect(cells.length).toBe(tableParams.columns.length + 1);
						expect(cells[1].getText()).toBe(tableParams.data[index].title);
						expect(cells[2].element(by.tagName("a")).getAttribute("href")).toBe(tableParams.data[index].website);
						expect(cells[2].element(by.tagName("a")).getText()).toBe("Link to Website");
						expect(cells[3].getText()).toBe(tableParams.data[index].rating);
						expect(cells[4].getText()).toBe(tableParams.data[index].summary);
						expect(cells[5].getText()).toBe(tableParams.data[index].opened_on);
						expect(cells[6].getText()).toBe(tableParams.data[index].luxurious);
					});
				}(i))
			}
		});
	});

	it("should have " + tableParams.columns.length + " columns", function() {
        chaisePage.recordsetPage.getColumnNames().then(function(columns) {
            expect(columns.length).toBe(tableParams.columns.length);
            for (var i = 0; i < columns.length; i++) {
                expect(columns[i].getText()).toEqual(tableParams.columns[i].title);
            }
        });
	});

	it("should show line under columns which have a comment and inspect the comment value too", function() {
		var columns = tableParams.columns.filter(function(c) {
			return (c.value != null && typeof c.comment == 'string');
		});
		chaisePage.recordsetPage.getColumnsWithUnderline().then(function(pageColumns) {
			expect(pageColumns.length).toBe(columns.length);
			var index = 0;
			pageColumns.forEach(function(c) {
				var comment = columns[index++].comment;
				chaisePage.recordsetPage.getColumnComment(c).then(function(actualComment) {
					var exists = actualComment ? true : undefined;
					expect(exists).toBeDefined();

                    // Check comment is same
                    expect(actualComment).toBe(comment);
				});
			});
		});
	});

	it("apply different searches, ", function() {
		var EC = protractor.ExpectedConditions;
		var e = element(by.id('custom-page-size'));
		browser.wait(EC.presenceOf(e), browser.params.defaultTimeout);

		var searchBox = chaisePage.recordsetPage.getSearchBox(),
            searchSubmitButton = chaisePage.recordsetPage.getSearchSubmitButton(),
            clearSearchButton = chaisePage.recordsetPage.getSearchClearButton(),
            noResultsMessage = "No Results Found";

		searchBox.sendKeys('Super 8 North Hollywood Motel');
		searchSubmitButton.click().then(function() {
			return chaisePage.waitForElementInverse(element(by.id("spinner")));
		}).then(function() {
			return chaisePage.recordsetPage.getRows()
		}).then(function(rows) {
			expect(rows.length).toBe(1);
			// clear search
			return clearSearchButton.click();
		}).then(function() {
			return chaisePage.waitForElementInverse(element(by.id("spinner")));
		}).then(function() {
			return chaisePage.recordsetPage.getRows();
		}).then(function(rows) {
			expect(rows.length).toBe(4);

			// apply conjunctive search words
			searchBox.sendKeys('"Super 8" motel "North Hollywood"');

			return searchSubmitButton.click();
		}).then(function() {
			return chaisePage.waitForElementInverse(element(by.id("spinner")));
		}).then(function() {
			return chaisePage.recordsetPage.getRows();
		}).then(function(rows) {
			expect(rows.length).toBe(1);
			// clear search
			return clearSearchButton.click();
		}).then(function() {
            return chaisePage.waitForElementInverse(element(by.id("spinner")));
        }).then(function() {
            // search has been reset
            searchBox.sendKeys("asdfghjkl");

            return searchSubmitButton.click();
        }).then(function() {
            return chaisePage.waitForElementInverse(element(by.id("spinner")));
        }).then(function() {
            return chaisePage.recordsetPage.getRows();
        }).then(function(rows) {
            expect(rows.length).toBe(0);

            return chaisePage.recordsetPage.getNoResultsRow().getText();
        }).then(function(text) {
            expect(text).toBe(noResultsMessage);

            // clearing the search here resets the page for the next test case
            clearSearchButton.click();
        });

	});

	it("action columns should show view button that redirects to the record page", function() {
		chaisePage.waitForElementInverse(element(by.id("spinner"))).then(function() {
			return chaisePage.recordsetPage.getViewActionButtons();
		}).then(function(viewButtons) {
			expect(viewButtons.length).toBe(4);
			return viewButtons[0].click();
		}).then(function() {
			var result = '/record/#' + browser.params.catalogId + "/" + tableParams.schemaName + ":" + tableParams.table_name + "/id=" + tableParams.data[0].id;
			chaisePage.waitForUrl(result, browser.params.defaultTimeout).finally(function() {
				expect(browser.driver.getCurrentUrl()).toContain(result);
				browser.navigate().back();
			});
		});
	});

	it("action columns should show edit button that redirects to the recordedit page", function() {

		var allWindows;
		chaisePage.waitForElementInverse(element(by.id("spinner"))).then(function() {
			return chaisePage.recordsetPage.getEditActionButtons();
		}).then(function(editButtons) {
			expect(editButtons.length).toBe(4);
			return editButtons[0].click();
		}).then(function() {
			return browser.getAllWindowHandles();
		}).then(function(handles) {
			allWindows = handles;
			return browser.switchTo().window(allWindows[1]);
		}).then(function() {
			var result = '/recordedit/#' + browser.params.catalogId + "/" + tableParams.schemaName + ":" + tableParams.table_name + "/id=" + tableParams.data[0].id;
            browser.driver.getCurrentUrl().then(function(url) {
                // Store this for use in later spec.
                recEditUrl = url;
            });
			expect(browser.driver.getCurrentUrl()).toContain(result);
			browser.close();
			browser.switchTo().window(allWindows[0]);
		});
	});

    it('should show a modal if user tries to delete (via action column) a record that has been modified by someone else (412 error)', function() {
        var EC = protractor.ExpectedConditions, allWindows, config;
        // Edit a record in a new tab in order to change the ETag
        recEditUrl = recEditUrl.replace('id=2003', 'id=4004');
        recEditUrl = recEditUrl.slice(0, recEditUrl.indexOf('?invalidate'));

        browser.executeScript('window.open(arguments[0]);', recEditUrl).then(function() {
            return browser.getAllWindowHandles();
        }).then(function(handles) {
            allWindows = handles;
            return browser.switchTo().window(allWindows[1]);
        }).then(function() {
            return chaisePage.waitForElement(element(by.id("submit-record-button")));
        }).then(function() {
        // - Change a small thing. Submit.
            var input = chaisePage.recordEditPage.getInputById(0, 'Summary');
            input.clear();
            input.sendKeys('as;dkfa;sljk als;dkj f;alsdjf a;');
            return chaisePage.recordEditPage.getSubmitRecordButton().click();
        }).then(function(handles) {
        // - Go back to initial RecordEdit page
            browser.close();
            browser.switchTo().window(allWindows[0]);
        }).then(function() {
            return chaisePage.recordsetPage.getDeleteActionButtons().get(3).click();
        }).then(function () {
            var modalTitle = chaisePage.recordPage.getConfirmDeleteTitle();
            browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);
            // expect modal to open
            return modalTitle.getText();
        }).then(function(text) {
            browser.pause();
            expect(text).toBe("Confirm Delete");
            return chaisePage.recordPage.getConfirmDeleteButton().click();
        }).then(function() {
            // Expect another modal to appear to tell user that this record cannot be deleted
            // and user should check the updated UI for latest row data.
            chaisePage.waitForElement(element(by.id('confirm-btn')));
            return element(by.id('confirm-btn')).click();
        }).then(function() {
            return chaisePage.waitForElementInverse(element(by.id("spinner")));
        }).then(function() {
            var rows = chaisePage.recordsetPage.getRows();
            var changedCell = rows.get(3).all(by.css('td')).get(4);
            expect(changedCell.getText()).toBe('as;dkfa;sljk als;dkj f;alsdjf a;');
        }).catch(function(error) {
            console.dir(error);
            expect(error).not.toBeDefined();
        });
    });

    it("action columns should show delete button that deletes record", function() {
		var deleteButton;
		chaisePage.waitForElementInverse(element(by.id("spinner"))).then(function() {
			return chaisePage.recordsetPage.getDeleteActionButtons();
		}).then(function(deleteButtons) {
			expect(deleteButtons.length).toBe(4);
			deleteButton = deleteButtons[3];
			return deleteButton.click();
		}).then(function() {
			var EC = protractor.ExpectedConditions;
			var confirmButton = chaisePage.recordsetPage.getConfirmDeleteButton();
			browser.wait(EC.visibilityOf(confirmButton), browser.params.defaultTimeout);

			return confirmButton.click();
		}).then(function() {
			var EC = protractor.ExpectedConditions;
			browser.wait(EC.stalenessOf(deleteButton), browser.params.defaultTimeout);
		}).then(function() {
			return chaisePage.recordsetPage.getRows();
		}).then(function(rows) {
			expect(rows.length).toBe(3);
		});
	});

};
