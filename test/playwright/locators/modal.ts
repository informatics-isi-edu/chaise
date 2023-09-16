import { Locator, Page } from '@playwright/test';

export default class ModalLocators {
  static getProfileModal(page: Page) : Locator {
    return page.locator('.profile-popup');
  }

  static getCloseBtn (modal: Locator) : Locator {
    return modal.locator('.modal-close');
  }
}
