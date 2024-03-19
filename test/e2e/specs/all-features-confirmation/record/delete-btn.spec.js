var chaisePage = require('../../../utils/chaise.page.js');
const { testDeleteConfirm } = require('../../../utils/record-helpers.js');

const getURL = (appName, tableName, filter) => {
  return `${browser.params.url}/${appName}/#${browser.params.catalogId}/product-delete-btn:${tableName}${filter ? '/' + filter : ''}`;
}

describe('Delete functionality in record page with confirm dialog,', () => {

  describe('when the deleted row is from a table without any inline fks with on delete cascade', () => {
    beforeAll((done) => {
      chaisePage.navigate(getURL('record', "delete_table", 'id=1'));

      chaisePage.recordPageReady();
      done();
    });

    describe('related entity row', () => {
      it ('clicking on delete button should open a confirm with proper message, and confirming should properly delete.', (done) => {
        const message = 'Are you sure you want to delete inbound_to_delete_table:one?';
        testDeleteConfirm(chaisePage.recordsetPage.getDeleteActionButtons().first(), message).then(() => {
          // the fact that we can delete after this it means that this has been fully removed
          // so we don't need to wait
          done();
        }).catch(chaisePage.catchTestError(done));
      });
    });

    describe('the main record', () => {
      it('clicking on delete button should open a confirm with proper message, and confirming should properly delete.', (done) => {
        const message = 'Are you sure you want to delete delete_table: one?';
        testDeleteConfirm(chaisePage.recordPage.getDeleteRecordButton(), message).then(() => {
          return browser.wait(function () {
            return browser.driver.getCurrentUrl().then(function (url) {
              return url.startsWith(getURL('recordset', 'delete_table'));
            });
          });
        }).then(() => {
          done();
        }).catch(chaisePage.catchTestError(done));
      });
    });
  });

  describe('when the deleted row is from a table with inline fks with on delete cascade', () => {
    beforeAll((done) => {
      chaisePage.navigate(getURL('record', "accommodation", 'id=4004'));
      chaisePage.recordPageReady();
      done();
    });

    describe('related entity row', () => {
      it ('clicking on delete button should open a confirm with proper message, and confirming should properly delete.', (done) => {
        const message = 'Are you sure you want to delete inbound_related_to_accommodation_for_delete:Four thousand four?';
        testDeleteConfirm(chaisePage.recordPage.getDeleteActionButtons('inbound_related_to_accommodation_for_delete').first(), message).then(() => {
          // the fact that we can delete after this it means that this has been fully removed
          // so we don't need to wait
          done();
        }).catch(chaisePage.catchTestError(done));
      });
    });

    describe('the main record', () => {
      it('clicking on delete button should open a confirm with proper message, and confirming should properly delete.', (done) => {
        const message = [
          'Are you sure you want to delete Accommodations: Hilton Hotel?',
          '\n\n',
          'This may also delete related records in the following 3 tables/sections: media, booking, and invisible_inbound_related_to_accommodation†',
          '\n',
          'Check the related records that are going to be deleted from the relevant sections in the side panel.',
          'Some of the affected tables (denoted by †) might not be visible in the side panel.'
        ].join('');
        testDeleteConfirm(chaisePage.recordPage.getDeleteRecordButton(), message).then(() => {
          return browser.wait(function () {
            return browser.driver.getCurrentUrl().then(function (url) {
              return url.startsWith(getURL('recordset', 'accommodation'));
            });
          });
        }).then(() => {
          done();
        }).catch(chaisePage.catchTestError(done));
      });
    });
  });

});
