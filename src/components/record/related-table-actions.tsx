import { MouseEvent, useState, useRef, useLayoutEffect } from 'react';

// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import RecordsetModal from '@isrd-isi-edu/chaise/src/components/modals/recordset-modal';
import DeleteConfirmationModal, { DeleteConfirmationModalTypes } from '@isrd-isi-edu/chaise/src/components/modals/delete-confirmation-modal';
import Dropdown from 'react-bootstrap/Dropdown';
// hooks
import useRecord from '@isrd-isi-edu/chaise/src/hooks/record';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { RecordRelatedModel } from '@isrd-isi-edu/chaise/src/models/record';
import { LogActions, LogParentActions, LogReloadCauses } from '@isrd-isi-edu/chaise/src/models/log';
import {
  RecordsetConfig,
  RecordsetDisplayMode,
  RecordsetProps,
  RecordsetSelectMode,
  SelectedRow,
} from '@isrd-isi-edu/chaise/src/models/recordset';
import { LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { CommentDisplayModes } from '@isrd-isi-edu/chaise/src/models/displayname';

// providers
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import { CookieService } from '@isrd-isi-edu/chaise/src/services/cookie';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utils
import { addQueryParamsToURL } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import {
  allowCustomModeRelated,
  displayCustomModeRelated,
  getPrefillCookieObject,
} from '@isrd-isi-edu/chaise/src/utils/record-utils';
import {
  RECORDSET_DEFAULT_PAGE_SIZE,
  CUSTOM_EVENTS,
} from '@isrd-isi-edu/chaise/src/utils/constants';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { getRandomInt } from '@isrd-isi-edu/chaise/src/utils/math-utils';
import { fireCustomEvent } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import Q from 'q';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';

type RelatedTableActionsProps = {
  relatedModel: RecordRelatedModel;
};

const RelatedTableActions = ({
  relatedModel
}: RelatedTableActionsProps): JSX.Element => {
  const {
    reference: recordReference,
    page: recordPage,
    toggleRelatedDisplayMode,
    updateRecordPage,
    pauseUpdateRecordPage,
    resumeUpdateRecordPage,
    logRecordClientAction,
    getRecordLogStack,
  } = useRecord();

  const { validateSessionBeforeMutation } = useAuthn();
  const { addAlert } = useAlert();
  const { dispatchError } = useError();
  const containerRef = useRef<any>(null);
  const buttonRef = useRef<any>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAllActionsAsDropdown, setShowAllActionsAsDropdown] = useState(false);
  const [buttonsInDropdown, setButtonsInDropdown] = useState([]);
  // add Pure and Binary
  const [addPureBinaryModalProps, setAddPureBinaryModalProps] = useState<RecordsetProps | null>(
    null
  );
  const [submitPureBinaryCB, setAddPureBinarySubmitCB] = useState<
    ((selectedRows: SelectedRow[]) => void) | null
  >(null);
  // unlink Pure and Binary
  const [unlinkPureBinaryModalProps, setUnlinkPureBinaryModalProps] =
    useState<RecordsetProps | null>(null);
  const [unlinkPureBinaryCB, setUnlinkPureBinarySubmitCB] = useState<
    ((selectedRows: SelectedRow[]) => void) | null
  >(null);
  const [showPureBinarySpinner, setShowPureBinarySpinner] = useState(false);

  // when object is null, hide the modal
  // object is the props for the the modal
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState<{
    onConfirm: () => void;
    onCancel: () => void;
    buttonLabel: string;
    title: string;
    message: JSX.Element;
  } | null>(null);

  const usedRef = relatedModel.initialReference;
  /*
   * This hook is to push the buttons to the dropdown if it exceeds the container width.
   * We are using ResizeSensor to listen to the resize event.
   */
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    /*
   * We choose main-container for the resize sensor because we we were encountering bugs:
   * 1) All buttons pushing to dropdown if we have just one button in the table header section
   * 2) Resize sensor not getting called if there is no change in width of the button container even if we resize
   * So we should put resize sensor on a container that won’t be affected by the logic inside it.
   * We are using ResizeSensor to listen to the resize event.
   */
    const mainContainer: any = document.querySelector('.main-container');
    const calculateButtons = () => {

      let buttons: any = [];
      if (containerRef.current) {
        const buttonContainer = buttonRef.current;

        const containerWidth = buttonContainer.getBoundingClientRect().width;
        buttons = Array.from(buttonContainer.getElementsByClassName('chaise-btn'));
        /**
         * If there aren't any enough space to show even one button, just switch to showing all as dropdown.
         * 350 is based on the width of the container containing dropdown and last visible button. We choose 350
         * because that is when the space gets more congested and we need to push all buttons to the dropdown
         */
        setShowAllActionsAsDropdown(mainContainer?.offsetWidth < 350);
        const tableHeaderButtonsToAddToDropdown: any = [];
        let buttonLeftOffset = 0;
        let totalWidth = 0;

        //This condition is to push all the buttons to the dropdown when the container width is below 200
        if (showAllActionsAsDropdown) {
          buttonContainer.style.height = '0';
        } else {
          buttonContainer.style.height = '30px';
        }
        // Loop through the buttons and calculate if the current button width plus the width of all visible buttons
        // is overflowing the container width. If yes, push the button to the dropdown

        buttons.forEach((button: any, index: number) => {
          const buttonWidth = button.getBoundingClientRect().width;
          if (index === 0) {
            buttonLeftOffset =
              button.getBoundingClientRect().left - buttonContainer.getBoundingClientRect().left;
          }

          if (totalWidth + buttonLeftOffset + buttonWidth <= containerWidth) {
            // calculate the total button container width if it doesn't overflow
            totalWidth += buttonWidth;
            if (showAllActionsAsDropdown) {
              tableHeaderButtonsToAddToDropdown.push(button);
            }
          } else {
            // Push to dropdown if it overflowa
            tableHeaderButtonsToAddToDropdown.push(button);
          }
        });
        setButtonsInDropdown(tableHeaderButtonsToAddToDropdown);
      }
    };
    calculateButtons();

    const mainResizeSensor = new ResizeSensor(mainContainer as Element, () => {
      calculateButtons()
    });

    return () => {
      mainResizeSensor.detach();
    };
  }, [showAllActionsAsDropdown]);

  //-------------------  UI related callbacks:   --------------------//

  // This function is to toggle the dropdown to show or hide with options
  const toggleDropdown = (bool: boolean, evt: any) => {
    evt.originalEvent.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  /*
   * Callback function for dropdown item click
   */
  const handleDropDownClick = (evt: any, button: any) => {
    const buttonText = button.textContent;
    evt.stopPropagation();
    switch (buttonText) {
      case 'Explore':
        onExplore(evt);
        break;
      case 'Link records':
      case 'Add records':
        onCreate(evt);
        break;
      case 'Edit Records':
        onUnlink(evt);
        break;
      case 'Unlink records':
        onUnlink(evt);
        break;
      case 'Edit mode':
      case 'Custom mode':
      case 'Table mode':
        onToggleDisplayMode(evt);
        break;
    }
  };

  /**
   * this is to avoid the accordion header to recieve the click
   */
  const onExplore = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
  };

  /**
   * this is to avoid the accordion header to recieve the click
   */
  const onBulkEdit = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
  };

  const onToggleDisplayMode = (e: MouseEvent<HTMLElement>) => {
    // this is to avoid the accordion header to recieve the click
    e.stopPropagation();
    toggleRelatedDisplayMode(relatedModel.index, relatedModel.isInline);
  };

  const onCreate = (e: MouseEvent<HTMLElement>) => {
    // this is to avoid the accordion header to recieve the click
    e.stopPropagation();

    if (relatedModel.isPureBinary) {
      pauseUpdateRecordPage();
      openAddPureBinaryModal();
      return;
    }

    // log the client action
    LogService.logClientAction(
      {
        action: LogService.getActionString(
          LogActions.ADD_INTEND,
          relatedModel.recordsetProps.logInfo.logStackPath
        ),
        stack: relatedModel.recordsetProps.logInfo.logStack,
      },
      relatedModel.initialReference.defaultLogInfo
    );

    // Generate a unique cookie name and set it to expire after 24hrs.
    const cookieName = 'recordedit-' + getRandomInt(0, Number.MAX_SAFE_INTEGER);
    const cookieValue = getPrefillCookieObject(relatedModel.initialReference, recordPage.tuples[0]);
    CookieService.setCookie(cookieName, cookieValue, new Date(Date.now() + 60 * 60 * 24 * 1000));

    // Generate a unique id for this request
    // append it to the URL
    const referrer_id = 'recordedit-' + getRandomInt(0, Number.MAX_SAFE_INTEGER);

    if (!!containerRef.current) {
      fireCustomEvent(CUSTOM_EVENTS.ADD_INTEND, containerRef.current, {
        id: referrer_id,
        containerDetails: {
          isInline: relatedModel.isInline,
          index: relatedModel.index,
        },
      });
    }

    // Redirect to the url in a new tab
    windowRef.open(
      addQueryParamsToURL(
        relatedModel.initialReference.unfilteredReference.contextualize.entryCreate.appLink,
        {
          prefill: cookieName,
          invalidate: referrer_id,
        }
      ),
      '_blank'
    );
  };

  const openAddPureBinaryModal = () => {
    // the reference that we're showing in the related section
    const domainRef = relatedModel.initialReference;
    // the reference that we're going to create rows from
    const derivedRef = domainRef.derivedAssociationReference;
    const fkToRelated = derivedRef.associationToRelatedFKR;

    const andFilters: any[] = [];
    // loop through all columns that make up the key information for the association with the leaf table and create non-null filters
    fkToRelated.key.colset.columns.forEach(function (col: any) {
      andFilters.push({
        source: col.name,
        hidden: true,
        not_null: true,
      });
    });
    // if filter in source is based on the related table, then we would need to add it as a hidden custom filter here.
    let customFacets: any = null;
    if (
      domainRef.pseudoColumn &&
      domainRef.pseudoColumn.filterProps &&
      domainRef.pseudoColumn.filterProps.leafFilterString
    ) {
      // NOTE should we display the filters or not?
      customFacets = {
        ermrest_path: domainRef.pseudoColumn.filterProps.leafFilterString,
        removable: false,
      };
    }

    const modalReference = domainRef.unfilteredReference.addFacets(andFilters, customFacets)
      .contextualize.compactSelectAssociationLink;

    const recordsetConfig: RecordsetConfig = {
      viewable: false,
      editable: false,
      deletable: false,
      sortable: true,
      selectMode: RecordsetSelectMode.MULTI_SELECT,
      showFaceting: true,
      disableFaceting: false,
      displayMode: RecordsetDisplayMode.PURE_BINARY_POPUP_ADD,
    };

    const stackElement = LogService.getStackNode(
      LogStackTypes.RELATED,
      relatedModel.initialReference.table,
      { source: domainRef.compressedDataSource, entity: true, picker: 1 }
    );

    const logInfo = {
      logObject: null,
      logStack: getRecordLogStack(stackElement),
      logStackPath: LogService.getStackPath(null, LogStackPaths.ADD_PB_POPUP),
    };

    /**
     * The existing rows in this p&b association must be disabled
     * so users doesn't resubmit them.
     */
    const getDisabledTuples = (
      page: any,
      pageLimit: number,
      logStack: any,
      logStackPath: string,
      requestCauses?: any,
      reloadStartTime?: any
    ): Promise<{ page: any, disabledRows?: any }> => {
      return new Promise((resolve, reject) => {
        const disabledRows: any = [];

        let action = LogActions.LOAD,
          newStack = logStack;
        if (Array.isArray(requestCauses) && requestCauses.length > 0) {
          action = LogActions.RELOAD;
          newStack = LogService.addCausesToStack(logStack, requestCauses, reloadStartTime);
        }
        // using the service instead of the record one since this is called from the modal
        const logObj = {
          action: LogService.getActionString(action, logStackPath),
          stack: newStack,
        };
        // fourth input: preserve the paging (read will remove the before if number of results is less than the limit)
        domainRef
          .setSamePaging(page)
          .read(pageLimit, logObj, false, true)
          .then(function (newPage: any) {
            newPage.tuples.forEach(function (newTuple: any) {
              const index = page.tuples.findIndex(function (tuple: any) {
                return tuple.uniqueId == newTuple.uniqueId;
              });
              if (index > -1) disabledRows.push(page.tuples[index]);
            });

            resolve({ disabledRows: disabledRows, page: page });
          })
          .catch(function (err: any) {
            reject(err);
          });
      });
    };

    // this function is here since we need to access the outer scope here
    const submitCB = function (selectedRows: SelectedRow[]) {
      if (!selectedRows) return;

      // this will populate the values that we should send
      const fkDetails = getPrefillCookieObject(relatedModel.initialReference, recordPage.tuples[0]);

      // populate submission rows based on the selected rows
      const submissionRows: any[] = [];
      selectedRows.forEach((sr: SelectedRow, index: number) => {
        // add the values from the main table key
        submissionRows[index] = { ...fkDetails.keys };

        // add the values from the related table key (selected rows)
        fkToRelated.key.colset.columns.forEach((col: any) => {
          submissionRows[index][fkToRelated.mapping.getFromColumn(col).name] = sr.data[col.name];
        });
      });

      setShowPureBinarySpinner(true);

      validateSessionBeforeMutation(() => {
        const logObj = {
          action: LogService.getActionString(LogActions.LINK, logInfo.logStackPath),
          stack: logInfo.logStack,
        };

        const createRef = derivedRef.unfilteredReference.contextualize.entryCreate;
        createRef
          .create(submissionRows, logObj)
          .then(() => {
            setAddPureBinaryModalProps(null);
            addAlert(
              'Your data has been submitted. Showing you the result set...',
              ChaiseAlertType.SUCCESS
            );

            const details = relatedModel.recordsetProps.config.containerDetails!;
            updateRecordPage(true, undefined, [
              {
                ...details,
                cause: details?.isInline
                  ? LogReloadCauses.RELATED_INLINE_CREATE
                  : LogReloadCauses.RELATED_CREATE,
              },
            ]);
          })
          .catch((error: any) => {
            dispatchError({ error: error, isDismissible: true });
          })
          .finally(() => setShowPureBinarySpinner(false));
      });
    };
    setAddPureBinarySubmitCB(() => submitCB);

    setAddPureBinaryModalProps({
      initialReference: modalReference,
      initialPageLimit: modalReference.display.defaultPageSize
        ? modalReference.display.defaultPageSize
        : RECORDSET_DEFAULT_PAGE_SIZE,
      config: recordsetConfig,
      logInfo,
      getDisabledTuples,
      parentTuple: recordPage.tuples[0],
      parentReference: recordReference,
    });
  };

  const closeAddPureBinaryModal = () => {
    resumeUpdateRecordPage();
    setAddPureBinaryModalProps(null);
  };

  const onUnlink = (e: MouseEvent<HTMLElement>) => {
    // this is to avoid the accordion header to recieve the click
    e.stopPropagation();

    if (relatedModel.isPureBinary) {
      pauseUpdateRecordPage();
      openUnlinkPureBinaryModal();
      return;
    }
  };

  const openUnlinkPureBinaryModal = () => {
    const domainRef = relatedModel.initialReference;

    // the reference that we're going to create rows from
    const derivedRef = domainRef.derivedAssociationReference;
    const fkToRelated = derivedRef.associationToRelatedFKR;

    const modalReference = domainRef.hideFacets().contextualize.compactSelectAssociationUnlink;

    const recordsetConfig: RecordsetConfig = {
      viewable: false,
      editable: false,
      deletable: false,
      sortable: true,
      selectMode: RecordsetSelectMode.MULTI_SELECT,
      showFaceting: true,
      disableFaceting: false,
      displayMode: RecordsetDisplayMode.PURE_BINARY_POPUP_UNLINK,
    };

    const stackElement = LogService.getStackNode(
      LogStackTypes.RELATED,
      relatedModel.initialReference.table,
      { source: modalReference.compressedDataSource, entity: true, picker: 1 }
    );

    const logInfo = {
      logObject: null,
      logStack: getRecordLogStack(stackElement),
      logStackPath: LogService.getStackPath(null, LogStackPaths.UNLINK_PB_POPUP),
    };

    // this function is here since we need to access the outer scope here
    const submitCB = (selectedRows: SelectedRow[]) => {
      if (!selectedRows) return;

      const cc = ConfigService.chaiseConfig;
      const CONFIRM_DELETE = cc.confirmDelete === undefined || cc.confirmDelete ? true : false;

      // NOTE: This reference has to be filtered so creating the path in the ermrestJS function works properly
      const leafReference = selectedRows[0].tupleReference;

      setShowPureBinarySpinner(true);

      validateSessionBeforeMutation(() => {
        const deleteResponse = (response: any) => {
          setShowPureBinarySpinner(false);

          // Show modal popup summarizing total # of deletions succeeded and failed
          response.clickOkToDismiss = true;

          // TODO: - improve partial success and use TRS to check delete rights before giving a checkbox
          //       - some errors could have been because of row level security
          dispatchError({
            error: response,
            isDismissible: true,
            closeBtnCallback: () => {
              // ask recordset to update the modal
              if (!!containerRef.current) {
                // NOTE: This feels very against React but the complexity of our flow control provider seems to warrant doing this
                fireCustomEvent(CUSTOM_EVENTS.FORCE_UPDATE_RECORDSET, containerRef.current, {
                  cause: LogReloadCauses.ENTITY_BATCH_UNLINK,
                  pageStates: { updateResult: true, updateCount: true, updateFacets: true },
                  response: response,
                });
              }
            },
          });
        };

        const deleteError = (err: any) => {
          setShowPureBinarySpinner(false);
          // errors that land here would be execution of code errors
          // if a deletion fails/errors, that delete request is caught by ermrestJS and returned
          //   as part of the deleteErrors object in the success cb
          // NOTE: if one of the identifying values is empty or null, an error is thrown here
          dispatchError({ error: err, isDismissible: true });
        };

        if (!CONFIRM_DELETE) {
          return leafReference
            .deleteBatchAssociationTuples(relatedModel.recordsetProps.parentTuple, selectedRows)
            .then(deleteResponse)
            .catch(deleteError);
        }

        logRecordClientAction(LogActions.UNLINK_INTEND);

        const multiple = selectedRows.length > 1 ? 's' : '';
        const confirmMessage: JSX.Element = (
          <>
            Are you sure you want to unlink {selectedRows.length} record{multiple}?
          </>
        );

        setShowDeleteConfirmationModal({
          buttonLabel: 'Unlink',
          title: 'Confirm Unlink',
          onConfirm: () => {
            setShowDeleteConfirmationModal(null);
            return leafReference
              .deleteBatchAssociationTuples(relatedModel.recordsetProps.parentTuple, selectedRows)
              .then(deleteResponse)
              .catch(deleteError);
          },
          onCancel: () => {
            setShowDeleteConfirmationModal(null);
            setShowPureBinarySpinner(false);
            logRecordClientAction(LogActions.UNLINK_CANCEL);
          },
          message: confirmMessage,
        });
      });
    };
    setUnlinkPureBinarySubmitCB(() => submitCB);

    setUnlinkPureBinaryModalProps({
      initialReference: modalReference,
      initialPageLimit: RECORDSET_DEFAULT_PAGE_SIZE,
      config: recordsetConfig,
      logInfo,
      parentTuple: recordPage.tuples[0],
      parentReference: recordReference,
    });
  };

  const closeUnlinkPureBinaryModal = () => {
    resumeUpdateRecordPage();
    setUnlinkPureBinaryModalProps(null);
    updateRecordPage(true, LogReloadCauses.RELATED_BATCH_UNLINK);
  };

  //-------------------  render logic   --------------------//

  // Adding different classname for table header and main section to apply styles
  const containerClassName = `related-table-actions ${!relatedModel.isInline ? 'table-header-actions' : 'main-section-actions'}`;

  let pureAndBinaryTitleComment;
  if (usedRef.comment && usedRef.comment.displayMode === CommentDisplayModes.TOOLTIP) {
    pureAndBinaryTitleComment= usedRef.comment;
  }

  const mainTable = (
    <code>
      <DisplayValue value={recordReference.displayname}></DisplayValue>
    </code>
  );
  const currentTable = (
    <code>
      <DisplayValue value={usedRef.displayname}></DisplayValue>
    </code>
  );

  const exploreLink = addQueryParamsToURL(usedRef.appLink, {
    paction: LogParentActions.EXPLORE,
  });
  const editLink = usedRef.contextualize.entryEdit.appLink;

  const renderCustomModeBtn = (tertiary?: boolean) => {
    let tooltip: string | JSX.Element = '',
      icon = '',
      label = '';
    if (displayCustomModeRelated(relatedModel)) {
      icon = 'fas fa-table';
      if (relatedModel.canEdit) {
        tooltip = (
          <span>
            Display edit controls for {currentTable} records related to this {mainTable}.
          </span>
        );
        label = 'Edit mode';
      } else {
        tooltip = <span>Display related {currentTable} in tabular mode.</span>;
        label = 'Table mode';
      }
    } else {
      icon = 'fa-solid fa-layer-group';
      tooltip = 'Switch back to the custom display mode.';
      label = 'Custom mode';
    }

    return (
      <ChaiseTooltip placement='top' tooltip={tooltip}>
        <button
          className={`chaise-btn toggle-display-link ${tertiary ? 'chaise-btn-tertiary dropdown-button' : 'chaise-btn-secondary'}`}
          onClick={tertiary ? undefined : onToggleDisplayMode}
        >
          <span className={`chaise-btn-icon ${icon}`}></span>
          <span>{label}</span>
        </button>
      </ChaiseTooltip>
    );
  };

  const renderCreateBtnTooltip = () => {
    if (relatedModel.canCreateDisabled) {
      let fkr;
      if (relatedModel.initialReference.derivedAssociationReference) {
        fkr = relatedModel.initialReference.derivedAssociationReference.origFKR;
      } else {
        fkr = relatedModel.initialReference.origFKR;
      }
      const keyset = <code>{fkr.key.colset.columns.map((c: any) => c.name).join(', ')}</code>;

      if (relatedModel.isPureBinary) {
        return (
          <span>
            Unable to connect to {currentTable} records until {keyset} in this {mainTable} is set.
          </span>
        );
      }
      return (
        <span>
          Unable to create {currentTable} records for this {mainTable} until {keyset} in this{' '}
          {mainTable} is set.
        </span>
      );
    }

    if (relatedModel.isPureBinary) {
      return (
        <span>
          Connect {currentTable} records to this {mainTable}.
        </span>
      );
    }
    return (
      <span>
        Create {currentTable} records for this {mainTable}.
      </span>
    );
  };

  const renderBulkEditBtnTooltip = () => {
    if (relatedModel.recordsetState.page?.length < 1) {
      return (
        <span>
          Unable to edit {currentTable} records until some are created.
        </span>
      )
    }

    return (
      <span>
        Edit this page of {currentTable} records related to this {mainTable}.
      </span>
    )
  }

  /*
    * This function is to render each button. We call the renderButton function with button text,
    * inner element classname and boolean flag to show tertiary class(for the dropdown buttons) or not
  */
  const renderButtons = () => {
    return (
      <div
        ref={buttonRef}
        className='button-wrapper'
        style={{ marginRight: `${buttonsInDropdown.length > 0 ? '5px' : '0px'}` }}
      >
        {relatedModel.canCreate && renderButton(`${relatedModel.isPureBinary ? 'Link' : 'Add'} records`, false)}

        {relatedModel.isPureBinary && relatedModel.canDelete && renderButton('Unlink records', false)}

        {allowCustomModeRelated(relatedModel) && renderCustomModeBtn()}
        {/*
          * if user can edit, also check for create permission
          *   - if they can't create, allow edit if there are some rows set
          *   - disable button if can create but no rows
          */}
        {relatedModel.canEdit && (relatedModel.canCreate || relatedModel.recordsetState.page?.length > 0) && renderButton('Bulk Edit', false)}

        {renderButton('Explore', false)}
      </div>
    );
  };
  /**
   * This function is to render the button in the dropdown with the tooltip.
   * @param  {string}   buttonText title of button
   * @param  {string}   spanClass classname of inner span
   * @param  {boolean}   tertiary boolean to differentiate dropdown button and outside button
   * @param  {number} index
  */
  const renderButton = (buttonText: string, tertiary?: boolean) => {
    switch (buttonText) {
      case 'Explore':
        return (
          <ChaiseTooltip
            placement='top'
            tooltip={
              <span>
                Explore more {currentTable} records related to this {mainTable}.
              </span>
            }
          >
            <a
              className={`chaise-btn more-results-link ${tertiary ? 'chaise-btn-tertiary dropdown-button' : 'chaise-btn-secondary'
                }`}
              href={exploreLink}
              onClick={onExplore}
            >
              <span className='chaise-btn-icon fa-solid fa-magnifying-glass'></span>
              <span>Explore</span>
            </a>
          </ChaiseTooltip>
        );
      case 'Bulk Edit':
        const disableBulkEdit = relatedModel.recordsetState.page?.length < 1;
        return (
          <ChaiseTooltip
            placement='top'
            tooltip={renderBulkEditBtnTooltip()}
          >
            <a
              className={`chaise-btn bulk-edit-link
                ${tertiary ? ' chaise-btn-tertiary dropdown-button' : ' chaise-btn-secondary'}
                ${disableBulkEdit ? ' disabled' : ''}`
              }
              href={editLink}
              onClick={onBulkEdit}
              aria-disabled={disableBulkEdit}
            >
              <span className='chaise-btn-icon fa fa-pencil'></span>
              <span>Bulk Edit</span>
            </a>
          </ChaiseTooltip>
        );
      case 'Link records':
      case 'Add records':
        return (
          <ChaiseTooltip placement='top' tooltip={renderCreateBtnTooltip()}>
            <button
              className={`chaise-btn add-records-link ${tertiary ? 'chaise-btn-tertiary dropdown-button' : 'chaise-btn-secondary'
                }`}
              onClick={tertiary ? undefined : onCreate}
              disabled={relatedModel.canCreateDisabled}
            >
              <span className='chaise-btn-icon fa-solid fa-plus'></span>
              <span>{relatedModel.isPureBinary ? 'Link' : 'Add'} records</span>
            </button>
          </ChaiseTooltip>
        )
      case 'Unlink records':
        return (
          <ChaiseTooltip
            placement='top'
            tooltip={
              <span>
                Disconnect {currentTable} records from this {mainTable}.
              </span>
            }
          >
            <button
              className={`chaise-btn unlink-records-link ${tertiary ? 'chaise-btn-tertiary dropdown-button' : 'chaise-btn-secondary'
                }`}
              onClick={tertiary ? undefined : onUnlink}
            >
              <span className='chaise-btn-icon fa-regular fa-circle-xmark'></span>
              <span>Unlink records</span>
            </button>
          </ChaiseTooltip>
        )
      case 'Edit mode':
      case 'Custom mode':
      case 'Table mode':
        return renderCustomModeBtn(true);
    }
  };

  return (
    <>
      <div className={containerClassName} ref={containerRef}>
        {renderButtons()}
        {buttonsInDropdown.length > 0 && (
          <Dropdown onToggle={(isOpen: boolean, event: any) => toggleDropdown(isOpen, event)}>
            <ChaiseTooltip
              placement='top'
              tooltip={
                <span>
                  {`${showAllActionsAsDropdown ? 'View the available actions.' : 'View the extra available actions.'}`}
                </span>
              }
            >
              <Dropdown.Toggle
                disabled={false}
                className={`chaise-btn chaise-btn-primary dropdown-toggle-table ${showAllActionsAsDropdown
                  && !relatedModel.isInline ? 'show-all-actions-as-dropdown' : ''}`}
              >
                <span className='fa fa-angle-double-right'></span>
              </Dropdown.Toggle>
            </ChaiseTooltip>
            <Dropdown.Menu>
              {buttonsInDropdown.map((button: any, index) => (
                <Dropdown.Item
                  as={'li'}
                  key={`dropdown-button-${index}`}
                  onClick={(e: any) => handleDropDownClick(e, button)}
                >
                  {renderButton(button.textContent, true)}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>

      {addPureBinaryModalProps && submitPureBinaryCB && (
        <RecordsetModal
          modalClassName='add-pure-and-binary-popup'
          recordsetProps={addPureBinaryModalProps}
          onSubmit={submitPureBinaryCB}
          showSubmitSpinner={showPureBinarySpinner}
          onClose={closeAddPureBinaryModal}
          displayname={relatedModel.initialReference.displayname}
          comment={pureAndBinaryTitleComment}
        />
      )}

      {unlinkPureBinaryModalProps && unlinkPureBinaryCB && (
        <RecordsetModal
          modalClassName='unlink-pure-and-binary-popup'
          recordsetProps={unlinkPureBinaryModalProps}
          onSubmit={unlinkPureBinaryCB}
          showSubmitSpinner={showPureBinarySpinner}
          onClose={closeUnlinkPureBinaryModal}
          displayname={relatedModel.initialReference.displayname}
          comment={pureAndBinaryTitleComment}
          closeButtonLabel='Close'
        />
      )}

      {showDeleteConfirmationModal && (
        <DeleteConfirmationModal
          show={!!showDeleteConfirmationModal}
          message={showDeleteConfirmationModal.message}
          buttonLabel={showDeleteConfirmationModal.buttonLabel}
          onConfirm={showDeleteConfirmationModal.onConfirm}
          onCancel={showDeleteConfirmationModal.onCancel}
          title={showDeleteConfirmationModal.title}
          context={DeleteConfirmationModalTypes.SINGLE}
        />
      )}
    </>
  );
};

export default RelatedTableActions;
