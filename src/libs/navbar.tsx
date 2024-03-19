import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';

// services
import { ConfigServiceSettings } from '@isrd-isi-edu/chaise/src/services/config';

// utilities
import { APP_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';
import { waitForElementToLoad } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

const navbarLibSettings: ConfigServiceSettings = {
  appName: APP_NAMES.NAVBAR
};

/**
 * since angularjs implementation relies on 'navbar' tag, I decided to
 * keep it the same to reduce the amount of needed changes.
 */
const NAVBAR_SELECTOR = 'navbar';

waitForElementToLoad(NAVBAR_SELECTOR).then(() => {
  const navbar = document.querySelector(NAVBAR_SELECTOR) as HTMLElement;

  createRoot(navbar).render(
    <AppWrapper
      appSettings={navbarLibSettings} smallSpinnerContainer={navbar}
      includeNavbar ignoreHashChange
    >
      {/* navbar is already included and we don't want anything else */}
      <></>
    </AppWrapper>
  );

});
