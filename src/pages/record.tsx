import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { chaiseURItoErmrestURI, createRedirectLinkFromPath } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import Record, { RecordProps } from '@isrd-isi-edu/chaise/src/components/record/record';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import { updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { getDisplaynameInnerText } from '@isrd-isi-edu/chaise/src/utils/data-utils';

const recordSettings = {
  appName: 'record',
  appTitle: 'Record',
  overrideHeadTitle: true,
  overrideDownloadClickBehavior: true,
  overrideExternalLinkBehavior: true
};

const RecordApp = (): JSX.Element => {

  const { dispatchError, error } = useError();

  const [recordProps, setRecordProps] = useState<RecordProps | null>(null);

  useEffect(() => {

    let logObject: any = {};
    const res = chaiseURItoErmrestURI(windowRef.location);
    if (res.pcid) logObject.pcid = res.pcid;
    if (res.ppid) logObject.ppid = res.ppid;
    if (res.isQueryParameter) logObject.cqp = 1;

    ConfigService.ERMrest.resolve(res.ermrestUri).then((response: any) => {
      const reference = response.contextualize.compact;

      updateHeadTitle(`${getDisplaynameInnerText(reference.displayname)}: pending...`);

      // TODO log stuff and other props
      setRecordProps({ reference });

    }).catch((err: any) => {
      if (isObjectAndKeyDefined(err.errorData, 'redirectPath')) {
        err.errorData.redirectUrl = createRedirectLinkFromPath(err.errorData.redirectPath);
      }
      dispatchError({ error: err, isGlobal: true });
    })

  }, []);

  // if there was an error during setup, hide the spinner
  if (!recordProps && error) {
    return <></>;
  }

  if (!recordProps) {
    return <ChaiseSpinner />;
  }

  return <Record {...recordProps} />;
};

ReactDOM.render(
  <AppWrapper
    appSettings={recordSettings}
    includeAlerts={true}
    includeNavbar={true}
    displaySpinner={true}
  >
    <RecordApp />
  </AppWrapper>,
  document.getElementById('chaise-app-root'),
);


