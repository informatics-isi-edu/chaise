import '@isrd-isi-edu/chaise/src/assets/scss/_chat-app.scss';

import { type JSX } from 'react';
import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';
import Chat from '@isrd-isi-edu/chaise/src/components/chat/chat';

// services / utils
import { ConfigServiceSettings } from '@isrd-isi-edu/chaise/src/services/config';
import { APP_NAMES, ID_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';

const chatSettings: ConfigServiceSettings = {
  appName: APP_NAMES.CHAT,
  appTitle: 'Assistant',
  overrideHeadTitle: true,
  overrideImagePreviewBehavior: false,
  overrideDownloadClickBehavior: false,
  overrideExternalLinkBehavior: false,
  // the assistant is not addressed by a catalog id in the URL
  skipParsingURLForCatalogID: true,
};

/**
 * Standalone page entry for the assistant app. Mirrors RecordsetApp: it owns the
 * AppWrapper bootstrap and renders the reusable <Chat /> component.
 */
const ChatApp = (): JSX.Element => (
  <AppWrapper appSettings={chatSettings} includeAlerts includeNavbar displaySpinner>
    <Chat />
  </AppWrapper>
);

const root = createRoot(document.getElementById(ID_NAMES.APP_ROOT) as HTMLElement);
root.render(<ChatApp />);
