import { Locator, Page } from '@playwright/test';

export default class ModalLocators {

  // ------------ modal container getters ------------ //

  static getProfileModal(page: Page): Locator {
    return page.locator('.profile-popup');
  }

  static getShareCiteModal(page: Page): Locator {
    return page.locator('.chaise-share-citation-modal');
  }

  static getConfirmDeleteModal(page: Page): Locator {
    return page.locator('.confirm-delete-modal');
  }

  static getRecordsetSearchPopup(page: Page): Locator {
    return page.locator('.search-popup');
  }

  static getScalarPopup(page: Page): Locator {
    return page.locator('.scalar-show-details-popup');
  }

  static getForeignKeyPopup(page: Page): Locator {
    return page.locator('.foreignkey-popup');
  }

  static getErrorModal(page: Page): Locator {
    return page.locator('.modal-error');
  }

  static getLoginModal(page: Page): Locator {
    return page.locator('.modal-login-instruction');
  }

  static getExportModal(page: Page): Locator {
    return page.locator('.export-progress');
  }

  static getUploadProgressModal(page: Page): Locator {
    return page.locator('.modal-upload-progress');
  }

  static getCreateSavedQueryModal(page: Page): Locator {
    return page.locator('.create-saved-query');
  }

  static getSavedQueriesModal(page: Page): Locator {
    return page.locator('.saved-query-popup');
  }

  static getDuplicateSavedQueryModal(page: Page): Locator {
    return page.locator('.duplicate-saved-query-modal');
  }

  static getIframeFieldModal(page: Page): Locator {
    return page.locator('.iframe-field-popup');
  }

  static getIframeFieldCloseConfirmModal(page: Page): Locator {
    return page.locator('.confirm-iframe-close-modal');
  }

  static getMarkdownPreviewModal(page: Page): Locator {
    return page.locator('.chaise-preview-markdown');
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

  static getOkButton(modal: Locator): Locator {
    return modal.locator('.ok-button');
  }

  static getCancelButton(modal: Locator): Locator {
    return modal.locator('.cancel-button');
  }

  static getSubmitButton(modal: Locator): Locator {
    return modal.locator('#multi-select-submit-btn');
  }

  // --------- error modal  functions ------------ //
  static getToggleErrorDetailsButton(modal: Locator): Locator {
    return modal.locator('.toggle-error-details');
  }

  static getErrorDetails(modal: Locator): Locator {
    return modal.locator('.error-details');
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

  // --------- saved query modals functions ------------ //
  static getApplySavedQueryButtons(modal: Locator, idx: number): Locator {
    return modal.locator('.apply-saved-query-button').nth(idx);
  }

  static saveQuerySubmit(modal: Locator): Locator {
    return modal.locator('#modal-submit-record-btn');
  }

  // --------- iframe-field-modal functions ------------ //
  static getIframeFieldModalSpinner(modal: Locator): Locator {
    return modal.locator('.iframe-field-modal-spinner')
  }

  // --------- markdown-preview modal functions ------------ //
  static getMarkdownPreviewContent(modal: Locator): Locator {
    return ModalLocators.getModalText(modal).locator('.markdown-container');
  }
}
