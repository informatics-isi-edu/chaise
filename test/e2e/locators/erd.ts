import { expect, Locator, Page } from '@playwright/test';

export default class ErdLocators {
  /**
   * waits for the first layout to finish: at least one table node visible and no relayout in progress
   */
  static async waitForErdPageReady(page: Page, timeout?: number): Promise<void> {
    await expect(ErdLocators.getNodes(page).first()).toBeVisible({ timeout });
    await ErdLocators.waitForLayoutSettled(page, timeout);
  }

  /**
   * waits for a relayout to finish. only waits for the overlay to be gone: on small graphs
   * the relayout can settle faster than playwright polls, so waiting for the overlay to
   * appear first would be flaky.
   */
  static async waitForLayoutSettled(page: Page, timeout?: number): Promise<void> {
    await ErdLocators.getLoadingOverlay(page).waitFor({ state: 'detached', timeout });
  }

  static getCanvas(page: Page): Locator {
    return page.locator('.erd-canvas');
  }

  static getLoadingOverlay(page: Page): Locator {
    return page.locator('.erd-loading-overlay');
  }

  static getTitle(page: Page): Locator {
    return page.locator('.erd-title h3');
  }

  static getPane(page: Page): Locator {
    return page.locator('.react-flow__pane');
  }

  static getNodes(page: Page): Locator {
    return page.locator('.react-flow__node-erdTable');
  }

  /**
   * @param tableId the node id in `schema:table` format
   */
  static getNode(page: Page, tableId: string): Locator {
    return page.locator(`.react-flow__node-erdTable[data-id="${tableId}"]`);
  }

  static getNodeHeader(node: Locator): Locator {
    return node.locator('.erd-table-node-header');
  }

  static getNodeRows(container: Locator | Page): Locator {
    return container.locator('.erd-table-node-row');
  }

  static getColumnNames(node: Locator): Locator {
    return node.locator('.erd-column-name');
  }

  static getPkColumns(node: Locator): Locator {
    return node.locator('.erd-column-pk');
  }

  static getFkBadges(container: Locator | Page): Locator {
    return container.locator('.erd-column-fk-badge');
  }

  static getColumnTypes(node: Locator): Locator {
    return node.locator('.erd-column-type');
  }

  static getEdges(page: Page): Locator {
    return page.locator('.react-flow__edge');
  }

  /**
   * @param fromId the FK-holding table id, @param toId the referenced table id, both `schema:table`
   */
  static getEdge(page: Page, fromId: string, toId: string): Locator {
    return page.locator(`.react-flow__edge[data-id="${fromId}->${toId}"]`);
  }

  static getFocusedNodes(page: Page): Locator {
    return page.locator('.react-flow__node.erd-node-focused');
  }

  static getDimmedNodes(page: Page): Locator {
    return page.locator('.react-flow__node.erd-node-dimmed');
  }

  static getHighlightedEdges(page: Page): Locator {
    return page.locator('.react-flow__edge.erd-edge-highlighted');
  }

  static getDimmedEdges(page: Page): Locator {
    return page.locator('.react-flow__edge.erd-edge-dimmed');
  }

  static getToolbar(page: Page): Locator {
    return page.locator('.erd-toolbar');
  }

  static getCollapsedToolbar(page: Page): Locator {
    return page.locator('.erd-toolbar-collapsed');
  }

  static getHideSettingsButton(page: Page): Locator {
    return ErdLocators.getToolbar(page).locator('.erd-toolbar-header button');
  }

  static getShowSettingsButton(page: Page): Locator {
    return ErdLocators.getCollapsedToolbar(page).locator('button');
  }

  /**
   * @param label the row label, e.g. 'Detail' or 'Layout'
   */
  static getToolbarRow(page: Page, label: string): Locator {
    return ErdLocators.getToolbar(page).locator('.erd-toolbar-row').filter({ hasText: label });
  }

  static getDetailDropdown(page: Page): Locator {
    return ErdLocators.getToolbarRow(page, 'Detail').locator('.dropdown-toggle');
  }

  static getLayoutDropdown(page: Page): Locator {
    return ErdLocators.getToolbarRow(page, 'Layout').locator('.dropdown-toggle');
  }

  /**
   * the open dropdown menu is rendered in the toolbar, so query the page for the visible menu
   */
  static getDropdownOption(page: Page, text: string): Locator {
    return page.locator('.dropdown-menu.show .dropdown-item').filter({ hasText: text });
  }

  static getRemoveOverlapsButton(page: Page): Locator {
    return page.locator('.erd-remove-overlaps-btn');
  }

  static getExportPdfButton(page: Page): Locator {
    return page.locator('.erd-export-pdf-btn');
  }

  /**
   * @param title the checklist title, 'Schemas' or 'Tables'
   */
  static getChecklist(page: Page, title: string): Locator {
    return page.locator('.erd-checklist-container').filter({
      has: page.locator('.erd-checklist-title', { hasText: title })
    });
  }

  /**
   * the checkbox label has no htmlFor, so callers should locate the item then click its input
   */
  static getChecklistItem(checklist: Locator, label: string): Locator {
    return checklist.locator('li.chaise-checkbox').filter({ hasText: label });
  }

  static getChecklistCheckbox(item: Locator): Locator {
    return item.locator('input');
  }

  static getChecklistEmpty(checklist: Locator): Locator {
    return checklist.locator('.erd-checklist-empty');
  }
}
