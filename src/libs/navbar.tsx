import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';

const navbarLibSettings = {
  appName: 'navbar'
};

/**
 * since angularjs implementation relies on "navbar" tag, I decided to
 * keep it the same to reduce the amount of needed changes.
 */
const root = createRoot(document.querySelector('navbar') as HTMLElement);
root.render(
  <AppWrapper appSettings={navbarLibSettings} includeNavbar ignoreHashChange>
    {/* navbar is already included and we don't want anything else */}
    {/* (this comment is needed since appwrapper expects children) */}
  </AppWrapper>
);
