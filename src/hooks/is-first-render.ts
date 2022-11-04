import { useRef, useEffect } from 'react';

/**
 * Whether this is the first render or not.
 * can be used in combination with useEffect to skip the first render:
 *
 * const isFirstRender = useIsFirstRender();
 * useEffect(() => {
 *  if (isFirstRender) {
 *    console.log('First Render');
 *  } else {
 *    console.log('Subsequent Render');
 *  }
 *});
 *
 */
export const useIsFirstRender = () => {
  const isFirstRender = useRef(true);
  useEffect(() => {
    isFirstRender.current = false;
  }, []);
  return isFirstRender.current;
};
