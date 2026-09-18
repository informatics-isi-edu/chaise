/**
 * both dynamic and static specs change the catalog (annotation and ACLs), so this file holds the
 * TEST_LOCKS.CATALOG_MODEL lock and never runs at the same time as other specs that modify the catalog.
 */

import { test } from '@playwright/test';

import { runDynamicACLTests } from '@isrd-isi-edu/chaise/test/e2e/specs/all-features/acls/dynamic-acl.spec.include';
import { runStaticACLTests } from '@isrd-isi-edu/chaise/test/e2e/specs/all-features/acls/static-acl.spec.include';
import { TEST_LOCKS } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';

test.describe('regarding static ACL support', { lock: TEST_LOCKS.CATALOG_MODEL }, async () => {
  runStaticACLTests();
});

test.describe('regarding dynamic ACL support', { lock: TEST_LOCKS.CATALOG_MODEL }, () => {
  runDynamicACLTests();
});
