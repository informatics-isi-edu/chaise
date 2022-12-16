
import type { Config } from 'jest';

export const performLogin = async (cookie: string) => {
  console.log('cookie is  ' + cookie);
  await page.goto(process.env.CHAISE_BASE_URL + "/login/");

  await page.waitForFunction('window.location.pathname.includes("/login/")');

  await page.evaluate((cookieVal, isCI) => {
    document.cookie = `${cookieVal};path=/;${isCI ? '' : 'secure;'}`
    window.localStorage.setItem('session', '{"previousSession":true}');
  }, cookie, process.env.CI);
};
