import '@isrd-isi-edu/chaise/src/assets/scss/_alerts.scss';

// components
import { Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';

// hooks
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';

// models
import { ChaiseAlert, CHAISE_ALERT_TYPE_MAPPING } from '@isrd-isi-edu/chaise/src/providers/alerts';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

// utils
import { toTitlecase } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

import { Variant } from 'react-bootstrap/esm/types';

export const Alerts = (): JSX.Element => {
  const { alerts, removeAlert } = useAlert();
  const { popupLogin } = useAuthn();

  const login = () => {
    popupLogin(LogActions.LOGIN_WARNING);
  }

  const renderSessionExpiredAlert = (alert: ChaiseAlert) => {
    const tooltipText = 'Clicking on \'×\' button on the right will snooze this alert for one hour.'
    return (<>
      <strong className='alert-title'>{toTitlecase(alert.type)}</strong>
      <span>
        {'Your login session has expired. You are now accessing data anonymously. '}
        <a onClick={() => login()}>Log in</a>{' to continue your privileged access. '}
        <OverlayTrigger
          placement='bottom-start'
          overlay={<Tooltip>{tooltipText}</Tooltip>}
        >
          <i className='chaise-icon chaise-info'></i>
        </OverlayTrigger>
      </span>
    </>)
  }

  const renderAlerts = () => {
    return alerts.map((alert: ChaiseAlert, index: number) => {
      const variant = CHAISE_ALERT_TYPE_MAPPING[alert.type];
      return (
        <Alert key={index} variant={variant} dismissible onClose={() => removeAlert(alert)}>
          {/* TODO should it be able to render HTML? */}
          {alert.isSessionExpiredAlert ? renderSessionExpiredAlert(alert) : 
            <>
              <strong className='alert-title'>{toTitlecase(alert.type)}</strong>
              <span dangerouslySetInnerHTML={{ __html: alert.message }}></span>
            </>
          }
        </Alert>
      )
    });
  }

  return (
    <div className='alerts-container'>{renderAlerts()}</div>
  );
}

export default Alerts;
