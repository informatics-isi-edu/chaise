import moment from 'moment-timezone';

// components
import Dropdown from 'react-bootstrap/Dropdown';
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch/input-switch';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// hooks
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { SnapshotError } from '@isrd-isi-edu/chaise/src/models/errors';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utils
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { formatDatetime } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { dataFormats, errorMessages } from '@isrd-isi-edu/chaise/src/utils/constants';
import { addLogParams } from '@isrd-isi-edu/chaise/src/utils/menu-utils';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';

type SnapshotFormData = {
  [key: string]: string;
};

const SnapshotForm = () => {
  const { dispatchError, logTerminalError } = useError();

  const [snapshotOption, setSnapshotOption] = useState('snapshot');

  const catalogId = ConfigService.catalogID;
  const catalogIdVersion = ConfigService.catalogIDVersion;
  const fieldName = 'version-timestamp';

  const currVersionValue = catalogIdVersion
    ? formatDatetime(
        ConfigService.ERMrest.HistoryService.snapshotToDatetimeISO(catalogIdVersion, true),
        { outputMomentFormat: dataFormats.datetime.return }
      )
    : null;

  const methods = useForm<SnapshotFormData>({
    mode: 'onChange',
    defaultValues: {
      [fieldName]: currVersionValue?.datetime || '',
      [fieldName + '-date']: currVersionValue?.date || '',
      [fieldName + '-time']: currVersionValue?.time || '',
    },
  });

  // -------------------  UI callbacks:   --------------------//

  const handleDropdownChange = (value: string | null) => {
    if (value === null) return;
    setSnapshotOption(value);
  };

  const showError = (message: string, subMessage?: string) => {
    dispatchError({ error: new SnapshotError(message, subMessage) });
  };

  /**
   * the callback for when custom snapshot button is clicked
   */
  const gotToSnapshot = (data: SnapshotFormData) => {
    let url;
    if (snapshotOption === 'live') {
      url = windowRef.location.href.replace(catalogId, catalogId.split('@')[0]);
    } else {
      const dateValue = data[fieldName];
      const m = moment(dateValue);

      let snap = '', errorDetails;
      try {
        snap = ConfigService.ERMrest.HistoryService.datetimeISOToSnapshot(m.toISOString());
      } catch (e) {
        logTerminalError(e);
        errorDetails = e instanceof Error ? e.message : '';
      }

      if (!isStringAndNotEmpty(snap)) {
        showError(errorMessages.goToSnapshot.terminal, errorDetails);
        return;
      }

      url = window.location.href.replace(catalogId, catalogId.split('@')[0] + '@' + snap);
    }

    if (!url) return;
    windowRef.location = addLogParams(url, ConfigService.contextHeaderParams);
    windowRef.location.reload();
  };

  // -------------------  render logic:   --------------------//
  const formEnabled = snapshotOption === 'snapshot';

  const disableSubmit = () => {
    if (!formEnabled) return false;
    const hasError = Boolean(fieldName in methods.formState.errors);
    const isEmpty = !methods.watch(fieldName);
    return hasError || isEmpty;
  };

  return (
    <FormProvider {...methods}>
      <form
        className='chaise-snapshot-form'
        onSubmit={(event) => {
          event.stopPropagation();
          void methods.handleSubmit(gotToSnapshot)(event);
        }}
      >
        <div className={`snapshot-form-label${currVersionValue ? ' w-current-version' : ''}`}>
          {currVersionValue ? (
            <>
              <span style={{ marginRight: '5px' }}>Show</span>
              <Dropdown onSelect={handleDropdownChange}>
                <Dropdown.Toggle className='chaise-btn chaise-btn-secondary toggle-snapshot-live-btn'>
                  {formEnabled ? 'snapshot from' : 'live data'}
                </Dropdown.Toggle>
                <Dropdown.Menu align='start'>
                  <Dropdown.Item eventKey='snapshot' className='snapshot-item'>
                    <span>snapshot from</span>
                    {formEnabled && <span className='fa-solid fa-check'></span>}
                  </Dropdown.Item>
                  <Dropdown.Item eventKey='live' className='live-item'>
                    <span>live data</span>
                    {!formEnabled && <span className='fa-solid fa-check'></span>}
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <span style={{ marginLeft: '2px' }}>: </span>
            </>
          ) : (
            <span>Show snapshot from:</span>
          )}
        </div>
        <InputSwitch
          displayExtraDateTimeButtons
          displayErrors={false}
          disableInput={!formEnabled}
          name={fieldName}
          inputClassName={makeSafeIdAttr(fieldName)}
          type='timestamp'
          inputClasses='snapshot-date-input'
          timeClasses='snapshot-time-input'
          clearClasses='snapshot-date-clear'
          clearTimeClasses='snapshot-time-clear'
        />
        <ChaiseTooltip
          placement='bottom'
          tooltip={formEnabled ? MESSAGE_MAP.tooltip.snapshotDropdown.snapshotOnly : MESSAGE_MAP.tooltip.snapshotDropdown.liveOnly}
        >
          <button
            type='submit'
            className='chaise-btn chaise-btn-primary snapshot-form-apply-btn'
            disabled={disableSubmit()}
          >
            Apply
          </button>
        </ChaiseTooltip>
      </form>
    </FormProvider>
  );
};

export default SnapshotForm;
