import { expect, Locator, Page } from '@playwright/test';

export default class ModelAppLocators {
  /**
   * waits for the first layout to finish: at least one table node visible and no relayout in progress
   */
  static async waitForPageReady(page: Page, timeout?: number): Promise<void> {
    await expect(ModelAppLocators.getNodes(page).first()).toBeVisible({ timeout });
    await ModelAppLocators.waitForLayoutSettled(page, timeout);
  }

  /**
   * waits for a relayout to finish. only waits for the overlay to be gone: on small graphs
   * the relayout can settle faster than playwright polls, so waiting for the overlay to
   * appear first would be flaky.
   */
  static async waitForLayoutSettled(page: Page, timeout?: number): Promise<void> {
    await ModelAppLocators.getLoadingOverlay(page).waitFor({ state: 'detached', timeout });
  }

  static getCanvas(page: Page): Locator {
    return page.locator('.model-canvas');
  }

  static getLoadingOverlay(page: Page): Locator {
    return page.locator('.model-loading-overlay');
  }

  static getTitle(page: Page): Locator {
    return page.locator('.model-title h3');
  }

  static getPane(page: Page): Locator {
    return page.locator('.react-flow__pane');
  }

  static getNodes(page: Page): Locator {
    return page.locator('.react-flow__node-modelTable');
  }

  /**
   * @param tableId the node id in `schema:table` format
   */
  static getNode(page: Page, tableId: string): Locator {
    return page.locator(`.react-flow__node-modelTable[data-id="${tableId}"]`);
  }

  /**
   * the box inside a node, which carries the focus mode classes (`model-table-node-focus`,
   * `model-table-node-inbound`, ...)
   */
  static getNodeBox(node: Locator): Locator {
    return node.locator('.model-table-node');
  }

  static getNodeHeader(node: Locator): Locator {
    return node.locator('.model-table-node-header');
  }

  static getNodeRows(container: Locator | Page): Locator {
    return container.locator('.model-table-node-row');
  }

  static getColumnNames(node: Locator): Locator {
    return node.locator('.model-column-name');
  }

  static getPkColumns(node: Locator): Locator {
    return node.locator('.model-column-pk');
  }

  static getFkBadges(container: Locator | Page): Locator {
    return container.locator('.model-column-fk-badge');
  }

  static getColumnTypes(node: Locator): Locator {
    return node.locator('.model-column-type');
  }

  static getEdges(page: Page): Locator {
    return page.locator('.react-flow__edge');
  }

  /**
   * @param constraintId the fk constraint id in `schema:constraint_name` format (the edge's data-id)
   */
  static getEdge(page: Page, constraintId: string): Locator {
    return page.locator(`.react-flow__edge[data-id="${constraintId}"]`);
  }

  /**
   * the rendered svg path of an edge, for `d` attribute assertions
   */
  static getEdgePath(page: Page, constraintId: string): Locator {
    return ModelAppLocators.getEdge(page, constraintId).locator('.react-flow__edge-path');
  }

  static getHighlightedNodes(page: Page): Locator {
    return page.locator('.react-flow__node.model-node-highlighted');
  }

  static getDimmedNodes(page: Page): Locator {
    return page.locator('.react-flow__node.model-node-dimmed');
  }

  static getHighlightedEdges(page: Page): Locator {
    return page.locator('.react-flow__edge.model-edge-highlighted');
  }

  static getDimmedEdges(page: Page): Locator {
    return page.locator('.react-flow__edge.model-edge-dimmed');
  }

  static getToolbar(page: Page): Locator {
    return page.locator('.model-toolbar');
  }

  static getCollapsedToolbar(page: Page): Locator {
    return page.locator('.model-toolbar-collapsed');
  }

  static getHideSettingsButton(page: Page): Locator {
    return ModelAppLocators.getToolbar(page).locator('.model-toolbar-header .chaise-sidebar-close');
  }

  static getShowSettingsButton(page: Page): Locator {
    return ModelAppLocators.getCollapsedToolbar(page).locator('.chaise-sidebar-open');
  }

  /**
   * @param label the row label, e.g. 'Detail' or 'Layout'
   */
  static getToolbarRow(page: Page, label: string): Locator {
    // the whole label, since a substring match would also find 'Mode' in 'Model scope'
    return ModelAppLocators.getToolbar(page)
      .locator('.model-toolbar-row')
      .filter({ has: page.getByText(label, { exact: true }) });
  }

  static getDisplayModeDropdown(page: Page): Locator {
    return ModelAppLocators.getToolbarRow(page, 'Mode').locator('.dropdown-toggle');
  }

