// src/common/hooks/useAPIError/index.js
import { useContext } from 'react';
import { ErrorContext } from '@chaise/providers/error';

function useError() {
  const { error, dispatchError, hideError } = useContext(ErrorContext);
  return { error, dispatchError, hideError };
}

export default useError;
