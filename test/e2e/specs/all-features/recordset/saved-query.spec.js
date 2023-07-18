const chaisePage = require('../../../utils/chaise.page.js');
const pImport = require('../../../utils/protractor.import.js');
const EC = protractor.ExpectedConditions;

const testParams = {
  table_name: 'main',
  minInputClass: 'range-min',
  minInputClearClass: 'min-clear',
  maxInputClass: 'range-max',
  maxInputClearClass: 'max-clear',
  firstSavedQueryName: 'main with int_col ( 11 to 22)',
  secondSavedQueryName: 'main with int_col ( 11 to 22); one'
};

const chaiseConfigAnnotation = {
  'tag:isrd.isi.edu,2019:chaise-config': {
    savedQueryConfig: {
      defaultName: {
        totalTextLimit: 80,
      },
      storageTable: {
        catalog: browser.params.catalogId,
        schema: 'saved_query',
        table: 'saved_query',
        columnNameMapping: {
          queryId: 'query_id',
          catalog: 'catalog',
          schemaName: 'schema_name',
          tableName: 'table_name',
          userId: 'user_id',
          queryName: 'name',
          description: 'description',
          facets: 'facets',
          encodedFacets: 'encoded_facets',
          lastExecutionTime: 'last_execution_time'
        }
      }
    }
  },
  'tag:misd.isi.edu,2015:display': {
    show_saved_query: true
  }
}

