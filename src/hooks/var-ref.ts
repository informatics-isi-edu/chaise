
import { useRef, useEffect } from 'react';

type ReadOnlyRefObject<T> = {
  readonly current: T;
};

/**
 * This hook can be used to get a updated reference of a local variable in the
 * component. The variable could be based on state or props.
 *
 * This is useful for places that we want to use the variable outside of
 * React lifecycle and want to ensure using the latest value. For example
 * in async calls that are outside of React (flow-control for example).
 */
const useVarRef = <S>(val: S): ReadOnlyRefObject<S> => {
  const ref = useRef(val);

  useEffect(() => {
    ref.current = val;
  }, [val]);

  return ref;
}

export default useVarRef;
