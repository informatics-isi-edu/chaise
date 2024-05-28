const { element, browser } = require('protractor');
var Q = require('q');

var recordEditPage = function() {
    var that = this;

    // recordedit form view

    // TODO playwright: renamed to getPageTitle
    this.getEntityTitleElement = function() {
        return element(by.css('.app-container #page-title'));
    };

    // TODO playwright: renamed to getPageTitleLink
    this.getEntityTitleLinkElement = function() {
        return this.getEntityTitleElement().element(by.tagName('a'));
    };

    this.getRequiredInfoEl = () => {
        return element(by.className('required-info'));
    }

    this.getAllColumnNames = function() {
        return element.all(by.css(".entity-key-column > .entity-key > span.column-displayname > span"));
    };

    this.getAllColumnPermissionOverlays = function () {
      return element.all(by.css(".column-permission-overlay"));
    }

    this.getColumnPermissionOverlay = function (formNumber, displayName) {
        displayName = makeSafeIdAttr(displayName);
        return element(by.css(".column-permission-overlay-" + formNumber + '-' + displayName));
    }

    this.getColumnPermissionError = function (formNumber, displayName) {
        displayName = makeSafeIdAttr(displayName);
        return element(by.css(".column-permission-warning-" + formNumber + '-' + displayName));
    };

    this.getColumnsWithUnderline = function() {
        return element.all(by.css('.entity-key-column > .entity-key > span.column-displayname.chaise-icon-for-tooltip'));
    };

    this.getColumnInlineComments = () => {
      return element.all(by.css('.inline-comment-row'));
    };

    this.getColumnWithAsterisk = function(el) {
        return el.element(by.xpath('./../..')).element(by.className('text-danger'));
    };

    this.getRecordeditForms = () => {
        return element.all(by.css('.recordedit-form .form-header'))
    }

    this.getCloneFormInput = function () {
        return element(by.id("copy-rows-input"));
    };

    this.getCloneFormInputSubmitButton = function () {
        return element(by.id("copy-rows-submit"));
    };

    this.getRecordeditResetButton = function () {
        return element(by.id('recordedit-reset'));
    };

    this.getSubmitRecordButton = function () {
        return element(by.id("submit-record-button"));
    };

    this.getBulkDeleteButton = function () {
        return element(by.id('bulk-delete-button'));
    };

    /* input selectors */
    this.getInputRemoveButton = function (name, index) {
        const inputName = 'c_' + index + '-' + name;
        return element(by.className('input-switch-container-' + inputName)).element(by.css('.remove-input-btn'));
    }

    this.clearInput = function(el) {
        return el.getAttribute('value').then(function(value) {
            el.sendKeys(Array(value.length + 1).join(protractor.Key.BACK_SPACE));
            browser.sleep(10);
        }).catch(function (err) {
            console.log(err)
        });
    };

    this.getInputForAColumn = function(name, index) {
        index = index || 1;
        const inputName = 'c_' + index + '-' + name;
        return element(by.className(inputName));
    };

    this.getInputById = function (index, displayName) {
        displayName = makeSafeIdAttr(displayName);
        return element(by.id("form-" + index + '-' + displayName + "-input"));
    };

    // NOTE: duplicate of getInputForAColumn, not removing this and refactoring tests since protractor tests will be deprecated soon
    this.getTextAreaForAColumn = function(name, index) {
        index = index || 1;
        const inputName = 'c_' + index + '-' + name;
        return element(by.className(inputName));
    };

    this.getDateInputsForAColumn = function(name, index) {
        index = index || 1;
        const inputName = 'c_' + index + '-' + name;
        const inputObj = {};
        // NOTE: duplicate of getInputForAColumn, not changing this since protractor tests will be deprecated soon
        inputObj.date = element(by.className(inputName));
        inputObj.todayBtn = element(by.css(`.input-switch-container-${inputName} .date-today-btn`));
        return inputObj;
    };

    this.getTimestampInputsForAColumn = function(name, index) {
        index = index || 1;
        const inputName = 'c_' + index + '-' + name;
        var inputObj = {};
        const container =  element(by.className(`input-switch-container-${inputName}`));
        inputObj.date = element(by.className(`${inputName}-date`));
        inputObj.time = element(by.className(`${inputName}-time`));
        inputObj.nowBtn = container.element(by.css('.date-time-now-btn'));
        inputObj.clearBtn = container.element(by.css('.date-time-clear-btn'));
        return inputObj;
    };

    this.getInputControlForAColumn = (name, index) => {
        index = index || 1;
        const inputName = 'c_' + index + '-' + name;
        return element(by.className('input-switch-container-' + inputName)).element(by.css('.chaise-input-control'));
    }

    this.getTextFileInputForAColumn = (name, index) => {
        index = index || 1;
        const inputName = 'c_' + index + '-' + name;
        return element(by.className('input-switch-container-' + inputName)).element(by.css('.chaise-input-control > span'));
    }

    /* Color input selectors */
    this.getColorInputForAColumn = (name, index) => {
        index = index || 1;
        const inputName = 'c_' + index + '-' + name;
        return element(by.className('input-switch-container-' + inputName)).element(by.tagName('input'));
    }

    this.getColorInputBackground = function (name, index) {
        index = index || 1;
        const inputName = 'c_' + index + '-' + name;
        var script = "var color = document.querySelector('.input-switch-container-" + inputName + " .chaise-color-picker-preview').style.backgroundColor;";
        script += "var ctx = document.createElement('canvas').getContext('2d');ctx.fillStyle = color;";
        script += "return ctx.fillStyle;";
        return browser.executeScript(script);
    };

    this.getColorInputBtn = function (name, index) {
        index = index || 1;
        const inputName = 'c_' + index + '-' + name;
        return element(by.css('.input-switch-container-' + inputName + ' button'));
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

    /* Multi form input selectors */
    this.getMultiFormToggleButton = function (name) {
        var columnDisplayName = makeSafeIdAttr(name);
        return element(by.css('.multi-form-' + columnDisplayName));
    };

    this.getMultiFormApplyBtn = function () {
        return element(by.css('.multi-form-input-apply-btn'));
    }

    this.getMultiFormClearBtn = function () {
        return element(by.css('.multi-form-input-clear-btn'));
    }

    this.getMultiFormCloseBtn = function () {
        return element(by.css('.multi-form-input-close-btn'));
    }

    this.getMultiFormInputCheckbox = function () {
        return element(by.css('.multi-form-input-checkbox input'));
    }

    this.getMultiFormInputCheckboxLabel = function () {
        return element(by.css('.multi-form-input-checkbox label'));
    }

    /* dropdown selectors */
    this.getDropdownElementByName = (name, index) => {
        index = index || 1;
        const inputName = 'c_' + index + '-' + name;
        return element(by.css('.input-switch-container-' + inputName + ' .dropdown-toggle'));
    }

    // foreign key dropdown selectors
    this.getFkeyDropdowns = () => {
        return element.all(by.css('.fk-dropdown'));
    }

    this.getDropdownSelectableOptions = () => {
        return element(by.css('.dropdown-menu.show')).all(by.css('.dropdown-select-value'));
    }

    this.getDropdownLoadMoreRow = () => {
        return element(by.css('.dropdown-menu .load-more-row'));
    }

    this.getDropdownSearch = () => {
        return element(by.css('.dropdown-menu .search-row .chaise-input-control input'));
    }

    // boolean dropdown selectors
    this.getDropdownText = (el) => {
        return el.element(by.css('.chaise-input-control'));
    };

    this.getOpenDropdownOptionsContainer = () => {
        return element(by.css(".dropdown-menu.show"));
    }

    // Gets the boolean dropdown options after the input is opened and attached to input container
    this.getDropdownOptions = function() {
        return element(by.css(".dropdown-menu.show")).all(by.tagName('li'));
    }

    this.selectDropdownValue = function(dropdownEl, value) {
        var self = this;
        return dropdownEl.getText().then(function(txt) {
            var defer = Q.defer();
            // if the existing selection isn't the desired value,
            if (txt.trim() !== value) {
                // Click open the dropdown
                dropdownEl.click().then(function () {
                    const optionsContainer = self.getOpenDropdownOptionsContainer();
                    return browser.wait(protractor.ExpectedConditions.visibilityOf(optionsContainer), browser.params.defaultTimeout);
                }).then(() => {
                    // Get all the possible choices in the dropdown
                    return self.getDropdownOptions();
                }).then(function (options) {
                    // loop through options and check for one that matches our value we want to click
                    options.forEach(function (option, index) {
                        option.getAttribute("innerHTML").then(function (optionTxt) {
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

    /* Foreign key input and popup selectors */
    this.getModalPopupBtns = function() {
        return element.all(by.css(".modal-popup-btn"));
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

    this.getForeignKeyInputDisplay = function(columnDisplayName, index) {
        columnDisplayName = makeSafeIdAttr(columnDisplayName);
        return element(by.id("form-" + index + '-' + columnDisplayName + "-display"));
    };

    this.getForeignKeyInputButton = function(columnDisplayName, index) {
        columnDisplayName = makeSafeIdAttr(columnDisplayName);
        return element(by.id("form-" + index + '-' + columnDisplayName + "-button"));
    };

    this.getForeignKeyInputClear = function(columnDisplayName, index) {
        return this.getForeignKeyInputDisplay(columnDisplayName, index).element(by.className('remove-input-btn'));
    };

    this.getForeignKeyInputs = function() {
        return element.all(by.css(".popup-select-value"));
    };

    /**
     * returns the cell (entity-value).
     * this is useful if we want to test the extra classes attached to it.
     */
    this.getFormInputCell = (name, index, isArray) => {
      index = index || 1;
      const inputName = 'c_' + index + '-' + name;

      if(isArray){
        return element(by.className('array-input-field-container ' + inputName)).element(by.xpath('..'));
      }
      return element(by.className('input-switch-container-' + inputName)).element(by.xpath('..'));
    };

    this.getInputSwitchContainer = (name, index) => {
      index = index || 1;
      const inputName = 'c_' + index + '-' + name;
      return element(by.className('input-switch-container-' + inputName))
    }
    // TODO: This is BAD, no column name should be hardcoded
    this.getInputSwitchContainerFK = (index) => {
        index = index || 1;
        const inputName = 'c_' + index + '-' + 'lIHKX0WnQgN1kJOKR0fK5A';
        return element(by.className('input-switch-container-' + inputName))
      }

    this.getIframeInputDisplay = (container, name, index) => {
      if (!container) {
        container = this.getInputSwitchContainer(name, index);
      }
      return container.element(by.css('.chaise-input-control'));
    };

    this.getIframeInputButton = (container, name, index) => {
      if (!container) {
        container = this.getInputSwitchContainer(name, index);
      }
      return container.element(by.css('.chaise-input-group-append button'));
    };

    this.getIframeInputClear = (container, name, index) => {
      if (!container) {
        container = this.getInputSwitchContainer(name, index);
      }
      return container.element(by.css('.input-switch-clear'));
    };

    this.getIframeInputPopupSpinner = () => {
      return element(by.className('iframe-field-modal-spinner'));
    };

    this.getIframeInputPopupIframe = () => {
      return element(by.css('.iframe-field-popup iframe'));
    };

    this.getIframeInputPopupSubmitBtn = () => {
      return element(by.id('iframe-submit-btn'));
    };

    this.getIframeInputPopupAlertBtn = () => {
      return element(by.id('iframe-alert-btn'));
    };

    this.getIframeInputPopupInputs = () => {
      return {
        creator: element(by.id('creator')),
        file_content: element(by.id('file-content')),
        notes: element(by.id('notes'))
      }
    }

    this.getIframeInputCancelPopup = () => {
      const modal = element(by.css('.confirm-iframe-close-modal'));
      return {
        element: modal,
        body: modal.element(by.css('.modal-body')),
        cancelButton: modal.element(by.css('.cancel-button'))
      };
    }

    this.submitForm = function() {
        const defer = Q.defer();

        element(by.css(('button[type="submit"]'))).click().then(() => {
            defer.resolve();
        });

        return defer.promise;
    };

    /* error message selectors */
    this.getErrorMessageForAColumn = (name, index) => {
        index = index || 1;
        const inputName = 'c_' + index + '-' + name;
        return element(by.className('input-switch-container-' + inputName)).element(by.css('.input-switch-error'));
    }

    this.getInputErrorMessage = function(el, type) {
        return el.element(by.xpath('./../..')).element(by.css('.input-switch-error'));
    };

    this.getJSONInputErrorMessage = function(el) {
        // similar input structure as array detailed below
        return el.element(by.xpath('./../../..')).element(by.css('.input-switch-error'));
    };

    this.getArrayInputErrorMessage = function(el) {
        /**
         * The error message is a sibling of the grandparent to the textarea. Get the great grandparent and select the error from there
         *  <div class='input-switch-container-{index}-{name}'>
         *    <div class='input-switch-array'>
         *      <div class='chaise-input-control'>
         *        <textarea class='c_{index}-{name}' />
         *      </div>
         *    </div>
         *    <span class='input-switch-error'>...</span>]
         *  </div>
         */
        return el.element(by.xpath('./../../..')).element(by.css('.input-switch-error'));
    };

    this.getDeleteRowButton = function(index) {
        index = index || 0;
        return this.getAllDeleteRowButtons().get(index);
    };

    this.getAllDeleteRowButtons = function() {
        return element.all(by.css('button.remove-form-btn'));
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

    /* alert selectors */

    // TODO use getAlertErrorElement instead of this
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

    this.getAlertErrorElement = (el) => {
      const locator = by.css('.alert-danger');
      return el ? el.element(locator) : element(locator);
    };

    this.getAlertErrorClose = (el) => {
      const locator = by.css('.alert-danger button')
      return el ? el.element(locator) : element(locator);
    }

    this.getAlertErrorLink = function(el) {
      const locator = by.css('.alert-danger a');
      return el ? el.element(locator) : element(locator);
    };

    this.getAlertWarning = function(el) {
      const locator = by.css('.alert-warning');
      return el ? el.element(locator) : element(locator);
    };

    this.getRecordSetTable = function() {
        return element(by.className('recordset-table'));
    };

    // ArrayField Selectors

    /**
     *
     * @typedef {Object} ArrayFieldContainerElement
     * @property {Function} getAddNewElementContainer - returns the add new element container for the given array field
     * @property {Function} getAddNewValueInputElement - returns add new element input element for a given array field
     * @property {Function} getClearInputButton - returns clear button for the current input
     * @property {Function} getErrorMessageElement - returns error message element for the current input
     * @property {Function} getAddButton - returns add button for a given array field
     * @property {Function} getRemoveButton - returns remove button for a given array field
     * @property {Function} getRemoveLastElementButton - returns remove button for last element in the arrayField
     * @property {Function} getLastArrayItem - returns the element added to the array
     * @property {Function} getArrayFieldValues - returns values of the arrayfield as an array
     * @property {Function} isAddButtonDisabled - returns true if Add button is disabled, false if otherwise
     */

    /**
     *
     * @param {string} fieldName - name of the column
     * @param {string} formNumber - form number
     * @param {string} baseType - baseType of the Array
     * @return {ArrayFieldContainerElement} arrayFieldContainer
     *
     */
    this.getArrayFieldContainer = function(colName, formNumber, baseType){
      formNumber = formNumber || 1;
      const fieldName = `c_${formNumber}-${colName}`;

      const elem = element(by.css(`.array-input-field-container-${fieldName}`));

      elem.getAddNewElementContainer = function(){
        return this.element(by.className("add-element-container"));
      }

      elem.getAddButton = function(){
        const addNewContainer = this.getAddNewElementContainer()
        return addNewContainer.element(by.className("add-button"))
      }

      elem.getRemoveButton = function () {
        return this.element(by.css('.array-remove-button'));
      }

      elem.getRemoveLastElementButton = async function(){
        try{
          const buttons = this.all(by.css(".action-buttons .fa-trash"));

          if(await buttons.count()){
            return buttons.last()
          }
          return null

        }catch (err){
          return null
        }
      }

      elem.getErrorMessageElement = function(){
        return this.element(by.className("input-switch-error"));
      }

      elem.isAddButtonDisabled = async function(){
        const addNewContainer = this.getAddNewElementContainer()
        const addButton = await addNewContainer.element(by.css('.chaise-btn-sm.add-button'))
        return !(await addButton.isEnabled());
      }

      switch(baseType){
        case 'date':
        case 'integer':
        case 'number':
        case 'text':
          elem.getAddNewValueInputElement = function(){
            const addNewContainer = this.getAddNewElementContainer()
            return addNewContainer.element(by.className(" input-switch"))
          }

          elem.getLastArrayItem = function(){
            return this.all(by.css(`li [class*="${fieldName}-"][class$="-val"] input`)).last();
          }

          elem.getArrayFieldValues = async function(){
            const arrElems = await this.all(by.css(`li [class*="${fieldName}-"][class$="-val"] input`));
            const extractedValues = []

            for( let item of arrElems){
              let val = await item.getAttribute('value')
              extractedValues.push(/number|integer/.test(baseType) ? JSON.parse(val) : val)
            }

            return extractedValues.length ? extractedValues : null;
          }

          elem.getClearInputButton = function () {
            const addNewContainer = this.getAddNewElementContainer();
            return addNewContainer.element(by.className('remove-input-btn'));
          }

        break;
        case 'boolean':
          elem.getArrayFieldValues = async function(){
            const arrElems = await this.all(by.css(`li [class*="${fieldName}-"][class$="-val"] input`));
            const extractedValues = []

            for( let item of arrElems){
              let val = await item.getAttribute('value')
              extractedValues.push(JSON.parse(val))
            }

            return extractedValues.length ? extractedValues : null;
          }
          break;
        case 'timestamp':
        case 'timestamptz' :
          elem.getAddNewValueInputElement = function(){
            const addNewContainer = this.getAddNewElementContainer()
            return [
              addNewContainer.element(by.className("input-switch-date")).element(by.className(" input-switch")),
              addNewContainer.element(by.className("input-switch-time")).element(by.className(" input-switch"))
          ]
          }

          elem.getLastArrayItem = function(){
            const dateInput = this.all(by.css(`li [class*="${fieldName}-"][class$="-val"] .input-switch-date input`)).last();
            const timeInput = this.all(by.css(`li [class*="${fieldName}-"][class$="-val"] .input-switch-time input`)).last();

            return [dateInput, timeInput];
          }

          elem.getArrayFieldValues = async function(){
            const dateInputs = await this.all(by.css(`li [class*="${fieldName}-"][class$="-val"] .input-switch-date input`));
            const timeInputs = await this.all(by.css(`li [class*="${fieldName}-"][class$="-val"] .input-switch-time input`));

            let dateTimeValues = []

            for(let i =0; i< dateInputs.length; i++){
              let dateVal = await dateInputs[i].getAttribute('value')
              let timeVal = await timeInputs[i].getAttribute('value')
              dateTimeValues.push([dateVal,timeVal])
            }

            return dateTimeValues.length ? dateTimeValues : null;
          }

          elem.getClearInputButton = function () {
            const addNewContainer = this.getAddNewElementContainer();
            return addNewContainer.element(by.className("date-time-clear-btn"));
          }

        break;
      }
      return  elem;
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

    this.getValueMarkdownContainer = function (el) {
        return el.element(by.css(".markdown-container:not(.chaise-comment)"));
    };

    /* related table selectors */
    this.getRelatedTables = function () {
        return element.all(by.css(".chaise-accordion:not(.forced-hidden)"));
    };

    this.getRelatedTable = function(displayName) {
        displayName = makeSafeIdAttr(displayName);
        return element(by.id("rt-" + displayName));
    };

    this.getEntityRelatedTable = function (displayName) {
        displayName = makeSafeIdAttr(displayName);
        return element(by.id("entity-" + displayName));
    };

    this.getInlineRelatedTableInlineComment = function (displayname) {
        return this.getEntityRelatedTable(displayname).element(by.css(".inline-tooltip"));
    }

    // TODO this function might not be needed and we should evaluate it during react migration
    //      (we might only need the getDisplayedRelatedTableTitles function)
    // given that we're using ng-show, this function is returning the hidden related tables too
    this.getRelatedTableTitles = function() {
        return browser.executeScript(`
          return Array.from(document.querySelectorAll('.chaise-accordion .chaise-accordion-header .chaise-accordion-displayname')).map((el) => el.textContent.trim());
        `);
    }
    // the following function only returns the related tables that are displayed
    this.getDisplayedRelatedTableTitles = function() {
      return browser.executeScript(`
          return Array.from(document.querySelectorAll('.chaise-accordion:not(.forced-hidden) .chaise-accordion-header .chaise-accordion-displayname')).map((el) => el.textContent.trim());
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
        return this.getRelatedTableHeading(displayName).element(by.css('.chaise-accordion-header'));
    };

    this.getRelatedTableSectionHeaderDisplayname = function(displayName) {
        return this.getRelatedTableHeading(displayName).element(by.css('.chaise-accordion-header .chaise-accordion-displayname'));
    };

    this.getRelatedTableInlineComment = function(displayname) {
        return this.getRelatedTableAccordion(displayname).element(by.css('.inline-tooltip'));
    }

    this.getRelatedTableColumnNamesByTable = function(displayName) {
        displayName = makeSafeIdAttr(displayName);
        return element(by.id("rt-" + displayName)).all(by.css(".table-column-displayname > span"));
    };

    /**
     * TODO
     * in playwright use RecordsetLocators.getRows instead and
     * pass the contaienr yourself.
     */
    this.getRelatedTableRows = function(displayName, isInline) {
        var el = isInline ? this.getEntityRelatedTable(displayName) : this.getRelatedTable(displayName);
        return el.all(by.css(".chaise-table-row"));
    };

    /* related table actions selectors */
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

    this.getDeleteActionButtons = function (displayname) {
        return element(by.id("rt-" + displayname)).all(by.css(".delete-action-button"));
    };

    this.getMoreResultsLink = function(displayName, isInline) {
        var el = isInline ? this.getEntityRelatedTable(displayName) : this.getRelatedTableAccordion(displayName);
        // the link is not a child of the table, rather one of the accordion group
        return el.element(by.css(".more-results-link"));
    };

    this.getBulkEditLink = function(displayName, isInline) {
      var el = isInline ? this.getEntityRelatedTable(displayName) : this.getRelatedTableAccordion(displayName);
      // the link is not a child of the table, rather one of the accordion group
      return el.element(by.css(".bulk-edit-link"));
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

    this.getNoResultsRow = function(displayName, isInline) {
        var el = isInline ? this.getEntityRelatedTable(displayName) : this.getRelatedTable(displayName);
        return el.element(by.id("no-results-row"));
    };

    /* record page action selectors */
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
        return element(by.css(".confirm-delete-modal .ok-button"));
    };

    this.getConfirmDeleteText = function () {
      return element(by.css(".confirm-delete-modal .modal-body"));
    };

    this.getShowAllRelatedEntitiesButton = function() {
        return element(by.css(".toggle-empty-sections"));
    };

    /* share citation popup selectors */
    this.getShareButton = function() {
        return element(by.css('.share-cite-btn'));
    };

    this.getVersionedLinkElement = function() {
        return element(by.css('.share-modal-versioned-link'));
    };

    this.getLiveLinkElement = function() {
        return element(by.css('.share-modal-live-link'));
    };

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

    /* general record modal selectors */
    this.getModalText = function() {
        return element(by.css(".modal-body"));
    };

    this.getConfirmDeleteModalText = function () {
        return element(by.css(".confirm-delete-modal .modal-body"));
    }

    this.getErrorModalText = function () {
        return element(by.css(".modal-error .modal-body"));
    }

    this.getModalDisabledRows = function () {
      return element.all(by.css('.modal-body tr.disabled-row'));
    };

    this.getRelatedSectionSpinner = function () {
        return element(by.css(".related-section-spinner"));
    }

    /* side panel selectors */
    this.getSidePanel = function() {
      return element(by.css('.side-panel-resizable'));
    }

    this.getSidePanelItemById = function (idx) {
        return element(by.id("recordSidePan-heading-" + idx));
    }

    this.getSidePanelHeadings = function() {
        return element.all(by.css("li.toc-heading"));
    };

    this.getSidePanelTableTitles = function() {
        return element.all(by.css('.columns-container li.toc-heading'));
    }

    this.getHideTocBtn = function() {
        return element(by.className('hide-toc-btn'));
    }

    this.getShowTocBtn = function() {
        return element(by.className('show-toc-btn'));
    }

    /**
     * TODO in playwright use the recordset function
     */
    this.getModalSidePanel = function() {
        return element(by.css(".modal-body")).element(by.css('.side-panel-resizable'));
    }
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

    this.getTotalCount = function() {
        return element(by.css('.chaise-table-header-total-count'));
    };

    this.getColumnNames = function() {
        return element.all(by.css(".table-column-displayname > span"));
    };

    this.getWarningAlert = function () {
        return element(by.css(".alert-warning"));
    };

    this.getSuccessAlert = () => element(by.css('.alert-success'));

    this.getAlerts = () => element.all(by.css('.alerts-container .alert'));

    /* sort selectors */
    this.getColumnSortButton = function(rawColumnName){
        return element(by.css('.c_' + rawColumnName)).element(by.css('.not-sorted-icon'));
    };

    this.getColumnSortAscButton = function(rawColumnName){
        return element(by.css('.c_' + rawColumnName)).element(by.css('.desc-sorted-icon'));
    };

    this.getColumnSortDescButton = function(rawColumnName){
        return element(by.css('.c_' + rawColumnName)).element(by.css('.asc-sorted-icon'));
    };

    /* main table selectors */
    this.getRows = function() {
        return element.all(by.css('.chaise-table-row'));
    };

    this.getRowCells = function (el) {
        return el.all(by.tagName("td"));
    };

    /**
     * TODO in playwright version, use rdsetLocators.getRows(rsModal)
     */
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

    this.getNoResultsRow = function() {
        return element(by.id("no-results-row"));
    };

    this.getColumnsWithTooltipIcon = function() {
        return element.all(by.css("span.table-column-displayname.chaise-icon-for-tooltip"));
    };

    /* main search selectors */
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

    /* table actions selectors */
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

    this.getAddRecordLink = function(el) {
        var locator = by.css(".chaise-table-header-create-link");
        return el ? el.element(locator) : element(locator);
    };

    this.getEditRecordLink = function(el) {
        var locator = by.css(".chaise-table-header-edit-link");
        return el ? el.element(locator) : element(locator);
    };

    // NOTE: used for making changes in recordedit app. Could be rewritten to use recordEditPage function instead
    this.getInputForAColumn = function(name, index) {
        index = index || 1;
        const inputName = 'c_' + index + '-' + name;
        return element(by.className(inputName));
    };

    // NOTE: used for making changes in recordedit app. Could be rewritten to use recordEditPage function instead
    this.getModalPopupBtn = function(columnDisplayName, index) {
        columnDisplayName = makeSafeIdAttr(columnDisplayName);
        return element(by.id("form-" + index + '-' + columnDisplayName + "-button"));
    };

    /* action column selectors */
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
      return element(by.css(".confirm-delete-modal .ok-button"));
    };

    /* saved query, export, and other page action selectors */
    this.getSavedQueryDropdown = () => element(by.css('.saved-query-menu')).element(by.tagName('button'));

    this.getSavedQueryOptions = () => element.all(by.css('.saved-query-menu-item'));

    this.getSaveQueryOption = () => element(by.partialLinkText('Save current search criteria'));

    this.saveQuerySubmit = () => element(by.id('modal-submit-record-btn'));

    this.getSavedQueriesOption = () => element(by.partialLinkText('Show saved search criteria'));

    this.getApplySavedQueryButtons = () => element.all(by.css('.apply-saved-query-button'));

    this.getDuplicateSavedQueryModal = () => element(by.css('.duplicate-saved-query-modal'));

    this.getExportDropdown = function () {
        return element(by.css(".export-menu")).element(by.tagName("button"));
    };

    this.getExportOptions = function () {
        return element.all(by.css(".export-menu-item"));
    };

    this.getExportOption = function (optionName) {
        var option = makeSafeIdAttr(optionName);
        return element(by.css(".export-menu-item-" + option));
    };

    this.getExportSubmenuOptions = function () {
      return element.all(by.css(".export-submenu-item"));
    };

    this.getExportSubmenuOption = function (optionName) {
      var option = makeSafeIdAttr(optionName);
      return element(by.css(".export-submenu-item-" + option));
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

    /******* Facet selectors for recordset with faceting ********/
    this.getHideFilterPanelBtn = function(el) {
        const locator = by.css('.hide-filter-panel-btn');
        return el ? el.element(locator) : element(locator);
    }

    this.getShowFilterPanelBtn = function(el) {
        const locator = by.css('.show-filter-panel-btn');
        return el ? el.element(locator) : element(locator);
    }

    this.getSidePanel = function(el) {
        const locator = by.css('.side-panel-resizable');
        return el ? el.element(locator) : element(locator);
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

    this.getFacetSearchBox = function (idx) {
        return element(by.css(".fc-" + idx)).element(by.css(".facet-search-input"));
    }

    this.getFacetSearchBoxClear = function (idx) {
        return element(by.css(".fc-" + idx)).element(by.css(".remove-search-btn"));
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

    /* facet and selected filters selectors */
    this.getSelectedRowsFilters = function () {
        // adding ".selected-chiclet-name" to the selector to not select the clear-all-btn
        return element(by.css(".selected-chiclets")).all(by.css(".selected-chiclet .selected-chiclet-name"));
    }

    this.getFacetFilters = function () {
        return element(by.css(".chiclets-container")).all(by.css(".filter-chiclet"));
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

    this.getFacetMoreFiltersText = function (idx) {
      return element(by.css(".fc-" + idx)).element(by.css('.more-filters'));
    }

    this.getFacetOptionsText = function (idx) {
      return browser.executeScript(`
        return Array.from(document.querySelectorAll('.fc-${idx} .chaise-checkbox label')).map((el) => el.textContent.trim())
      `);
    }

    this.getFacetOption = function (idx, option) {
        return element(by.css(".fc-" + idx)).element(by.css(".checkbox-" + option));
    }

    this.getList = function (idx) {
        return element(by.css(".fc-" + idx)).element(by.css(".chaise-list-container"));
    }

    this.getModalMatchNullInput = function () {
        return element(by.className("chaise-table-header-match-null"));
    };

    this.getModalDisabledRows = function () {
        return element.all(by.css('.modal-body tr.disabled-row'));
    };

    this.getDisabledFacetOptions = function (idx) {
        return element(by.css(".fc-" + idx)).all(by.css(".chaise-checkbox input[disabled]"));
    };

    /* facet show more and popup selectors */
    this.getShowMore = function (idx) {
        return element(by.css(".fc-" + idx)).element(by.css(".show-more-btn"));
    }

    this.getModalRecordsetTotalCount = function() {
        return element(by.css('.modal-body .chaise-table-header-total-count'));
    };

    this.getModalFirstColumn = function () {
        return element.all(by.css(".modal-body .chaise-table-row td:nth-child(2)"));
    };

    this.getModalCloseBtn = function() {
        return element(by.css(".modal-close"));
    };

    this.getCheckedModalOptions = function () {
        return element(by.css(".modal-body .recordset-table")).all(by.css(".chaise-checkbox input.checked"));
    }

    this.getModalOptions = function () {
        return element(by.css(".modal-body .recordset-table")).all(by.css(".chaise-checkbox input"));
    };

    this.getModalTotalCount = function (popup) {
        return popup.element(by.css('.chaise-table-header-total-count'));
    };

    /**
     * TODO playwright: use RecordsetLocators.getCheckboxInputs
     */
    this.getRecordsetTableModalOptions = function () {
        return element(by.css(".modal-body .recordset-table")).all(by.css(".chaise-checkbox input"));
    };

    /**
     * TODO playwright: use RecordsetLocators.getRowCheckboxInput
     */
    this.getModalRecordsetTableOptionByIndex = function (popup, index) {
        return popup.element(by.css(".recordset-table")).all(by.css(".chaise-checkbox input")).get(index);
    };

    this.getModalClearSelection = function (popup) {
        return popup.element(by.css(".clear-all-btn"));
    }

    this.getModalSubmit = function () {
        return element(by.id("multi-select-submit-btn"));
    }

    this.getSelectAllBtn = function () {
        return element(by.css(".table-select-all-rows"));
    };

    this.getModalWarningAlert = function (popup) {
        return popup.element(by.css(".alert-warning"));
    };

    /* range facet selectors */
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

    /* histogram selectors */
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

    this.getElement = function () {
        return element(by.css('.modal-error'));
    };

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
        return element(by.css('.modal-error .ok-button'));
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
        return this.waitForClickableElement(element(by.id("submit-record-button")));
    }

    this.setAuthCookie = function(url, authCookie) {
        if (url && authCookie) {
            // Visit the default page and set the authorization cookie if required
            this.navigate(url);
            browser.sleep(browser.params.defaultTimeout);
            browser.driver.executeScript('document.cookie="' + authCookie + 'path=/;secure;"');
        }
    };

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
    this.performLogin = function(cookie, defer) {
        defer = defer || require('q').defer();

        this.navigate(process.env.CHAISE_BASE_URL + "/login/");

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
            } else if (appName === 'recordedit') {
                browser.actions().mouseMove(self.recordEditPage.getRequiredInfoEl()).perform();
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
