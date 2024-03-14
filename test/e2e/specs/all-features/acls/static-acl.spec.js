var chaisePage = require('../../../utils/chaise.page.js');
const pImport = require('../../../utils/protractor.import.js');

describe("regarding static ACL support, ", function () {
  it("anonymous user should be shown login modal when viewing recoredit app", function (done) {
    modalBody = element(by.css('.modal-body'));

    browser.ignoreSynchronization = true;
    var url = browser.params.url + "/recordedit/#" + browser.params.catalogId + "/multi-permissions:static_acl_table/id=1";
    browser.get(url).then(function () {
      // manually remove the cookie
      return browser.manage().deleteCookie('webauthn');
    }).then(function () {
      // refresh the page
      return browser.navigate().refresh();
    }).then(function () {
      return chaisePage.waitForElement(modalBody);
    }).then(function () {
      expect(modalBody.isDisplayed()).toBe(true, "modal body is not displayed");
      expect(element(by.css('.modal-title')).isPresent()).toBe(true, "modal title is not present");
      expect(element(by.css('.modal-title')).getText()).toBe('You need to be logged in to continue.', "modal title text is incorrect");

      // add the cookie again for the rest of test cases
      return chaisePage.performLogin(process.env.AUTH_COOKIE);
    }).then(function () {
      done();
    }).catch(function (err) {
      done.fail(err);
    })
  });

  describe('shareCite.acls support', () => {

    it('using only `show` should show and enable the button', (done) => {
      pImport.updateCatalogAnnotation(browser.params.catalogId, {
        'tag:isrd.isi.edu,2019:chaise-config': { 'shareCite': { 'acls': { 'show': ['*'] } } }
      }).then(() => {
        gotToRecordPageAndCheckShareBtn(true, true);
      }).then(() => {
        done();
      }).catch(chaisePage.catchTestError(done));
    });

    it('using only `enable` should show and enable the button', (done) => {
      pImport.updateCatalogAnnotation(browser.params.catalogId, {
        'tag:isrd.isi.edu,2019:chaise-config': { 'shareCite': { 'acls': { 'enable': ['*'] } } }
      }).then(() => {
        return gotToRecordPageAndCheckShareBtn(true, true);
      }).then(() => {
        done();
      }).catch(chaisePage.catchTestError(done));
    });

    describe('defining show and enable', () => {
      beforeAll((done) => {
        // add shareCiteAcls to catalog annotation
        pImport.updateCatalogAnnotation(browser.params.catalogId, {
          'tag:isrd.isi.edu,2019:chaise-config': {
            'shareCite': {
              'acls': {
                // both main and restricted user can see it
                'show': [process.env.AUTH_COOKIE_ID, process.env.RESTRICTED_AUTH_COOKIE_ID],
                // only enabled for the main user
                'enable': [process.env.AUTH_COOKIE_ID]
              }
            }
          }
        }).then(() => {
          done();
        }).catch(chaisePage.catchTestError(done));
      });

      it('should be enabled for the main user based on the chaise-config property', (done) => {
        // main user should be able to see and click
        gotToRecordPageAndCheckShareBtn(true, true).then(() => done()).catch(chaisePage.catchTestError(done));
      });

      it('should be disabled for the restricted user based on the chaise-config property', (done) => {
        // should be disabled for restricted user
        chaisePage.performLogin(process.env.RESTRICTED_AUTH_COOKIE).then(() => {
          return gotToRecordPageAndCheckShareBtn(true, false);
        }).then(() => {
          done();
        }).catch(chaisePage.catchTestError(done));
      });

      it('should be hidden for anonymous user based on the chaise-config property', (done) => {
        // anonymous user should not even see it
        browser.manage().deleteCookie('webauthn').then(() => {
          return gotToRecordPageAndCheckShareBtn(false, false);
        }).then(() => {
          done();
        }).catch(chaisePage.catchTestError(done));
      });

      afterAll((done) => {
        // remove the catalog annotation and login as the main user
        pImport.updateCatalogAnnotation(browser.params.catalogId, {}).then(() => {
          return chaisePage.performLogin(process.env.AUTH_COOKIE);
        }).then(() => {
          done();
        }).catch(chaisePage.catchTestError(done));
      });
    });

    const gotToRecordPageAndCheckShareBtn = (isPresent, isEnabled) => {
      return new Promise((resolve, reject) => {
        chaisePage.navigate(`${browser.params.url}/record/#${browser.params.catalogId}/multi-permissions:static_acl_table/id=1`).then(() => {
          return chaisePage.recordPageReady();
        }).then(() => {
          expect(chaisePage.recordPage.getShareButton().isPresent()).toBe(isPresent);
          if (isPresent) {
            expect(chaisePage.recordPage.getShareButton().isDisplayed()).toBe(true);
            expect(chaisePage.recordPage.getShareButton().isEnabled()).toBe(isEnabled);
          }
          resolve()
        }).catch((err) => reject(err));
      })
    }
  });


  describe('exportConfigsSubmenu.support', () => {

    it('using only `show` should show and enable the button', (done) => {
      pImport.updateCatalogAnnotation(browser.params.catalogId, {
        'tag:isrd.isi.edu,2019:chaise-config': { 'exportConfigsSubmenu': { 'acls': { 'show': ['*'] } } }
      }).then(() => {
        goToRecordPageAndCheckExportConfigsBtn(true, true);
      }).then(() => {
        done();
      }).catch(chaisePage.catchTestError(done));
    });

    it('using only `enable` should show and enable the button', (done) => {
      pImport.updateCatalogAnnotation(browser.params.catalogId, {
        'tag:isrd.isi.edu,2019:chaise-config': { 'exportConfigsSubmenu': { 'acls': { 'enable': ['*'] } } }
      }).then(() => {
        return goToRecordPageAndCheckExportConfigsBtn(true, true);
      }).then(() => {
        done();
      }).catch(chaisePage.catchTestError(done));
    });

    describe('defining show and enable', () => {
      beforeAll((done) => {
        // add shareCiteAcls to catalog annotation
        pImport.updateCatalogAnnotation(browser.params.catalogId, {
          'tag:isrd.isi.edu,2019:chaise-config': {
            'exportConfigsSubmenu': {
              'acls': {
                // both main and restricted user can see it
                'show': [process.env.AUTH_COOKIE_ID, process.env.RESTRICTED_AUTH_COOKIE_ID],
                // only enabled for the main user
                'enable': [process.env.AUTH_COOKIE_ID]
              }
            }
          }
        }).then(() => {
          done();
        }).catch(chaisePage.catchTestError(done));
      });

      it('should be enabled for the main user based on the chaise-config property', (done) => {
        // main user should be able to see and click
        goToRecordPageAndCheckExportConfigsBtn(true, true).then(() => done()).catch(chaisePage.catchTestError(done));
      });

      it('should be disabled for the restricted user based on the chaise-config property', (done) => {
        // should be disabled for restricted user
        chaisePage.performLogin(process.env.RESTRICTED_AUTH_COOKIE).then(() => {
          return goToRecordPageAndCheckExportConfigsBtn(true, false);
        }).then(() => {
          done();
        }).catch(chaisePage.catchTestError(done));
      });

      it('should be hidden for the anonymous user based on the chaise-config property', (done) => {
        // anonymous user should not even see it
        browser.manage().deleteCookie('webauthn').then(() => {
          return goToRecordPageAndCheckExportConfigsBtn(false, false);
        }).then(() => {
          done();
        }).catch(chaisePage.catchTestError(done));
      });

      afterAll((done) => {
        // remove the catalog annotation and login as the main user
        pImport.updateCatalogAnnotation(browser.params.catalogId, {}).then(() => {
          return chaisePage.performLogin(process.env.AUTH_COOKIE);
        }).then(() => {
          done();
        }).catch(chaisePage.catchTestError(done));
      });
    });

    const goToRecordPageAndCheckExportConfigsBtn = (isPresent, isEnabled) => {
      return new Promise((resolve, reject) => {
        let exportSubmenuOptions, configOption;

        chaisePage.navigate(`${browser.params.url}/record/#${browser.params.catalogId}/multi-permissions:static_acl_table/id=1`).then(() => {
          return chaisePage.recordPageReady();
        }).then(() => {
          return chaisePage.clickButton(chaisePage.recordsetPage.getExportDropdown());
        }).then(() => {
          // chaisePage.waitForElement(chaisePage.recordsetPage.getExportDropdownMenu());

          configOption = chaisePage.recordsetPage.getExportOption('configurations');
          expect(configOption.isPresent()).toBe(isPresent);

          if (isPresent && !isEnabled) {
            expect(configOption.getAttribute('class')).toContain('disable-link');
            resolve();
          } else if (isPresent && isEnabled) {
            chaisePage.clickButton(configOption).then(() => {
              exportSubmenuOptions = chaisePage.recordsetPage.getExportSubmenuOptions();
              expect(exportSubmenuOptions.count()).toBe(1);
              resolve();
            }).catch((err) => reject(err));
          } else {
            resolve();
          }
        }).catch((err) => reject(err));
      })
    };

  });

  // TODO more static acl tests should be added
})
