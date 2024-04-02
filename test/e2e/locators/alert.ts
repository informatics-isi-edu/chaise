import { Locator, Page } from '@playwright/test';

export default class AlertLocators {
  static getWarningAlert(container: Page | Locator): Locator {
    return container.locator('.alert-warning');
  }

  static getErrorAlert(container: Page | Locator): Locator {
    return container.locator('.alert-danger');
  }

  static getAlertCloseButton(alert: Locator): Locator {
    return alert.locator('button');
  }

  static getAlertLink(alert: Locator): Locator {
    return alert.locator('a');
  }
}
