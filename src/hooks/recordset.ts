import { useContext } from 'react';
import { RecordsetContext } from '@chaise/providers/recordset';

/**
 * useRecordset hook to be used for accessing recordset 
 * can be used in sub-recordset components to get the reference and data
 * for list of properties take a look at RecordsetContext value
 */
function useRecordset() {
  const context = useContext(RecordsetContext);
  if (!context) {
    throw new Error('No RecordsetProvider found when calling RecordsetContext');
  }
  return context;
}

export default useRecordset;
