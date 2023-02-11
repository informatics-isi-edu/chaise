// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// hooks
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';

// models
import { appModes } from '@isrd-isi-edu/chaise/src/models/recordedit';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { getColumnModelLogAction, getColumnModelLogStack } from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';

const KeyColumn = (): JSX.Element => {

  const {
    appMode, columnModels, activeSelectAll, toggleActiveSelectAll,
    columnPermissionErrors, forms, reference, canUpdateValues
  } = useRecordedit();

  const onToggleClick = (cmIndex: number) => {
    const model = columnModels[cmIndex];

    const defaultLogInfo = (model.column.reference ? model.column.reference.defaultLogInfo : reference.defaultLogInfo);

    const action = cmIndex === activeSelectAll ? LogActions.SET_ALL_CLOSE : LogActions.SET_ALL_OPEN;

    // TODO parent stack model
    LogService.logClientAction({
        action: getColumnModelLogAction(action, model, null),
        stack: getColumnModelLogStack(model, null)
    }, defaultLogInfo);

    toggleActiveSelectAll(cmIndex);
  }


  // -------------------------- render logic ---------------------- //

  const renderColumnHeader = (column: any) => {
    const headerClassName = `column-displayname${column.comment ? ' chaise-icon-for-tooltip' : ''}`;
    return (
      <span className={headerClassName}>
        <DisplayValue value={column.displayname} />
        {column.comment ? ' ' : ''}
      </span>
    )
  }

  /**
   * whether we should show the button
   * NOTE: we used to show disabled tuples, if we decided to bring that back,
   * we need to change the logic here.
   */
  const canShowSelectAllBtn = (columnIndex: number) => {
    const cm = columnModels[columnIndex];

    // if we're already showing the select-all UI, then we have to show the button
    if (activeSelectAll === columnIndex) {
      return true;
    }

    // in this case we want toshow the button and instead disable it
    if (disableSelectAllbtn(columnIndex)) {
      return true;
    }

    // it must be multi-row, column must not be disabled,
    // and at least one row can be edited (if in edit mode)
    if (cm.isDisabled || forms.length < 2) {
      return false;
    }

    return true;
  };

  /**
   * if we're going to show column permission errors (one row has disabled a column),
   * then we should disable this button
   */
  const disableSelectAllbtn = (columnIndex: number) => {
    return appMode === appModes.EDIT && isObjectAndKeyDefined(columnPermissionErrors, columnModels[columnIndex].column.name);
  }

  return (
    <div className='entity-key-column'>
      <div className='form-header entity-key'>Record Number</div>
      {columnModels.map((cm: any, cmIndex: number) => {
        const column = cm.column;
        const colName = column.name;

        const isDisabled = disableSelectAllbtn(cmIndex);
        let tooltip = cmIndex === activeSelectAll ? 'Click to close the set all input.' : 'Click to set a value for all records.';
        if (isDisabled) {
          tooltip = 'Cannot perform this action.';
        }

        // try changing to div if height adjustment does not work
        return (
          // NOTE `entity-key-${cmIndex}` is used in form-container.tsx
          // to ensure consistent height between this element and FormRow
          <span key={colName} className={`entity-key entity-key-${cmIndex}`} >
            {cm.isRequired && <span className='text-danger'><b>*</b> </span>}
            {column.comment ?
              <ChaiseTooltip
                placement='right'
                tooltip={column.comment}
              >
                {renderColumnHeader(column)}
              </ChaiseTooltip> :
              renderColumnHeader(column)
            }
            {canShowSelectAllBtn(cmIndex) &&
              <ChaiseTooltip placement='bottom' tooltip={tooltip}>
                <button
                  className={`chaise-btn chaise-btn-secondary toggle-select-all-btn toggle-select-all-btn-${cmIndex}`}
                  disabled={isDisabled}
                  onClick={() => onToggleClick(cmIndex)}
                >
                  <span className={`fa-solid ${cmIndex === activeSelectAll ? 'fa-chevron-up' : 'fa-pencil'}`}></span>
                </button>
              </ChaiseTooltip>
            }
          </span>
        )
      })}

    </div>
  );
}

export default KeyColumn;
