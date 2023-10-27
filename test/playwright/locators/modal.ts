import { Locator, Page } from '@playwright/test';

export default class ModalLocators {

  // ------------ modal container getters ------------ //

  static getProfileModal(page: Page): Locator {
    return page.locator('.profile-popup');
  }

  static getShareCiteModal(page: Page): Locator {
    return page.locator('.chaise-share-citation-modal');
  }

  // ------------- common modal functions -------------- //

  static getModalTitle(modal: Locator) {
    return modal.locator('.modal-title');
  }

  static getModalText(modal: Locator) {
    return modal.locator('.modal-body');
  }

  static getCloseBtn(modal: Locator): Locator {
    return modal.locator('.modal-close');
  }


  // --------- share cite related functions ------------ //

  static async waitForCitation(modal: Locator, timeout?: number): Promise<void> {
    await modal.locator('.citation-loader').waitFor({ state: 'detached', timeout });
  }

  static getVersionedLinkElement(modal: Locator): Locator {
    return modal.locator('.share-modal-versioned-link');
  }

  static getLiveLinkElement(modal: Locator): Locator {
    return modal.locator('.share-modal-live-link');
  }

  static getModalListElements(modal: Locator): Locator {
    return ModalLocators.getModalText(modal).locator('li');
  }

  static getShareLinkHeader(modal: Locator): Locator {
    return modal.locator('.share-modal-links h2');
  }

  static getShareLinkSubHeaders(modal: Locator): Locator {
    return modal.locator('.share-modal-links h3');
  }

  static getShareLinkCopyBtns(modal: Locator): Locator {
    return modal.locator('.share-modal-links .chaise-copy-to-clipboard-btn')
  }

  static getCitationHeader(modal: Locator): Locator {
    return modal.locator('.share-modal-citation h2');
  }

  static getDownloadCitationHeader(modal: Locator): Locator {
    return modal.locator('.share-modal-download-citation h3');
  }

  static getCitationText(modal: Locator): Locator {
    return modal.locator('.share-modal-citation-text');
  }

  static getBibtex(modal: Locator): Locator {
    return modal.locator('.bibtex-download-btn');
  }

}
