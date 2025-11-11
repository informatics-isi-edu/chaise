// components
import Dropdown from 'react-bootstrap/Dropdown';
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch/input-switch';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// hooks
import { FormProvider, useForm } from 'react-hook-form';
import { useState } from 'react';

// models
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { formatDatetime } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { dataFormats } from '@isrd-isi-edu/chaise/src/utils/constants';
import { addLogParams } from '@isrd-isi-edu/chaise/src/utils/menu-utils';

type SnapshotFormData = {
  [key: string]: string;
};

const SnapshotForm = () => {
  const [snapshotOption, setSnapshotOption] = useState('snapshot');

  const catalogId = ConfigService.catalogID;
  const catalogIdVersion = ConfigService.CatalogIDVersion;
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

  /**
   * the callback for when custom snapshot button is clicked
   */
  const gotToSnapshot = (data: SnapshotFormData) => {
    let url;
    if (snapshotOption === 'live') {
      url = windowRef.location.href.replace(catalogId, catalogId.split('@')[0]);
    } else {
      const dateValue = data[fieldName];

      if (!isStringAndNotEmpty(dateValue)) return;

      let snap = '';
      try {
        snap = ConfigService.ERMrest.HistoryService.datetimeISOToSnapshot(
          new Date(dateValue).toISOString()
        );
      } catch (e) {
        console.error('Unable to resolve the snapshot', e);
      }

      if (!isStringAndNotEmpty(snap)) {
        // TODO: show error to user
        console.error('Unable to resolve the snapshot');
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
          <span>Show </span>
          {currVersionValue ? (
            <Dropdown onSelect={handleDropdownChange}>
              <Dropdown.Toggle className='chaise-btn chaise-btn-secondary toggle-snapshot-live-btn'>
                {formEnabled ? 'snapshot from' : 'live data'}
              </Dropdown.Toggle>
              <Dropdown.Menu as='ul'>
                <Dropdown.Item as='li' eventKey='snapshot'>
                  <span>snapshot from</span>
                </Dropdown.Item>
                <Dropdown.Item as='li' eventKey='live'>
                  <span>live data</span>
                </Dropdown.Item>
                {/* <Dropdown.Item as='li' eventKey='snapshot'>
                  <span>snapshot from</span>
                  {formEnabled && (
                    <span className='fa-solid fa-check' style={{ float: 'right' }}></span>
                  )}
                </Dropdown.Item>
                <Dropdown.Item as='li' eventKey='live'>
                  <span>live data</span>
                  {snapshotOption === 'live' && (
                    <span className='fa-solid fa-check' style={{ float: 'right' }}></span>
                  )}
                </Dropdown.Item> */}
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <span>snapshot from</span>
          )}
          <span>: </span>
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
        <button
          type='submit'
          className='chaise-btn chaise-btn-primary snapshot-form-apply-btn'
          disabled={disableSubmit()}
        >
          Apply
        </button>
      </form>
    </FormProvider>
  );
};

export default SnapshotForm;
