const { element, browser } = require('protractor');
var Q = require('q');

var recordEditPage = function() {
    var that = this;

    // recordedit form view
    this.getEntityTitleElement = function() {
        return element(by.css('.form-container #page-title'));
    };

    this.getEntityTitleLinkElement = function() {
        return this.getEntityTitleElement().element(by.tagName('a'));
    };

    // resultset view
    this.getResultsetTitleElement = function() {
        return element(by.css('.resultset-container #page-title'));
    };

    this.getResultsetTitleLinkElement = function () {
        return this.getResultsetTitleElement().element(by.tagName('a'));
    };

    this.getAllColumnCaptions = function() {
        return browser.executeScript("return $('td.entity-key > span.column-displayname > span')");
    };

    this.getAllColumnNames = function() {
        return element.all(by.css("td.entity-key > span.column-displayname > span"));
    };

    this.getAllColumnPermissionOverlays = function () {
      return element.all(by.css(".column-permission-overlay"));
    }

    this.getColumnPermissionOverlay = function (rowIndex, displayName) {
        displayName = makeSafeIdAttr(displayName);
        return element(by.id("form-" + rowIndex + '-' + displayName + "-col-perm-overlay"));
    }

    this.getColumnPermissionError = function (rowIndex, displayName) {
        displayName = makeSafeIdAttr(displayName);
        return element(by.id("form-" + rowIndex + '-' + displayName + "-col-perm-warn"));
    };

    this.getDisabledRowIcon = function (rowIndex) {
        return element.all(by.css('.form-header')).get(rowIndex).all(by.css('.disabled-row-icon'));
    }

    this.getColumnCaptionsWithHtml = function() {
        return element.all(by.css('td.entity-key > span.column-displayname > span[ng-bind-html]'));
    };

    this.getColumnsWithUnderline = function() {
        return browser.executeScript("return $('td.entity-key > span.column-displayname[uib-tooltip]')");
    };

    this.getColumnWithAsterisk = function(el) {
        return browser.executeScript("return $(arguments[0]).parent().siblings('span[ng-if=\"::form.isRequired(columnIndex);\"].text-danger')[0];", el);
    };

    this.getColumnComment = function(el) {
        return el.getAttribute('uib-tooltip');
    };

    this.getInputForAPageColumn = function(el, index) {
        index = index || 0;
        return browser.executeScript("return $(arguments[0]).parents('tr').find('input.form-control')[0];", el);
    };

    this.getInputForAColumn = function(name, index) {
        index = index || 0;
        return browser.executeScript("return $('td.entity-value input[name=\"" + name + "\"]')[" + index + "];");
    };

    this.getTextAreaForAcolumn = function(name, index) {
        index = index || 0;
        return browser.executeScript("return $('td.entity-value textarea[name=\"" + name + "\"]')[" + index + "];");
    };

    this.getColorInputBackground = function (index, name) {
        index = index || 0;
        var script = "var color = $('td.entity-value input[name=\"" + name + "\"]:eq(" + index + ")').siblings('.sp-colorize-container').find('.sp-colorize').css('background-color');";
        script += "var ctx = document.createElement('canvas').getContext('2d');ctx.fillStyle = color;";
        script += "return ctx.fillStyle;";
        return browser.executeScript(script);
    };

    this.getColorInputBtn = function (index, columnDisplayName) {
        columnDisplayName = makeSafeIdAttr(columnDisplayName);
        return element(by.id("form-" + index + '-' + columnDisplayName + "-button"));
    }

    this.getColorInputPopup = function () {
        return element(by.css('.chaise-color-picker-popup:not(.sp-hidden)'));
    };

    this.getColorInputPopupInput = function () {
        return this.getColorInputPopup().element(by.css('.sp-input'));
    };

    this.getColorInputPopupClearBtn = function () {
        return this.getColorInputPopup().element(by.css('.sp-clear'));
    };

    this.getColorInputPopupSelectBtn = function () {
        return this.getColorInputPopup().element(by.css('.sp-choose'));
    };

    this.getHelpTextBlock = function(el) {
        return browser.executeScript("return $(arguments[0].siblings('.help-block'));", el);
    };

    this.getColumnSelectAllButton = function (name) {
        var columnDisplayName = makeSafeIdAttr(name);
        return element(by.id("select-all-"+columnDisplayName));
    };

    this.getSelectAllInput = function (name) {
        var columnDisplayName = makeSafeIdAttr(name);
        return element(by.id("select-all-"+columnDisplayName+"-input"));
    }

    this.getSelectAllDate = function (name) {
        return this.getSelectAllInput(name).element(by.css('input[name="' + name + '"][date]'));
    }

    this.getSelectAllTime = function (name) {
        return this.getSelectAllInput(name).element(by.css('input[name="' + name + '"][time]'));
    }

    this.getSelectAllPopupBtn = function (name) {
        return this.getSelectAllInput(name).element(by.className("modal-popup-btn"));
    }

    this.getSelectAllFileInput = function (name, name2) {
        return this.getSelectAllInput(name).element(by.css('input[name="' + name2 + '"]'));
    }

    this.getSelectAllTextArea = function (name) {
        return this.getSelectAllInput(name).element(by.css('textarea[name="' + name + '"]'));
    };

    this.getSelectAllApply = function (name) {
        var columnDisplayName = makeSafeIdAttr(name);
        return element(by.id("select-all-apply-"+columnDisplayName));
    }

    this.getSelectAllCancel = function (name) {
        var columnDisplayName = makeSafeIdAttr(name);
        return element(by.id("select-all-cancel-"+columnDisplayName));
    }

    // gets dropdowns relative to el
    this.getDropdownElements = function(el) {
        return el.element(by.xpath('ancestor::tr')).all(by.css(".chaise-input-control.dropdown-toggle"));
    };

    // gets all dropdowns
    this.getDropdowns = function() {
        return element.all(by.css(".chaise-input-control.dropdown-toggle"));
    };

    this.getDropdownText = function(el) {
        return el.element(by.css(".ng-binding"));
    };

    this.getBooleanInputDisplay = function(columnDisplayName, index) {
        columnDisplayName = makeSafeIdAttr(columnDisplayName);
        return element(by.id("form-" + index + '-' + columnDisplayName + "-display"));
    };

    this.getBooleanInputValue = function(columnDisplayName, index) {
        columnDisplayName = makeSafeIdAttr(columnDisplayName);
        return element(by.id("form-" + index + '-' + columnDisplayName + "-input"));
    };

    // Gets the boolean dropdown options after the input is opened and attached to input container
    // NOTE: could be more general because of how `.uib-dropdown-open` works
    this.getDropdownOptions = function() {
        return element(by.css(".uib-dropdown-open > .adjust-boolean-dropdown.dropdown-menu")).all(by.tagName('li'));
    }

    // Gets the boolean dropdown options when the dropdown is closed/hidden
    // the list is relative to the input when hidden
    this.getRelativeDropdownOptions = function(el) {
        // el is "form-x-colname-display"
        return el.element(by.xpath('ancestor::td')).all(by.tagName('li'));
    }

    this.getRelativeDropdownOptionsATag = function(el) {
        // el is "form-x-colname-display"
        return el.element(by.xpath('ancestor::td')).all(by.css('li a'));
    }

    this.getDropdownClear = function (el) {
        // el is "form-x-colname-display"
        return el.element(by.xpath('ancestor::td')).element(by.css(".boolean-remove"));
    }

    this.selectDropdownValue = function(dropdownEl, value) {
        var self = this;
        return dropdownEl.getText().then(function(txt) {
            var defer = Q.defer();
            // if the existing selection isn't the desired value,
            if (txt.trim() !== value) {
                // Click open the dropdown
                dropdownEl.click().then(function () {
                    // Get all the possible choices in the dropdown
                    return self.getDropdownOptions(dropdownEl)
                }).then(function (options) {
                    // loop through options and check for one that matches our value we want to click
                    options.forEach(function (option, index) {
                        option.element(by.tagName('a')).getAttribute("innerHTML").then(function (optionTxt) {
                            if (optionTxt.trim() == value + "") {
                                try {
                                    option.click()
                                } catch (e) {}
                                defer.resolve();
                            } else if (index == options.length-1) {
                                // we didn't match any and this is the last one
                                defer.reject();
                            }
                        });
                    });
                });

            } else {
                defer.resolve(txt);
            }
            return defer.promise;
        });
    };

    this.getCreateBtns = function() {
        return element.all(by.css(".create-record-btn"));
    };

    this.getModalPopupBtns = function() {
        return element.all(by.css(".modal-popup-btn"));
    };

    this.getModalPopupBtnsUsingScript = function() {
        return browser.executeScript("return $('.modal-popup-btn')");
    };

    this.getForeignKeyInputRemoveBtns = function() {
        return browser.executeScript("return $('.foreignkey-remove');");
    };

    this.getModalTitle = function() {
        return element(by.css(".modal-title"));
    };

    this.getModalActionBody = function() {
        return element(by.css('.modal-body')).all(by.tagName('span')).get(1);
    };

    this.getModalCloseBtn = function() {
        return element(by.css(".modal-close"));
    };

    this.getForms = function() {
        return element.all(by.css(".form-header"));
    };

    this.getForeignKeyInputDisplay = function(columnDisplayName, index) {
        columnDisplayName = makeSafeIdAttr(columnDisplayName);
        return element(by.id("form-" + index + '-' + columnDisplayName + "-display"));
    };

    this.getForeignKeyInputValue = function(columnDisplayName, index) {
        columnDisplayName = makeSafeIdAttr(columnDisplayName);
        return element(by.id("form-" + index + '-' + columnDisplayName + "-input"));
    };

    this.getForeignKeyInputButton = function(columnDisplayName, index) {
        columnDisplayName = makeSafeIdAttr(columnDisplayName);
        return element(by.id("form-" + index + '-' + columnDisplayName + "-button"));
    };

    this.getForeignKeyInputs = function() {
        return element.all(by.css(".popup-select-value"));
    };

    this.getUploadInput = function (columnName, index) {
        return element(by.id("form-" + index + '-' + columnName + "-input")).element(by.css("input[name='txt" + columnName + "']"));
    }

    this.getInputValue = function(columnName, index) {
        index = index || 0;
        return element(by.model('form.recordEditModel.rows[' + index + ']["' + columnName + '"]'));
    };

    this.getDateInputForAColumn = function(name, index) {
        index = index || 0;
        return element.all(by.css('input[name="' + name + '"][date]')).first();
    };

    this.getDatePickerForAnInput = function(el) {
        return browser.executeScript("return $(arguments[0]).parent().find('.ng-scope._720kb-datepicker-open')[0];", el);
    };

    this.getDateInputsForAColumn = function(name, index) {
        index = index || 0;
        var inputs = {};
        var inputControl = element(by.id("form-" + index + '-' + name + "-input"));
        inputs.date = inputControl.element(by.tagName("input"));
        inputs.todayBtn = inputControl.element(by.xpath('..')).element(by.css(".chaise-input-group-append > button"));
        return inputs;
    };

    // NOTE: currently only works for Date
    this.getRemoveButton = function (name, index, removeClass) {
        return element(by.id("form-" + index + '-' + name + "-input")).element(by.css("." + removeClass));
    }

    this.getTimestampInputsForAColumn = function(name, index) {
        index = index || 0;
        var inputs = {};
        inputs.date = element.all(by.css('input[name="' + name + '"][date]')).get(index);
        inputs.time = element.all(by.css('input[name="' + name + '"][time]')).get(index);
        inputs.meridiem = element.all(by.css('button[name="' + name + '"]')).get(index);
        inputs.nowBtn = element.all(by.css('button[name="' + name + '-now"]')).get(index);
        inputs.clearBtn = element.all(by.css('button[name="' + name + '-clear"]')).get(index);
        return inputs;
    };

    this.getIntegerInputForAColumn = function(name, index) {
        index = index || 0
        return browser.executeScript("return $('td.entity-value input[type=\"text\"][integer][name=\"" + name + "\"]')[" + index + "];");
    };

    this.getFloatInputForAColumn = function(name, index) {
        index = index || 0;
        return browser.executeScript("return $('td.entity-value input[type=\"text\"][float][name=\"" + name + "\"]')[" + index + "];");
    };

    this.submitForm = function() {
        return browser.executeScript("$('.alert-danger button').click(), $('button[type=\"submit\"]').click();");
    };

    this.getInputErrorMessage = function(el, type) {
        return browser.executeScript("return $(arguments[0]).parents('.chaise-input-control').siblings('.text-danger.ng-active').find('div[ng-message=\"" + type + "\"]')[0];", el);
    };

    this.getTimestampInputErrorMessage = function(el, type) {
        return browser.executeScript("return $(arguments[0]).parents('div[ng-switch-when=\"timestamp\"]').siblings('.text-danger.ng-active').find('div[ng-message=\"" + type + "\"]')[0];", el);
    };

    this.getJSONInputErrorMessage = function(el, type) {
        return browser.executeScript("return $(arguments[0]).parents('div[ng-switch-when=\"json\"]').siblings('.text-danger.ng-active').find('div[ng-message=\"" + type + "\"]')[0];", el);
    };

    this.getArrayInputErrorMessage = function(el) {
        return browser.executeScript("return $(arguments[0]).parents('div[ng-switch-when=\"array\"]').siblings('.text-danger.ng-active').find('div').text();", el);
    };

    this.getDateInputErrorMessage = function(el, type) {
        return browser.executeScript("return $(arguments[0]).parents('div[ng-switch-when=\"date\"]').siblings('.text-danger.ng-active').find('div[ng-message=\"" + type + "\"]')[0];", el);
    };

    this.getFileInputErrorMessage = function(el, type) {
        return browser.executeScript("return $(arguments[0]).parents('div[ng-switch-when=\"file\"]').siblings('.text-danger.ng-active').find('div[ng-message=\"" + type + "\"]')[0];", el);
    };

    this.getColorInputErrorMessage = function(el, type) {
        return browser.executeScript("return $(arguments[0]).parents('div[ng-switch-when=\"color\"]').siblings('.text-danger.ng-active').find('div[ng-message=\"" + type + "\"]')[0];", el);
    };

    this.clearInput = function(el) {
        return el.getAttribute('value').then(function(value) {
            el.sendKeys(Array(value.length + 1).join(protractor.Key.BACK_SPACE));
            browser.sleep(10);
        }).catch(function (err) {
            console.log(err)
        });
    };

    this.getDeleteRowButton = function(index) {
        index = index || 0;
        return browser.executeScript("return $('button.remove-form-btn')[" + index  + "];");
    };

    this.getAllDeleteRowButtons = function() {
        return browser.executeScript("return $('button.remove-form-btn');");
    };

    this.getDeleteModalButton = function() {
        return browser.executeScript("return $('.modal .btn-danger')[0]");
    };

    this.getDayButtonsForDatePicker = function(dp) {
        return browser.executeScript("return $(arguments[0]).find('._720kb-datepicker-calendar-day:not(._720kb-datepicker-disabled)');", dp);
    };

    /**
     * Returns a random number between min (inclusive) and max (exclusive)
     */
    this.getRandomArbitrary = function(min, max) {
        min = min || -32768;
        max = max || 32767;
        return Math.random() * (max - min) + min;
    };

    /**
     * Returns a random integer between min (inclusive) and max (inclusive)
     * Using Math.round() will give you a non-uniform distribution!
     */
    this.getRandomInt = function(min, max) {
        min = (min == undefined || min == null) ? -32768 : min;
        max = (max == undefined || max == null) ? 32767 : max;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    this.getAlertError = function() {
        /**
         * TODO while this is only used in recordedit, the submission might be
         * very fast and therefore by the time that we're calling this it's executing in record.
         * That's why I rewrote it to not use jQuery.
         * Also the way it's used in test it must be executeScript, but it might be
         * better to refactor where this function is called and then use element selector instead.
         */
        return browser.executeScript('return document.querySelector(\'.alert-danger\');');
    };

    this.getAlertErrorLinkHref = function() {
        return browser.executeScript("return $('.alert-danger:visible a')[0].getAttribute('href');");
    };

    this.getAlertWarning = function() {
        return element(by.css('.alert-warning'));
    };

    this.getViewModelRows = function() {
        return browser.executeScript("return $('div[ng-controller=\"FormController as form\"]').data().$ngControllerController.recordEditModel.rows;");
    };

    this.getSubmissionModelRows = function() {
        return browser.executeScript("return $('div[ng-controller=\"FormController as form\"]').data().$ngControllerController.recordEditModel.submissionRows;");
    };

    this.getSubmitRecordButton = function () {
        return element(by.id("submit-record-button"));
    };

    this.getMultiFormInput = function () {
        return element(by.id("copy-rows-input"));
    };

    this.getMultiFormInputSubmitButton = function () {
        return element(by.id("copy-rows-submit"));
    };

    this.getInputById = function (index, displayName) {
        displayName = makeSafeIdAttr(displayName);
        return element(by.id("form-" + index + '-' + displayName + "-input"));
    };

    this.getClearButton = function(el) {
        return browser.executeScript("return $(arguments[0]).parent().parent().find('.fa-xmark')[0]", el);
    };

    this.getDisabledResultSet = function () {
        return element(by.id("resultset-disabled-table"));
    };

    this.getDisabledResultSetHeader = function () {
        return element(by.id("resultset-disabled-table")).element(by.tagName("h3"));
    };

    this.getDisabledResultSetRows = function () {
        return element(by.id("resultset-disabled-table")).all(by.css('.chaise-table-row'));
    };

    this.getRecordSetTable = function() {
        return element(by.className('recordset-table'));
    };
};

var recordPage = function() {
    var that = this;
    this.getEntityTitleElement = function() {
        return element(by.css('.entity-title'));
    };

    this.getEntitySubTitleElement = function() {
        return element(by.css(".entity-subtitle"));
    };

    this.getColumns = function() {
        return element.all(by.css("tr:not(.forced-hidden) td.entity-key"));
    };

    this.getAllColumnNames = function() {
        return element.all(by.css('tr:not(.forced-hidden) td.entity-key > span.column-displayname > span'));
    };

    this.getColumnNameElement = function (columnDisplayName) {
        const displayName = makeSafeIdAttr(columnDisplayName);
        return element(by.css(`.entity-row-${displayName} td.entity-key > span.column-displayname`));
    };

    this.getAllColumnValues = function () {
        return element.all(by.css('tr:not(.forced-hidden) td.entity-value'));
    };

    this.getColumnValue = function(columnName) {
        return element(by.id("row-" + columnName)).element(by.css(".entity-value")).element(by.css("span"));
    };

    this.getLinkChild = function(el) {
        return el.element(by.css("a"));
    };

    this.getRelatedTables = function () {
        return element.all(by.css(".related-table-accordion:not(.forced-hidden)"));
    };

    this.getRelatedTable = function(displayName) {
        displayName = makeSafeIdAttr(displayName);
        return element(by.id("rt-" + displayName));
    };

    this.getEntityRelatedTable = function (displayName) {
        displayName = makeSafeIdAttr(displayName);
        return element(by.id("entity-" + displayName));
    };

    this.getEntityRelatedTableScope = function (displayName,safeId=false) { //if safeId==true then no need to call the function
        displayName = safeId?displayName:makeSafeIdAttr(displayName);
        return element(by.id("entity-" + displayName)).element(by.css(".ng-scope")).element(by.css(".ng-scope"));
    };

    this.getInlineRelatedTableInlineComment = function (displayname) {
        return this.getEntityRelatedTable(displayname).element(by.css(".inline-tooltip"));
    }

    this.getRelatedTableHeadings = function() {
        return element.all(by.css(".related-table-accordion"));
    };

    // TODO this function might not be needed and we should evaluate it during react migration
    //      (we might only need the getDisplayedRelatedTableTitles function)
    // given that we're using ng-show, this function is returning the hidden related tables too
    this.getRelatedTableTitles = function() {
        return browser.executeScript(`
          return Array.from(document.querySelectorAll('.related-table-accordion .rt-section-header .rt-displayname')).map((el) => el.textContent.trim());
        `);
    }
    // the following function only returns the related tables that are displayed
    this.getDisplayedRelatedTableTitles = function() {
      return browser.executeScript(`
          return Array.from(document.querySelectorAll('.related-table-accordion:not(.forced-hidden) .rt-section-header .rt-displayname')).map((el) => el.textContent.trim());
      `);
    }

    this.getRelatedTableAccordion = function(displayName) {
        displayName = makeSafeIdAttr(displayName);
        return element(by.id("rt-heading-" + displayName));
    };

    this.getRelatedTableHeading = function(displayName) {
        return this.getRelatedTableAccordion(displayName).element(by.css('.panel-heading'));
    };

    this.getRelatedTableSectionHeader = function(displayName) {
        return this.getRelatedTableHeading(displayName).element(by.css('.rt-section-header'));
    };

    this.getRelatedTableSectionHeaderDisplayname = function(displayName) {
        return this.getRelatedTableHeading(displayName).element(by.css('.rt-section-header .rt-displayname'));
    };

    this.getRelatedTableInlineComment = function(displayname) {
        return this.getRelatedTableAccordion(displayname).element(by.css('.inline-tooltip'));
    }

    this.getRelatedTableHeadingTitle = function(displayname) {
        displayName = makeSafeIdAttr(displayname);
        return element(by.id("rt-heading-" + displayName)).element(by.css('.panel-heading'))
    };

    this.getRelatedTableColumnNamesByTable = function(displayName) {
        displayName = makeSafeIdAttr(displayName);
        return element(by.id("rt-" + displayName)).all(by.css(".table-column-displayname > span"));
    };

    this.getRelatedTableRows = function(displayName, isInline) {
        var el = isInline ? this.getEntityRelatedTable(displayName) : this.getRelatedTable(displayName);
        return el.all(by.css(".chaise-table-row"));
    };

    this.getRelatedTableRowLink = function (displayName, rowIndex, isInline) {
        var rows = this.getRelatedTableRows(displayName, isInline);
        return rows.get(rowIndex).all(by.tagName("td")).first().all(by.css(".view-action-button")).first();
    };

    this.getRelatedTableRowEdit = function (displayName, rowIndex, isInline) {
        var rows = this.getRelatedTableRows(displayName, isInline);
        return rows.get(rowIndex).all(by.tagName("td")).first().element(by.css(".edit-action-button"));
    };

    this.getRelatedTableRowDelete = function (displayName, rowIndex, isInline) {
        var rows = this.getRelatedTableRows(displayName);
        return rows.get(rowIndex).all(by.tagName("td")).first().element(by.css(".delete-action-button"));
    };

    this.getMoreResultsLink = function(displayName, isInline) {
        var el = isInline ? this.getEntityRelatedTable(displayName) : this.getRelatedTableAccordion(displayName);
        // the link is not a child of the table, rather one of the accordion group
        return el.element(by.css(".more-results-link"));
    };

    this.getAddRecordLink = function(displayName, isInline) {
        var el = isInline ? this.getEntityRelatedTable(displayName) : this.getRelatedTableAccordion(displayName);
        // the link is not a child of the table, rather one of the accordion group
        return el.element(by.css(".add-records-link"));
    };

    this.getUnlinkRecordsLink = function(displayName, isInline) {
        var el = isInline ? this.getEntityRelatedTable(displayName) : this.getRelatedTableAccordion(displayName);
        // the link is not a child of the table, rather one of the accordion group
        return el.element(by.css(".unlink-records-link"));
    }

    this.getToggleDisplayLink = function(displayName, isInline) {
        var el = isInline ? this.getEntityRelatedTable(displayName) : this.getRelatedTableAccordion(displayName);
        // the link is not a child of the table, rather one of the accordion group
        return el.element(by.css(".toggle-display-link"));
    };

    this.getRelatedTableRowValues = function(displayName, isInline) {
        return this.getRelatedTableRows(displayName, isInline).all(by.tagName("td"));
    };

    this.getNoResultsRow = function(displayName, isInline) {
        var el = isInline ? this.getEntityRelatedTable(displayName) : this.getRelatedTable(displayName);
        return el.element(by.id("no-results-row"));
    };

    this.getCreateRecordButton = function() {
        return element(by.css(".title-buttons .create-record-btn"));
    };

    this.getEditRecordButton = function() {
        return element(by.css(".title-buttons .edit-record-btn"));
    };

    this.getCopyRecordButton = function() {
        return element(by.css(".title-buttons .copy-record-btn"));
    };

    this.getDeleteRecordButton = function () {
        return element(by.css(".title-buttons .delete-record-btn"));
    };

    this.getConfirmDeleteTitle = function() {
        return element(by.css(".confirm-delete-modal .modal-title"));
    };

    this.getConfirmDeleteButton = function () {
        return element(by.id("delete-confirmation"));
    }

    this.getShowAllRelatedEntitiesButton = function() {
        return element(by.css(".toggle-empty-sections"));
    };

    this.getShareButton = function() {
        return element(by.css('.share-cite-btn'));
    };

    this.getVersionedLinkElement = function() {
        return element(by.css('.share-modal-versioned-link'));
    };

    this.getLiveLinkElement = function() {
        return element(by.css('.share-modal-live-link'));
    };

    this.getModalText = function() {
        return element(by.css(".modal-body"));
    };

    this.getConfirmDeleteModalText = function () {
        return element(by.css(".confirm-delete-modal .modal-body"));
    }

    this.getErrorModalText = function () {
        return element(by.css(".modal-error .modal-body"));
    }

    this.getShareModal = function() {
        return element(by.css(".chaise-share-citation-modal"));
    };

    this.waitForCitation = function (timeout) {
        var locator = element.all(by.css('.citation-loader'));
        return browser.wait(function () {
            return locator.isDisplayed().then(function (arr) {
                return arr.includes(true) === false;
            }).catch(function () {
                return true;
            });
        }, timeout || browser.params.defaultTimeout);
    }

    this.getModalListElements = function() {
        return this.getModalText().all(by.tagName('li'));
    };

    this.getShareLinkHeader = function() {
        return element(by.css(".share-modal-links")).element(by.tagName('h2'));
    };

    this.getShareLinkSubHeaders = function() {
        return element(by.css(".share-modal-links")).all(by.tagName('h3'));
    };

    this.getCitationHeader = function() {
        return element(by.css(".share-modal-citation")).element(by.tagName('h2'));
    };

    this.getDownloadCitationHeader = function() {
        return element(by.css(".share-modal-download-citation")).element(by.tagName('h3'));
    };

    this.getCitationText = function() {
        return element(by.css(".share-modal-citation-text"));
    };

    this.getBibtex = function() {
        return element(by.css(".bibtex-download-btn"));
    };

    this.getModalDisabledRows = function () {
      return element.all(by.css('.modal-body tr.disabled-row'));
    };

    this.getSuccessAlert = function () {
        return element(by.css(".alert-success"));
    };

    this.getDeleteActionButtons = function (displayname) {
        return element(by.id("rt-" + displayname)).all(by.css(".btn-group .delete-action-button"));
    };

    this.getRelatedSectionSpinner = function () {
        return element(by.css(".related-section-spinner"));
    }

    this.getSidePanel = function() {
      return element(by.css('.side-panel-resizable'));
    }

    this.getSidePanelItemById = function (idx) {
        return element(by.id("recordSidePan-heading-" + idx));
    }

    this.getSidePanelHeadings = function() {
        return element.all(by.css("li.toc-heading"));
    };

    this.getSidePanelHeading = function () {
        return browser.executeScript('return $(".side-panel-heading").text()');
    }

    this.getSidePanelTableTitles = function() {
        return element.all(by.css('.columns-container li.toc-heading'));
    }

    this.getHideTocBtn = function() {
        return element(by.className('hide-toc-btn'));
    }

    this.getShowTocBtn = function() {
        return element(by.className('show-toc-btn'));
    }

    this.getModalHideFilterPanelBtn = function() {
        return element(by.css(".modal-body")).element(by.className('hide-filter-panel-btn'));
    }

    this.getModalSidePanel = function() {
        return element(by.css(".modal-body")).element(by.css('.side-panel-resizable'));
    }

    this.getMarkdownContainer = function (el) {
        return el.all(by.css(".markdown-container")).first();
    };
};

var recordsetPage = function() {
    var that = this;

    this.waitForInverseMainSpinner = function () {
        var locator = element(by.id("main-spinner"));
        return browser.wait(protractor.ExpectedConditions.invisibilityOf(locator), browser.params.defaultTimeout);
    };

    this.getPageTitleElement = function() {
        return element(by.id('page-title'));
    };

    this.getPageTitleTooltip = function () {
        return this.getPageTitleElement().element(by.css(".chaise-icon-for-tooltip"));
    };

    this.getPageTitleInlineComment = function () {
        return this.getPageTitleElement().element(by.css(".inline-tooltip"));
    };

    this.getPageSubtitle = function() {
        return browser.executeScript("return $('#page-subtitle).text();')");
    };

    this.getPageSubtitleElement = function() {
        return element(by.id('page-subtitle'));
    };

    this.getShowUnfilterdButton = function() {
        return element(by.id('show-unfiltered'));
    };

    this.getTotalCount = function() {
        return element(by.css('.chaise-table-header-total-count'));
    };

    this.getModalRecordsetTotalCount = function() {
        return element(by.css('.modal-body .chaise-table-header-total-count'));
    };

    this.getColumnNames = function() {
        return element.all(by.css(".table-column-displayname > span"));
    };

    this.getColumnSortButton = function(rawColumnName){
        return element(by.css('.c_' + rawColumnName)).element(by.css('.not-sorted-icon'));
    };

    this.getColumnSortAscButton = function(rawColumnName){
        return element(by.css('.c_' + rawColumnName)).element(by.css('.desc-sorted-icon'));
    };

    this.getColumnSortDescButton = function(rawColumnName){
        return element(by.css('.c_' + rawColumnName)).element(by.css('.asc-sorted-icon'));
    };

    this.getRows = function() {
        return element.all(by.css('.chaise-table-row'));
    };

    this.getRowCells = function (el) {
        return el.all(by.tagName("td"));
    };

    this.getModalRows = function () {
        return element.all(by.css('.modal-body .chaise-table-row'));
    };

    this.getModalColumnNames = function() {
        return element.all(by.css(".modal-body .table-column-displayname > span"));
    };

    this.waitForInverseModalSpinner = function () {
        var locator = element(by.css(".modal-body .recordest-main-spinner"));
        return browser.wait(protractor.ExpectedConditions.invisibilityOf(locator), browser.params.defaultTimeout);
    };

    this.getModalFirstColumnValues = function () {
        return browser.executeScript('return $(".modal-body .chaise-table-row td:nth-child(2)").map(function (i, a) { return a.textContent.trim(); });');
    };

    this.getModalFirstColumn = function () {
        return element.all(by.css(".modal-body .chaise-table-row td:nth-child(2)"));
    };

    this.getModalCloseBtn = function() {
        return element(by.css(".modal-close"));
    };

    this.getNoResultsRow = function() {
        return element(by.id("no-results-row"));
    };

    this.getColumnsWithTooltipIcon = function() {
        return element.all(by.css("span.table-column-displayname.chaise-icon-for-tooltip"));
    };

    this.getMainSearchBox = function(el) {
        var locator = by.className("recordset-main-search");
        return el ? el.element(locator) : element(locator);
    };

    this.getMainSearchPlaceholder = function (el) {
        return this.getMainSearchBox(el).element(by.className("chaise-input-placeholder"))
    }

    this.getMainSearchInput = function(el) {
        return this.getMainSearchBox(el).element(by.className("main-search-input"));
    };

    this.getSearchSubmitButton = function(el) {
        return this.getMainSearchBox(el).element(by.className("chaise-search-btn"));
    };

    this.getSearchClearButton = function(el) {
        return this.getMainSearchBox(el).element(by.className("remove-search-btn"));
    };

    this.getAddRecordLink = function(el) {
        var locator = by.css(".chaise-table-header-create-link");
        return el ? el.element(locator) : element(locator);
    };

    this.getEditRecordLink = function(el) {
        var locator = by.css(".chaise-table-header-edit-link");
        return el ? el.element(locator) : element(locator);
    };

    this.getInputForAColumn = function(name, index) {
        index = index || 0;
        return browser.executeScript("return $('td.entity-value input[name=\"" + name + "\"]')[" + index + "];");
    };

    this.getModalPopupBtn = function(index) {
        index = index || 0;
        return browser.executeScript("return $('.modal-popup-btn')[" + index + "];");
    };

    this.getActionHeaderSpan = function () {
        return element(by.css('.actions-header span'));
    }

    this.getViewActionButtons = function() {
        return element.all(by.css('.view-action-button'));
    };

    this.getEditActionButtons = function() {
        return element.all(by.css('.edit-action-button'));
    };

    this.getDeleteActionButtons = function() {
        return element.all(by.css('.delete-action-button'));
    };

    this.getConfirmDeleteTitle = function() {
        return element(by.css(".confirm-delete-modal .modal-title"));
    };

    this.getConfirmDeleteButton = function () {
        return element(by.id("delete-confirmation"));
    };

    this.getNextButton = function () {
        return element(by.css(".chaise-table-next-btn"));
    };

    this.getPreviousButton = function () {
        return element(by.css(".chaise-table-previous-btn"));
    };

    this.getPageLimitDropdown = function () {
        return element(by.css(".page-size-dropdown"));
    };

    this.getPageLimitSelector = function (limit) {
        return element(by.css(".page-size-limit-" + limit));
    };

    this.getExportDropdown = function () {
        return element(by.css(".export-menu")).element(by.tagName("button"));
    };

    this.getExportOptions = function () {
        return element.all(by.css(".export-menu-item"));
    };

    this.getExportOption = function (optionName) {
        var option = makeSafeIdAttr(optionName);
        return element(by.css(".export-" + option));
    };

    this.getExportModal = function () {
        return element(by.css(".export-progress"));
    }

    this.getPermalinkButton = function() {
        return element(by.id('permalink'));
    };

    this.getTableHeader = function () {
        return element(by.tagName("thead"));
    }

    this.getRecordsetColumnHeader = function (name) {
        return element(by.id(name + "-header"));
    };

    /******* Facet selectors for recordset with faceting ********/
    this.getHideFilterPanelBtn = function(el) {
        var locator = by.className('hide-filter-panel-btn');
        return el ? el.element(locator) : element(locator);
    }

    this.getShowFilterPanelBtn = function(el) {
        var locator = by.className('show-filter-panel-btn');
        return el ? el.element(locator) : element(locator);
    }

    this.getSidePanel = function() {
      return element(by.css('.side-panel-resizable'));
    }

    this.getAllFacets = function (){
        return element.all(by.css(".panel-group")).all(by.css(".facet-panel"));
    }

    this.getOpenFacets = function () {
        return element.all(by.css(".panel-open"));
    }

    this.getClosedFacets = function () {
        return element.all(by.css(".facet-panel button.collapsed"));
    }

    this.getFacetById = function (idx) {
        return element(by.css(".fc-" + idx));
    }

    this.getFacetHeaderById = function (idx) {
        return element(by.css(".fc-heading-" + idx)).element(by.css('.facet-header-text'));
    };

    this.getFacetHeaderButtonById = function (idx) {
        return this.getFacetById(idx).element(by.css('.fc-heading-' + idx + ' button'))
    }

    this.getFacetSearchBoxById = function (idx) {
        return element(by.css(".fc-" + idx)).element(by.css(".chaise-search-box"));
    }

    this.getFacetSearchPlaceholderById = function (idx) {
        return this.getFacetSearchBoxById(idx).element(by.className("chaise-input-placeholder"))
    }

    // get child of accordion group, sibling to accordion heading
    this.getFacetCollapse = function (idx) {
        return element(by.css(".fc-" + idx)).element(by.css(".accordion-collapse"));
    }

    this.getFacetTitles = function () {
        return element.all(by.css(".accordion-header .facet-header-text"));
    }

    this.getOpenFacetTitles = function () {
        return element.all(by.css(".panel-open .facet-header-text"));
    }

    this.getSelectedRowsFilters = function () {
        // adding ".selected-chiclet-name" to the selector to not select the clear-all-btn
        return element(by.css(".selected-chiclets")).all(by.css(".selected-chiclet .selected-chiclet-name"));
    }

    this.getFacetFilters = function () {
        return element(by.css(".chiclets-container")).all(by.css(".filter-chiclet"));
    }

    // NOTE: keeping around until angular apps are rewritten
    this.getAngularFacetFilters = function () {
        return element(by.css(".recordset-chiclets")).all(by.css(".filter-chiclet"));
    }

    this.getClearAllFilters = function () {
        return element(by.css(".clear-all-filters"));
    }

    this.getClearCustomFilters = function () {
        return element(by.className("clear-custom-filters"));
    }

    this.getClearCustomFacets = function () {
        return element(by.className("clear-custom-facets"));
    };

    this.getFacetOptions = function (idx) {
        return element(by.css(".fc-" + idx)).all(by.css(".chaise-checkbox label"));
    }

    this.getCheckedFacetOptions = function (idx) {
        return element(by.css(".fc-" + idx)).all(by.css(".chaise-checkbox input.checked"));
    }

    this.getFacetOptionsText = function (idx) {
      return browser.executeScript(`
        return Array.from(document.querySelectorAll('.fc-${idx} .chaise-checkbox label')).map((el) => el.textContent.trim())
      `);
    }

    // just getting the text content returns a stringified JSON value (that is not properly stringified) with hidden characters, stringifying that shows the hidden characters
    // but if we parse the odd stringfied version to JSON then stringify it, we can effectively clean up those hidden characters and get a simple string reprsentation
    this.getJsonbFacetOptionsText = function (idx) {
      return browser.executeScript(`
        return Array.from(document.querySelectorAll('.fc-${idx} .chaise-checkbox label')).map((el) =>  { try { return JSON.stringify(JSON.parse(a.textContent.trim())); } catch(e) { return a.textContent.trim()} })
      `);
    }

    // NOTE: keeping around until angular apps are rewritten
    this.getAngularFacetOption = function (idx, option) {
        return element(by.id("fc-" + idx)).element(by.id("checkbox-" + option));
    }

    this.getFacetOption = function (idx, option) {
        return element(by.css(".fc-" + idx)).element(by.css(".checkbox-" + option));
    }

    this.getFacetSearchBox = function (idx) {
        return element(by.css(".fc-" + idx)).element(by.css(".facet-search-input"));
    }

    this.getFacetSearchBoxClear = function (idx) {
        return element(by.css(".fc-" + idx)).element(by.css(".remove-search-btn"));
    }

    this.getList = function (idx) {
        return element(by.css(".fc-" + idx)).element(by.css(".chaise-list-container"));
    }

    this.getShowMore = function (idx) {
        return element(by.css(".fc-" + idx)).element(by.css(".show-more-btn"));
    }

    this.getCheckedModalOptions = function () {
        return element(by.css(".modal-body .recordset-table")).all(by.css(".chaise-checkbox input.checked"));
    }

    this.getModalOptions = function () {
        return element(by.css(".modal-body .recordset-table")).all(by.css(".chaise-checkbox input"));
    };

    this.getModalTotalCount = function (popup) {
        return popup.element(by.css('.chaise-table-header-total-count'));
    };

    this.getRecordsetTableModalOptions = function () {
        return element(by.css(".modal-body .recordset-table")).all(by.css(".chaise-checkbox input"));
    };

    this.getModalRecordsetTableOptionByIndex = function (popup, index) {
        return popup.element(by.css(".recordset-table")).all(by.css(".chaise-checkbox input")).get(index);
    };

    this.getModalClearSelection = function (popup) {
        return popup.element(by.css(".clear-all-btn"));
    }

    this.getModalSubmit = function () {
        return element(by.id("multi-select-submit-btn"));
    }

    this.getModalCancel = function () {
        return element(by.css(".modal-close"));
    }

    this.getRangeFacetForm = function (idx) {
        return element(by.css(".fc-"+ idx)).element(by.css("fieldset"));
    };

    // there's integer/float/date/timestamp inputs
    this.getRangeMinInput = function (idx, className) {
        return element(by.css(".fc-" + idx)).element(by.css("." + className));
    }

    this.getRangeMaxInput = function (idx, className) {
        return element(by.css(".fc-" + idx)).element(by.css("." + className));
    }

    this.getInputClear = function (idx, className) {
        return element(by.css(".fc-" + idx)).element(by.css("." + className));
    }

    this.getRangeInputValidationError = function (idx) {
        return element(by.css(".fc-" + idx)).element(by.css(".range-input-error"));
    }

    this.getRangeSubmit = function (idx) {
        return element(by.css(".fc-" + idx)).element(by.css(".range-input-submit-btn"));
    }

    this.getModalMatchNotNullInput = function () {
        return element(by.className("chaise-table-header-match-not-null"));
    };

    this.getModalMatchNullInput = function () {
        return element(by.className("chaise-table-header-match-null"));
    };

    this.getModalDisabledRows = function () {
        return element.all(by.css('.modal-body tr.disabled-row'));
    };

    this.getFacetSpinner = function (idx) {
        return element(by.css(".fc-" + idx)).element(by.css(".spinner"));
    };

    this.getDisabledFacetOptions = function (idx) {
        return element(by.css(".fc-" + idx)).all(by.css(".chaise-checkbox input[disabled]"));
    };

    this.getHistogram = function (idx) {
        return element(by.css(".fc-" + idx)).element(by.css(".js-plotly-plot"));
    };

    this.getPlotlyZoom = function (idx) {
        return element(by.css(".fc-" + idx)).element(by.css(".zoom-plotly-button"));
    };

    this.getPlotlyZoomDisabled = function (idx) {
        return element(by.css(".fc-" + idx)).all(by.css(".zoom-plotly-button[disabled]"));
    };

    this.getPlotlyUnzoom = function (idx) {
        return element(by.css(".fc-" + idx)).element(by.css(".unzoom-plotly-button"));
    };

    this.getPlotlyUnzoomDisabled = function (idx) {
        return element(by.css(".fc-" + idx)).all(by.css(".unzoom-plotly-button[disabled]"));
    };

    this.getPlotlyReset = function (idx) {
        return element(by.css(".fc-" + idx)).element(by.css(".reset-plotly-button"));
    };

    this.getModalWarningAlert = function (popup) {
        return popup.element(by.css(".alert-warning"));
    };

    this.getWarningAlert = function () {
        return element(by.css(".alert-warning"));
    };

    this.getWarningAlertDissmBtn = function () {
        return element(by.css(".alert-warning")).element(by.css("button"));
    };

    this.getSelectAllBtn = function () {
        return element(by.css(".table-select-all-rows"));
    };
};

var SearchPopup = function () {
    this.getAddPureBinaryPopup = function () {
        return element(by.className("add-pure-and-binary-popup"));
    };

    this.getUnlinkPureBinaryPopup = function () {
        return element(by.className("unlink-pure-and-binary-popup"));
    }

    this.getFacetPopup = function () {
        return element(by.className("faceting-show-details-popup"));
    };

    this.getScalarPopup = function () {
        return element(by.className("scalar-show-details-popup"));
    };

    this.getForeignKeyPopup = function () {
        return element(by.className("foreignkey-popup"));
    };
}

var errorModal = function () {
    var self = this;

    this.getToggleDetailsLink = function () {
        return element(by.css('.modal-error .toggle-error-details'));
    };

    this.getErrorDetails = function () {
        return element(by.css('.modal-error .error-details'));
    }

    this.getTitle = function () {
        return element(by.css(".modal-error .modal-title"));
    }

    this.getBody = function () {
        return element(by.css(".modal-error .modal-body"));
    }

    this.getOKButton = function () {
        return element(by.css('.modal-error .error-ok-button'));
    }

    this.getCloseButton = function () {
        return element(by.css('.modal-error .modal-close'));
    }

    this.getReloadButton = function () {
      return element(by.css('.modal-error .error-reload-button'));
    };
};

var navbar = function () {
    this.getBanner = function (key) {
        var selector = ".chaise-navbar-banner-container";
        if (key) {
            selector += ".chaise-navbar-banner-container-" + key;
        }
        return element(by.css(selector));
    }

    this.getBannerDismissBtn = function (key) {
        var banner = this.getBanner(key);
        return banner.element(by.css(".close"));
    }

    this.getHrefValue = function(element) {
        return browser.executeScript("return arguments[0].getAttribute('href');", element);
    };
}

// Makes a string safe and valid for use in an HTML element's id attribute.
// Commonly used for column displaynames.
function makeSafeIdAttr(string) {
    var ID_SAFE_REGEX = /[^\w-]+/g;
    return String(string).replace(ID_SAFE_REGEX, '-');
}

function chaisePage() {
    this.recordEditPage = new recordEditPage();
    this.recordPage = new recordPage();
    this.recordsetPage = new recordsetPage();
    this.errorModal = new errorModal();
    this.searchPopup = new SearchPopup();
    this.navbar = new navbar();

    this.clickButton = function(button) {
        return browser.executeScript("arguments[0].click();", button);
    };

    this.jqueryClickButton = function(button) {
        return browser.executeScript("$(arguments[0]).click();", button);
    };

    /**
     * For longer strings, the sendKeys can be very slow.
     * If the string length is more than 10, it will change the value of input directly
     * and then does the sendKeys for the last character, just to make sure it's
     * triggering angularjs digest cycle.
     */
    this.setInputValue = function (el, value) {
        var sendKeysVal = value;
        if (value.length > 10) {
            browser.executeScript("arguments[0].value='" + value.substring(0, value.length-1) + "';", el);
            sendKeysVal = value[value.length-1];
        }
        el.sendKeys(sendKeysVal);
    }
    this.customExpect = {
        elementContainClass: function (ele, className) {
            expect(ele.getAttribute('class')).toContain(className);
        }
    };
    this.getWindowName = function() {
        return browser.executeScript("return window.name;");
    };
    this.getPageId = function() {
        return browser.executeScript("return window.dcctx.contextHeaderParams.pid");
    };
    this.recordsetPageReady = function() {
        return this.waitForElement(element(by.css(".recordset-table")));
    }
    this.recordPageReady = function() {
        var self = this;
        this.waitForElement(self.recordPage.getEntityTitleElement());
        this.waitForElement(element(by.css('.record-main-section-table')));
        return this.waitForElementInverse(self.recordPage.getRelatedSectionSpinner());
    }
    this.recordeditPageReady = function() {
        this.waitForClickableElement(element(by.id("submit-record-button")));
        return this.waitForElementInverse(element(by.id("recordedit-main-spinner")));
    }
    this.setAuthCookie = function(url, authCookie) {
        if (url && authCookie) {
            // Visit the default page and set the authorization cookie if required
            this.navigate(url);
            browser.sleep(browser.params.defaultTimeout);
            browser.driver.executeScript('document.cookie="' + authCookie + 'path=/;secure;"');
        }
    };
    this.getConfig = function(paths) {
        var suite = browser.params.configuration.tests;
        for (var i = 0; i < paths.length; i++) {
            if (!suite) break;
            suite = suite[paths[i]];
        }

        if (!suite || suite == 'ignore') {
            return false;
        }
        return suite;
    };
    this.getCurrentContext = function() {

        var deferred = protractor.promise.defer();

        browser.executeScript('return window.location.hash;').then(function(hash) {
            var context = {};

            if (hash === undefined || hash == '' || hash.length == 1) {
                return deferred.fulfill(context);
            }

            var parts = hash.substring(1).split('/');
            context.catalogID = parts[0];
            if (parts[1]) {
                var params = parts[1].split(':');
                if (params.length > 1) {
                    context.schemaName = decodeURIComponent(params[0]);
                    context.tableName = decodeURIComponent(params[1]);
                } else {
                    context.tableName = decodeURIComponent(params[0]);
                }
            }

            // If there are filters appended to the URL, add them to context.js
            if (parts[2]) {
                context.filters = {};
                var filters = parts[2].split('&');
                for (var i = 0, len = filters.length; i < len; i++) {
                    var filter = filters[i].split('=');
                    if (filter[0] && filter[1]) {
                        context.filters[decodeURIComponent(filter[0])] = decodeURIComponent(filter[1]);
                    }
                }
            }

            deferred.fulfill(context);
        });

        return deferred.promise;
    };

    this.dataUtils = new (require('./page.utils.js'))();

    this.waitForUrl = function(expectedUrlFragment, timeout) {
        return browser.wait(function() {
            return browser.driver.getCurrentUrl().then(function(url) {
              return new RegExp(expectedUrlFragment).test(url);
            });
        }, timeout || browser.params.defaultTimeout);
    };

    this.waitForClickableElement = function (locator, timeout) {
        return browser.wait(protractor.ExpectedConditions.elementToBeClickable(locator), timeout || browser.params.defaultTimeout);
    };

    this.waitForElement = function (locator, timeout) {
        return browser.wait(protractor.ExpectedConditions.visibilityOf(locator), timeout || browser.params.defaultTimeout);
    };

    this.waitForElementInverse = function (locator, timeout) {
        return browser.wait(protractor.ExpectedConditions.invisibilityOf(locator), timeout || browser.params.defaultTimeout);
    };

    this.waitForElementCondition = function(condition, timeout) {
        return browser.wait(condition, timeout || browser.params.defaultTimeout);
    };

    /**
     * Given a text wait for it to be available in the element.
     * It waits for the result of locator.getText() to be the given `text`
     * NOTE it will ignore all the newlines, so you should not inlcude any in the `text`
     */
    this.waitForTextInElement = function(locator, text, timeout, message) {
        return browser.wait(protractor.ExpectedConditions.textToBePresentInElement(locator, text), timeout || browser.params.defaultTimeout, message);
    }

    this.waitForTextInUrl = function(text, errMsg, timeout){
        return browser.wait(protractor.ExpectedConditions.urlContains(text), timeout || browser.params.defaultTimeout, errMsg);
    }

    // schema - schema name
    // table - table name
    // row - array of objects in form of [{column: "column-name", value: "value"}, ...]
    this.getEntityRow = function (schema, table, row) {
        var match;
        var entities = browser.params.entities[schema][table];
        for (var i=0; i<entities.length; i++) {
            var entity = entities[i];
            // identifying information for entity could be multiple columns of data
            // which is the case for assocation tables
            for (var j=0; j<row.length; j++) {
                if (entity[row[j].column] == row[j].value) {
                    match = entity;
                } else {
                    match = null;
                    // move on to next entity
                    break;
                }
            }
            if (match) break;
        }
        return match;
    }

    this.getErmrest = function () {
        return browser.executeScript("return window");
    };

    this.getTooltipDiv = function() {
        return element(by.css('.tooltip'));
    };

    this.catchTestError = function (done) {
        return function (err) {
            done.fail(err);
        };
    };

    /**
     * Simulate the login process by navigating to a chaise page and
     * changing cookie and localStorage values.
     * NOTE if we change the cookie/localStorage that we're adding during login,
     *      this function needs to be updated too.
     */
    this.performLogin = function(cookie, isAlertPresent, defer) {
        defer = defer || require('q').defer();

        this.navigate(process.env.CHAISE_BASE_URL + "/login/");

        if(isAlertPresent){
            browser.switchTo().alert().accept();
        }


        browser.wait(protractor.ExpectedConditions.urlContains('/login/'), browser.params.defaultTimeout).then(function() {
            return browser.executeScript('document.cookie="' + cookie + ';path=/;' + (process.env.CI ? '"' : 'secure;"'))
        }).then(function() {
            return browser.executeScript('window.localStorage.setItem( \'session\', \'{"previousSession":true}\' );');
        }).then(function () {
            browser.ignoreSynchronization = false;
            defer.resolve();
        }).catch(function (err) {
            console.dir(err);
            defer.reject(err);
        });

        return defer.promise;
    };

    this.waitForAggregates = function (timeout) {
        var locator = element.all(by.css('.table-column-spinner'));
        return browser.wait(function () {
            return locator.isDisplayed().then(function (arr) {
                return arr.includes(true) === false;
            }).catch(function () {
                return true;
            });
        }, timeout || browser.params.defaultTimeout);
    };

    /**
     * the safe way to navigate to a page with or without angular
     * @param {string} url
     * @returns
     */
    this.navigate = function (url) {
      browser.waitForAngularEnabled(false);
      browser.ignoreSynchronization = true;
      return browser.get(url);
    }

    this.refresh = function (url) {
      this.navigate(url);
      return browser.refresh();
    }

    /**
     * hover over the element and see if the expected tooltip shows up or not
     * this function requires a done that will be called based on success/failure
     */
    this.testTooltipWithDone = function (el, expectedTooltip, done, appName) {
        this.testTooltipReturnPromise(el, expectedTooltip, appName).then(() => {
          done();
        }).catch(this.catchTestError(done));
    };

    /**
     * hover over the element and see if the expected tooltip shows up or not
     * this function returns a promise
     */
    this.testTooltipReturnPromise = function (el, expectedTooltip, appName, defer) {
        defer = defer || require('q').defer();
        const self = this;
        const tooltip = self.getTooltipDiv();
        // hover over the element
        browser.actions().mouseMove(el).perform();

        // wait for tooltip to show up
        self.waitForElement(tooltip).then(() => {
            expect(tooltip.getText()).toBe(expectedTooltip);

            // hover over an element that we know doesn't have tooltip to remove the tooltip
            if (appName === 'record') {
                browser.actions().mouseMove(self.recordPage.getEntityTitleElement()).perform();
            } else if (appName === 'recordset') {
                browser.actions().mouseMove(self.recordsetPage.getTotalCount()).perform();
            }

            // TODO what about other apps

            return self.waitForElementInverse(tooltip);
        }).then(() => {
            defer.resolve();
        }).catch((err) => {
            defer.reject(err);
        });

        return defer.promise;
    };
};

module.exports = new chaisePage();
