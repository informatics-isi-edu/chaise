// components
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch/input-switch';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// hooks
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';

// models
import { appModes, RecordeditColumnModel, RecordeditDisplayMode, SELECT_ALL_INPUT_FORM_VALUE } from '@isrd-isi-edu/chaise/src/models/recordedit';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

// utils
import { getDisabledInputValue } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { copyOrClearValue } from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { addTopHorizontalScroll } from '@isrd-isi-edu/chaise/src/utils/ui-utils';


const ViewerAnnotationFormContainer = (): JSX.Element => {

  const {
    forms, appMode, reference, columnModels, tuples,
    canUpdateValues, foreignKeyData, waitingForForeignKeyData,
    getRecordeditLogStack, getRecordeditLogAction,
    onSubmitValid, onSubmitInvalid, foreignKeyCallbacks
  } = useRecordedit();

  const { handleSubmit } = useFormContext();


  const formNumber = forms[0];

  /**
  * Returntrue if,
  *  - columnModel is marked as disabled
  *  - based on dynamic ACLs the column cannot be updated (based on canUpdateValues)
  *  - show all
  * @param formNumber
  * @param columnModel
  * @param canUpdateValues
  */
  const getIsDisabled = (columnModel: RecordeditColumnModel): boolean => {
    if (columnModel.isDisabled) {
      return true;
    }

    const valName = `${formNumber}-${columnModel.column.name}`;
    if (canUpdateValues && valName in canUpdateValues && canUpdateValues[valName] === false) {
      return true;
    }

    return false;
  }

  const renderColumnHeader = (column: any) => {
    const headerClassName = `column-displayname${column.comment ? ' chaise-icon-for-tooltip' : ''}`;
    return (
      <span className={headerClassName}>
        <DisplayValue value={column.displayname} />
        {column.comment ? ' ' : ''}
      </span>
    )
  }


  const renderInput = (columnModel: RecordeditColumnModel) => {
    const colName = columnModel.column.name;

    const isDisabled = getIsDisabled(columnModel);

    let placeholder = '';
    if (isDisabled) {
      placeholder = getDisabledInputValue(columnModel.column);
    }

    return (
      <InputSwitch
        key={colName}
        displayErrors
        displayExtraDateTimeButtons
        displayDateTimeLabels
        disableInput={isDisabled}
        requiredInput={columnModel.isRequired}
        name={`${formNumber}-${colName}`}
        type={columnModel.inputType}
        classes='column-cell-input'
        placeholder={placeholder}
        columnModel={columnModel}
        appMode={appMode}
        formNumber={formNumber}
        parentReference={reference}
        parentTuple={appMode === appModes.EDIT ? tuples[0] : undefined}
        parentLogStack={getRecordeditLogStack()}
        parentLogStackPath={getRecordeditLogAction(true)}
        foreignKeyData={foreignKeyData}
        waitingForForeignKeyData={waitingForForeignKeyData}
        foreignKeyCallbacks={foreignKeyCallbacks}
      />
    )
  }

  return (
    <form
      className='annotation-form'
      onSubmit={handleSubmit(onSubmitValid, onSubmitInvalid)}
    >
      {columnModels.map((cm, idx) => (
        (!cm.isHidden && <div key={idx} className='annotation-form-row'>
          <div className='annotation-form-row-header'>
            {cm.isRequired && <span className='text-danger'><b>*</b> </span>}
            {cm.column.comment ?
              <ChaiseTooltip
                placement='right'
                tooltip={cm.column.comment}
              >
                {renderColumnHeader(cm.column)}
              </ChaiseTooltip> :
              renderColumnHeader(cm.column)
            }
          </div>
          <div className='annotation-form-row-input'>
            {renderInput(cm)}
          </div>
        </div>)
      ))}
    </form>
  )
};

export default ViewerAnnotationFormContainer;
