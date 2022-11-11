import { useContext } from 'react';
import { RecordeditContext } from '@isrd-isi-edu/chaise/src/providers/recordedit';

/**
 * useRecordedit hook to be used for accessing record provider
 * can be used in sub-recordset components to get the reference and data
 * for list of properties take a look at RecordsetContext value
 */
function useRecordedit() {
  const context = useContext(RecordeditContext);
  if (!context) {
    throw new Error('No RecordeditProvider found when calling RecordeditContext');
  }
  return context;
}

export default useRecordedit;