describe('View recordset page and form a query,', () => {

  describe('For table ' + testParams.table_name + ',', () => {

    beforeAll((done) => {
      // add chaise-config catalog annotation once we have the catalog id
      pImport.updateCatalogAnnotation(browser.params.catalogId, chaiseConfigAnnotation).then(() => {
        const url = browser.params.url + '/recordset/#' + browser.params.catalogId + '/saved_query:' + testParams.table_name;
        return chaisePage.navigate(url);
      }).then(() => {
        return chaisePage.recordsetPageReady();
      }).then(() => {
        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('should show a saved query dropdown', (done) => {
      const sqDropdown = chaisePage.recordsetPage.getSavedQueryDropdown();

      expect(sqDropdown.isDisplayed()).toBe(true, 'The saved query dropdown button is not visible on the recordset app');
      sqDropdown.click().then(() => {

        const savedQueryMenuItems = chaisePage.recordsetPage.getSavedQueryOptions();
        expect(savedQueryMenuItems.count()).toBe(2, 'incorrect number of saved query options');
        // close the dropdown
        return sqDropdown.click();
      }).then(() => {
        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('apply filter in int_col facet and open save query form', (done) => {
      const facetIdx = 1;

      // inputs
      const minInput = chaisePage.recordsetPage.getRangeMinInput(facetIdx, testParams.minInputClass);
      const maxInput = chaisePage.recordsetPage.getRangeMaxInput(facetIdx, testParams.maxInputClass);

      // clear buttons
      const minClear = chaisePage.recordsetPage.getInputClear(facetIdx, testParams.minInputClearClass);
      const maxClear = chaisePage.recordsetPage.getInputClear(facetIdx, testParams.maxInputClearClass);

      // facet should be open on page load
      chaisePage.waitForElement(chaisePage.recordsetPage.getFacetCollapse(facetIdx));
      chaisePage.waitForElement(chaisePage.recordsetPage.getRangeSubmit(facetIdx));

      // wait for histogram
      chaisePage.waitForElement(chaisePage.recordsetPage.getHistogram(facetIdx));

      // first clear the min and max
      chaisePage.waitForElement(minClear);
      chaisePage.waitForClickableElement(minClear);

      minClear.click().then(() => {
        return chaisePage.clickButton(maxClear);
      }).then(() => {
        minInput.sendKeys('11');
        maxInput.sendKeys('22');

        return chaisePage.recordsetPage.getRangeSubmit(facetIdx).click();
      }).then(() => {
        // wait for table rows to load
        browser.wait(() => {
          return chaisePage.recordsetPage.getRows().count().then((ct) => {
              return ct == 12;
          });
        }, browser.params.defaultTimeout);

        return chaisePage.recordsetPage.getRows().count();
      }).then((ct) => {
        expect(ct).toBe(12, 'number of rows is incorrect for "int_col" facet selection');

        // close the facet
        return chaisePage.recordsetPage.getFacetHeaderButtonById(facetIdx).click();
      }).then(() => {
        return chaisePage.recordsetPage.getSavedQueryDropdown().click();
      }).then(() => {
        const saveQueryOption = chaisePage.recordsetPage.getSaveQueryOption();

        return saveQueryOption.click();
      }).then(() => {
        chaisePage.waitForElement(chaisePage.recordsetPage.saveQuerySubmit());

        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('have correct modal title and default values then save the query', (done) => {
      expect(chaisePage.recordEditPage.getModalTitle().getText()).toBe('Save current search criteria for table main', 'modal title is incorrect');

      const queryNameInput = chaisePage.recordEditPage.getInputForAColumn('name');
      expect(queryNameInput.getAttribute('value')).toBe(testParams.firstSavedQueryName, 'default saved query name is incorrect');

      const descriptionInput = chaisePage.recordEditPage.getTextAreaForAColumn('description');
      expect(descriptionInput.getAttribute('value')).toBe('main with:\n  - int_col (1 choice): int_col ( 11 to 22);', 'default description is incorrect');

      chaisePage.recordsetPage.saveQuerySubmit().click().then(() => {
        return chaisePage.recordsetPage.getSuccessAlert();
      }).then((al) => {
        expect(al.getText()).toContain('SuccessSearch criteria saved.', 'alert message incorrect');

        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('open apply saved queries modal, verify query was saved, and close the modal', (done) => {
      chaisePage.clickButton(chaisePage.recordsetPage.getSavedQueryDropdown()).then(() => {
        const savedQueriesOption = chaisePage.recordsetPage.getSavedQueriesOption();

        return savedQueriesOption.click();
      }).then(() => {
        browser.wait(() => {
          return chaisePage.recordsetPage.getModalRows().count().then((ct) => {
              return ct == 1;
          });
        }, browser.params.defaultTimeout);

        return chaisePage.recordsetPage.getModalRows().count();
      }).then((ct) => {
        expect(ct).toBe(1, 'number of saved queries incorrect');

        return chaisePage.recordsetPage.getModalCloseBtn().click();
      }).then(() => {
        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('try to save the same query again', (done) => {
      chaisePage.recordsetPage.getSavedQueryDropdown().click().then(() => {
        const saveQueryOption = chaisePage.recordsetPage.getSaveQueryOption();

        return saveQueryOption.click();
      }).then(() => {
        chaisePage.waitForElement(chaisePage.recordsetPage.getDuplicateSavedQueryModal());

        expect(chaisePage.recordEditPage.getModalTitle().getText()).toBe('Duplicate Saved Search', 'modal title is incorrect');
        expect(element(by.css('.modal-body')).getText()).toContain('name "' + testParams.firstSavedQueryName + '"', 'modal contains incorrect saved query name text');
        
        return chaisePage.recordsetPage.getModalCloseBtn().click();
      }).then(() => {
        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('apply filter in text_col facet and open save query form', (done) => {
      const facetIdx = 6;

      chaisePage.recordsetPage.getFacetHeaderButtonById(facetIdx).click().then(() => {
        // wait for facet checkboxes to load
        browser.wait(() => {
          return chaisePage.recordsetPage.getFacetOptions(facetIdx).count().then((ct) => {
              return ct == 6;
          });
        }, browser.params.defaultTimeout);

        const optionIdx = 2;
        return chaisePage.recordsetPage.getFacetOption(facetIdx, optionIdx).click();
      }).then(() => {
        return chaisePage.recordsetPage.getSavedQueryDropdown().click();
      }).then(() => {
        const saveQueryOption = chaisePage.recordsetPage.getSaveQueryOption();

        return saveQueryOption.click();
      }).then(() => {
        chaisePage.waitForElement(chaisePage.recordsetPage.saveQuerySubmit());

        const queryNameInput = chaisePage.recordEditPage.getInputForAColumn('name');
        expect(queryNameInput.getAttribute('value')).toBe(testParams.secondSavedQueryName, 'default saved query name is incorrect');

        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('change name and description then save the query', (done) => {
      const queryNameInput = chaisePage.recordEditPage.getInputForAColumn('name');
      chaisePage.recordEditPage.clearInput(queryNameInput);
      queryNameInput.sendKeys('Second saved query');

      const descriptionInput = chaisePage.recordEditPage.getTextAreaForAColumn('description');
      chaisePage.recordEditPage.clearInput(descriptionInput);
      descriptionInput.sendKeys('Second query description');

      chaisePage.recordsetPage.saveQuerySubmit().click().then(() => {
        browser.wait(() => {
          return chaisePage.recordsetPage.getAlerts().count().then((ct) => {
              return ct == 2;
          });
        }, browser.params.defaultTimeout);

        return chaisePage.recordsetPage.getAlerts().count();
      }).then((ct) => {
        expect(ct).toBe(2, 'number of alerts incorrect');

        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('open apply saved query modal, verify 2 queries now, and apply first saved query', (done) => {
      chaisePage.recordsetPage.getSavedQueryDropdown().click().then(() => {
        const savedQueriesOption = chaisePage.recordsetPage.getSavedQueriesOption();

        return savedQueriesOption.click();
      }).then(() => {
        browser.wait(() => {
          return chaisePage.recordsetPage.getModalRows().count().then((ct) => {
              return ct == 2;
          });
        }, browser.params.defaultTimeout);

        return chaisePage.recordsetPage.getModalRows().count();
      }).then((ct) => {
        expect(ct).toBe(2, 'number of saved queries incorrect');

        return chaisePage.recordsetPage.getApplySavedQueryButtons();
      }).then((btns) => {
        return btns[0].click();
      }).then(() => {
        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('should change the filters applied and show first query that was saved', (done) => {
      chaisePage.recordsetPageReady().then(() => {
        browser.wait(() => {
          return chaisePage.recordsetPage.getRows().count().then((ct) => {
              return ct == 12;
          });
        }, browser.params.defaultTimeout);

        expect(chaisePage.recordsetPage.getRows().count()).toBe(12, 'number of rows is incorrect after applying saved query');
        
        return chaisePage.recordsetPage.getFacetFilters();
      }).then((filters) => {
        expect(filters.length).toBe(1, 'number of filters incorrect on page load');

        expect(filters[0].getText()).toBe('int_col\n11 to 22', 'displayed facet filter is incorrect');

        done();
      }).catch((err) => {
        done.fail(err);
      });
    });
  });
});
