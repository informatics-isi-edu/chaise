var chaisePage = require('../../utils/chaise.page.js');

exports.testPresentation = function (tableParams) {

	it("should have '" + tableParams.title +  "' as title", function() {
		chaisePage.recordsetPage.getPageTitle().then(function(txt) {
			expect(txt).toBe(tableParams.title);
		});
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
						expect(cells.length).toBe(tableParams.columns.length);
						expect(cells[0].getText()).toBe(tableParams.data[index].title);
						expect(cells[1].element(by.tagName("a")).getAttribute("href")).toBe(tableParams.data[index].website);
						expect(cells[1].element(by.tagName("a")).getText()).toBe("Link to Website");
						expect(cells[2].getText()).toBe(tableParams.data[index].rating);
						expect(cells[3].getText()).toBe(tableParams.data[index].summary);
						expect(cells[4].getText()).toBe(tableParams.data[index].opened_on);
						expect(cells[5].getText()).toBe(tableParams.data[index].luxurious);
					});
				}(i))
			}
		});
	});

	it("should show " + tableParams.columns.length + " columns", function() {
		chaisePage.recordsetPage.getColumns().getInnerHtml().then(function(columnNames) {
			for (var j = 0; j < columnNames.length; j++) {
				expect(columnNames[j]).toBe(tableParams.columns[j].title);

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
		var searchBox = chaisePage.recordsetPage.getSearchBox();
		searchBox.sendKeys('Super 8 North Hollywood Motel');
		chaisePage.recordsetPage.getSearchSubmitButton().click().then(function() {
			return chaisePage.waitForElementInverse(element(by.id("spinner")));
		}).then(function() {
			return chaisePage.recordsetPage.getRows()
		}).then(function(rows) {
			expect(rows.length).toBe(1);
			// clear search
			return chaisePage.recordsetPage.getSearchClearButton().click();
		}).then(function() {
			return chaisePage.waitForElementInverse(element(by.id("spinner")));
		}).then(function() {
			return chaisePage.recordsetPage.getRows();
		}).then(function(rows) {
			expect(rows.length).toBe(4);

			// apply conjunctive search words
			searchBox.sendKeys('"Super 8" motel "North Hollywood"');

			return chaisePage.recordsetPage.getSearchSubmitButton().click();
		}).then(function() {
			return chaisePage.waitForElementInverse(element(by.id("spinner")));
		}).then(function() {
			return chaisePage.recordsetPage.getRows();
		}).then(function(rows) {
			expect(rows.length).toBe(1);

			// clear search
			return chaisePage.recordsetPage.getSearchClearButton().click();
		});

	});

	it("click on row should redirect to record app", function() {
        chaisePage.waitForElementInverse(element(by.id("spinner"))).then(function() {
        	return chaisePage.recordsetPage.getRows();
        }).then(function(rows) {
        	rows[0].click();

        	var result = '/record/#' + browser.params.catalogId + "/" + tableParams.schemaName + ":" + tableParams.table_name + "/id=" + tableParams.data[0].id;
        	chaisePage.waitForUrl(result, browser.params.defaultTimeout).finally(function() {
                expect(browser.driver.getCurrentUrl()).toContain(result);
            });
		});

	});
};
