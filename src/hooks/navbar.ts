import { NavbarContext } from '@isrd-isi-edu/chaise/src/providers/navbar';
import { useContext } from 'react';


/**
 * useNavbar hook to be used for accessing alert service
 * can be used in sub-recordset components to get the reference and data
 * for list of properties take a look at RecordsetContext value
 */
export default function useNavbar() {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error('No NavbarProvider found when calling NavbarContext');
  }
  return context;
}
