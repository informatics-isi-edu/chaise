
import { useRef, useState, SetStateAction, Dispatch, useEffect } from 'react';

type ReadOnlyRefObject<T> = {
  readonly current: T;
};

type UseStateRef = {
  <S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>, ReadOnlyRefObject<S>];
  <S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>, ReadOnlyRefObject<S | undefined>];
};

/**
 * This hook can be used in place of useState when we also want to have a
 * reference to the state variable.
 * This is useful for places that we want to use the state variable outside of
 * React lifecycle and want to ensure using the latest value. For example
 * in async calls that are outside of React (flow-control for example).
 */
const useStateRef: UseStateRef = <S>(initialState?: S | (() => S)) => {
  const [state, setState] = useState(initialState);
  const ref = useRef(state);

  /**
   * This will make sure the reference always has the latest used state variable
   */
  ref.current = state;

  return [state, setState, ref];
};

export default useStateRef;
