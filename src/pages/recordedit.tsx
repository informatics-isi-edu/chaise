import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import TypeUtils from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { chaiseURItoErmrestURI, createRedirectLinkFromPath } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { useEffect } from 'react';
import ReactDOM from 'react-dom';

const recordeditSettings = {
  appName: 'recordedit',
  appTitle: 'Recordedit',
  overrideHeadTitle: true,
  overrideDownloadClickBehavior: true,
  overrideExternalLinkBehavior: true
};

const RecordeditApp = () : JSX.Element => {

  const { dispatchError } = useError();

  useEffect(() => {

    let logObject: any = {};
    const res = chaiseURItoErmrestURI(windowRef.location);
    if (res.pcid) logObject.pcid = res.pcid;
    if (res.ppid) logObject.ppid = res.ppid;
    if (res.isQueryParameter) logObject.cqp = 1;

    ConfigService.ERMrest.resolve(res.ermrestUri).then((response: any) => {
      $log.info('reference resolved');
    }).catch((err: any)=> {
      if (TypeUtils.isObjectAndKeyDefined(err.errorData, 'redirectPath')) {
        err.errorData.redirectUrl = createRedirectLinkFromPath(err.errorData.redirectPath);
      }
      dispatchError({ error: err, isGlobal: true });
    })

  }, [])

  return (
    <div>Recordedit app!</div>
  )
};

ReactDOM.render(
  <AppWrapper
    appSettings={recordeditSettings}
    includeAlerts={true}
    includeNavbar={true}
    displaySpinner={true}
  >
    <RecordeditApp />
  </AppWrapper>,
  document.getElementById('chaise-app-root'),
);
