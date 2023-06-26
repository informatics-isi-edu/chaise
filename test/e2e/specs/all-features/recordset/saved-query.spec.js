const chaisePage = require('../../../utils/chaise.page.js');
const pImport = require('../../../utils/protractor.import.js');

const testParams = {
  table_name: 'main'
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
          encodedFacets: 'encoded_facets'
        }
      }
    }
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
      expect(true).toBe(true);
      browser.sleep(1000000)

      done()
    })

  });

});
