// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import Spinner from 'react-bootstrap/Spinner';
import DeleteConfirmationModal from '@isrd-isi-edu/chaise/src/components/modals/delete-confirmation-modal';

import { ResizeSensor } from 'css-element-queries';

// hooks
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useRecordset from '@isrd-isi-edu/chaise/src/hooks/recordset';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// models
import { RecordsetConfig, RecordsetDisplayMode, RecordsetSelectMode } from '@isrd-isi-edu/chaise/src/models/recordset';
import { LogActions, LogParentActions, LogReloadCauses, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { addQueryParamsToURL } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { getRandomInt } from '@isrd-isi-edu/chaise/src/utils/math-utils';
import { fireCustomEvent } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { CUSTOM_EVENTS } from '@isrd-isi-edu/chaise/src/utils/constants';

type TableRowProps = {
  config: RecordsetConfig,
  rowIndex: number,
  rowValues: any[],
  tuple: any,
  /**
   * Added to make sure the parent and this comp are using the same boolean
   */
  showActionButtons: boolean,
  selected: boolean,
  onSelectChange: (tuple: any) => void,
  disabled: boolean
}

type ReadMoreStateProps = {
  hideContent: boolean,
  linkText: string,
  maxHeightStyle: { maxHeight?: string }
}

const TableRow = ({
  config,
  rowIndex,
  rowValues,
  tuple,
  showActionButtons,
  selected,
  onSelectChange,
  disabled
}: TableRowProps): JSX.Element => {

  /**
   * TODO this seems wrong, each row is not going to update on each recordset change..
   * while it should be only through recordset-table
   * But if this was in recordset-table then we would need to pass these and
   * it wouldn't make any difference in terms of number of renders
   */
  const {
    reference, setForceShowSpinner, update, getLogStack, getLogAction,
    parentPageTuple, parentPageReference
  } = useRecordset();
  const { validateSessionBeforeMutation } = useAuthn();

  const CONFIG_MAX_ROW_HEIGH = ConfigService.chaiseConfig.maxRecordsetRowHeight;

  /**
   * if the chaise-config property is set to `false` we should skip the ellipsis logic
   */
  const disableMaxRowHeightFeature = CONFIG_MAX_ROW_HEIGH === false;

  // +10 to account for padding on <td>
  const tdPadding = 10;
  const moreButtonHeight = 20;
  const maxHeight = typeof CONFIG_MAX_ROW_HEIGH === 'number' ? CONFIG_MAX_ROW_HEIGH : 160;
  const defaultMaxHeightStyle = { 'maxHeight': (maxHeight - moreButtonHeight) + 'px' };

  const [sensor, setSensor] = useState<ResizeSensor | null>(null);
  const [overflow, setOverflow] = useState<boolean[]>([]);
  const [readMoreObj, setReadMoreObj] = useState<ReadMoreStateProps>({
    hideContent: true,
    linkText: 'more',
    maxHeightStyle: defaultMaxHeightStyle
  })

  /**
   * state variable to open and close delete confirmation modal window
   */
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState<{
    onConfirm: () => void,
    onCancel: () => void,
    buttonLabel: string,
    message: JSX.Element
  } | null>(null);
  /**
   * used to show loading indicator in the delete button
   */
  const [waitingForDelete, setWaitingForDelete] = useState(false);

  const { dispatchError } = useError();

  const rowContainer = useRef<any>(null);

  /**
   * Disable the row if,
   *   - the parent says that it should be disabled
   *   - we're waiting for the delete request
   */
  const rowDisabled = disabled || waitingForDelete;

  // TODO: logging
  const initializeOverflows = () => {
    // Iterate over each <td> in the <tr>
    const tempOverflow: boolean[] = [];
    for (let i = 0; i < rowContainer.current.children.length - 1; i++) {
      let hasOverflow = overflow[i] || false;

      // children is each <td>, span is the cell wrapping the content
      const dataCell = rowContainer.current.children[i].querySelector('.display-value > span');

      // dataCell must be defined and the previous overflow was false so check again to make sure it hasn't changed
      if (dataCell && !hasOverflow) {
        // overflow is true if the content overflows the cell
        // TODO offsetHeight is a rounded integer, should we use getBoundingClientRect().height instead?
        hasOverflow = (dataCell.offsetHeight + tdPadding) > maxHeight;
      }

      tempOverflow[i] = hasOverflow;
    }

    setOverflow(tempOverflow);

    // NOTE: this is intended to fix the case when there is only 1 column in the table and the resize sensor causes an extra cell to show
    // if all overflows are false, detach the sensor
    const justOverflows = tempOverflow.filter((overflow: boolean) => {
      return overflow === true
    });

    if (sensor && justOverflows.length === 0) sensor.detach();
  }

  // TODO: This assumes that tuple is set before rowValues. And that useEffect triggers before useLayoutEffect
  // NOTE: if the tuple changes, the table-row component isn't destroyed so the overflows need to be reset
  useEffect(() => {
    if (disableMaxRowHeightFeature) return;
    setOverflow([]);
  }, [tuple]);

  useLayoutEffect(() => {
    if (!rowContainer.current || disableMaxRowHeightFeature) return;
    const tempSensor = new ResizeSensor(
      rowContainer.current,
      () => {
        initializeOverflows();
      }
    )

    setSensor(tempSensor);

    return () => {
      tempSensor.detach();
    }
  }, [rowValues]);

  const getRowLogAction = (action: LogActions) => {
    return getLogAction(action, LogStackPaths.ENTITY);
  }

  const tupleReference = tuple.reference,
    isRelated = config.displayMode.indexOf(RecordsetDisplayMode.RELATED) === 0,
    isSavedQueryPopup = config.displayMode === RecordsetDisplayMode.SAVED_QUERY_POPUP;

  const eventDetails: { [key: string]: any } = { rowIndex };
  if (config.containerDetails) eventDetails.containerDetails = config.containerDetails;

  /**
   * The JS.Elements that are used for displaying messages
   * NOTE facet popup is sometimes using AttributeGroupReference API which doesn't have displayname.
   * That's why this try-catch is added to guard against it.
   */
  let parentTable: JSX.Element, currentTable: JSX.Element, currentTuple: JSX.Element;
  try {
    parentTable = parentPageReference ? <code><DisplayValue value={parentPageReference.displayname}></DisplayValue></code> : <></>;
    currentTable = <code><DisplayValue value={reference.displayname}></DisplayValue></code>;
    currentTuple = <code><DisplayValue value={tuple.displayname}></DisplayValue></code>;
  } catch (exp) {
    parentTable = currentTable = currentTuple = <></>;
  }

  let logStack: any;
  if (tupleReference) {
    logStack = getLogStack(LogService.getStackNode(LogStackTypes.ENTITY, tupleReference.table, tupleReference.filterLogInfo));
  }

  // apply saved query link
  // show the apply saved query button for (compact/select savedQuery popup)
  let applySavedQuery: string | false;
  if (isSavedQueryPopup) {
    // NOTE: assume relative to reference the user is viewing
    // encoded_facets column might not be a part of the rowValues so get from tuple.data (prevents formatting being applied as well)
    // some queries might be saved withoug any facets selected meaning this shouldn't break

    // TODO: applySavedQuery most probably must be a state variable
    // const facetString = tuple.data.encoded_facets ? `/*::facets::${tuple.data.encoded_facets}` : '';
    // const ermrestPath = parentReference.unfilteredReference.uri + facetString;
    // ConfigService.ERMrest.resolve(ermrestPath).then((savedQueryRef: any) => {
    //   const savedQueryLink = savedQueryRef.contextualize.compact.appLink;
    //   const qCharacter = savedQueryLink.indexOf('?') !== -1 ? '&' : '?';
    //   // TODO: change from HTML link to refresh page to:
    //   //    "updateFacets on main entity and add to browser history stack"
    //   // after update, put last_execution_time as "now"
    //   applySavedQuery = savedQueryLink + qCharacter + "savedQueryRid=" + scope.tuple.data.RID + "&paction=" + logService.pactions.APPLY_SAVED_QUERY;
    // }).catch(function (error: any) {
    //   $log.warn(error);
    //   // fail silently and degrade the UX (hide the apply button)
    //   // show the disabled apply button
    //   applySavedQuery = false;
    // });
  }

  // view link
  let viewLink: string;
  if (config.viewable) {
    viewLink = addQueryParamsToURL(tupleReference.contextualize.detailed.appLink, { paction: LogParentActions.VIEW });
  }

  // edit button
  let editCallback: null | (() => void) = null;
  if (config.editable && tuple.canUpdate) {
    editCallback = function () {
      const requestID = 'recordset-' + getRandomInt(0, Number.MAX_SAFE_INTEGER);
      const newRef = tupleReference.contextualize?.entryEdit;

      if (newRef) {
        const editLink = addQueryParamsToURL(newRef.appLink, {
          invalidate: requestID
        });

        fireCustomEvent(CUSTOM_EVENTS.ROW_EDIT_INTEND, rowContainer.current, { ...eventDetails, id: requestID });

        windowRef.open(editLink, '_blank');

        LogService.logClientAction({
          action: getRowLogAction(LogActions.EDIT_INTEND),
          stack: logStack
        }, tupleReference.defaultLogInfo);
      } else {
        $log.debug('Error: reference is undefined or null');
      }
    };
  }

  // delete/unlink button
  let deleteCallback: null | (() => void) = null;
  let unlinkCallback: null | (() => void) = null;
  if (config.deletable) {
    // unlink button should only show up in related mode
    let associationRef: any;
    if (isRelated && parentPageTuple) {
      associationRef = tuple.getAssociationRef(parentPageTuple.data);
    }

    if (associationRef) {
      if (tuple.canUnlink) {
        // define unlink function
        unlinkCallback = function () {
          deleteOrUnlink(associationRef, isRelated, true);
        };
      }
    }
    else if (tuple.canDelete) {
      // define delete function
      deleteCallback = function () {
        deleteOrUnlink(tupleReference, isRelated);
      };
    }
  }

  const deleteOrUnlink = (reference: any, isRelated?: boolean, isUnlink?: boolean) => {
    validateSessionBeforeMutation(() => {
      if (ConfigService.chaiseConfig.confirmDelete === undefined || ConfigService.chaiseConfig.confirmDelete) {
        LogService.logClientAction({
          action: getRowLogAction(isUnlink ? LogActions.UNLINK_INTEND : LogActions.DELETE_INTEND),
          stack: logStack
        }, reference.defaultLogInfo);

        const confirmMessage: JSX.Element = (
          <>
            {!isUnlink && <>Are you sure you want to delete {currentTable}:{currentTuple}?</>}
            {isUnlink && <>Are you sure you want to disconnect {currentTable}:{currentTuple} from this {parentTable}?</>}
          </>
        );

        setShowDeleteConfirmationModal({
          buttonLabel: isUnlink ? 'Unlink' : 'Delete',
          onConfirm: () => { onDeleteUnlinkConfirmation(reference, isRelated, isUnlink) },
          onCancel: () => {
            setShowDeleteConfirmationModal(null);
            const actionVerb = isUnlink ? LogActions.UNLINK_CANCEL : LogActions.DELETE_CANCEL
            LogService.logClientAction({
              action: getRowLogAction(actionVerb),
              stack: logStack
            }, reference.defaultLogInfo);
          },
          message: confirmMessage
        });

      } else {
        onDeleteUnlinkConfirmation(reference, isRelated, isUnlink);
      }
    })
    $log.debug('deleting tuple!');



    return;
  };

  const onDeleteUnlinkConfirmation = (reference: any, isRelated?: boolean, isUnlink?: boolean) => {
    // make sure the main spinner is displayed (it's a state variable in recordset provider)
    setForceShowSpinner(true);
    // disable the buttons and row
    setWaitingForDelete(true);
    // close the confirmation modal if it exists
    setShowDeleteConfirmationModal(null);

    const actionVerb = isUnlink ? LogActions.UNLINK : LogActions.DELETE;
    const logObj = {
      action: getRowLogAction(actionVerb),
      stack: logStack
    };
    reference.delete(null, logObj).then(() => {
      if (!isRelated) {
        // ask flow-control to update the page
        // this will also make sure to remove the "disabled" row
        update({ updateResult: true, updateCount: true, updateFacets: true }, null, { cause: LogReloadCauses.ENTITY_DELETE });
      }
      fireCustomEvent(CUSTOM_EVENTS.ROW_DELETE_SUCCESS, rowContainer.current, eventDetails);
    }).catch((error: any) => {
      setWaitingForDelete(false);
      dispatchError({ error: error, isDismissible: true });
    }).finally(() => {
      // hide the spinner
      setForceShowSpinner(false);
    });
  }

  const readMore = () => {
    if (readMoreObj.hideContent) {
      setReadMoreObj({
        hideContent: false,
        linkText: 'less',
        maxHeightStyle: {}
      });
    } else {
      setReadMoreObj({
        hideContent: true,
        linkText: 'more',
        maxHeightStyle: defaultMaxHeightStyle
      });
    }
  }

  const renderActionButtons = () => {

    switch (config.selectMode) {
      case RecordsetSelectMode.SINGLE_SELECT:
        return (
          <ChaiseTooltip
            placement='bottom-start'
            tooltip='Select'
          >
            <button
              type='button' disabled={rowDisabled}
              className='select-action-button chaise-btn chaise-btn-primary chaise-btn-sm icon-btn'
              onClick={() => onSelectChange(tuple)}
            >
              <span className='chaise-btn-icon fa-regular fa-square-check'></span>
            </button>
          </ChaiseTooltip>
        )
      case RecordsetSelectMode.MULTI_SELECT:
        return (
          <div className='chaise-checkbox'>
            <input
              className={(selected || rowDisabled) ? 'checked' : ''}
              type='checkbox'
              checked={selected || rowDisabled}
              disabled={rowDisabled}
              onChange={() => onSelectChange(tuple)}
            />
            <label />
            {/* TODO favorites */}
            {/*
              <span ng-if="config.enableFavorites && isFavoriteLoading" class="favorite-icon favorite-spinner-container pull-right">
                <span class="fa-solid fa-circle-notch fa-spin"></span>
              </span>
              <span ng-if="config.enableFavorites && !isFavoriteLoading && tuple.isFavorite" class="favorite-icon fa-solid fa-star pull-right" ng-click="callToggleFavorite()"></span>
              <span ng-if="config.enableFavorites && !isFavoriteLoading && !tuple.isFavorite" class="favorite-icon hover-show fa-regular fa-star pull-right" ng-click="callToggleFavorite()"></span>
            */}
          </div>
        );
      default:
        const ApplySavedQueryTag = (applySavedQuery === false || rowDisabled) ? 'span' : 'a';
        let applySavedQueryBtnClass = 'apply-saved-query-button chaise-btn chaise-btn-tertiary chaise-btn-link icon-btn'
        if (applySavedQuery === false || rowDisabled) {
          applySavedQueryBtnClass += ' disabled';
        }

        return (
          <div className='chaise-btn-group'>
            {(applySavedQuery || applySavedQuery === false) &&
              <ChaiseTooltip
                tooltip={applySavedQuery ? 'Apply search criteria' : 'Search criteria cannot be applied'}
                placement='bottom'
              >
                <ApplySavedQueryTag
                  className={applySavedQueryBtnClass}
                  {...(applySavedQuery && { href: applySavedQuery })}
                >
                  <span className='chaise-btn-icon fa-solid fa-check'></span>
                </ApplySavedQueryTag>
              </ChaiseTooltip>
            }
            {viewLink &&
              <ChaiseTooltip
                tooltip='View Details'
                placement='bottom'
              >
                <a
                  type='button'
                  className={`view-action-button chaise-btn chaise-btn-tertiary chaise-btn-link icon-btn ${rowDisabled ? ' disabled' : ''}`}
                  href={!rowDisabled ? viewLink : undefined}
                >
                  <span className='chaise-btn-icon chaise-icon chaise-view-details'></span>
                </a>
              </ChaiseTooltip>
            }
            {editCallback &&
              <ChaiseTooltip
                tooltip='Edit'
                placement='bottom'
              >
                <button
                  type='button' className='edit-action-button chaise-btn chaise-btn-tertiary chaise-btn-link icon-btn'
                  disabled={rowDisabled} onClick={editCallback}
                >
                  <span className='chaise-btn-icon fa-solid fa-pencil'></span>
                </button>
              </ChaiseTooltip>
            }
            {deleteCallback &&
              <ChaiseTooltip
                tooltip={'Delete'}
                placement='bottom'
              >
                <button
                  type='button' className='delete-action-button chaise-btn chaise-btn-tertiary chaise-btn-link icon-btn'
                  disabled={rowDisabled} onClick={deleteCallback}
                >
                  {waitingForDelete && <Spinner size='sm' animation='border' className='delete-loader' />}
                  {!waitingForDelete && <span className='chaise-btn-icon fa-regular fa-trash-can'></span>}
                </button>
              </ChaiseTooltip>
            }
            {unlinkCallback &&
              <ChaiseTooltip
                tooltip={<>Disconnect {currentTable}:{currentTuple} from this {parentTable}.</>}
                placement='bottom'
              >
                <button
                  type='button' className='delete-action-button chaise-btn chaise-btn-tertiary chaise-btn-link icon-btn'
                  disabled={rowDisabled} onClick={unlinkCallback}
                >
                  {waitingForDelete && <Spinner size='sm' animation='border' className='delete-loader' />}
                  {/* TODO record the icon must be reviewed*/}
                  {!waitingForDelete && <span className='chaise-btn-icon fa-regular fa-circle-xmark'></span>}
                </button>
              </ChaiseTooltip>
            }

          </div>
        )
    }

  };

  const renderCells = () => {
    // rowValues is an array of values for each column. Does not include action column
    return rowValues.map((value: any, colIndex: number) => {
      return (
        <td key={rowIndex + '-' + colIndex} className={rowDisabled ? 'disabled-cell' : ''}>
          <div
            className={'display-value ' + (!disableMaxRowHeightFeature && readMoreObj.hideContent === true ? 'hideContent' : 'showContent')}
            style={!disableMaxRowHeightFeature ? readMoreObj.maxHeightStyle : {}}
          >
            <DisplayValue addClass={true} value={value} />
          </div>
          {(!disableMaxRowHeightFeature && overflow[colIndex + 1]) && <div style={{ 'display': 'inline' }}>
            {' ... '}
            <span
              className='text-primary readmore'
              style={{ 'display': 'inline-block', 'textDecoration': 'underline', 'cursor': 'pointer' }}
              onClick={readMore}
            >
              {readMoreObj.linkText}
            </span>
          </div>}
        </td>
      )
    });
  }

  return (
    <>
      <tr
        className={`chaise-table-row${rowDisabled ? ' disabled-row' : ''}`}
        ref={rowContainer}
        style={{ 'position': 'relative' }}
      >
        {showActionButtons &&
          <td className={`block action-btns${rowDisabled ? ' disabled-cell' : ''}`}>
            {renderActionButtons()}
          </td>
        }
        {renderCells()}
      </tr>
      {showDeleteConfirmationModal &&
        <DeleteConfirmationModal
          show={!!showDeleteConfirmationModal}
          message={showDeleteConfirmationModal.message}
          buttonLabel={showDeleteConfirmationModal.buttonLabel}
          onConfirm={showDeleteConfirmationModal.onConfirm}
          onCancel={showDeleteConfirmationModal.onCancel}
        />
      }
    </>
  )
}

export default TableRow;
