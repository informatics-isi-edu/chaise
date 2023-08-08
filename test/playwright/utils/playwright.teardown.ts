import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('doing global teardown');
}

export default globalTeardown;
