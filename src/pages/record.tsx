import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';
import Record, { RecordProps } from '@isrd-isi-edu/chaise/src/components/record/record';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';

// hooks
import { useEffect, useRef, useState } from 'react';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';
import { LogActions, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { AuthnStorageService } from '@isrd-isi-edu/chaise/src/services/authn-storage';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utilities
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { chaiseURItoErmrestURI, createRedirectLinkFromPath } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { getDisplaynameInnerText } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { ID_NAMES, QUERY_PARAMS } from '@isrd-isi-edu/chaise/src/utils/constants';

const recordSettings = {
  appName: 'record',
  appTitle: 'Record',
  overrideHeadTitle: true,
  overrideDownloadClickBehavior: true,
  overrideExternalLinkBehavior: true
};

const RecordApp = (): JSX.Element => {

  const { addAlert } = useAlert();
  const { session, showPreviousSessionAlert, popupLogin } = useAuthn();
  const { dispatchError, errors } = useError();

  const [recordProps, setRecordProps] = useState<RecordProps | null>(null);

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

    // 'promptlogin' query parameter comes from static generated chaise record pages
    if (res.queryParams && !session && QUERY_PARAMS.PROMPT_LOGIN in res.queryParams) {
      popupLogin(LogActions.LOGIN_WARNING);
    }

    // 'scrollTo' query parameter used to automatically scroll to a related section on load
    let scrollToDisplayname: string;
    if (res.queryParams && QUERY_PARAMS.SCROLL_TO in res.queryParams) {
      scrollToDisplayname = res.queryParams[QUERY_PARAMS.SCROLL_TO];
    }

    ConfigService.ERMrest.resolve(res.ermrestUri).then((response: any) => {
      const reference = response.contextualize.detailed;

      updateHeadTitle(`${getDisplaynameInnerText(reference.displayname)}: pending...`);

      if (!session && showPreviousSessionAlert()) {
        addAlert(MESSAGE_MAP.previousSession.message, ChaiseAlertType.WARNING, AuthnStorageService.createPromptExpirationToken, true);
      }

      const logStack = [
        LogService.getStackNode(
          LogStackTypes.ENTITY,
          reference.table,
          reference.filterLogInfo,
        ),
      ];
      const logStackPath = LogStackTypes.ENTITY;

      // set the global log stack and log stack path
      LogService.config(logStack, logStackPath);

      // set the record props so it can start bootstraping
      setRecordProps({ reference, scrollToDisplayname, logInfo: { logObject, logStack, logStackPath } });

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

const root = createRoot(document.getElementById(ID_NAMES.APP_ROOT) as HTMLElement);
root.render(
  <AppWrapper appSettings={recordSettings} includeAlerts includeNavbar displaySpinner>
    <RecordApp />
  </AppWrapper>
);

