import { useContext } from 'react';
import { RecordsetContext } from '@chaise/providers/recordset';


function useRecordSet() {
  const context = useContext(RecordsetContext);
  if (!context) {
    throw new Error('No Recordset.Provider found when calling RecordsetContext');
  }
  return context;
}

export default useRecordSet;
