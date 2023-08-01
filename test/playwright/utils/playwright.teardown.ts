import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('doing global teardown');
  console.log(process.env.FOO);
  console.log(process.env.BAR);
}

export default globalTeardown;
