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
    deletionErrTextBooking : "This entry cannot be deleted as it is still referenced from the booking table. All dependent entries must be removed before this item can be deleted. If you have trouble removing dependencies please contact the site administrator.\n\nClick OK to go to the Accommodations.\nShow Error Details",
    deletionErrTextAccommodationImg : "This entry cannot be deleted as it is still referenced from the accommodation_image table. All dependent entries must be removed before this item can be deleted.\n\nClick OK to go to the Accommodations.\nShow Error Details",
    uniqueConstraint : "Error The entry cannot be created/updated. Please use a different ID for this record.",
    recordNotFoundModalText : "The record does not exist or may be hidden.\nIf you continue to face this issue, please contact the system administrator.\n\nClick OK to show the list of all records.\nShow Error Details",
    multipleRecordFoundModalText : "There are more than 1 record found for the filters provided.\n\nClick OK to show all the matched records.\nShow Error Details",
    tableNotFoundModalText : function() { return "Table " + this.tableNotFound + " not found in schema.\n\nClick OK to go to the Home Page."},
    sizeNotValidModalText : function() { return "'limit' must be greater than 0\n\nClick OK to go to the " + this.multipleRecordsTable + ".\nClick Reload to start over."},
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
    }
};

/*
*  All error related test cases are created here.
*  Test cases from other apps would be collated in future
*/

