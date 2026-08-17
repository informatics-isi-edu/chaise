import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';
import ERD from '@isrd-isi-edu/chaise/src/components/erd/erd';

// utilities
import { APP_NAMES, ID_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';
import { ConfigServiceSettings } from '@isrd-isi-edu/chaise/src/services/config';

const erdSettings: ConfigServiceSettings = {
  appName: APP_NAMES.ERD,
  appTitle: 'Model Diagram',
  overrideHeadTitle: false,
  overrideImagePreviewBehavior: true,
  overrideDownloadClickBehavior: true,
  overrideExternalLinkBehavior: true,
  overrideImageErrorBehavior: true,
};

const root = createRoot(document.getElementById(ID_NAMES.APP_ROOT) as HTMLElement);
root.render(
  <AppWrapper appSettings={erdSettings} includeAlerts includeNavbar displaySpinner>
    <ERD />
  </AppWrapper>
);
