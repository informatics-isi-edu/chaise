// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import DisplayCommentValue from '@isrd-isi-edu/chaise/src/components/display-comment-value';

// hooks
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';

// models
import { appModes, RecordeditDisplayMode } from '@isrd-isi-edu/chaise/src/models/recordedit';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';
import { CommentDisplayModes } from '@isrd-isi-edu/chaise/src/models/displayname';

// utils
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';

type KeyColumnProps = {
  /* the index of column that is showing the select all input */
  activeMultiForm: number;
  /* function to change the active select all */
  toggleActiveMultiForm: (colIndex: number) => void;
}

const KeyColumn = ({
  activeMultiForm,
  toggleActiveMultiForm
}: KeyColumnProps): JSX.Element => {

  const {
    appMode, columnModels, columnPermissionErrors,
    config, forms, logRecordeditClientAction
  } = useRecordedit();

  const onToggleClick = (cmIndex: number) => {
    const cm = columnModels[cmIndex];

    logRecordeditClientAction(
      cmIndex === activeMultiForm ? LogActions.SET_ALL_CLOSE : LogActions.SET_ALL_OPEN,
      cm.logStackPathChild,
      cm.logStackNode,
      undefined,
      cm.column.reference ? cm.column.reference : undefined
    );

    toggleActiveMultiForm(cmIndex);
  }


  // -------------------------- render logic ---------------------- //

  /**
   * whether the column has comment and it's in tooltip display mode
   */
  const columnHasTooltip = (column: any) => {
    return column.comment && column.comment.displayMode === CommentDisplayModes.TOOLTIP;
  }

  const renderColumnHeader = (column: any) => {
    const hasTooltip = columnHasTooltip(column);
    const headerClassName = `column-displayname${hasTooltip ? ' chaise-icon-for-tooltip' : ''}`;
    return (
      <span className={headerClassName}>
        <DisplayValue value={column.displayname} />
        {hasTooltip ? ' ' : ''}
      </span>
    )
  }

  /**
   * whether we should show the button
   * NOTE: we used to show disabled tuples, if we decided to bring that back,
   * we need to change the logic here.
   */
  const canShowMultiFormBtn = (columnIndex: number) => {
    const cm = columnModels[columnIndex];

    // if we're already showing the multi form UI, then we have to show the button
    if (activeMultiForm === columnIndex) {
      return true;
    }

    // in this case we want to show the button and instead disable it
    if (disableMultiFormbtn(columnIndex)) {
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
  const disableMultiFormbtn = (columnIndex: number) => {
    return appMode === appModes.EDIT && isObjectAndKeyDefined(columnPermissionErrors, columnModels[columnIndex].column.name);
  }

  return (
    <div className='entity-key-column'>
      {config.displayMode !== RecordeditDisplayMode.POPUP && <div className='form-header entity-key'>Record Number</div>}
      {columnModels.map((cm: any, cmIndex: number) => {
        const column = cm.column;
        const colName = column.name;
        const colDisplay = makeSafeIdAttr(column.displayname.value)

        const disableMultiForm = disableMultiFormbtn(cmIndex);
        let tooltip = cmIndex === activeMultiForm ? 'Close the panel for setting multiple inputs.' : 'Set value for multiple records.';
        if (disableMultiForm) {
          tooltip = 'Cannot perform this action.';
        }

        const showMultiForm = canShowMultiFormBtn(cmIndex);

        let entityKeyClassName = `entity-key entity-key-${cmIndex}`;
        if (showMultiForm) {
          entityKeyClassName += ' with-multi-form-toggle';
        }

        return (
          // NOTE `entity-key-${cmIndex}` is used in form-container.tsx
          // to ensure consistent height between this element and FormRow
          <span key={colName} className={entityKeyClassName} >
            {cm.isRequired && <span className='text-danger'><b>*</b> </span>}
            {columnHasTooltip(column) ?
              <ChaiseTooltip
                placement='right'
                tooltip={<DisplayCommentValue comment={column.comment} />}
              >
                {renderColumnHeader(column)}
              </ChaiseTooltip> :
              renderColumnHeader(column)
            }
            {showMultiForm &&
              <ChaiseTooltip placement='bottom' tooltip={tooltip}>
                <button
                  className={`chaise-btn chaise-btn-secondary toggle-multi-form-btn toggle-multi-form-btn-${cmIndex} multi-form-${colDisplay}`}
                  disabled={disableMultiForm}
                  onClick={() => onToggleClick(cmIndex)}
                >
                  <span className={`fa-solid ${cmIndex === activeMultiForm ? 'fa-chevron-up' : 'fa-pencil'}`}></span>
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
