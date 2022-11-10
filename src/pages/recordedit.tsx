import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';
import Recordedit, { RecordeditProps } from '@isrd-isi-edu/chaise/src/components/recordedit/recordedit';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';

// hooks
import { useEffect, useState, useRef } from 'react';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';

// models
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { AuthnStorageService } from '@isrd-isi-edu/chaise/src/services/authn-storage';

// utils
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { chaiseURItoErmrestURI, createRedirectLinkFromPath } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { APP_ROOT_ID_NAME } from '@isrd-isi-edu/chaise/src/utils/constants';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';

const recordeditSettings = {
  appName: 'recordedit',
  appTitle: 'Recordedit',
  overrideHeadTitle: true,
  overrideDownloadClickBehavior: true,
  overrideExternalLinkBehavior: true
};

const RecordeditApp = (): JSX.Element => {

  const { addAlert } = useAlert();
  const { session, showPreviousSessionAlert, popupLogin } = useAuthn();
  const { dispatchError, errors } = useError();

  const [recordeditProps, setRecordeditProps] = useState<RecordeditProps | null>(null);

  // since we're using strict mode, the useEffect is getting called twice in dev mode
  // this is to guard against it
  const setupStarted = useRef<boolean>(false);

  useEffect(() => {
    if (setupStarted.current) return;
    setupStarted.current = true;

    const logObject: any = {};
    const res = chaiseURItoErmrestURI(windowRef.location);
    if (res.pcid) logObject.pcid = res.pcid;
    if (res.ppid) logObject.ppid = res.ppid;
    if (res.isQueryParameter) logObject.cqp = 1;

    ConfigService.ERMrest.resolve(res.ermrestUri).then((response: any) => {
      // TODO should be changed, we're assuming create mode right now
      const reference = response.contextualize.entryCreate;

      // TODO update head title

      if (!session && showPreviousSessionAlert()) {
        addAlert(MESSAGE_MAP.previousSession.message, ChaiseAlertType.WARNING, AuthnStorageService.createPromptExpirationToken, true);
      }

      // TODO set log related properties


      setRecordeditProps({ reference, initialized: true });

    }).catch((err: any) => {
      if (isObjectAndKeyDefined(err.errorData, 'redirectPath')) {
        err.errorData.redirectUrl = createRedirectLinkFromPath(err.errorData.redirectPath);
      }
      dispatchError({ error: err });
    });

  }, []);

  // if there was an error during setup, hide the spinner
  if (!recordeditProps && errors.length > 0) {
    return <></>;
  }

  if (!recordeditProps) {
    return <ChaiseSpinner />;
  }

  return <Recordedit {...recordeditProps} />;
};

// TODO: make sure this is what we want
const root = createRoot(document.getElementById(APP_ROOT_ID_NAME) as HTMLElement);
root.render(
  <AppWrapper
    appSettings={recordeditSettings}
    includeAlerts={true}
    includeNavbar={true}
    displaySpinner={true}
  >
    <RecordeditApp />
  </AppWrapper>
);
