import { useContext } from 'react';
import { ErrorContext } from '@chaise/providers/error';

/**
 * useError hook to be used for accessing the error context
 * it will return the following properties:
 * - errror: the current error object (might be null)
 * - dispatchError: can be used to dispatch an error object
 * - hideError: can be used to hide the currently displayed error.
 */
function useError() {
  const { error, dispatchError, hideError } = useContext(ErrorContext);
  return { error, dispatchError, hideError };
}

export default useError;
