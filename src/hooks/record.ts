import { useContext } from 'react';
import { RecordContext } from '@isrd-isi-edu/chaise/src/providers/record';

/**
 * useRecord hook to be used for accessing record provider
 * can be used in sub-recordset components to get the reference and data
 * for list of properties take a look at RecordsetContext value
 */
function useRecord() {
  const context = useContext(RecordContext);
  if (!context) {
    throw new Error('No RecordProvider found when calling RecordContext');
  }
  return context;
}

export default useRecord;
