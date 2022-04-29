import '@chaise/assets/scss/_alerts.scss';
import useAlert from '@chaise/hooks/alerts';
import { ChaiseAlert, CHAISE_ALERT_TYPE_MAPPING } from '@chaise/providers/alerts';
import { toTitlecase } from '@chaise/utils/string-utils';
import { Alert } from 'react-bootstrap';
import { Variant } from 'react-bootstrap/esm/types';

export const Alerts = (): JSX.Element => {
  const { alerts, removeAlert } = useAlert();
  const renderAlerts = () => {
    return alerts.map((alert: ChaiseAlert, index: number) => {
      const variant = CHAISE_ALERT_TYPE_MAPPING[alert.type];
      return (
        <Alert key={index} variant={variant} dismissible onClose={() => removeAlert(alert)}>
          {/* TODO should it be able to render HTML? */}
          <strong className='alert-title'>{toTitlecase(alert.type)}</strong>
          <span dangerouslySetInnerHTML={{ __html: alert.message }}></span>
        </Alert>
      )
    });
  }

  return (
    <div className='alerts-container'>{renderAlerts()}</div>
  );
}

export default Alerts;
