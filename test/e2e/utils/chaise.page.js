/**
 *
 * Created by shuai on 1/14/16.
 *
 * To store reusable elements and functions.
 *
 */

var Q = require('q');

function tools() {
    this.getRandomInt = function (min, max) {
        //include min and max
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    this.getSiblingByCss = function (ele, cssStr) {
        return ele.element(by.xpath('following-sibling::' + cssStr));
    }
};

var toolkit = new tools();

/*
    Utility object for finding elements under '#sidebar' element.
 */
var sidebarId = '#sidebar';
function sidebar() {
    var that = this;
    this.htmlElement = $(sidebarId);
    this.searchInput = this.htmlElement.$('div.search-box > input');
    this.sidebarAttrsDisplayed = this.htmlElement.all(by.css('ul.sidebar-nav li.ng-scope:not(.ng-hide)'));
    this.getSidebarAttrsDisplayed = function() {
        return this.htmlElement.all(by.css('ul.sidebar-nav li.ng-scope:not(.ng-hide)'));
    };
    this.sidebarHeader = this.htmlElement.$('#navcontainer h4');
    this.viewMoreBtn = this.htmlElement.element(by.cssContainingText('li a', 'View all attributes'));
    this.findSidebarAttrVisibleByName = function(attrName) {
        return that.htmlElement.element(by.cssContainingText('ul li.ng-scope:not(.ng-hide) a', attrName));
    };
    this.findSidebarAttrByName = function (attrName) {
        return that.htmlElement.element(by.cssContainingText('ul li.ng-scope a', attrName));
    };
    this.isSidebarAttrDisplayed = function (attrName) {
        var defer = Q.defer(), resolved = false;
        that.htmlElement.all(by.cssContainingText('ul li.ng-scope:not(.ng-hide) a', attrName)).then(function(elements) {
            var resolvedCount = 0;
            elements.forEach(function(e) {
                e.getText().then(function(txt) {
                    if (!resolved) {
                        if (txt.trim() == attrName) {
                            resolved = true;
                        }
                    }

                    if (++resolvedCount == elements.length) {
                        defer.fulfill(resolved);
                    };
                });
            });
        }, function(err) {
            throw err;
        });

        return defer.promise;
    };
    this.clickSidebarAttr = function (attrName) {
        that.htmlElement.all(by.cssContainingText('ul li.ng-scope:not(.ng-hide) a', attrName)).then(function(elements) {
            var resolved = 0;
            elements.forEach(function(e) {
                e.getText().then(function(txt) {
                    if (!resolved) {
                        if (txt.trim() == attrName) {
                            resolved = true;
                            e.click();
                        }
                    }
                });
            });
        }, function(err) {
            throw err;
        });
    };
};

/*
 Utility object for finding elements under '#morefilters' element.
 */
var moreFilterId = '#morefilters';
function moreFilter() {
    var that = this;
    this.htmlElement = $(moreFilterId);
    this.sidebarHeader = this.htmlElement.$('div.sidebar-title h4');
    this.findFirstUncheckedAttrCheckBox = function () {
        return that.htmlElement.
        all(by.css('label[ng-class="sideBar.getMoreFieldValueClass(facet)"]:not(.toggler--is-active)')).first();
    };
    this.findFirstCheckedAttrCheckBox = function () {
        return this.findAllCheckedAttrCheckbox().first();
    };
    this.findAllCheckedAttrCheckbox = function() {
        return this.htmlElement.all(by.css('label[ng-class="sideBar.getMoreFieldValueClass(facet)"].toggler--is-active'));
    };
    this.findMorefilterAttrByName = function (attrName) {
        return this.htmlElement.element(by.cssContainingText('div.editvalue-container' +
            ' div[ng-repeat="facet in FacetsData.facets"] label', attrName));
    };
    this.clickMorefilterAttrByName = function(attrName) {
        var defer = protractor.promise.defer();

        return this.htmlElement.all(by.cssContainingText('div.editvalue-container' +
            ' div[ng-repeat="facet in FacetsData.facets"] label', attrName)).then(function(elements) {
                var resolved = false;
                elements.forEach(function(e) {
                    e.getText().then(function(txt) {
                        if (!resolved && txt.trim() == attrName) {
                            resolved = true;
                            e.click();
                            defer.fulfill();
                        }
                    });
                });
        });

        return defer.promise;
    };
    this.goBackToSidebar = function () {
        that.sidebarHeader.click();
    };
};

/*
 Utility object for finding elements under '#editfilter' element.
 */
var editFilterId = '#editfilter';
function editFilter() {
    var that = this;
    this.htmlElement = $(editFilterId);
    this.sidebarHeader = this.htmlElement.$('div.sidebar-title h4');
    this.editFilterAttrsDisplayed = this.htmlElement.all(by.css('ul.nav.filteritems li.ng-scope:not(.ng-hide)'));
    this.getEditFilterAttrsDisplayed = function() {
        return this.htmlElement.all(by.css('ul.nav.filteritems li.ng-scope:not(.ng-hide)'));
    }
    this.findEditfilterAttrByName = function (attrName) {
        return that.htmlElement.element(by.cssContainingText('ul.nav.filteritems li.ng-scope:not(.ng-hide) label', attrName));
    };
    this.clickEditFilter = function (attrName) {
        that.findEditfilterAttrByName(attrName).click();
    };
    this.getCheckedEditFilters = function() {
        return this.htmlElement.all(by.css('ul.nav.filteritems li.ng-scope:not(.ng-hide) label[ng-class="sideBar.getFieldValueClass(FacetsData.tag, value)"].toggler--is-active'));
    };
    this.goBackToSidebar = function () {
        that.sidebarHeader.click();
    };
    this.findEditFilterLiByName = function (attrName) {
        return that.htmlElement.element(by.cssContainingText('ul.nav.filteritems li.ng-scope:not(.ng-hide)', attrName));
    };
    this.findCheckStatusDivByName = function (attr) {
        return that.findEditFilterLiByName(attr).$('div[ng-click="sideBar.checkUncheck($event,value)"]');
    }
};

function contentFilter() {
    var that = this;
    var filterEle = '#filter';
    this.htmlElement = $(filterEle);
    this.clearAllBtn = this.htmlElement.element(by.cssContainingText('div.filter-item.ng-scope > a', 'Clear All Filters'));
    this.displayedFilters = this.htmlElement.all(by.css('div.filter-item.ng-scope:not(.ng-hide)'));
    this.clickClearAllBtn = function () {
        that.clearAllBtn.click();
    };
    this.findFilterWrapperByName = function (attrName) {
        return that.htmlElement.element(by.cssContainingText('div.filter-item.ng-scope:not(.ng-hide)', attrName))
    };
    this.findFilterWrapperTitleByWrapperName = function (wrapperAttrName) {
        return browser.executeScript("return $('div.filter-item.ng-scope:not(.ng-hide):contains(\"" + wrapperAttrName + "\") span[ng-attr-title=\"{{facetResults.displayTitle(facet)}}\"]').attr('title');");
    };
    this.clickFilterWrapperCancelByName = function (attrName) {
        that.findFilterWrapperByName(attrName).$('a.filter-link-cancel').click();
    };
    this.findCheckedSubfiltersByName = function (attrName) {
        return that.findFilterWrapperByName(attrName).all(by.css('span.filter-item-value.ng-scope > span'));
    };
};

function resultContent() {
    var that = this;
    this.resultAllRows = element.all(by.repeater('row in FacetsData.ermrestData'));
    this.resultTally = element.all(by.css('#results_tally')).get(1);
    this.numOfRecords = this.resultTally.all(by.css('strong')).last();
    this.currentRecordCount = this.resultTally.all(by.css('strong')).first();
    this.getResultRowsByViewType = function(viewType) {
        return element.all(by.css('[ng-show="FacetsData.view==\'list\'"]'));
    };
    this.permalink = element(by.css('#permalink'));
    this.filter = new contentFilter();
    this.getAllResultRows = function() {
        return element.all(by.repeater('row in FacetsData.ermrestData'));
    };
    this.getResultTally = function() {
        return element.all(by.css('#results_tally')).get(1);
    };
    this.getNumOfRecords = function() {
        return this.resultTally.all(by.css('strong')).last();
    };
    //ele is element found using resultAllRows.get(idx);
    this.getResultTitleElement = function (ele) {
        return ele.$('span.panel-title.ng-binding');
    };
    this.getResultTitleAnchorUrl = function (ele) {
        return ele.$('div.panel-heading a').getAttribute('href');
    }
    this.getResultImgElement = function (ele) {
        return ele.$('img');
    };
    this.getResultInvestigatorElement = function (ele) {
        return ele.element(by.cssContainingText('dt.ng-binding', 'Investigator'));
    };
    this.getResultInvestigatorContent = function (ele) {
        var investEle = that.getResultInvestigatorElement(ele);
        return toolkit.getSiblingByCss(investEle, 'dd');
    };
    this.getResultSummaryElement = function (ele) {
        return ele.element(by.cssContainingText('dt.ng-binding', 'Summary'));
    };
    this.getResultSummaryContent = function (ele) {
        var summaryEle = that.getResultSummaryElement(ele);
        return toolkit.getSiblingByCss(summaryEle, 'dd');
    }
};

function detailedPage() {
    var that = this;
    this.entityTitle = $('#entity-title');
    this.getEntityTitle = function() {
        return $('#entity-title');
    };
    this.findEntityKeyByName = function (entityName) {
        //return element(by.css('.entity-key.ng-binding:contains("' + entityName + '")'));
        //return element(by.xpath('//span[.=\'' + entityName + '\']'));
        return element(by.cssContainingText('span.entity-key', entityName));
    };
    this.findEntityValueByName = function (entityName) {
        var entityKey = that.findEntityKeyByName(entityName);
        var parentEl = entityKey.element(by.xpath('..'));
        return toolkit.getSiblingByCss(parentEl, 'td');
    };
    this.findAssociationKeyByName = function (associateName) {
        return element(by.xpath('//td[.=\'' + associateName + '\']'));
    };
    this.findAssociationValueByName = function (associateName) {
        var associationKeyElement = that.findAssociationKeyByName(associateName);
        return toolkit.getSiblingByCss(associationKeyElement, 'td');
    };
    this.findToggleWrapperByName = function (keyName) {
        return element(by.cssContainingText('.panel-group div.panel.panel-default', keyName))
    };
    this.clickToggleWrapperByName = function (keyName) {
        that.findToggleWrapperByName(keyName).click();
    };
};


var recordEditPage = function() {
    var that = this;
    this.getEntityTitle = function() {
        return browser.executeScript("return $('#entity-title').text();");
    };

    this.getAllColumnCaptions = function() {
        return browser.executeScript("return $('td.entity-key').find('span[ng-class=\"{\\'coltooltiplabel\\': column.comment}\"]');");
    };

    this.getColumnsWithUnderline = function() {
        return browser.executeScript("return $('td.entity-key').find('span[ng-class=\"{\\'coltooltiplabel\\': column.comment}\"].coltooltiplabel');");
    };

    this.getColumnWithAsterisk = function(el) {
        return browser.executeScript("return $(arguments[0]).siblings('span[ng-if=\"::form.isRequired(column);\"].text-danger')[0];", el);
    };

    this.getColumnComment = function(el) {
        return browser.executeScript("return $(arguments[0]).next('.coltooltiptext')[0];", el);
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

    this.getHelpTextBlock = function(el) {
        return browser.executeScript("return $(arguments[0].siblings('.help-block'));", el);
    };

    this.getInputErrorMessage = function(el, type) {
        return browser.executeScript("return $(arguments[0]).siblings('.text-danger.ng-active').find('div[ng-message=\"" + type + "\"]')[0];", el);
    };

    this.getDropdown = function(el, index) {
        index = index || 0;
        return browser.executeScript("return $(arguments[0]).parents('tr').find('.select2-container')[" + index + "];", el);
    };

    this.selectDropdownValue = function(el, value) {
        return this.getDropdownText(el).then(function(txt) {
            var defer = Q.defer();
            if (txt.trim() !== value) {
                browser.executeScript(" $(arguments[0]).find('.select2-choice').click();", el);
                browser.sleep(100);
                browser.executeScript("return $(arguments[0]).find('.select2-result-single li');", el).then(function(items) {
                    if (value != undefined) {
                        browser.executeScript("$(arguments[0]).data().$uiSelectController.select('" + value + "');", el);
                        defer.resolve(value);
                    } else {
                        var index = that.getRandomInt(0, items.length - 1);
                        try {
                             items[index].click();
                        } catch(e) {}
                        defer.resolve();
                    }
                });
            } else {
                defer.resolve(txt);
            }
            return defer.promise;
        });
    };

    this.getDropdownText = function(el) {
        return browser.executeScript("return $(arguments[0]).find('.select2-chosen:not(\".ng-hide\")').text().trim();", el);
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

    this.getModalCloseBtn = function() {
            return element(by.css(".modal-close"));
    };

    this.getFormTitle = function() {
        return element(by.id("entity-title"));
    };

    this.getForeignKeyInputValue = function(columnDisplayName, index) {
        return element(by.id("row-" + index + '-' + columnDisplayName + "-input"));
    };

    this.getInputValue = function(columnName, index) {
        index = index || 0;
        return element(by.model('form.recordEditModel.rows[' + index + ']["' + columnName + '"]'));
    };

    this.getDatePickerForAnInput = function(el) {
        return browser.executeScript("return $(arguments[0]).parent().find('.ng-scope._720kb-datepicker-open')[0];", el);
    };

    this.getTimestampInputsForAColumn = function(name, index) {
        index = index || 0;
        var inputs = {};
        inputs.date = element.all(by.css('input[name="' + name + '"][date]')).first();
        inputs.time = element.all(by.css('input[name="' + name + '"][time]')).first();
        inputs.meridiem = element.all(by.css('button[name="' + name + '"]')).first();
        return inputs;
    };

    this.getIntegerInputForAColumn = function(name, index) {
        index = index || 0
        return browser.executeScript("return $('td.entity-value input[type=\"number\"][integer][name=\"" + name + "\"]')[" + index + "];");
    };

    this.getFloatInputForAColumn = function(name, index) {
        index = index || 0;
        return browser.executeScript("return $('td.entity-value input[type=\"number\"][float][name=\"" + name + "\"]')[" + index + "];");
    };

    this.submitForm = function() {
        return browser.executeScript("$('.alert-danger button').click(), $('button[type=\"submit\"]').click();");
    };

    this.getInputErrorMessage = function(el, type) {
        return browser.executeScript("return $(arguments[0]).siblings('.text-danger.ng-active').find('div[ng-message=\"" + type + "\"]')[0];", el);
    };

    this.getDateInputErrorMessage = function(el, type) {
        return browser.executeScript("return $(arguments[0]).parent().siblings('.text-danger.ng-active').find('div[ng-message=\"" + type + "\"]')[0];", el);
    };

    this.clearInput = function(el) {
        return el.getAttribute('value').then(function(value) {
            el.sendKeys(Array(value.length + 1).join(protractor.Key.BACK_SPACE));
            browser.sleep(10);
        });
    };

    this.getAddRowButton = function() {
        return browser.executeScript("return $('#copy-record-btn')[0];");
    };

    this.getDeleteRowButton = function(index) {
        index = index || 0;
        return browser.executeScript("return $('delete-link button')[" + index  + "];");
    };

    this.getAllDeleteRowButtons = function() {
        return browser.executeScript("return $('delete-link button');");
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

    this.recordBookmark = function() {
        return element(by.id('detailed-bookmark-container'));
    };

    this.getAlertError = function() {
        return browser.executeScript("return $('.alert-danger:visible')[0];");
    };

    this.getRecordModelRows = function() {
        return browser.executeScript("return $('div[ng-controller=\"FormController as form\"]').data().$ngControllerController.recordEditModel.rows;");
    };

    this.getDeleteRecordButton = function () {
        return element(by.id("delete-button"));
    };

    this.getSubmitRecordButton = function () {
        return element(by.id("submit-record-button"));
    };

    this.getMultiFormInputOpenButton = function () {
        return element(by.id("copy-x-rows-btn"));
    };

    this.getMultiFormInputOpenButtonScript = function () {
        return browser.executeScript("return $('#copy-x-rows-btn')");
    };

    this.getMultiFormInput = function () {
        return element(by.id("copy-rows-input"));
    };

    this.getMultiFormInputSubmitButton = function () {
        return element(by.id("copy-rows-submit"));
    };

    this.getMultiFormInputSubmitButtonScript = function () {
        return browser.executeScript("return $('#copy-rows-submit')");
    };

    this.getInputById = function (index, displayName) {
        return element(by.id("form-" + index + '-' + displayName + "-input"));
    };
};

var recordPage = function() {
    var that = this;
    this.getEntityTitle = function() {
        return browser.executeScript("return $('#entity-title').text();");
    };

    this.getEntityTitleElement = function() {
        return element(by.id("entity-title"));
    };

    this.getEntitySubTitle = function() {
        return browser.executeScript("return $('#entity-subtitle').text();");
    };

    this.getColumns = function() {
        return browser.executeScript("return $('tr[ng-repeat=\"column in columns\"]')");
    };

    this.getAllColumnCaptions = function() {
        return browser.executeScript("return $('td.entity-key').find('span[ng-class=\"{\\'coltooltiplabel\\': column.comment}\"]');");
    };

    this.getColumnsWithUnderline = function() {
        return browser.executeScript("return $('td.entity-key').find('span[ng-class=\"{\\'coltooltiplabel\\': column.comment}\"].coltooltiplabel');");
    };

    this.getColumnWithAsterisk = function(el) {
        return browser.executeScript("return $(arguments[0]).siblings('span[ng-if=\"!column.nullok\"].text-danger')[0];", el);
    };

    this.getColumnComment = function(el) {
        return browser.executeScript("return $(arguments[0]).next('.coltooltiptext')[0];", el);
    };

    this.getColumnValueElements = function() {
        return browser.executeScript("return $('.entity-value > span.ng-scope');");
    };

    this.getColumnValue = function(columnName) {
        return element(by.id("row-" + columnName)).element(by.css(".entity-value")).element(by.css(".ng-scope"));
    };

    this.getLinkChild = function(el) {
        return browser.executeScript("return $(arguments[0]).find('a')[0];", el);
    };

    this.getRelatedTables = function() {
        return element.all(by.css(".related-table"));
    };

    this.getRelatedTable = function(displayName) {
        return element(by.id("rt-" + displayName));
    };

    this.getRelatedTableHeadings = function() {
        return element.all(by.css(".related-table-heading"));
    };

    this.getRelatedTableTitles = function() {
        return browser.executeScript("return $('.related-table-heading .panel-title').map(function(i, a) { return a.textContent.trim(); });");
    }

    this.getRelatedTableHeading = function(displayName) {
        return element(by.id("rt-heading-" + displayName));
    };

    this.getRelatedTableColumnNamesByTable = function(displayName) {
        return element(by.id("rt-" + displayName)).all(by.css(".table-column-displayname"));
    };

    this.getRelatedTableRows = function(displayName) {
        return element(by.id("rt-" + displayName)).all(by.css(".table-row"));
    };

    this.getMoreResultsLink = function(displayName) {
        // the link is not a child of the table, rather one of the accordion group
        return element(by.id("rt-heading-" + displayName)).element(by.css(".more-results-link"));
    };

    this.getAddRecordLink = function(displayName) {
        // the link is not a child of the table, rather one of the accordion group
        return element(by.id("rt-heading-" + displayName)).element(by.css(".add-records-link"));
    };

    this.getToggleDisplayLink = function(displayName) {
        // the link is not a child of the table, rather one of the accordion group
        return element(by.id("rt-heading-" + displayName)).element(by.css(".toggle-display-link"));
    };

    this.getRelatedTableRowValues = function(displayName) {
        return that.getRelatedTableRows(displayName).all(by.tagName("td"));
    };

    this.getCreateRecordButton = function() {
        return element(by.id("create-record"));
    };

    this.getEditRecordButton = function() {
        return element(by.id("edit-record"));
    };

    this.getCopyRecordButton = function() {
        return element(by.id("copy-record"));
    };

    this.getDeleteRecordButton = function () {
        return element(by.id("delete-record"));
    };

    this.getConfirmDeleteTitle = function() {
        return element(by.css(".modal-title"));
    };

    this.getConfirmDeleteButton = function () {
        return element(by.id("delete-confirmation"));
    }

    this.getShowAllRelatedEntitiesButton = function() {
        return element(by.id("show-all-related-tables"));
    };

    this.getPermalinkButton = function() {
        return element(by.id('permalink'));
    };
};

var recordsetPage = function() {
    this.getPageTitle = function() {
        return browser.executeScript("return $('#page-title').text();");
    };

    this.getCustomPageSize = function() {
        return browser.executeScript("return $('#custom-page-size').text().trim();");
    };

    this.getColumns = function() {
        return element.all(by.css(".table-column-displayname"));
    };

    this.getRows = function() {
        return element.all(by.css('.table-row'));
    };

    this.getColumnsWithUnderline = function() {
        return browser.executeScript("return $('td.entity-key').find('span[ng-class=\"{\\'coltooltiplabel\\': column.comment}\"].coltooltiplabel');");
    };

    this.getColumnComment = function(el) {
        return browser.executeScript("return $(arguments[0]).next('.coltooltiptext')[0];", el);
    };

    this.getSearchBox = function() {
        return element(by.id("search-input"));
    };

    this.getSearchSubmitButton = function() {
        return element(by.id("search-submit"));
    };

    this.getSearchClearButton = function() {
        return element(by.id("search-clear"));
    };

    this.getAddRecordButton = function() {
        return element(by.id("add-record-btn"));
    };

    this.getInputForAColumn = function(name, index) {
        index = index || 0;
        return browser.executeScript("return $('td.entity-value input[name=\"" + name + "\"]')[" + index + "];");
    };

    this.getModalPopupBtn = function(index) {
        index = index || 0;
        return browser.executeScript("return $('.modal-popup-btn')[" + index + "];");
    };
};

function chaisePage() {
    this.sidebar = new sidebar();
    this.moreFilter = new moreFilter();
    this.editFilter = new editFilter();
    this.resultContent = new resultContent();
    this.detailedPage = new detailedPage();
    this.recordEditPage = new recordEditPage();
    this.recordPage = new recordPage();
    this.recordsetPage = new recordsetPage();
    this.tools = new tools();
    this.tourButton = element(by.css('.tour-start-btn'));
    this.tourBox = element(by.css('.tour-DataBrowserTour'));
    this.clickButton = function(button) {
        return browser.executeScript("$(arguments[0]).click();", button);
    };
    this.customExpect = {
        elementContainClass: function (ele, className) {
            expect(ele.getAttribute('class')).toContain(className);
        }
    };
    this.setAuthCookie = function(url, authCookie) {
        if (url && authCookie) {
            // Visit the default page and set the authorization cookie if required
            browser.get(url);
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
        }, timeout || 5000);
    };

    this.waitForElement = function (locator, timeout) {
        return browser.wait(protractor.ExpectedConditions.visibilityOf(locator), timeout || 5000);
    };
};

module.exports = new chaisePage();
