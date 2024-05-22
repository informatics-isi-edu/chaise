const { browser, element } = require('protractor');
var chaisePage = require('../../../utils/chaise.page.js');
var recordHelpers = require('../../../utils/record-helpers.js');
var EC = protractor.ExpectedConditions;

var testParams = {
    table_name: "accommodation",
    schemaName:  "product-record",
    fileTable:  "file",
    multipleRecordsTable : "multiple_records",
    tableNotFound : "accommodation_not_found",
    conflict : "Conflict",
    deletionErrTextBooking : [
        "This entry cannot be deleted as it is still referenced from the booking table. " +
        "All dependent entries must be removed before this item can be deleted. " +
        "If you have trouble removing dependencies please contact the site administrator.\n\n" +
        "Show Error Details"
    ],
    deletionErrTextAccommodationImg : [
        "This entry cannot be deleted as it is still referenced from the accommodation_image table. " +
        "All dependent entries must be removed before this item can be deleted. " +
        "If you have trouble removing dependencies please contact the site administrator.\n\n" +
        "Show Error Details"
    ],
    recordNotFoundModalText : "The record does not exist or may be hidden.\nIf you continue to face this issue, please contact the system administrator.\n\nClick OK to show the list of all records.",
    multipleRecordFoundModalText : "There are more than 1 record found for the filters provided.\n\nClick OK to show all the matched records.",
    tableNotFoundModalText : function() { return "Table " + this.tableNotFound + " not found in schema.\n\nClick OK to go to the Home Page."},
    sizeNotValidModalText : function() { return "'limit' must be greater than 0\n\nClick OK to go to the " + this.multipleRecordsTable + "."},
    negativeLimitErrorText : "'limit' must be greater than 0\n\nClick OK to go to the Home Page.",
    hideErrors : "Hide Error Details",
    conflictRecordEditErrorBooking : "This entry cannot be deleted as it is still referenced from the booking table. All dependent entries must be removed before this item can be deleted.\n\nClick OK to go to the Accommodations.\nClick Reload to start over.\nShow Error Details",
    conflictRecordEditErrorAccommodationImg : "This entry cannot be deleted as it is still referenced from the accommodation_image table. All dependent entries must be removed before this item can be deleted.\n\nClick OK to go to the Accommodations.\nClick Reload to start over.\nShow Error Details",
    facetErrorstext:{
      invalidPageCriteriaTitle: "Invalid Page Criteria",
      invalidPageCriteriaBody: "Click OK to reload this page without Invalid Page Criteria.",
      invalidFacetFilterTitle: "Invalid Facet Filters",
      invalidFacetFilterBody: "Click OK to reload this page without Invalid Facet Filters.",
      invalidFilterOperatorErrorTitle : "Invalid Filter",
      invalidFilterOperatorErrorBody : "Click OK to show the list of all records."
    },
    conflictErrors: {
        title: "Conflict",
        message: [
            "An unexpected error has occurred. Try clearing your cache.",
            "If you continue to face this issue, please contact the system administrator.",
            "\nClick OK to go to the Home Page.",
            "Show Error Details"
        ].join("\n"),
        details: "invalid input syntax for type boolean: \"12\"",
    }
};

/*
*  All error related test cases are created here.
*  Test cases from other apps would be collated in future
*/

describe('Error related test cases,', function() {
    describe("Error check for invalid filter in RecordEdit", function(){

      beforeAll(function() {
          pageTestUrl = browser.params.url + "/recordedit/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name +  "/id::gt:2002@after()";
          chaisePage.navigate(pageTestUrl);
          modalTitle = chaisePage.recordEditPage.getModalTitle();
          modalActionBody = chaisePage.recordEditPage.getModalActionBody();
      });

      it("should be returned Invalid Page Criteria", function (done) {
          chaisePage.waitForElement(modalTitle).then(function(){
              return modalTitle.getText();
          }).then(function (text) {
              expect(text).toBe(testParams.facetErrorstext.invalidPageCriteriaTitle, "Invalid Page Criteria error pop-up could not be opened!");
              return modalActionBody.getText();
          }).then(function (errorText) {
              expect(errorText).toBe(testParams.facetErrorstext.invalidPageCriteriaBody, "Error action text did not match");
              done();
          }).catch(chaisePage.catchTestError(done));
      });

      it('On click of OK button the page should reload the page without paging condition but with invalid filter conditions', function(done){
          const modalOkBtn = chaisePage.errorModal.getOKButton();
          // make sure ok button is clickable
          browser.wait(protractor.ExpectedConditions.elementToBeClickable(modalOkBtn), browser.params.defaultTimeout);
          chaisePage.clickButton(modalOkBtn).then(function(){
              return chaisePage.waitForElement(modalTitle);
          }).then (function (){
             return modalTitle.getText();
          }).then(function (text) {
               expect(text).toBe(testParams.facetErrorstext.invalidFilterOperatorErrorTitle, "Invalid Filter operator error pop-up could not be opened!");
               return modalActionBody.getText();
           }).then(function (errorText) {
               expect(errorText).toBe(testParams.facetErrorstext.invalidFilterOperatorErrorBody, "Error action text did not match");
               done();
          }).catch(chaisePage.catchTestError(done));
      });

      it('On click of OK button the page should redirect to RecordSet', function(done){
          const modalOkBtn = chaisePage.errorModal.getOKButton();
          // make sure ok button is clickable
          browser.wait(protractor.ExpectedConditions.elementToBeClickable(modalOkBtn), browser.params.defaultTimeout);
          chaisePage.clickButton(modalOkBtn).then(function(){
              recordsetWithoutFacetUrl = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name;
              browser.wait(() => {
                  return browser.driver.getCurrentUrl().then((url) => {
                      return url.toContain(recordsetWithoutFacetUrl);
                  });
              });

             done();
          }).catch(chaisePage.catchTestError(done));
      });

    });
});
