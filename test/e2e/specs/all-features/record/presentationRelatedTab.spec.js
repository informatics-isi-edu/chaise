var chaisePage = require('../../../utils/chaise.page.js');

var EC = protractor.ExpectedConditions;
var testParams = {
    table_name: "accommodation",
    key: {
        name: "id",
        value: "2002",
        operator: "="
    },
};

describe('Related tables in Record App ', function() {

        beforeAll(function() {
            var keys = [];
            browser.ignoreSynchronization = true;
            keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/product-record:" + testParams.table_name + "/" + keys.join("&");
            browser.get(url);
            accordionSet = element.all(by.css('.related-table-heading'));
            chaisePage.waitForElement(chaisePage.recordPage.getEntityTitleElement(), browser.params.defaultTimeout);
        });

        it('should collapse related tables after it exceed cutOff value',function(){
            expect(element.all(by.css('.panel-open')).count()).toEqual(0);
    });
});
