// utils
import {
  TOUR_CHROME_TARGETS,
  columnTourTarget,
  facetTourTarget,
} from '@isrd-isi-edu/chaise/src/utils/tour-utils';

/**
 * A tour step in the shape we expect the annotation to use.
 *
 * Deliberately NOT react-joyride's `Step` type. This is the author-facing shape, so it is
 * plain JSON, uses ERMrest naming (`markdown_pattern`, snake_case), and exposes only the
 * subset of joyride we are willing to commit to. `tour.tsx` translates it.
 */
export type ChaiseTourStep = {
  /** Markdown for the step body. Would go through processMarkdownPattern once annotation-driven. */
  markdown_pattern: string;
  /** Optional heading shown above the body. */
  title?: string;
  /**
   * The element to point at: a column `alias`, or a reserved `$`-prefixed Chaise chrome key.
   * Omit for a centered card with no spotlight.
   */
  target?: string;
  /** Where the tooltip sits relative to the target. */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto' | 'center';
  /**
   * Escape hatch for the rest of react-joyride's JSON-safe per-step options
   * (spotlightPadding, showProgress, spotlightRadius, ...). Shape still under discussion —
   * see 04.joyride-findings.md for the full list of what is expressible here.
   */
  options?: Record<string, unknown>;
};

/**
 * The hardcoded demo tour for the recordset app.
 *
 * Written to exercise every targeting mechanism we are considering:
 * a centered card with no target, two reserved chrome keys, a positional facet key, and a
 * column key that is standing in for a future author-assigned `alias`.
 */
export const RECORDSET_DEMO_TOUR: ChaiseTourStep[] = [
  {
    markdown_pattern: [
      'This page lists every record in the table, and gives you a few ways to narrow that list down.',
      '',
      'The tour takes about a minute.',
    ].join('\n'),
    title: 'Welcome',
    placement: 'center',
  },
  {
    markdown_pattern:
      'Type here to search across **all** columns at once. Results filter as you type, ' +
      'so you can start broad and narrow down.',
    title: 'Search',
    target: TOUR_CHROME_TARGETS.MAIN_SEARCH,
    placement: 'bottom',
  },
  {
    markdown_pattern:
      'This panel breaks the table down by its columns. Each section is a filter you can ' +
      'open and apply, and they stack together.',
    title: 'Refine your results',
    target: TOUR_CHROME_TARGETS.FACET_PANEL,
    placement: 'right',
  },
  {
    markdown_pattern:
      'Open a filter to see the values available for it, then tick the ones you want. ' +
      'The result count updates as you go.',
    title: 'Applying a filter',
    target: facetTourTarget(0),
    placement: 'right',
  },
  {
    markdown_pattern: 'Click any column heading to sort by it. Click again to reverse the order.',
    title: 'Sorting',
    target: columnTourTarget(0),
    placement: 'bottom',
  },
];
