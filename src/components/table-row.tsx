import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// models
import { RecordsetConfig, RecordsetDisplayMode, RecordsetSelectMode } from '@isrd-isi-edu/chaise/src/models/recordset';
import { LogActions, LogParentActions } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utils
import { addQueryParamsToURL } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import useRecordset from '@isrd-isi-edu/chaise/src/hooks/recordset';
import { getRandomInt } from '@isrd-isi-edu/chaise/src/utils/math-utils';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import DeleteConfirmationModal from '@isrd-isi-edu/chaise/src/components/delete-confirmation-modal';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

type TableRowProps = {
  config: RecordsetConfig,
  rowIndex: number,
  rowValues: any[],
  tuple: any,
  /**
   * Added to make sure the parent and this comp are using the same boolean
   */
  showActionButtons: boolean
}

const TableRow = ({
  config,
  rowIndex,
  rowValues,
  tuple,
  showActionButtons
}: TableRowProps): JSX.Element => {

  const tdPadding = 10, // +10 to account for padding on <td>
    moreButtonHeight = 20,
    maxHeight = ConfigService.chaiseConfig.maxRecordsetRowHeight || 160,
    defaultMaxHeightStyle = { 'maxHeight': (maxHeight - moreButtonHeight) + 'px' };

  const [overflow, setOverflow] = useState<boolean[]>([]);
  const [readMoreObj, setReadMoreObj] = useState<any>({
    hideContent: true,
    linkText: 'more',
    maxHeightStyle: defaultMaxHeightStyle
  })

  /**
   * state variable to open and close delete confirmation modal window
   */
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState<{
    onConfirm: (() => void) | null,
    buttonLabel: string
  } | null>(null);

  const { dispatchError } = useError();

  const rowContainer = useRef<any>(null);
  
  // TODO: logging
  // const { logRecordsetClientAction } = useRecordset();

  const initializeOverflows = () => {
    // Iterate over each <td> in the <tr>
    const tempOverflow: boolean[] = [];
    for (let i = 0; i < rowContainer.current.children.length; i++) {
      let hasOverflow = overflow[i] || false;

      const currentElement = rowContainer.current.children[i].querySelector('.markdown-container');

      // currentElement must be defined and the previous overflow was false so check again to make sure it hasn't changed
      if (currentElement && !hasOverflow) {
        // console.log('col index: ' + i + ' height: ', currentElement.offsetHeight);
        // overflow is true if the content overflows the cell
        hasOverflow = (currentElement.offsetHeight + tdPadding) > maxHeight;
      }
      tempOverflow[i] = hasOverflow;
    }

    setOverflow(tempOverflow);
  }

  // TODO: This assumes that tuple is set before rowValues. And that useEffect triggers before useLayoutEffect
  useEffect(() => {
    setOverflow([])
  }, [tuple]);

  useLayoutEffect(() => {
    initializeOverflows();
  }, [rowValues]);

  const deleteOrUnlink = (reference: any, isRelated?: boolean, isUnlink?: boolean) => {
    $log.debug('deleting tuple!');

    if (ConfigService.chaiseConfig.confirmDelete === undefined || ConfigService.chaiseConfig.confirmDelete) {
      
      // TODO: log the opening of delete modal
      // LogService.logClientAction({
      //   action: LogService.getActionString(isUnlink ? LogActions.UNLINK_INTEND : LogActions.DELETE_INTEND),
      //   stack: logStack
      // }, reference.defaultLogInfo);

      setShowDeleteConfirmationModal({
        buttonLabel: isUnlink ? 'Unlink' : 'Delete',
        onConfirm: isUnlink ? onUnlinkConfirm : onDeleteConfirm,
      });

    } else {

      // TODO: setting logObj
      const actionVerb = isUnlink ? LogActions.UNLINK : LogActions.DELETE;
      const logObj = {
        action: LogService.getActionString(actionVerb),
        // stack: logStack
      }

      if (logObj) {
        reference.delete(logObj).then(function deleteSuccess() {
          // TODO: tell parent controller data updated
          // scope.$emit('record-deleted', emmitedMessageArgs);
        }).catch(function (error: any) {
          dispatchError({ error, isGlobal: true });
        });
      }
    }

    return;
  };

  const onDeleteUnlinkConfirmation = (reference: any, isRelatable?:boolean, isUnlink?: boolean) => {
    setShowDeleteConfirmationModal(null);

    const actionVerb = isUnlink ? LogActions.UNLINK : LogActions.DELETE;
    const logObj = {
      action: LogService.getActionString(actionVerb),
      // stack: logStack
    }
    
    if (logObj) {
      reference.delete(logObj)
        .then(function deleteSuccess() {
          // TODO: tell parent controller data updated
          // scope.$emit('record-deleted', emmitedMessageArgs);
        }).catch(function (error: any) {
          // TODO: log the opening of cancelation modal
          // const actionVerb = isUnlink ? LogActions.UNLINK_CANCEL : LogActions.DELETE_CANCEL
          // LogService.logClientAction({
          //   action: LogService.getActionString(actionVerb),
          //   // TODO: ask
          //   // stack: logStack
          // }, tuple.reference.defaultLogInfo);
          
          // if response is string, the modal has been dismissed
          if (typeof error !== 'string') {
            dispatchError({ error: error, isGlobal: true });
          }
      });
    }
  }

  const onCancel = () => {
    setShowDeleteConfirmationModal(null);
  }

  const tupleReference = tuple.reference,
    isRelated = config.displayMode.indexOf(RecordsetDisplayMode.RELATED) === 0,
    isSavedQueryPopup = config.displayMode === RecordsetDisplayMode.SAVED_QUERY_POPUP;

  // TODO log support
  if (tupleReference) {
    // all the row level actions should use this stack
    // logStack = recordTableUtils.getTableLogStack(
    //   scope.tableModel,
    //   logService.getStackNode(logService.logStackTypes.ENTITY, tupleReference.table, tupleReference.filterLogInfo)
    // );
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
      $log.debug('edit clicked!');
      
      const referrer_id = 'recordset-' + getRandomInt(0, Number.MAX_SAFE_INTEGER);
      const newRef = tupleReference.contextualize?.entryEdit;

      if (newRef) {
        const editLink = addQueryParamsToURL(newRef.appLink, {
          invalidate: referrer_id
        });

        windowRef.open(editLink, '_blank');

        // TODO: logging
        // logRecordsetClientAction(LogActions.EDIT_INTEND);
      } else {
        $log.debug('Error: reference is undefined or null');
      }
    };
  }

  // delete/unlink button
  let deleteCallback: null | (() => void) = null;
  let unlinkCallback: null | (() => void) = null, unlinkTooltip: string;
  let onUnlinkConfirm: null | (() => void) = null;
  let onDeleteConfirm: null | (() => void) = null;
  if (config.deletable) {
    // unlink button should only show up in related mode
    let associationRef: any;
    // TODO record page
    // if (isRelated && scope.tableModel.parentTuple) {
    //   associationRef = scope.tuple.getAssociationRef(scope.tableModel.parentTuple.data);
    // }

    if (associationRef) {
      if (tuple.canUnlink) {
        // TODO record page
        // unlinkTooltip = "Disconnect " + scope.tableModel.reference.displayname.value + ': ' + scope.tuple.displayname.value + " from this " + scope.tableModel.parentReference.displayname.value + '.';
        // define unlink function
        unlinkCallback = function () {
          deleteOrUnlink(associationRef, isRelated, true);
        };

        onUnlinkConfirm = function() {
          onDeleteUnlinkConfirmation(associationRef, isRelated, true);
        }
      }
    }
    else if (tuple.canDelete) {
      // define delete function
      deleteCallback = function () {
        deleteOrUnlink(tupleReference, isRelated);
      };

      onDeleteConfirm = function() {
        onDeleteUnlinkConfirmation(tupleReference, isRelated);
      }
    }
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
            <button type='button' className='select-action-button chaise-btn chaise-btn-primary chaise-btn-sm icon-btn'
            // ng-disabled="selectDisabled" ng-click="onSelect($event)"
            >
              <span className='chaise-btn-icon fa-solid fa-check'></span>
            </button>
          </ChaiseTooltip>
        )
      case RecordsetSelectMode.MULTI_SELECT:
        return (
          <>
            <input type='checkbox' />
            {/* ng-checked="selected || selectDisabled" ng-click="onSelect($event)" ng-disabled="selectDisabled" */}
            <label />
            {/* TODO favorites */}
            {/*
              <span ng-if="config.enableFavorites && isFavoriteLoading" class="favorite-icon favorite-spinner-container pull-right">
                <span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>
              </span>
              <span ng-if="config.enableFavorites && !isFavoriteLoading && tuple.isFavorite" class="favorite-icon glyphicon glyphicon-star pull-right" ng-click="callToggleFavorite()"></span>
              <span ng-if="config.enableFavorites && !isFavoriteLoading && !tuple.isFavorite" class="favorite-icon hover-show glyphicon glyphicon-star-empty pull-right" ng-click="callToggleFavorite()"></span>
            */}
          </>
        );
      default:
        const ApplySavedQueryTag = (applySavedQuery === false) ? 'span' : 'a';
        let applySavedQueryBtnClass = 'apply-saved-query-button chaise-btn chaise-btn-tertiary chaise-btn-link icon-btn'
        if (applySavedQuery === false) {
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
                  className='view-action-button chaise-btn chaise-btn-tertiary chaise-btn-link icon-btn'
                  href={viewLink}
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
                  onClick={editCallback}
                >
                  <span className='chaise-btn-icon fa-solid fa-pencil'></span>
                </button>
              </ChaiseTooltip>
            }
            {deleteCallback &&
              <ChaiseTooltip
                tooltip='Delete'
                placement='bottom'
              >
                <button
                  type='button' className='delete-action-button chaise-btn chaise-btn-tertiary chaise-btn-link icon-btn'
                  onClick={deleteCallback}
                >
                  <span className='chaise-btn-icon fa-regular fa-trash-can'></span>
                </button>
              </ChaiseTooltip>
            }
            {unlinkCallback &&
              <ChaiseTooltip
                tooltip={unlinkTooltip}
                placement='bottom'
              >
                <button
                  type='button' className='delete-action-button chaise-btn chaise-btn-tertiary chaise-btn-link icon-btn'
                  onClick={unlinkCallback}
                >
                  {/* TODO record the icon must be reviewed*/}
                  <span className='chaise-btn-icon fa-solid fa-link-slash'></span>
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
        <td key={rowIndex + '-' + colIndex}>
          <div className={readMoreObj.hideContent === true ? 'hideContent' : 'showContent'} style={readMoreObj.maxHeightStyle}>
            <DisplayValue addClass={true} value={value} />
          </div>
          {overflow[colIndex + 1] && <div style={{ 'display': 'inline' }}>
            ...
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
      className='chaise-table-row'
      ref={rowContainer}
      style={{ 'position': 'relative' }}
    >
      {showActionButtons &&
        <td className='block action-btns'>
          {renderActionButtons()}
        </td>
      }
      {renderCells()}
    </tr>
    {showDeleteConfirmationModal && 
      <DeleteConfirmationModal 
        show={!!showDeleteConfirmationModal} 
        onConfirm={showDeleteConfirmationModal.onConfirm}
        onCancel={onCancel}
        tuple={tuple}
        buttonLabel={showDeleteConfirmationModal.buttonLabel}
      />
    }
  </>
  )
}

export default TableRow;