  static getDetailDropdown(page: Page): Locator {
    return ModelAppLocators.getToolbarRow(page, 'Detail').locator('.dropdown-toggle');
  }

  static getLayoutDropdown(page: Page): Locator {
    return ModelAppLocators.getToolbarRow(page, 'Layout').locator('.dropdown-toggle');
  }

  /**
   * the open dropdown menu is rendered in the toolbar, so query the page for the visible menu
   */
  static getDropdownOption(page: Page, text: string): Locator {
    return page.locator('.dropdown-menu.show .dropdown-item').filter({ hasText: text });
  }

  static getRemoveOverlapsButton(page: Page): Locator {
    return page.locator('.model-remove-overlaps-btn');
  }

  static getExportPdfButton(page: Page): Locator {
    return page.locator('.model-export-pdf-btn');
  }

  /**
   * @param title the checklist title, 'Schemas' or 'Tables'
   */
  static getChecklist(page: Page, title: string): Locator {
    return page.locator('.model-checklist-container').filter({
      has: page.locator('.model-checklist-title', { hasText: title })
    });
  }

  static getSchemasChecklist(page: Page): Locator {
    return page.locator('.model-schemas-checklist');
  }

  /**
   * titled 'Tables', or 'Neighboring tables' in focus mode
   */
  static getTablesChecklist(page: Page): Locator {
    return page.locator('.model-tables-checklist');
  }

  static getChecklistTitle(checklist: Locator): Locator {
    return checklist.locator('.model-checklist-title');
  }

  /**
   * the checkbox label has no htmlFor, so callers should locate the item then click its input.
   * matches the whole label: `model-test` would otherwise also find `model-test-focus-mode`.
   */
  static getChecklistItem(checklist: Locator, label: string): Locator {
    return checklist.locator('li.chaise-checkbox').filter({ has: checklist.page().getByText(label, { exact: true }) });
  }

  static getChecklistItems(checklist: Locator): Locator {
    return checklist.locator('li.chaise-checkbox');
  }

  static getChecklistCheckbox(item: Locator): Locator {
    return item.locator('input');
  }

  static getChecklistEmpty(checklist: Locator): Locator {
    return checklist.locator('.model-checklist-empty');
  }

  /**
   * the "Found ..." line, shown on lists with 6 or more items
   */
  static getChecklistSummary(checklist: Locator): Locator {
    return checklist.locator('.model-checklist-summary-text');
  }

  static getChecklistShowAll(checklist: Locator): Locator {
    return checklist.locator('.model-checklist-show-all');
  }

  static getChecklistHideAll(checklist: Locator): Locator {
    return checklist.locator('.model-checklist-hide-all');
  }

  /**
   * shown on lists with 10 or more items
   */
  static getChecklistSearch(checklist: Locator): Locator {
    return checklist.locator('.model-checklist-search input');
  }

  static getScopeDropdownToggle(page: Page): Locator {
    return page.locator('.model-scope-dropdown .dropdown-toggle');
  }

  /**
   * the menu stays mounted after it closes, so everything below is scoped to the open one
   */
  static getScopeDropdownMenu(page: Page): Locator {
    return page.locator('.model-scope-dropdown-menu.show');
  }

  static getScopeDropdownSearch(page: Page): Locator {
    return ModelAppLocators.getScopeDropdownMenu(page).locator('.search-row input');
  }

  static getScopeDropdownOptions(page: Page): Locator {
    return ModelAppLocators.getScopeDropdownMenu(page).locator('.simple-search-dropdown-option');
  }

  /**
   * @param label a table id, or 'Catalog (all tables)'. matched exactly: `focus` would otherwise
   * also find `focus_tag`.
   */
  static getScopeDropdownOption(page: Page, label: string): Locator {
    return ModelAppLocators.getScopeDropdownOptions(page).filter({ has: page.getByText(label, { exact: true }) });
  }

  static getScopeDropdownSelectedOption(page: Page): Locator {
    return ModelAppLocators.getScopeDropdownMenu(page).locator('.simple-search-dropdown-selected');
  }

  static getScopeDropdownNoResults(page: Page): Locator {
    return ModelAppLocators.getScopeDropdownMenu(page).locator('.no-results');
  }

  /**
   * only shown in focus mode
   */
  static getLegend(page: Page): Locator {
    return page.locator('.model-relation-legend');
  }

  static getLegendItems(page: Page): Locator {
    return ModelAppLocators.getLegend(page).locator('.model-relation-legend-item');
  }
}
