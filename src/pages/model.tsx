import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';
import Model from '@isrd-isi-edu/chaise/src/components/model/model';

// utilities
import { APP_NAMES, ID_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';
import { ConfigServiceSettings } from '@isrd-isi-edu/chaise/src/services/config';

const modelSettings: ConfigServiceSettings = {
  appName: APP_NAMES.MODEL,
  appTitle: 'Data Model',
  overrideHeadTitle: false,
  overrideImagePreviewBehavior: true,
  overrideDownloadClickBehavior: true,
  overrideExternalLinkBehavior: true,
  overrideImageErrorBehavior: true,
};

const root = createRoot(document.getElementById(ID_NAMES.APP_ROOT) as HTMLElement);
// the model app handles hash changes itself, see the hashchange listener in components/model/model.tsx
root.render(
  <AppWrapper appSettings={modelSettings} includeAlerts includeNavbar displaySpinner ignoreHashChange>
    <Model />
  </AppWrapper>
);
