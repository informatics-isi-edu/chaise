// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DisplayCommentValue from '@isrd-isi-edu/chaise/src/components/display-comment-value';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch/input-switch';

// hooks
import { useFormContext } from 'react-hook-form';
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';

// models
import { appModes, RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';

// utils
import { getDisabledInputValue } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { ID_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';

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

    const valName = `c_${formNumber}-${columnModel.column.RID}`;
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
    const colRid = columnModel.column.RID;

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
        name={`c_${formNumber}-${colRid}`}
        inputName={`c_${formNumber}-${makeSafeIdAttr(colName)}`}
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
      id={ID_NAMES.VIEWER_ANNOTATION_FORM}
      className='viewer-annotation-form'
      onSubmit={handleSubmit(onSubmitValid, onSubmitInvalid)}
    >
      {columnModels.map((cm, idx) => (
        (!cm.isHidden && <div key={idx} className='viewer-annotation-form-row'>
          <div className='viewer-annotation-form-row-header'>
            {cm.isRequired && <span className='text-danger'><b>*</b> </span>}
            {cm.column.comment ?
              <ChaiseTooltip
                placement='right'
                tooltip={<DisplayCommentValue comment={cm.column.comment} />}
              >
                {renderColumnHeader(cm.column)}
              </ChaiseTooltip> :
              renderColumnHeader(cm.column)
            }
          </div>
          <div className='viewer-annotation-form-row-input'>
            {renderInput(cm)}
          </div>
        </div>)
      ))}
    </form>
  )
};

export default ViewerAnnotationFormContainer;
