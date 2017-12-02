var chaisePage = require('../../../utils/chaise.page.js');
var recordHelpers = require('../../../utils/record-helpers.js');
var testParams = {
    table_name: "accommodation",
},
schemaName = "product-record",
errorTexts = {
  deletionErrText : "This entry cannot be deleted as it is still referenced from the booking table. All dependent entries must be removed before this item can be deleted.\n\nClick OK to go to the Record Page Show Error Details",
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
            url = browser.params.url + "/record/#" + browser.params.catalogId + "/" + schemaName + ":" + testParams.table_name +  "/id=11223312121";
            browser.get(url);
            chaisePage.waitForElement(element(by.css('.modal-dialog ')));
        });

        it('A error modal window should appear with Record Not Found title', function(){
            var modalTitle = chaisePage.recordPage.getErrorModalTitle();

            expect(modalTitle).toBe("Record Not Found", "The title of no record error pop is not correct");

        });

        it('On click of OK button the page should redirect to recordset/search page', function(){
            chaisePage.recordPage.getErrorModalOkButton().then(function(btn){
                return btn.click();
            }).then (function (){
                return browser.driver.getCurrentUrl();
            }).then (function(currentUrl) {
              var recordsetUrl = url.replace("record", "recordset") + "@sort(id)";
                expect(currentUrl).toBe(recordsetUrl, "The redirection from record page to recordset/search in case of multiple records failed");
            }).catch( function(err) {
                console.log(error);
                expect('Something went wrong with this promise chain.').toBe('Please see error message.');
            });
        });
    });

    describe("Error formatting during 409 check", function(){

      beforeAll(function() {
          var url = browser.params.url + "/record/#" + browser.params.catalogId + "/" + schemaName + ":" + testParams.table_name +  "/id=2002";
          browser.get(url);
      });

      it("should be returned as a 409 error with deletion conflict.", function () {
          var modalTitle = chaisePage.recordPage.getConfirmDeleteTitle(),
              deleteReccordBtn = chaisePage.recordPage.getDeleteRecordButton(),
              config;
          chaisePage.waitForElement(element(by.id('tblRecord'))).then(function() {
              return browser.executeScript('return chaiseConfig;');
          }).then(function(chaiseConfig) {
              config = chaiseConfig;
              chaisePage.waitForElement(deleteReccordBtn);
              return deleteReccordBtn.click();
          }).then(function () {
              chaisePage.waitForElement(modalTitle);
              // expect modal to open
              return modalTitle.getText();
          }).then(function (text) {
              expect(text).toBe("Confirm Delete");
              chaisePage.recordPage.getConfirmDeleteButton().click();
              errModalClass =  chaisePage.recordPage.getModalText();
              chaisePage.waitForElement(errModalClass);
              return errModalClass.getText();
          }).then(function (errorText) {
              expect(errorText).toBe(errorTexts.deletionErrText);
          }).catch(function(error) {
              console.log(error);
              expect('Something went wrong with this promise chain.').toBe('Please see error message.');
          });
      });

    });

});
