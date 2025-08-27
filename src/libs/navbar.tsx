import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';

// services
import { ConfigServiceSettings } from '@isrd-isi-edu/chaise/src/services/config';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utilities
import { APP_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';
import { waitForElementToLoad } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';


const navbarLibSettings: ConfigServiceSettings = {
  appName: APP_NAMES.NAVBAR,
  // we don't know what the url would look like on static sites that are using this
  skipParsingURLForCatalogID: true
};

/**
 * since angularjs implementation relies on 'navbar' tag, I decided to
 * keep it the same to reduce the amount of needed changes.
 */
const NAVBAR_SELECTOR = 'navbar';

waitForElementToLoad(NAVBAR_SELECTOR).then(() => {
  const navbar = document.querySelector(NAVBAR_SELECTOR) as HTMLElement;

  const defaultCatalog = isStringAndNotEmpty(navbar.dataset.defaultCatalog) ? navbar.dataset.defaultCatalog : undefined;

  createRoot(navbar).render(
    <AppWrapper
      appSettings={{ ...navbarLibSettings, defaultCatalog }}
      smallSpinnerContainer={navbar}
      includeNavbar ignoreHashChange
    >
      {/* navbar is already included and we don't want anything else */}
      <></>
    </AppWrapper>
  );
}).catch((error) => {
  $log.error('<navbar> element is either missing or never loaded.')
  $log.error(error);
});
