import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';

// utils
import { ID_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';

const navbarLibSettings = {
  appName: 'navbar'
};

// TODO more specific id?
const root = createRoot(document.getElementById(ID_NAMES.APP_ROOT) as HTMLElement);
root.render(
  <AppWrapper appSettings={navbarLibSettings} includeNavbar ignoreHashChange>
    {/* navbar is already included and we don't want anything else */}
    {/* (this comment is needed since appwrapper expects children) */}
  </AppWrapper>
);
