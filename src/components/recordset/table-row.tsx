// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import Spinner from 'react-bootstrap/Spinner';
import DeleteConfirmationModal, { DeleteConfirmationModalTypes } from '@isrd-isi-edu/chaise/src/components/modals/delete-confirmation-modal';

import { ResizeSensor } from 'css-element-queries';

// hooks
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useRecordset from '@isrd-isi-edu/chaise/src/hooks/recordset';
import { useEffect, useLayoutEffect, useRef, useState, type JSX } from 'react';

// models
import { DisabledRowType, RecordsetConfig, RecordsetDisplayMode, RecordsetSelectMode } from '@isrd-isi-edu/chaise/src/models/recordset';
import { LogActions, LogParentActions, LogReloadCauses, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { CLASS_NAMES, CUSTOM_EVENTS } from '@isrd-isi-edu/chaise/src/utils/constants';
import { getRandomInt } from '@isrd-isi-edu/chaise/src/utils/math-utils';
import { disabledRowTooltip } from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
import { fireCustomEvent } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { addQueryParamsToURL } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

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
  disabled: boolean,
  disabledType?: DisabledRowType
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
  disabled,
  disabledType
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

  const CONFIG_MAX_ROW_HEIGHT = ConfigService.chaiseConfig.maxRecordsetRowHeight;

  /**
   * if the chaise-config property is set to `false` we should skip the ellipsis logic
   */
  const disableMaxRowHeightFeature = CONFIG_MAX_ROW_HEIGHT === false;

  // +10 to account for padding on <td>
  const tdPadding = 10;
  const moreButtonHeight = 20;
  const maxHeight = typeof CONFIG_MAX_ROW_HEIGHT === 'number' ? CONFIG_MAX_ROW_HEIGHT : 160;
  const defaultMaxHeightStyle = { 'maxHeight': (maxHeight - moreButtonHeight) + 'px' };

  const numImages = useRef<number>(0);
  const numImagesLoaded = useRef<number>(0);

  const [sensor, setSensor] = useState<ResizeSensor | null>(null);
  const [overflow, setOverflow] = useState<boolean[]>([]);
  const [readMoreObj, setReadMoreObj] = useState<ReadMoreStateProps>({
    hideContent: true,
    linkText: 'more',
    maxHeightStyle: defaultMaxHeightStyle
  });
  const [applySavedQuery, setApplySavedQuery] = useState<string | boolean>(false);

  /**
   * state variable to open and close delete confirmation modal window
   */
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState<{
    onConfirm: () => void,
    onCancel: () => void,
    buttonLabel: string,
    message: JSX.Element,
    reference?: any
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
  const rowDisabled = (disabled && !selected) || waitingForDelete;
  let singleSelectIconTooltip = `Select${selected ? 'ed' : ''}`;

  if (rowDisabled && disabledType) {
    // disabled will be a small grey button without an icon
    singleSelectIconTooltip = disabledRowTooltip(disabledType);
  }

  // TODO: logging
  const initializeOverflows = () => {
    // Iterate over each <td> in the <tr>
    const tempOverflow: boolean[] = [];

    if (rowContainer.current && rowContainer.current.children) {
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
    }

    setOverflow(tempOverflow);

    // NOTE: this is intended to fix the case when there is only 1 column in the table and the resize sensor causes an extra cell to show
    // if all overflows are false, detach the sensor
    const justOverflows = tempOverflow.filter((overflow: boolean) => {
      return overflow === true
    });

    // add length check so this only triggers for the reason from the above comment
    if (sensor && rowValues.length === 1 && justOverflows.length === 0) sensor.detach();
  }

  // This assumes that tuple is set before rowValues. And that useEffect triggers before useLayoutEffect
  // NOTE: if the tuple changes, the table-row component isn't destroyed so the overflows need to be reset
  useEffect(() => {
    if (disableMaxRowHeightFeature) return;
    setOverflow([]);
  }, [tuple]);

  // attach resize sensor to the table row and an onload event to each <img> tag in the table row
  // onload will update a state variable to communicate when all images have loaded to trigger overflow logic once more
  useLayoutEffect(() => {
    if (!rowContainer.current || disableMaxRowHeightFeature) return;
    const tempSensor = new ResizeSensor(
      rowContainer.current,
      () => initializeOverflows()
    )

    setSensor(tempSensor);

    // fetch all <img> tags with -chaise-post-load class and keep count of the total
    // attach an onload function that updates how many have loaded
    const imgTags = Array.from<HTMLImageElement>(rowContainer.current.querySelectorAll(
      `img.${CLASS_NAMES.CONTENT_LOADED}, .${CLASS_NAMES.CONTENT_LOADED} img`
    )).filter(img => !img.complete);
    if (imgTags.length > numImages.current) numImages.current = imgTags.length

    const onImageLoad = () => {
      numImagesLoaded.current++;
      if (numImagesLoaded.current === numImages.current) initializeOverflows();
    }

    imgTags.forEach((image: HTMLImageElement) => {
      image.addEventListener('load', onImageLoad);
      image.addEventListener('error', onImageLoad);
    });

    return () => {
      tempSensor.detach();
      imgTags.forEach((image: HTMLImageElement) => {
        image.removeEventListener('load', onImageLoad);
        image.removeEventListener('error', onImageLoad);
      });
    }
  }, [rowValues]);

  /**
   * as images load, check if we have loaded all images before triggering the overflow logic one more time
   * We can't rely on this useEffect alone since there might not be any images
   *
   * NOTE: images can be a value for a column or part of a aggregate request to fetch multiple images
   *   the above ResizeSensor doesn't recalculate when images load as part of an aggregate request so this useEffect
   *   does it one last time when all images have finished loading
   */

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
  if (isSavedQueryPopup) {
    // NOTE: assume relative to reference the user is viewing
    // encoded_facets column might not be a part of the rowValues so get from tuple.data (prevents formatting being applied as well)
    // some queries might be saved withoug any facets selected meaning this shouldn't break

    const facetString = tuple.data.encoded_facets ? `/*::facets::${tuple.data.encoded_facets}` : '';
    const ermrestPath = parentPageReference.unfilteredReference.uri + facetString;
    ConfigService.ERMrest.resolve(ermrestPath).then((savedQueryRef: any) => {
      const savedQueryLink = savedQueryRef.contextualize.compact.appLink;
      const qCharacter = savedQueryLink.indexOf('?') !== -1 ? '&' : '?';
      // TODO: change from HTML link to refresh page to:
      //    "updateFacets on main entity and add to browser history stack"
      // after update, put last_execution_time as "now"
      setApplySavedQuery(savedQueryLink + qCharacter + 'savedQueryRid=' + tuple.data.RID + '&paction=' + LogParentActions.APPLY_SAVED_QUERY);
    }).catch((error: any) => {
      $log.warn(error);
      // fail silently and degrade the UX (hide the apply button)
      // show the disabled apply button
      setApplySavedQuery(false);
    });
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
          message: confirmMessage,
          reference: !isUnlink ? reference : undefined
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
        return (<ChaiseTooltip
          placement='bottom-start'
          tooltip={singleSelectIconTooltip}
        >
          <button
            className={'select-action-button chaise-btn chaise-btn-secondary chaise-btn-sm icon-btn'}
            type='button'
            disabled={rowDisabled}
            onClick={() => onSelectChange(tuple)}
          >
            {selected && <span className={'chaise-btn-icon fa-solid fa-circle'}></span>}
          </button>
        </ChaiseTooltip>);
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
          <div className='chaise-btn-group chaise-btn-group-no-border'>
            {isSavedQueryPopup && (applySavedQuery || applySavedQuery === false) &&
              <ChaiseTooltip
                tooltip={applySavedQuery ? 'Apply search criteria' : 'Search criteria cannot be applied'}
                placement='bottom'
              >
                <a className={applySavedQueryBtnClass} href={applySavedQuery as string}>
                  <span className='chaise-btn-icon fa-regular fa-square-check'></span>
                </a>
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
          {/* the overflow index should be shifted only if we're showing the action buttons */}
          {(!disableMaxRowHeightFeature && overflow[colIndex + (showActionButtons ? 1 : 0)]) && <div style={{ 'display': 'inline' }}>
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
        {showActionButtons && <td className={`block action-btns${rowDisabled ? ' disabled-cell' : ''}`}>
          <div className='action-btns-inner-container'>
            {renderActionButtons()}
          </div>
        </td>}
        {renderCells()}
      </tr>
      {showDeleteConfirmationModal &&
        <DeleteConfirmationModal
          show={!!showDeleteConfirmationModal}
          message={showDeleteConfirmationModal.message}
          buttonLabel={showDeleteConfirmationModal.buttonLabel}
          onConfirm={showDeleteConfirmationModal.onConfirm}
          onCancel={showDeleteConfirmationModal.onCancel}
          reference={showDeleteConfirmationModal.reference}
          context={DeleteConfirmationModalTypes.SINGLE}
        />
      }
    </>
  )
}

export default TableRow;
