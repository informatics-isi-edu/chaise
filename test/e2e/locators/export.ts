import { Locator, Page } from '@playwright/test';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';

export default class ExportLocators {
  static getExportDropdown(container: Locator | Page): Locator {
    return container.locator('.export-menu button');
  }

  static getExportOptions(container: Locator | Page): Locator {
    return container.locator('.export-menu-item');
  }

  static getExportOption(container: Locator | Page, optionName: string): Locator {
    optionName = makeSafeIdAttr(optionName);
    return container.locator(`.export-menu-item-${optionName}`);
  }

  static getExportSubmenuOptions(container: Locator | Page): Locator {
    return container.locator('.export-submenu-item');
  }

  static getExportSubmenuOption(container: Locator | Page, optionName: string): Locator {
    optionName = makeSafeIdAttr(optionName);
    return container.locator(`.export-submenu-item-${optionName}`);
  }

}
