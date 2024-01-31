import { useContext } from 'react';
import { ViewerContext } from '@isrd-isi-edu/chaise/src/providers/viewer';

/**
 * useViewer hook to be used for accessing viewer provider
 * can be used in sub-record components to get the reference and data
 * for list of properties take a look at ViewerContext value
 */
function useViewer() {
  const context = useContext(ViewerContext);
  if (!context) {
    throw new Error('No ViewerProvider found when calling ViewerContext');
  }
  return context;
}

export default useViewer;
