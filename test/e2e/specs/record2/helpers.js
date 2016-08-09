var chaisePage = require('../../utils/chaise.page.js');

exports.testPresentation = function (tableParams) {
	it("should have '" + tableParams.title +  "' as title", function() {
		chaisePage.record2Page.getEntityTitle().then(function(txt) {
			expect(txt).toBe(tableParams.title);
		});
	});

	it("should show " + tableParams.columns.length + " columns only", function() {
		chaisePage.record2Page.getColumns().then(function(columns) {
			expect(columns.length).toBe(tableParams.columns.length);
		});
	})

};