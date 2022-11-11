import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';
import ChaiseLogin from '@isrd-isi-edu/chaise/src/components/navbar/login';

const loginLibSettings = {
  appName: 'login'
};

/**
 * since angularjs implementation relies on "login" tag, I decided to
 * keep it the same to reduce the amount of needed changes.
 */
const root = createRoot(document.querySelector('login') as HTMLElement);
root.render(
  <AppWrapper appSettings={loginLibSettings} ignoreHashChange>
    <ChaiseLogin />
  </AppWrapper>
);
