var chaisePage = require('../../../utils/chaise.page.js');
var recordHelpers = require('../../../utils/record-helpers.js');
var testParams = {
    table_name: "accommodation",
    schemaName:  "product-record",
    deletionErrText : "This entry cannot be deleted as it is still referenced from the booking table. All dependent entries must be removed before this item can be deleted. If you have trouble removing dependencies please contact the site administrator.\n\nClick OK to go to the Record Page Show Error Details",
    uniqueConstraint : "Error The entry cannot be created/updated. Please use a different ID for this record."
};

/*
*  All error related test cases are created here.
*  Test cases from other apps would be collated in future
*/

describe('Error related to Record App,', function() {

    describe("For no record found in Record app", function() {

        beforeAll(function() {
          browser.ignoreSynchronization=true;
            url = browser.params.url + "/record/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name +  "/id=11223312121";
            browser.get(url);
            chaisePage.waitForElement(element(by.css('.modal-dialog ')));
        });

        it('An error modal window should appear with Record Not Found title', function(){
            var modalTitle = chaisePage.recordPage.getErrorModalTitle();
            expect(modalTitle).toBe("Record Not Found", "The title of no record error pop is not correct");
        });

        it('On click of OK button the page should redirect to recordset/search page', function(){
            chaisePage.recordPage.getErrorModalOkButton().then(function(btn){
                return btn.click();
            }).then (function (){
                return browser.driver.getCurrentUrl();
            }).then (function(currentUrl) {
              var newapplink = url.replace("record", "recordset"),
                  lastSlash = newapplink.lastIndexOf("/"),
                  recordsetUrl = newapplink.slice(0, lastSlash);
                expect(currentUrl).toBe(recordsetUrl, "The redirection from record page to recordset/search in case of multiple records failed");
            }).catch( function(err) {
                console.log(error);
                expect('Something went wrong with this promise chain.').toBe('Please see error message.');
            });
        });
    });

    describe("For no record found in RecordEdit app", function() {

        beforeAll(function() {
          browser.ignoreSynchronization=true;
            url = browser.params.url + "/recordedit/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name +  "/id=11223312121";
            browser.get(url);
            chaisePage.waitForElement(element(by.css('.modal-dialog ')));
        });

        it('An error modal window should appear with Record Not Found title', function(){
            var modalTitle = chaisePage.recordPage.getErrorModalTitle();
            expect(modalTitle).toBe("Record Not Found", "The title of no record error pop is not correct");
        });

        it('On click of OK button the page should redirect to recordset/search page', function(){
            chaisePage.recordPage.getErrorModalOkButton().then(function(btn){
                return btn.click();
            }).then (function (){
                return browser.driver.getCurrentUrl();
            }).then (function(currentUrl) {
                var newapplink = url.replace("recordedit", "recordset"),
                    lastSlash = newapplink.lastIndexOf("/"),
                    recordsetUrl = newapplink.slice(0, lastSlash);
                expect(currentUrl).toBe(recordsetUrl, "The redirection from record page to recordset/search in case of multiple records failed");
            }).catch( function(err) {
                console.log(error);
                expect('Something went wrong with this promise chain.').toBe('Please see error message.');
            });
        });
    });

    describe("Error formatting during 409 check", function(){

      beforeAll(function() {
          var url = browser.params.url + "/record/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name +  "/id=2002";
          browser.get(url);
      });

      it("should be returned as a 409 error with deletion conflict.", function () {
          var modalTitle = chaisePage.recordPage.getConfirmDeleteTitle(),
              deleteReccordBtn = chaisePage.recordPage.getDeleteRecordButton();

          chaisePage.waitForElement(element(by.id('tblRecord'))).then(function() {
              chaisePage.waitForElement(deleteReccordBtn);
              return deleteReccordBtn.click();
          }).then(function () {
              chaisePage.waitForElement(modalTitle);
              return modalTitle.getText();
          }).then(function (text) {
              expect(text).toBe("Confirm Delete", "Deleteion confirmation pop-up could not be opened!");
              chaisePage.recordPage.getConfirmDeleteButton().click();
              errModalClass =  chaisePage.recordPage.getModalText();
              chaisePage.waitForElement(errModalClass);
              return errModalClass.getText();
          }).then(function (errorText) {
              expect(errorText).toBe(testParams.deletionErrText, "409 Conflict could not be matched! Check conflict during deletion.");
          }).catch(function(error) {
              console.log(error);
              expect('Something went wrong with this promise chain.').toBe('Please see error message.');
          });
      });

    });

});
