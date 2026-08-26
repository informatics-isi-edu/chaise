import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react';

// services
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utilities
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';

type ExampleComponentProps = {
  /**
   * The app name
   */
  app: string;
  /**
   * description of the app.
   * Note:
   *   - Add any important things that you need to remind developers about this prop
   */
  description?: string;
}

/**
 * The example component that shows the code style of components
 * and how we should structure the code and document it.
 *
 * Hooks are declared in the order established in dev-guide.md (storage first,
 * then what is derived from it, then what reacts to it):
 *   1. external/context hooks   4. useMemo (derived values)
 *   2. useState                 5. useCallback (handlers and actions)
 *   3. useRef                   6. useEffect / useLayoutEffect
 * followed by render helpers, early returns, and a single JSX structure.
 */
const ExampleComponent = ({
  // - Destructure values from `props` object
  app,
  description,
} : ExampleComponentProps) : JSX.Element => {
  // - External/context hooks first: store selectors and custom hooks, e.g.
  //   const { dispatchError } = useError();
  //   const detail = useSomeStore((state) => state.detail);

  //-------------------  state:   --------------------//

  const [showDescription, setShowDescription] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  //-------------------  refs:   --------------------//

  // refs are storage that doesn't trigger re-renders (DOM handles, mutable
  // values read by callbacks); declare them with the rest of the storage
  const containerRef = useRef<HTMLDivElement>(null);

  //-------------------  derived values:   --------------------//

  /**
   * values computed from state/props belong in useMemo, not in a state that
   * has to be kept in sync manually
   */
  const clickSummary = useMemo(() => {
    return `${app}: clicked ${clickCount} time${clickCount === 1 ? '' : 's'}`;
  }, [app, clickCount]);

  //-------------------  callbacks:   --------------------//

  /**
   * handlers passed to children (or used by effects) belong in useCallback
   * so their identity is stable across renders.
   * when the button is clicked, show the description.
   */
  const onClick = useCallback(() => {
    setShowDescription(true);
    // use the updater form when the new value depends on the old one
    setClickCount((count) => count + 1);
  }, []);

  /**
   * explain the function here
   * @param change explain the input here
   */
  const onSomeChange = useCallback((change: string) => {
    $log.debug(`new change: ${change}`);
  }, []);

  //-------------------  effects:   --------------------//

  /**
   * explain why the hook is used. effects come last: they react to (and often
   * call) everything declared above. return a cleanup when the effect
   * subscribes to anything.
   */
  useEffect(() => {
    onSomeChange('mounted');
    return () => {
      // cleanup (detach sensors, abort requests, ...)
    };
  }, [onSomeChange]);

  //-------------------  render logic:   --------------------//

  // - Render any dependent items into temporary variables,
  //    such as conditional components or lists
  const conditionalDescription = isStringAndNotEmpty(description) ? (
    <button className='chaise-btn chaise-btn-primary' onClick={onClick}>
      Show Description
    </button>
  ) : null;

  // - Use a single JSX structure filled with content
  return (
    <div ref={containerRef}>
      A sample component for {app} app. {clickSummary}
      {showDescription && <p>{description}</p>}
      {conditionalDescription}
    </div>
  );
};

export default ExampleComponent;
