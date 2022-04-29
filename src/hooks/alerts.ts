import { AlertsContext } from '@chaise/providers/alerts';
import { useContext } from 'react';


/**
 * useAlert hook to be used for accessing alert service
 * can be used in sub-recordset components to get the reference and data
 * for list of properties take a look at RecordsetContext value
 */
export default function useAlert() {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error('No AlertsProvider found when calling AlertsContext');
  }
  return context;
}