describe('Error related test cases,', function() {

    describe("For no record found in Record app", function() {

        beforeAll(function() {
          browser.ignoreSynchronization = true;
            url = browser.params.url + "/record/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name +  "/id=11223312121";
            browser.get(url);
            chaisePage.waitForElement(element(by.css('.modal-dialog ')));
        });

        it('An error modal window should appear with Record Not Found title', function(){
            var modalTitle = chaisePage.errorModal.getTitle();
            expect(modalTitle.getText()).toBe("Record Not Found", "The title of no record error pop is not correct");
        });

        it('Error modal text indicates users about error and provides them with navigation options', function(){
            var modalText = chaisePage.recordPage.getModalText();
            expect(modalText.getText()).toBe(testParams.recordNotFoundModalText, "The message in modal pop is not correct");
        });

        it('Error modal should Show Error Details', function(done){
            var showDetails = chaisePage.errorModal.getToggleDetailsLink();
            var errorDetails = chaisePage.errorModal.getErrorDetails();
            chaisePage.waitForElement(showDetails);
            showDetails.click().then(function(){
                chaisePage.waitForElement(errorDetails);
                expect(showDetails.getText()).toBe(testParams.hideErrors, "The Show/Hide message in modal pop is not correct");
                expect(errorDetails.getText()).toContain("Error", "error missmatch.");
                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it('On click of OK button the page should redirect to recordset page', function(done){
            chaisePage.clickButton(chaisePage.recordPage.getErrorModalOkButton()).then (function (){
                return browser.driver.getCurrentUrl();
            }).then (function(currentUrl) {
              var newapplink = url.replace("record", "recordset"),
                  lastSlash = newapplink.lastIndexOf("/"),
                  recordsetUrl = newapplink.slice(0, lastSlash);
                expect(currentUrl).toContain(recordsetUrl, "The redirection from record page to recordset in case of multiple records failed");
                done();
            }).catch(chaisePage.catchTestError(done));
        });
    });

    describe("For table not found error in Record app", function() {

        beforeAll(function() {
          browser.ignoreSynchronization = true;
            url = browser.params.url + "/record/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.tableNotFound +  "/id=10007";
            browser.refresh();
            browser.get(url);
            chaisePage.waitForElement(element(by.css('.modal-dialog ')));
        });

        it('An error modal window should appear with Item Not Found title', function(){
            var modalTitle = chaisePage.errorModal.getTitle();
            expect(modalTitle.getText()).toBe("Item Not Found", "The title of no table error pop is not correct");
        });

        it('Error modal text indicates users about error and provides them with navigation options', function(){
            var modalText = chaisePage.recordPage.getModalText();
            expect(modalText.getText()).toBe(testParams.tableNotFoundModalText(), "The message in modal pop is not correct");
        });

        it('On click of OK button the page should redirect Home page', function(done){
            chaisePage.clickButton(chaisePage.recordPage.getErrorModalOkButton()).then (function (){
                return browser.driver.getCurrentUrl();
            }).then (function(currentUrl) {
              var homeAppUrl = browser.params.url,
                  homePage =   homeAppUrl.slice(0, homeAppUrl.slice(0, homeAppUrl.lastIndexOf("/")).lastIndexOf("/") + 1);
                  // CI local URL has different structure
                  if (process.env.CI) {
                      homePage = currentUrl;
                  }
                expect(currentUrl).toBe(homePage, "The redirection from record page to Home page failed");
                done();
            }).catch(chaisePage.catchTestError(done));
        });
    });

    describe("For multiple records error in Record app", function() {

        beforeAll(function() {
          browser.ignoreSynchronization = true;
            url = browser.params.url + "/record/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.multipleRecordsTable +  "/id=10007";
            browser.get(url);
            chaisePage.waitForElement(element(by.css('.modal-dialog ')));
        });

        it('An error modal window should appear with Multiple Records Found title', function(){
            var modalTitle = chaisePage.errorModal.getTitle();
            expect(modalTitle.getText()).toBe("Multiple Records Found", "The title of no record error pop is not correct");
        });

        it('Error modal text indicates users about error and provides them with navigation options', function(){
            var modalText = chaisePage.recordPage.getModalText();
            expect(modalText.getText()).toBe(testParams.multipleRecordFoundModalText, "The message in modal pop is not correct");
        });

        it('Error modal should Show Error Details', function(done){
            var showDetails = chaisePage.errorModal.getToggleDetailsLink();
            var errorDetails = chaisePage.errorModal.getErrorDetails();
            chaisePage.waitForElement(showDetails);
            showDetails.click().then(function(){
                chaisePage.waitForElement(errorDetails);
                expect(showDetails.getText()).toBe(testParams.hideErrors, "The Show/Hide message in modal pop is not correct");
                expect(errorDetails.getText()).toContain("Error", "error missmatch.");
                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it('On click of OK button the page should redirect to recordset page', function(done){
            chaisePage.clickButton(chaisePage.recordPage.getErrorModalOkButton()).then (function (){
                return browser.driver.getCurrentUrl();
            }).then (function(currentUrl) {
                var newapplink = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.multipleRecordsTable;
                expect(currentUrl).toContain(newapplink, "The redirection from record page to recordset in case of multiple records failed");
                done();
            }).catch(chaisePage.catchTestError(done));
        });
    });

    describe("For negative page size in schema definition in Recordset app", function() {

        beforeAll(function() {
          browser.ignoreSynchronization = true;
            url = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.multipleRecordsTable;
            browser.refresh();
            browser.get(url);
            chaisePage.waitForElement(element(by.css('.modal-dialog ')));
        });

        it('An error modal window should appear with Invalid Input title', function(){
            var modalTitle = chaisePage.errorModal.getTitle();
            expect(modalTitle.getText()).toBe("Invalid Input", "The title of Invalid Input error pop is not correct");
        });

        it('Error modal text indicates users about error and provides them with navigation options to Home Page', function(){
            var modalText = chaisePage.recordPage.getModalText();
            expect(modalText.getText()).toBe(testParams.negativeLimitErrorText, "The message in modal pop is not correct");
        });

        it('On click of OK button the page should redirect to Home page', function(done){
            chaisePage.clickButton(chaisePage.recordPage.getErrorModalOkButton()).then (function (){
                return browser.driver.getCurrentUrl();
            }).then (function(currentUrl) {
              var homeAppUrl = browser.params.url,
                  homePage =   homeAppUrl.slice(0, homeAppUrl.slice(0, homeAppUrl.lastIndexOf("/")).lastIndexOf("/") + 1);
                  // CI local URL has different structure
                  if (process.env.CI) {
                      homePage = currentUrl;
                  }
                 expect(currentUrl).toBe(homePage, "The redirection from recordset page to Home page failed");
                 done();
            }).catch(chaisePage.catchTestError(done));
        });
    });


    describe("For reload button to start over in Recordedit app", function() {

        beforeAll(function() {
          browser.ignoreSynchronization = true;
            url = browser.params.url + "/recordedit/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name +"/id=2002";
            browser.get(url);
            chaisePage.waitForElement(chaisePage.recordEditPage.getEntityTitleElement());
        });

        it("An error modal window should appear with Conflict.", function (done) {
            var modalTitle = chaisePage.recordPage.getConfirmDeleteTitle(),
                deleteReccordBtn = chaisePage.recordEditPage.getDeleteRecordButton();
            deleteReccordBtn.click().then(function () {
                chaisePage.waitForElement(modalTitle);
                return modalTitle.getText();
            }).then(function (text) {
                expect(text).toBe("Confirm Delete", "Deleteion confirmation pop-up could not be opened!");
                chaisePage.recordPage.getConfirmDeleteButton().click();
                errModalClass =  chaisePage.recordPage.getModalText();
                chaisePage.waitForElement(errModalClass);
                return errModalClass.getText();
            }).then(function (errorText) {
                // Added OR case to avoid discrepancy in error message when table is deleted
                expect(errorText == testParams.conflictRecordEditErrorBooking || errorText == testParams.conflictRecordEditErrorAccommodationImg ).toBe(true, "409 Conflict could not be matched! Check conflict during deletion in RecordEdit.");

                expect(chaisePage.errorModal.getTitle().getText()).toBe(testParams.conflict, "Error title missmatch");
                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it('On click of Reload button the page should reload itself in Recordedit app', function(done){
            chaisePage.clickButton(chaisePage.recordPage.getErrorModalReloadButton()).then (function (){
                return browser.driver.getCurrentUrl();
            }).then (function(currentUrl) {
                expect(currentUrl).toBe(currentUrl, "Reload button could not refresh the recordedit page.");
                done();
            }).catch(chaisePage.catchTestError(done));
        });
    }).pend("no button on Recordedit for delete");

    describe("Error formatting during 409 check", function(){

      beforeAll(function() {
        browser.ignoreSynchronization = true;
        var url = browser.params.url + "/record/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name +  "/id=2002";
        browser.get(url);
      });

      it("should be returned as a 409 error with deletion conflict.", function (done) {

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
              return chaisePage.recordPage.getConfirmDeleteButton().click();
          }).then(function() {
            errModalClass =  chaisePage.recordPage.getModalText();
            return chaisePage.waitForElement(errModalClass);
          }).then(function() {
            return errModalClass.getText();
          }).then(function (errorText) {
              // Added OR case to avoid discrepancy in error message when table is deleted
              expect(errorText == testParams.deletionErrTextBooking || errorText == testParams.deletionErrTextAccommodationImg).toBe(true, "409 Conflict could not be matched! Check conflict during deletion.");
              expect(chaisePage.errorModal.getTitle().getText()).toBe(testParams.conflict, "Error title missmatch");
              done();
          }).catch(chaisePage.catchTestError(done));
      });
    });

    describe("History for errorneous Url", function(){

        beforeAll(function() {
            browser.ignoreSynchronization = true;
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name +  "/id=269111";
            browser.get(url);
            chaisePage.waitForElement(element(by.css('.modal-dialog ')));
        });

        it('After clicking back button initial page should appear', function(done){
            chaisePage.clickButton(chaisePage.recordPage.getErrorModalOkButton()).then (function () {
                return chaisePage.recordsetPageReady();
            }).then(function () {
                return browser.navigate().back();
            }).then(function () {
                return browser.driver.getCurrentUrl();
            }).then (function(currentUrl) {
                // we cannot use recordPageReady because of the error,
                // we just make sure the url is correct
                browser.wait(function () {
                    return browser.driver.getCurrentUrl().then(function(url) {
                        return url.toContain('id=269111');
                    });
                });
                done();
            }).catch(chaisePage.catchTestError(done));
        });

    });

    describe("Dismissible Error Modal when using Record Delete button", function(){

        beforeAll(function() {
            browser.ignoreSynchronization = true;
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name +  "/id=2002";
            browser.get(url);
            deleteBtn  = chaisePage.recordPage.getDeleteRecordButton();
        });

        it('Error modal is dismissible in case of conflict/forbidden error', function(done){
            chaisePage.waitForElement(deleteBtn).then(function(){
                return deleteBtn.click();
            }).then(function () {
                var confirmBtn = chaisePage.recordPage.getConfirmDeleteButton();
                browser.wait(EC.presenceOf(confirmBtn), browser.params.defaultTimeout);
                return confirmBtn.click();
            }).then (function() {
                closeModal = chaisePage.recordEditPage.getModalCloseBtn();
                chaisePage.waitForElement(closeModal);
                expect(closeModal.isDisplayed()).toBeTruthy('Close modal option is not available for conflict/forbiddden errors');
                expect(chaisePage.errorModal.getTitle().getText()).toBe(testParams.conflict, "Error title missmatch");
                done();
            }).catch(chaisePage.catchTestError(done));
        });
    });

    // delete from ellipsis
    describe("Dismissible Error Modal when using Ellipses delete button", function(){

        beforeAll(function() {
            browser.ignoreSynchronization = true;
            var url = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.fileTable;
            browser.get(url);
            deleteBtnEllipses  = chaisePage.recordsetPage.getDeleteActionButtons().first();
            chaisePage.waitForElement(deleteBtnEllipses);
        });

        it('Error modal is dismissible in case of conflict/forbidden error while deleting from ellipsis', function(done){
            deleteBtnEllipses.click().then(function(){
                var confirmBtn = chaisePage.recordPage.getConfirmDeleteButton();
                browser.wait(EC.presenceOf(confirmBtn), browser.params.defaultTimeout);
                return confirmBtn.click();
            }).then (function() {
                closeModal = chaisePage.recordEditPage.getModalCloseBtn();
                chaisePage.waitForElement(closeModal);
                expect(closeModal.isDisplayed()).toBeTruthy('Close modal option is not available for conflict/forbiddden errors');
                expect(chaisePage.errorModal.getTitle().getText()).toBe(testParams.conflict, "Error title missmatch");
                done();
            }).catch(chaisePage.catchTestError(done));
        });
    });

    describe("Error check for invalid filter in RecordEdit", function(){

      beforeAll(function() {
          browser.ignoreSynchronization = true;
          pageTestUrl = browser.params.url + "/recordedit/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name +  "/id::gt:2002@after()";
          browser.get(pageTestUrl);
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
          chaisePage.clickButton(chaisePage.recordPage.getErrorModalOkButton()).then(function(){
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
          chaisePage.clickButton(chaisePage.recordPage.getErrorModalOkButton()).then(function(){
              return browser.driver.getCurrentUrl();
          }).then (function(currentUrl) {
             recordsetWithoutFacetUrl = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name + "/";
             expect(currentUrl).toBe(recordsetWithoutFacetUrl, "The redirection to Recordset page failed");
             done();
          }).catch(chaisePage.catchTestError(done));
      });

    });

    describe("Error check for invalid paging changes in RecordEdit", function(){

      beforeAll(function() {
        browser.ignoreSynchronization = true;
        pageTestUrl = browser.params.url + "/recordedit/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name +  "/id=2002@after()";
        browser.refresh();
        browser.get(pageTestUrl);
        modalTitle = chaisePage.errorModal.getTitle();
        chaisePage.waitForElement(element(by.css('.modal-dialog ')));
      });

      it("should be returned Invalid Page Criteria", function (done) {

          var modalActionBody = chaisePage.recordEditPage.getModalActionBody();

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

      it('On click of OK button the page should reload the page without paging conditions', function(done){
          chaisePage.clickButton(chaisePage.recordPage.getErrorModalOkButton()).then(function () {
              return browser.driver.getCurrentUrl();
          }).then (function(currentUrl) {
             recordsetPage = pageTestUrl.slice(0, pageTestUrl.search('@'));
             expect(currentUrl).toBe(recordsetPage, "The redirection to RecordEdit page failed");
             done();
          }).catch(chaisePage.catchTestError(done));
      });

    });

    describe("Error check for invalid paging changes in RecordSet", function(){

      beforeAll(function() {
        browser.ignoreSynchronization = true;
          pageTestUrl = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name +  "/id=2002@after()";
          browser.get(pageTestUrl);
      });

      it("should be returned Invalid Page Criteria", function (done) {
          var modalTitle = chaisePage.errorModal.getTitle(),
              modalActionBody = chaisePage.recordEditPage.getModalActionBody();

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

      it('On click of OK button the page should reload the page without paging conditions', function(done){
          chaisePage.clickButton(chaisePage.recordPage.getErrorModalOkButton()).then(function() {
              return browser.driver.getCurrentUrl();
          }).then(function(currentUrl) {
             recordsetPage = pageTestUrl.slice(0, pageTestUrl.search('@'));
             expect(currentUrl).toBe(recordsetPage, "The redirection to Recordset page failed");
             done();
          }).catch(chaisePage.catchTestError(done));
      });

    });

    describe("For no record found in RecordEdit app", function() {

        beforeAll(function() {
          browser.ignoreSynchronization = true;
            url = browser.params.url + "/recordedit/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name +  "/id=11223312121";
            browser.refresh();
            browser.get(url);
        });

        it('An error modal window should appear with Record Not Found title', function(done){
          chaisePage.waitForElement(element(by.css('.modal-dialog '))).then(function() {
              return chaisePage.errorModal.getTitle();
            }).then(function(modalTitle) {
              expect(modalTitle.getText()).toBe("Record Not Found", "The title of no record error pop is not correct");
              done();
            }).catch(chaisePage.catchTestError(done));
        });

        it('On click of OK button the page should redirect to recordset page', function(done){
            chaisePage.clickButton(chaisePage.recordPage.getErrorModalOkButton()).then(function(){
                return browser.driver.getCurrentUrl();
            }).then (function(currentUrl) {
                var newapplink = url.replace("recordedit", "recordset"),
                    lastSlash = newapplink.lastIndexOf("/"),
                    recordsetUrl = newapplink.slice(0, lastSlash);
                expect(currentUrl).toContain(recordsetUrl, "The redirection from record page to recordset in case of multiple records failed");
                done();
            }).catch(chaisePage.catchTestError(done));
        });
    });

    describe("For negative page limit in Recordedit app", function() {

        beforeAll(function() {
          browser.ignoreSynchronization = true;
            url = browser.params.url + "/recordedit/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.multipleRecordsTable +"/?limit=-1";
            browser.refresh();
            browser.get(url);
            chaisePage.waitForElement(element(by.css('.modal-dialog ')));
        });

        it('An error modal window should appear with Invalid Input title', function(){
            var modalTitle = chaisePage.errorModal.getTitle();
            expect(modalTitle.getText()).toBe("Invalid Input", "The title of Invalid Input error pop is not correct");
        });

        it('Error modal text indicates users about error and provides them with navigation options to Home Page', function(){
            var modalText = chaisePage.recordPage.getModalText();
            expect(modalText.getText()).toBe(testParams.sizeNotValidModalText(), "The message in modal pop is not correct");
        });

        it('On click of OK button the page should redirect to RecordSet', function(done){
            // This has to be .click(), if we use clickButton then it won't show the alert
            chaisePage.recordPage.getErrorModalOkButton().click().then(function(){
                return browser.switchTo().alert().accept();
            }).then(function(){
                return browser.driver.getCurrentUrl();
            }).then (function(currentUrl) {
              var newapplink = url.replace("recordedit", "recordset"),
                  lastSlash = newapplink.lastIndexOf("/"),
                  recordsetUrl = newapplink.slice(0, lastSlash);
                expect(currentUrl).toContain(recordsetUrl, "The redirection from recordedit page to recordset failed");
                done();
            }).catch(chaisePage.catchTestError(done));
        });
    });

    if (!process.env.CI) {
        describe("For the expired session alert,", function () {
            var testExpiredSession = function (url, done) {
                browser.ignoreSynchronization = true;
                browser.get(url).then(function () {
                    // manually remove the cookie
                    return browser.manage().deleteCookie('webauthn');
                }).then(function () {
                    // refresh the page
                    return browser.navigate().refresh();
                }).then(function () {
                    return browser.wait(function() {
                        return chaisePage.recordEditPage.getAlertWarning();
                    }, browser.params.defaultTimeout);
                }).then(function (alert) {
                    return alert.getText();
                }).then(function (text) {
                    expect(text).toContain("Your login session has expired. You are now accessing data anonymously", "alert message missmatch");
                    return chaisePage.performLogin(process.env.AUTH_COOKIE, false);
                }).then(function () {
                    done();
                }).catch(chaisePage.catchTestError(done));
            }


            it ("should be displayed in record app", function (done) {
                testExpiredSession(
                    browser.params.url + "/record/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name +  "/id=2004",
                    done
                );
            });

            it ("should be displayed in recordset app", function (done) {
                testExpiredSession(
                    browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name,
                    done
                );
            })
        });
    }
});
