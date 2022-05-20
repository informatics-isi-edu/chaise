import { useContext } from 'react';
import { ErrorContext } from '@isrd-isi-edu/chaise/src/providers/error';

/**
 * useError hook to be used for accessing the error context
 * it will return the following properties:
 * - errror: the current error object (might be null)
 * - dispatchError: can be used to dispatch an error object
 * - hideError: can be used to hide the currently displayed error.
 */
function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('No ErrorProvider found when calling RecordsetContext');
  }
  return context;
}

export default useError;
