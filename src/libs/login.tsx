import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';
import ChaiseLogin from '@isrd-isi-edu/chaise/src/components/navbar/login';

// services
import { ConfigServiceSettings } from '@isrd-isi-edu/chaise/src/services/config';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utilities
import { APP_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';
import { waitForElementToLoad } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

const loginLibSettings : ConfigServiceSettings = {
  appName: APP_NAMES.LOGIN,
  skipParsingURLForCatalogID: true
};

/**
 * since angularjs implementation relies on "login" tag, I decided to
 * keep it the same to reduce the amount of needed changes.
 */
const LOGIN_SELECTOR = 'login';

waitForElementToLoad(LOGIN_SELECTOR).then(() => {
  const root = createRoot(document.querySelector(LOGIN_SELECTOR) as HTMLElement);
  root.render(
    <AppWrapper appSettings={loginLibSettings} ignoreHashChange>
      <ChaiseLogin />
    </AppWrapper>
  );
}).catch((error) => {
  $log.error('<login> element is either missing or never loaded.')
  $log.error(error);
});
