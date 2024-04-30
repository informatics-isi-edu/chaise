/**
 * both dynamic and static specs change catalog configuration. so we have
 * to make sure they are not running at the same time.
 */

import { test } from '@playwright/test';

import { runDynamicACLTests } from '@isrd-isi-edu/chaise/test/e2e/specs/all-features/acls/dynamic-acl.spec.include';
import { runStaticACLTests } from '@isrd-isi-edu/chaise/test/e2e/specs/all-features/acls/static-acl.spec.include';

test.describe('regarding static ACL support', async () => {
  runStaticACLTests();
});

test.describe('regarding dynamic ACL support', () => {
  runDynamicACLTests();
});
