import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';
import Record, { RecordProps } from '@isrd-isi-edu/chaise/src/components/record/record';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';

// hooks
import { useEffect, useState } from 'react';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { AuthnStorageService } from '@isrd-isi-edu/chaise/src/services/authn-storage';

// utilities
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { chaiseURItoErmrestURI, createRedirectLinkFromPath } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { getDisplaynameInnerText } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { APP_ROOT_ID_NAME } from '@isrd-isi-edu/chaise/src/utils/constants';

const recordSettings = {
  appName: 'record',
  appTitle: 'Record',
  overrideHeadTitle: true,
  overrideDownloadClickBehavior: true,
  overrideExternalLinkBehavior: true
};

const RecordApp = (): JSX.Element => {

  const { addAlert } = useAlert()
  const { session, showPreviousSessionAlert } = useAuthn();
  const { dispatchError, errors } = useError();

  const [recordProps, setRecordProps] = useState<RecordProps | null>(null);

  useEffect(() => {

    let logObject: any = {};
    const res = chaiseURItoErmrestURI(windowRef.location);
    if (res.pcid) logObject.pcid = res.pcid;
    if (res.ppid) logObject.ppid = res.ppid;
    if (res.isQueryParameter) logObject.cqp = 1;

    ConfigService.ERMrest.resolve(res.ermrestUri).then((response: any) => {
      const reference = response.contextualize.detailed;

      updateHeadTitle(`${getDisplaynameInnerText(reference.displayname)}: pending...`);

      if (!session && showPreviousSessionAlert()) {
        addAlert(MESSAGE_MAP.previousSession.message, ChaiseAlertType.WARNING, AuthnStorageService.createPromptExpirationToken, true);
      }

      // TODO log stuff and other props
      setRecordProps({ reference });

    }).catch((err: any) => {
      if (isObjectAndKeyDefined(err.errorData, 'redirectPath')) {
        err.errorData.redirectUrl = createRedirectLinkFromPath(err.errorData.redirectPath);
      }
      dispatchError({ error: err });
    })

  }, []);

  // if there was an error during setup, hide the spinner
  if (!recordProps && errors.length > 0) {
    return <></>;
  }

  if (!recordProps) {
    return <ChaiseSpinner />;
  }

  return <Record {...recordProps} />;
};

const root = createRoot(document.getElementById(APP_ROOT_ID_NAME) as HTMLElement);
root.render(
  <AppWrapper
    appSettings={recordSettings}
    includeAlerts={true}
    includeNavbar={true}
    displaySpinner={true}
  >
    <RecordApp />
  </AppWrapper>
);

