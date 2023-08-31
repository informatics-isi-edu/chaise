// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// hooks
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';

// models
import { appModes, RecordeditDisplayMode } from '@isrd-isi-edu/chaise/src/models/recordedit';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';

const KeyColumn = (): JSX.Element => {

  const {
    appMode, activeSelectAll, columnModels, columnPermissionErrors, 
    config, forms, logRecordeditClientAction, toggleActiveSelectAll
  } = useRecordedit();

  const onToggleClick = (cmIndex: number) => {
    const cm = columnModels[cmIndex];

    logRecordeditClientAction(
      cmIndex === activeSelectAll ? LogActions.SET_ALL_CLOSE : LogActions.SET_ALL_OPEN,
      cm.logStackPathChild,
      cm.logStackNode,
      undefined,
      cm.column.reference ? cm.column.reference : undefined
    );

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

    // in this case we want to show the button and instead disable it
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
      {config.displayMode !== RecordeditDisplayMode.POPUP && <div className='form-header entity-key'>Record Number</div>}
      {columnModels.map((cm: any, cmIndex: number) => {
        const column = cm.column;
        const colName = column.name;
        const colDisplay = makeSafeIdAttr(column.displayname.value)

        const disableSelectAll = disableSelectAllbtn(cmIndex);
        let tooltip = cmIndex === activeSelectAll ? 'Close the panel for setting multiple inputs.' : 'Set value for multiple records.';
        if (disableSelectAll) {
          tooltip = 'Cannot perform this action.';
        }

        const showSelectAll = canShowSelectAllBtn(cmIndex);

        let entityKeyClassName = `entity-key entity-key-${cmIndex}`;
        if (showSelectAll) {
          entityKeyClassName += ' with-select-all-toggle';
        }

        return (
          // NOTE `entity-key-${cmIndex}` is used in form-container.tsx
          // to ensure consistent height between this element and FormRow
          <span key={colName} className={entityKeyClassName} >
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
            {showSelectAll &&
              <ChaiseTooltip placement='bottom' tooltip={tooltip}>
                <button
                  className={`chaise-btn chaise-btn-secondary toggle-select-all-btn toggle-select-all-btn-${cmIndex} select-all-${colDisplay}`}
                  disabled={disableSelectAll}
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
