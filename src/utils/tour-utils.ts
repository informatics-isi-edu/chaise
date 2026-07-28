/**
 * Targeting for guided tours.
 *
 * A tour step points at a UI element by key, and Chaise stamps that key onto the element
 * as a `data-tour-target` attribute. react-joyride accepts a CSS selector string as a step
 * target, so the attribute selector is handed to it directly with no adapter in between.
 *
 * Two kinds of key share the one attribute namespace:
 *  - `$`-prefixed  reserved Chaise chrome (search bar, facet panel, ...). The `$` marks it as
 *                  internal, matching the convention used for template variables.
 *  - everything else
 *                  an author-assigned `alias` from a column directive.
 *
 * Because they share a namespace, the eventual annotation parser must reject an author `alias`
 * that starts with `$`, otherwise an author could shadow Chaise's own keys.
 *
 * NOTE: this is a proof of concept. Nothing here reads an annotation yet.
 */

/**
 * Reserved keys for Chaise chrome. Authors cannot define these.
 */
export const TOUR_CHROME_TARGETS = {
  MAIN_SEARCH: '$main-search',
  FACET_PANEL: '$facet-panel',
  EXPORT_BUTTON: '$export-button',
} as const;

/**
 * The reserved key for a single facet, which is positional since facets have no alias yet.
 * @param index the facet's index within reference.facetColumns
 */
export function facetTourTarget(index: number): string {
  return `$facet-${index}`;
}

/**
 * The fallback key for a table column, used until a column directive can carry an `alias`.
 * Positional and therefore brittle, which is the whole argument for adding `alias`.
 * @param index the column's index within the visible columns
 */
export function columnTourTarget(index: number): string {
  return `$column-${index}`;
}

/**
 * Props to spread onto a JSX element to make it targetable by a tour.
 * Returns nothing when the key is empty so we don't stamp a useless attribute.
 *
 * @param key a reserved `$` chrome key, or a column alias
 */
export function tourTarget(key?: string | null): { 'data-tour-target'?: string } {
  return key ? { 'data-tour-target': key } : {};
}

/**
 * The CSS selector that finds the element carrying the given tour key. Passed straight to
 * react-joyride as a step `target`.
 *
 * @param key a reserved `$` chrome key, or a column alias
 */
export function tourTargetSelector(key: string): string {
  return `[data-tour-target="${key}"]`;
}
