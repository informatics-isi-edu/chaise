import '@isrd-isi-edu/chaise/src/assets/scss/_alerts.scss';

// components
import Alert from 'react-bootstrap/Alert';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

// hooks
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';

// models
import { ChaiseAlert, CHAISE_ALERT_TYPE_MAPPING } from '@isrd-isi-edu/chaise/src/providers/alerts';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

// utils
import { toTitlecase } from '@isrd-isi-edu/chaise/src/utils/string-utils';

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
