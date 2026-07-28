// hooks
import { useCallback, useMemo, useState, type JSX } from 'react';

// libs
import { Joyride, EVENTS, STATUS, type EventData, type Step } from 'react-joyride';

// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// models
import type { Displayname } from '@isrd-isi-edu/chaise/src/models/displayname';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utils
import LocalStorage from '@isrd-isi-edu/chaise/src/utils/storage';
import { tourTargetSelector } from '@isrd-isi-edu/chaise/src/utils/tour-utils';
import type { ChaiseTourStep } from '@isrd-isi-edu/chaise/src/components/tour/demo-steps';

type TourProps = {
  /** the steps, in the author-facing shape that the annotation will eventually produce */
  steps: ChaiseTourStep[];
  /** whether the tour is currently running */
  run: boolean;
  /** called when the tour ends, whether it was completed or skipped */
  onFinish: () => void;
};

/**
 * Renders a guided tour over the current page.
 *
 * Translates our author-facing step shape into react-joyride's, which is deliberately a
 * separate type: the annotation should not be a passthrough for a third-party library's props.
 * Everything joyride can be told is listed in task-files/012-tour/04.joyride-findings.md.
 */
const Tour = ({ steps, run, onFinish }: TourProps): JSX.Element | null => {
  /**
   * Render a step's markdown into the {value, isHTML} shape DisplayValue expects.
   * This mirrors what ermrestjs's processMarkdownPattern already returns, so swapping the
   * hardcoded steps for annotation-driven ones will not change this component.
   */
  const renderContent = useCallback((markdown: string): JSX.Element => {
    const value: Displayname = {
      value: ConfigService.ERMrest.renderMarkdown(markdown, false),
      isHTML: true,
    };
    return <DisplayValue addClass value={value} />;
  }, []);

  const joyrideSteps: Step[] = useMemo(
    () =>
      steps.map((step) => ({
        content: renderContent(step.markdown_pattern),
        title: step.title,
        // a step with no target is a centered card with no spotlight
        target: step.target ? tourTargetSelector(step.target) : 'body',
        placement: step.target ? step.placement : 'center',
        /*
         * the launcher button is the invitation to start, so individual steps go straight to
         * their tooltip rather than making the user click a second beacon per step.
         */
        skipBeacon: true,
        ...step.options,
      })),
    [steps, renderContent]
  );

  const handleEvent = useCallback(
    (data: EventData) => {
      if (data.type === EVENTS.TARGET_NOT_FOUND) {
        // worth surfacing: once targets come from an annotation, this is an author typo
        $log.warn(`tour: could not find the target for step ${data.index + 1}`);
        return;
      }

      const status = data.status;
      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        onFinish();
      }
    },
    [onFinish]
  );

  if (!steps.length) return null;

  return (
    <Joyride
      steps={joyrideSteps}
      run={run}
      continuous
      onEvent={handleEvent}
      scrollToFirstStep
      options={{
        showProgress: true,
        buttons: ['back', 'skip', 'primary'],
        /*
         * joyride defaults to 100, which would put the overlay under Chaise's modals (1031+).
         * Kept in sync with the `tour-overlay` key in maps/_z-index-map.scss.
         */
        zIndex: 1040,
      }}
    />
  );
};

export default Tour;

/** localStorage key recording that this user already went through the tour. */
const TOUR_SEEN_KEY = 'chaise-tour-seen';

/**
 * Tracks whether the user has already been through a given tour, so we can invite
 * first-time users without nagging everyone else.
 *
 * react-joyride has no persistence of its own (there is no localStorage access anywhere in
 * its bundle), so this is ours to own.
 *
 * @param tourId identifies the tour; a per-page or per-table id once annotation-driven
 */
export function useTourSeen(tourId: string): { seen: boolean; markSeen: () => void } {
  const [seen, setSeen] = useState<boolean>(() => {
    const stored = LocalStorage.getStorage(TOUR_SEEN_KEY);
    return !!(stored && stored[tourId]);
  });

  const markSeen = useCallback(() => {
    const stored = LocalStorage.getStorage(TOUR_SEEN_KEY) || {};
    LocalStorage.setStorage(TOUR_SEEN_KEY, { ...stored, [tourId]: true });
    setSeen(true);
  }, [tourId]);

  return { seen, markSeen };
}
