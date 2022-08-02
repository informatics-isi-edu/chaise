import { AuthnContext } from '@isrd-isi-edu/chaise/src/providers/authn';
import { useContext } from 'react';

/**
 * useAuthn hook to be used for accessing authn service
 * for list of properties take a look at AuthnContext value
 */
export default function useAuthn() {
  const context = useContext(AuthnContext);
  if (!context) {
    throw new Error('No AuthnProvider found when calling AuthnContext');
  }
  return context;
}
