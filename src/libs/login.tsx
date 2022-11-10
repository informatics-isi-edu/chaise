import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';
import ChaiseLogin from '@isrd-isi-edu/chaise/src/components/navbar/login';

// utils
import { ID_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';

const loginLibSettings = {
  appName: 'login'
};

// TODO more specific id?
const root = createRoot(document.getElementById(ID_NAMES.APP_ROOT) as HTMLElement);
root.render(
  <AppWrapper appSettings={loginLibSettings} ignoreHashChange>
    <ChaiseLogin />
  </AppWrapper>
);
