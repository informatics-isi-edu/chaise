// components
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch/input-switch';

// hooks
import { FormProvider, useForm } from 'react-hook-form';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';

// models
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

type PermalinkFormData = {
  [key: string]: string;
};

const PermalinkForm = () => {
  const catalogId = ConfigService.catalogID;
  const fieldName = 'permalink-date';

  const methods = useForm<PermalinkFormData>({
    mode: 'onChange',
    defaultValues: {
      [fieldName]: ''
    }
  });

  /**
   * the callback for when custom permalink button is clicked
   */
  const handleCustomPermalinkClick = (data: PermalinkFormData) => {
    const dateValue = data[fieldName];
    
    if (!isStringAndNotEmpty(dateValue)) return;

    let snap = '';
    try {
      snap = ConfigService.ERMrest.HistoryService.datetimeISOToSnapshot(new Date(dateValue).toISOString());
    } catch (e) {
      // TODO: show error to user
      console.error('Unable to resolve the snapshot', e);
      return;
    }

    if (!isStringAndNotEmpty(snap)) {
      // TODO: show error to user
      console.error('Unable to resolve the snapshot');
      return;
    }

    const url = window.location.href.replace(catalogId, catalogId.split('@')[0] + '@' + snap);

    LogService.logClientAction({
      action: LogService.getActionString(LogActions.PERMALINK_LEFT, '', ''),
      stack: LogService.getStackObject()
    }, null);

    windowRef.open(url, '_blank');
  };

  const disableSubmit = () => {
    const hasError = Boolean(fieldName in methods.formState.errors);
    const isEmpty = !methods.watch(fieldName);
    return hasError || isEmpty;
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={(event) => {
        event.stopPropagation();
        void methods.handleSubmit(handleCustomPermalinkClick)(event);
      }}>
        <div className='permalink-form-input'>
          <label>Browse History:
            <InputSwitch
              displayExtraDateTimeButtons
              displayErrors={false}
              disableInput={false}
              name={fieldName}
              inputClassName={makeSafeIdAttr(fieldName)}
              type='timestamp'
              inputClasses='permalink-date-input'
              timeClasses='permalink-time-input'
              clearClasses='permalink-date-clear'
              clearTimeClasses='permalink-time-clear'
            />
          </label>
        </div>
        <div style={{ position: 'absolute', right: '10px', bottom: '10px' }}>
          <button
            type='submit'
            className='chaise-btn chaise-btn-primary'
            disabled={disableSubmit()}
          >
            Go
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

export default PermalinkForm;
