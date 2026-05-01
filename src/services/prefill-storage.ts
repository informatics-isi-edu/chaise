// models
import { PrefillObject } from '@isrd-isi-edu/chaise/src/models/recordedit';

// services
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utils
import LocalStorage from '@isrd-isi-edu/chaise/src/utils/storage';

const KEY_PREFIX = 'chaise-prefill-';
const TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Store a prefill entry. Called by the parent page before opening a new
 * recordedit tab.
 */
export const setPrefillData = (id: string, data: PrefillObject): void => {
  LocalStorage.setStorage(KEY_PREFIX + id, { data, ts: Date.now() });
};

/**
 * Read a prefill entry. Returns null if missing or malformed.
 */
export const getPrefillData = (id: string): PrefillObject | null => {
  const stored = LocalStorage.getStorage(KEY_PREFIX + id);
  if (!stored || typeof stored !== 'object' || !stored.data) return null;
  return stored.data as PrefillObject;
};

/**
 * Remove a prefill entry. Called by the child after a successful submit.
 */
export const removePrefillData = (id: string): void => {
  LocalStorage.deleteStorageNamespace(KEY_PREFIX + id);
};

/**
 * Sweep prefill entries older than the TTL. Called once on app boot so
 * abandoned entries (user never submitted) eventually get cleaned up.
 */
export const sweepStalePrefillEntries = (): void => {
  const now = Date.now();
  LocalStorage.getKeysWithPrefix(KEY_PREFIX).forEach((key) => {
    const stored = LocalStorage.getStorage(key);
    if (!stored || typeof stored.ts !== 'number' || now - stored.ts > TTL_MS) {
      $log.debug(`Removing stale prefill entry with key "${key}"`);
      LocalStorage.deleteStorageNamespace(key);
    }
  });
};
