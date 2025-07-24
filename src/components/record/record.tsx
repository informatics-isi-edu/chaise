import '@isrd-isi-edu/chaise/src/assets/scss/_record.scss';

// components
import Accordion from 'react-bootstrap/Accordion';
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DeleteConfirmationModal, { DeleteConfirmationModalTypes } from '@isrd-isi-edu/chaise/src/components/modals/delete-confirmation-modal';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import Export from '@isrd-isi-edu/chaise/src/components/export';
import Footer from '@isrd-isi-edu/chaise/src/components/footer';
import RecordMainSection from '@isrd-isi-edu/chaise/src/components/record/record-main-section';
import RelatedTable from '@isrd-isi-edu/chaise/src/components/record/related-table';
import RelatedTableHeader from '@isrd-isi-edu/chaise/src/components/record/related-table-header';
import ShareCiteButton from '@isrd-isi-edu/chaise/src/components/share-cite-button';
import Spinner from 'react-bootstrap/Spinner';
import SplitView from '@isrd-isi-edu/chaise/src/components/split-view';
import Title from '@isrd-isi-edu/chaise/src/components/title';

// hooks
import { useEffect, useLayoutEffect, useRef, useState, type JSX } from 'react';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useRecord from '@isrd-isi-edu/chaise/src/hooks/record';

// models
import { LogActions, LogObjectType, LogReloadCauses } from '@isrd-isi-edu/chaise/src/models/log';
import { RecordRelatedModel } from '@isrd-isi-edu/chaise/src/models/record';
import { RecordeditNotifyActions, RecordeditNotifyEventType } from '@isrd-isi-edu/chaise/src/models/events';

// providers
import AlertsProvider from '@isrd-isi-edu/chaise/src/providers/alerts';
import RecordProvider from '@isrd-isi-edu/chaise/src/providers/record';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utilities
import { CLASS_NAMES, CUSTOM_EVENTS } from '@isrd-isi-edu/chaise/src/utils/constants';
import { getDisplaynameInnerText } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { canShowInlineRelated, canShowRelated, determineScrollElement } from '@isrd-isi-edu/chaise/src/utils/record-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { isObjectAndNotNull } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { attachContainerHeightSensors, attachMainContainerPaddingSensor } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

export type RecordProps = {
  /**
   * The parent container that record will be part of
   * (used for scrollbar logic)
   */
  parentContainer?: HTMLElement;
  /**
   * the displayname of the section that we should scroll to after initialization
   */
  scrollToDisplayname?: string;
  /**
   * the displayed reference
   */
  reference: any;
  /**
   * The log related APIs
   */
  logInfo: {
    /**
     * the object that will be logged with the first request
     */
    logObject?: LogObjectType,
    logStack: any,
    logStackPath: string,
    logAppMode?: string
  }
};

const Record = ({
  parentContainer = document.querySelector('#chaise-app-root') as HTMLElement,
  reference,
  scrollToDisplayname,
  logInfo
}: RecordProps): JSX.Element => {
  return (
    <AlertsProvider>
      <RecordProvider reference={reference} logInfo={logInfo}>
        <RecordInner
          parentContainer={parentContainer}
          scrollToDisplayname={scrollToDisplayname}
        />
      </RecordProvider>
    </AlertsProvider>
  );
};

type RecordInnerProps = {
  parentContainer?: HTMLElement,
  scrollToDisplayname?: string
};

const RecordInner = ({
  parentContainer,
  scrollToDisplayname
}: RecordInnerProps): JSX.Element => {
  const { validateSessionBeforeMutation } = useAuthn();
  const { dispatchError, errors } = useError();

  const {
    relatedSectionInitialized, showMainSectionSpinner,
    showEmptySections,
    toggleShowEmptySections,
    updateRecordPage,
    initialized,
    page, citation,
    columnModels,
    readMainEntity,
    reference,
    relatedModels,
    logRecordClientAction, getRecordLogAction, getRecordLogStack
  } = useRecord();

  /**
   * whether we should even offer the side panel button or not
   * before fetching data, this should be true if we don't have any related or inlines.
   * after fetching data, this should be true if all the inline/related are hidden.
   */
  const [disablePanel, setDisablePanel] = useState(() => {
    return reference && !(reference.related.length > 0 || reference.columns.some((col: any) => {
      return col.isInboundForeignKey || (col.isPathColumn && col.hasPath && !col.isUnique && !col.hasAggregate)
    }));
  });

  /**
   * State variable to show or hide side panel
   * by default it will be closed if any of the following is true:
   * - chaise-config's hideTableOfContents is set to true
   * - reference's collapseToc is true
   */
  const [showPanel, setShowPanel] = useState<boolean>(() => (
    !(ConfigService.chaiseConfig.hideTableOfContents === true || reference.display.collapseToc === true)
  ));

  // when object is null, hide the modal
  // object is the props for the the modal
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState<{
    onConfirm: () => void,
    onCancel: () => void,
    buttonLabel: string,
    message: JSX.Element,
    reference: any
  } | null>(null);
  const [showDeleteSpinner, setShowDeleteSpinner] = useState(false);

  // by default open all the sections
  const [openRelatedSections, setOpenRelatedSections] = useState<string[]>(Array.from(Array(reference.related.length), (e, i) => `${i}`));

  const [showScrollToTopBtn, setShowScrollToTopBtn] = useState(false);

  /**
   * used to see if there are any pending create requests
   */
  const addRecordRequests = useRef<any>({});

  /**
   * used to figure out if we need to update the page after edit request or not
   */
  const editRecordRequests = useRef<any>({});

  const mainContainer = useRef<HTMLDivElement>(null);

  // since we're using strict mode, the useEffect is getting called twice in dev mode
  // this is to guard against it
  const setupStarted = useRef<boolean>(false);

  // initialize the page
  useEffect(() => {
    if (setupStarted.current) return;
    setupStarted.current = true;

    readMainEntity().then((p: any) => {
      const tuple = p.tuples[0];

      // send string to prepend to "headTitle" format: <table-name>: <row-name>
      const title = `${getDisplaynameInnerText(reference.displayname)}: ${getDisplaynameInnerText(tuple.displayname)}`;
      updateHeadTitle(title);

      // update the window location with tuple to remove query params (namely ppid and pcid)
      // and also change the url to always be based on RID
      let url = tuple.reference.contextualize.detailed.appLink;
      url = url.substring(0, url.lastIndexOf('?'));

      $log.log([
        'Default export template is accessible through `defaultExportTemplate` variable. ',
        'To get the string value of it call `JSON.stringify(defaultExportTemplate)`'
      ].join(''));
      windowRef.defaultExportTemplate = reference.defaultExportTemplate;

      // add hideNavbar param back if true
      if (ConfigService.appSettings.hideNavbar) url += `?hideNavbar=${ConfigService.appSettings.hideNavbar}`;
      windowRef.history.replaceState({}, '', url);
    }).catch((error: any) => {
      dispatchError({ error });
    });
  }, []);

  // properly set scrollable section height
  useEffect(() => {
    if (!initialized) return;
    const resizeSensors = attachContainerHeightSensors(parentContainer);

    const toggleScrollToTopBtn = () => {
      if (!mainContainer.current) return;
      setShowScrollToTopBtn(mainContainer.current.scrollTop > 300);
    }
    mainContainer.current?.addEventListener('scroll', toggleScrollToTopBtn);

    return () => {
      resizeSensors?.forEach((rs) => !!rs && rs.detach());

      mainContainer.current?.removeEventListener('scroll', toggleScrollToTopBtn);
    }
  }, [initialized]);

  // make sure the right padding is correct regardless of scrollbar being there or not
  useLayoutEffect(() => {
    if (!initialized) return;
    const paddingSensor = attachMainContainerPaddingSensor(parentContainer);

    return () => { paddingSensor.detach(); }
  }, [initialized]);

  /**
   * attach the onFocus event listener
   * NOTE: we have to make sure the event listener is updated when the
   * updateRecordPage function changes
   */
  useEffect(() => {
    windowRef.removeEventListener(CUSTOM_EVENTS.ADD_INTEND, onAddIntend);
    windowRef.addEventListener(CUSTOM_EVENTS.ADD_INTEND, onAddIntend);

    windowRef.removeEventListener(CUSTOM_EVENTS.ROW_EDIT_INTEND, onEditRowIntend);
    windowRef.addEventListener(CUSTOM_EVENTS.ROW_EDIT_INTEND, onEditRowIntend);

    windowRef.removeEventListener(CUSTOM_EVENTS.ROW_DELETE_SUCCESS, onDeleteRowSuccess);
    windowRef.addEventListener(CUSTOM_EVENTS.ROW_DELETE_SUCCESS, onDeleteRowSuccess);

    windowRef.removeEventListener('focus', onFocus);
    windowRef.addEventListener('focus', onFocus);

    const channelName = `chaise-${ConfigService.contextHeaderParams.cid}-${ConfigService.contextHeaderParams.pid}`;
    const channel = new BroadcastChannel(channelName);
    channel.onmessage = onMessageRecived;

    windowRef.removeEventListener(CUSTOM_EVENTS.RELATED_TABLE_PAGING_SUCCESS, onPagingSuccess);
    windowRef.addEventListener(CUSTOM_EVENTS.RELATED_TABLE_PAGING_SUCCESS, onPagingSuccess);
    return () => {
      windowRef.removeEventListener(CUSTOM_EVENTS.ADD_INTEND, onAddIntend);
      windowRef.removeEventListener(CUSTOM_EVENTS.ROW_EDIT_INTEND, onEditRowIntend);
      windowRef.removeEventListener(CUSTOM_EVENTS.ROW_DELETE_SUCCESS, onDeleteRowSuccess);
      windowRef.removeEventListener('focus', onFocus);
      channel.close();
      windowRef.removeEventListener(CUSTOM_EVENTS.RELATED_TABLE_PAGING_SUCCESS, onPagingSuccess);
    };
  }, [updateRecordPage]);

  /**
   * When the page is fully initialized (including related section),
   * - scroll to the section based on query parameter
   */
  const setupAfterPageLoadisDone = useRef(false);
  useEffect(() => {
    if (setupAfterPageLoadisDone.current || !relatedSectionInitialized || showMainSectionSpinner) return;
    setupAfterPageLoadisDone.current = true;

    // scroll to section based on query parameter
    if (!!scrollToDisplayname) {
      scrollToSection(scrollToDisplayname, true);
    }
  }, [showMainSectionSpinner, relatedSectionInitialized]);

  /**
   * disable the side panel if there aren't any visible inline or related tables
   */
  useEffect(() => {
    if (showMainSectionSpinner || !relatedSectionInitialized) return;
    setDisablePanel(
      columnModels.every((cm) => (!canShowInlineRelated(cm, showEmptySections))) &&
      relatedModels.every((rm) => !canShowRelated(rm, showEmptySections))
    );
  }, [showMainSectionSpinner, relatedSectionInitialized, showEmptySections, columnModels, relatedModels]);

  /**
     * On window focus, remove request and update the page
     */
  const onFocus = () => {
    const uc = LogReloadCauses;

    // where in the page has been changed
    const changedContainers: any = [];

    const addToChangedContainers = (details: { isInline: boolean, index: number }, causeDefs: string[]) => {
      changedContainers.push({
        ...details,
        cause: causeDefs[details.isInline ? 1 : 0],
      });
    };

    //find the completed or deleted edit requests
    for (const id in editRecordRequests.current) {
      if (editRecordRequests.current[id].completed) {
        addToChangedContainers(editRecordRequests.current[id], [uc.RELATED_UPDATE, uc.RELATED_INLINE_UPDATE]);
        delete editRecordRequests.current[id];
      }
      else if (editRecordRequests.current[id].deleted) {
        addToChangedContainers(editRecordRequests.current[id], [uc.RELATED_DELETE, uc.RELATED_INLINE_DELETE]);
        delete editRecordRequests.current[id];
      }
      else if (editRecordRequests.current[id].partiallyDeleted) {
        addToChangedContainers(editRecordRequests.current[id], [uc.RELATED_DELETE, uc.RELATED_INLINE_DELETE]);
        // the edit request could still be completed.
      }
    }

    // find the completed create requests
    for (const id in addRecordRequests.current) {
      if (addRecordRequests.current[id].completed) {
        addToChangedContainers(addRecordRequests.current[id], [uc.RELATED_CREATE, uc.RELATED_INLINE_CREATE]);
        // remove the request
        delete addRecordRequests.current[id];
      }
    }

    // if something has changed
    if (changedContainers.length > 0) {
      updateRecordPage(true, undefined, changedContainers);
    }
  };

  /**
   * capture the create requests so we know when to refresh the page on focus
   */
  const onAddIntend = ((event: CustomEvent) => {
    const id = event.detail.id;
    const containerDetails = event.detail.containerDetails;
    if (typeof id !== 'string' || !isObjectAndNotNull(containerDetails)) {
      return;
    }
    addRecordRequests.current[id] = { ...containerDetails, completed: false };
  }) as EventListener;

  /**
   * capture the edit requests so we know when to refresh the page on focus
   */
  const onEditRowIntend = ((event: CustomEvent) => {
    const id = event.detail.id;
    const containerDetails = event.detail.containerDetails;
    if (typeof id !== 'string' || !isObjectAndNotNull(containerDetails)) {
      return;
    }
    editRecordRequests.current[id] = { ...containerDetails, completed: false };
  }) as EventListener;

  /**
   * after a successful delete, update the page.
   */
  const onDeleteRowSuccess = ((event: CustomEvent) => {
    const containerDetails = event.detail.containerDetails;
    if (!isObjectAndNotNull(containerDetails)) return;
    const cause = containerDetails.isInline ? LogReloadCauses.RELATED_INLINE_DELETE : LogReloadCauses.RELATED_DELETE;
    updateRecordPage(true, undefined, [{ ...containerDetails, cause }])
  }) as EventListener;

  /**
   * the listener for the messages recived from recordedit.
   */
  const onMessageRecived = (event: MessageEvent<RecordeditNotifyEventType>) => {
    const eventType = event.data.type;
    const id = event.data.id;
    switch (eventType) {
      case RecordeditNotifyActions.CREATE:
        if (id && !!addRecordRequests.current[id]) {
          addRecordRequests.current[id].completed = true;
        }
        break;
      case RecordeditNotifyActions.EDIT:
        if (id && !!editRecordRequests.current[id]) {
          editRecordRequests.current[id].completed = true;
        } else {
          // if users opened the bulk edit link in a new tab, we don't have the id information
          editRecordRequests.current[-1] = { index: -1, isInline: false, completed: true };
        }
        break;
      case RecordeditNotifyActions.DELETE:
        const isPartial = event.data.details?.partial;
        if (id && !!editRecordRequests.current[id]) {
          if (isPartial) {
            editRecordRequests.current[id].partiallyDeleted = true;
          } else {
            editRecordRequests.current[id].deleted = true;
          }
        } else {
          // if users opened the bulk edit link in a new tab, we don't have the id information
          editRecordRequests.current[-1] = {
            index: -1, isInline: false,
            ...(isPartial && { deletePartial: true }),
            ...(!isPartial && { deleted: true })
          };
        }
        break;
    }
  }

  // if the main data is not initialized, just show spinner
  if (!initialized) {
    if (errors.length > 0) {
      return <></>;
    }
    return <ChaiseSpinner />;
  }

  const tuple = page.tuples[0];
  const modifyRecord = ConfigService.chaiseConfig.editRecord === false ? false : true;

  const canCreate = reference.canCreate && modifyRecord;
  const canEdit = tuple.canUpdate && modifyRecord;
  const canDelete = tuple.canDelete && ConfigService.chaiseConfig.deleteRecord !== false;

  const copyRecord = () => {
    const appLink = reference.contextualize.entryCreate.appLink;
    let separator = '?';
    // if appLink already has query params, add &
    // NOTE: With the ppid and pcid implementation appLink will always have
    // that, this is just to avoid further changes if we reverted that change.
    if (appLink.indexOf('?') !== -1) separator = '&';

    // this URL used to have limit=1 but we removed it since it was redundant.
    // we're throwing an error when there are multiple records with the given
    // given filter in record page. we're also making sure the record link
    // is based on the shortest key, so this query parameter is redundant
    return appLink + separator + 'copy=true';
  }

  const deleteRecord = () => {
    // TODO do we need an indicator that we're waiting for session fetch?
    validateSessionBeforeMutation(() => {
      if (ConfigService.chaiseConfig.confirmDelete === undefined || ConfigService.chaiseConfig.confirmDelete) {
        logRecordClientAction(LogActions.DELETE_INTEND);

        const confirmMessage: JSX.Element = (
          <>
            Are you sure you want to delete <code><DisplayValue value={reference.displayname}></DisplayValue></code>
            <span>: </span>
            <code><DisplayValue value={page.tuples[0].displayname}></DisplayValue></code>?
          </>
        );

        setShowDeleteConfirmationModal({
          buttonLabel: 'Delete',
          onConfirm: () => { onDeleteConfirmation() },
          onCancel: () => {
            setShowDeleteConfirmationModal(null);
            logRecordClientAction(LogActions.DELETE_CANCEL);
          },
          message: confirmMessage,
          reference
        });

      } else {
        onDeleteConfirmation();
      }
    })
    return;
  }

  const onDeleteConfirmation = () => {
    // make sure the main spinner is displayed
    setShowDeleteSpinner(true);
    // close the confirmation modal if it exists
    setShowDeleteConfirmationModal(null);

    const logObj = {
      action: getRecordLogAction(LogActions.DELETE),
      stack: getRecordLogStack()
    };
    reference.delete(null, logObj).then(function deleteSuccess() {
      // Get an appLink from a reference to the table that the existing reference came from
      const unfilteredRefAppLink = reference.table.reference.contextualize.compact.appLink;
      // $rootScope.showSpinner = false;
      windowRef.location = unfilteredRefAppLink;
    }).catch(function (error: any) {
      dispatchError({ error: error, isDismissible: true });
    }).finally(() => {
      // hide the spinner
      setShowDeleteSpinner(false);
    });
  }

  /**
   * function to change state to show or hide side panel
   */
  const toggleSidePanel = () => {
    const newState = !showPanel;
    logRecordClientAction(newState ? LogActions.TOC_SHOW : LogActions.TOC_HIDE);
    setShowPanel(newState);
  };

  const toggleRelatedSection = (relatedModel: RecordRelatedModel) => {
    return (event: any) => {
      // since we're using the link/unlink popups inside the header,
      // clicking anywhere on the popups will trigger this handler!
      // this will ensure what's clicked is actually a decendent of the accordion-button
      if (!!event.currentTarget) {
        const pEl = event.currentTarget as HTMLElement;
        if (!pEl.contains(event.target as HTMLElement)) {
          return;
        }
      }
      setOpenRelatedSections((currState: string[]) => {
        const currIndex = currState.indexOf(relatedModel.index.toString());
        const isOpen = (currIndex !== -1);

        const action = isOpen ? LogActions.CLOSE : LogActions.OPEN;

        // log the action
        LogService.logClientAction({
          action: LogService.getActionString(action, relatedModel.recordsetProps.logInfo.logStackPath),
          stack: relatedModel.recordsetProps.logInfo.logStack
        }, relatedModel.initialReference.defaultLogInfo);

        return isOpen ? [...currState.slice(0, currIndex), ...currState.slice(currIndex + 1)] : currState.concat(relatedModel.index.toString());
      });
    }
  };

  const scrollMainContainerToTop = (action: LogActions) => {
    if (!mainContainer.current) return;

    logRecordClientAction(action);

    mainContainer.current.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const scrollToRelatedTable = (element: HTMLElement, delayScroll?: number) => {
    // defer scrollTo behavior so the accordion has time to open
    // 200 seems like a good amount of time based on testing
    setTimeout(() => {
      mainContainer.current?.scrollTo({
        top: element.offsetTop,
        behavior: 'smooth',
      });

      // flash the activeness
      setTimeout(() => {
        element.classList.add('row-focus');
        setTimeout(() => {
          element.classList.remove('row-focus');
        }, 1600);
      }, 100);
    }, delayScroll);
  }

  // sectionId is displayname.value
  const scrollToSection = (displayname: string, dontLog?: boolean) => {
    if (!mainContainer.current) return;

    const scrollElement = determineScrollElement(displayname);
    if (!scrollElement) {
      $log.debug(`section '${displayname}' not found for scrolling to!`);
      return;
    }

    // column model or related table model
    let rtm = columnModels.filter((cm) => {
      return cm.column.displayname.value === displayname;
    })[0]?.relatedModel;

    // if not inline, check related section
    if (!rtm) {
      rtm = relatedModels.filter(function (rm) {
        return rm.initialReference.displayname.value === displayname;
      })[0];
    }

    // if no column or related model is found, log a debug error and return
    // NOTE: should not happen if we have a scroll element
    if (!rtm) {
      $log.debug(`section '${displayname}' does not have a related model!`);
      return;
    }

    if (!dontLog) {
      LogService.logClientAction({
        action: LogService.getActionString(LogActions.TOC_SCROLL_RELATED, rtm.recordsetProps.logInfo.logStackPath),
        stack: rtm.recordsetProps.logInfo.logStack
      }, rtm.initialReference.defaultLogInfo);
    }

    let delayScroll = 0;
    // if not inline and the related table is closed, add it to the set of open related sections to be opened
    if (!rtm.isInline && openRelatedSections.indexOf(rtm.index.toString()) === -1) {
      delayScroll = 200;
      setOpenRelatedSections((currState: string[]) => {
        // const action = LogActions.OPEN;

        return currState.concat(rtm.index.toString());
      });
    }

    scrollToRelatedTable(scrollElement as HTMLElement, delayScroll);
  }

  /**
   * When a user clicks previous/next for a related table, after the table has "updated" successfully, an
   * event is emitted with the related table's displayname for scrolling to
   */
  const onPagingSuccess = ((event: CustomEvent) => {
    if (!mainContainer.current) return;

    const displaynameForID = event.detail.displayname;
    const scrollElement = determineScrollElement(displaynameForID);
    if (!scrollElement) {
      $log.debug(`section '${displaynameForID}' not found for scrolling to!`);
      return;
    }

    const scrollElTop = scrollElement.getBoundingClientRect().top;
    const mainContainerTop = mainContainer.current.getBoundingClientRect().top;

    // return if related table header is at the top of main container or below the top (it's already visible)
    // NOTE: related table header can't be below the bottom of main container since the user clicked prev/next
    //    for the related table we are looking at, meaning prev/next is above the bottom of main container and
    //    therefore the related table header is either visible or above the top of main container top
    if (scrollElTop >= mainContainerTop) return;

    scrollToRelatedTable(scrollElement as HTMLElement);
  }) as EventListener;

  const renderTableOfContentsItem = (isInline: boolean, index: number) => {
    if (isInline && !canShowInlineRelated(columnModels[index], showEmptySections)) {
      return;
    }
    if (!isInline && !canShowRelated(relatedModels[index], showEmptySections)) {
      return;
    }

    const displayname = isInline ? columnModels[index].column.displayname : relatedModels[index].initialReference.displayname;

    // the related page might be null if we're still waiting for the request
    const relatedPage = isInline ? columnModels[index].relatedModel?.recordsetState.page : relatedModels[index].recordsetState.page;

    let pageInfo;
    if (relatedPage) {
      pageInfo = <> (containing {relatedPage.length}{relatedPage.hasNext && ' or more'} record{relatedPage.length !== 1 && 's'})</>;
    }

    return (
      <li
        key={`toc-inline-heading-${index}`} id={`recordSidePan-heading-${index}`}
        className={`toc-heading${isInline ? ' toc-inline-heading' : ''}`}
        onClick={() => { scrollToSection(displayname.value) }}
      >
        <ChaiseTooltip
          placement='right'
          tooltip={<span>Scroll to the <code><DisplayValue value={displayname} /></code> section{pageInfo}</span>}
        >
          <a className={!relatedPage || relatedPage.length === 0 ? 'empty-toc-heading' : ''}>
            <DisplayValue value={displayname} />
            {relatedPage && <span> ({relatedPage.length}{(relatedPage.hasNext || relatedPage.hasPrevious) ? '+' : ''})</span>}
          </a>
        </ChaiseTooltip>
      </li>
    )
  }

  // Function to render the full table of contents
  const renderTableOfContents = (leftRef: React.RefObject<HTMLDivElement | null>) => (
    <div
      id='record-side-pan'
      className={`side-panel-resizable record-toc resizable small-panel ${showPanel && !disablePanel ? 'open-panel' : 'close-panel'
        }`}
      ref={leftRef}
    >
      <div className='side-panel-container'>
        <div className='columns-container'>
          <ul>
            <li id='main-to-top' className='toc-heading' onClick={() => scrollMainContainerToTop(LogActions.TOC_SCROLL_TOP)}>
              <ChaiseTooltip placement='right' tooltip='Scroll to top of the page.'><a>Summary</a></ChaiseTooltip>
            </li>
            {columnModels.map((cm) => renderTableOfContentsItem(true, cm.index))}
            {relatedModels.map((rm) => renderTableOfContentsItem(false, rm.index))}
            {errors.length === 0 && !relatedSectionInitialized &&
              <li id='rt-toc-loading' className='loading-text'>
                <Spinner animation='border' size='sm' />
                <span> Loading...</span>
              </li>
            }
          </ul>
        </div>
      </div>

    </div>
  );

  const renderRelatedTableAccordion = (rm: RecordRelatedModel) => {
    return (
      <Accordion.Item
        key={`record-related-${rm.index}`}
        eventKey={rm.index + ''}
        className={`chaise-accordion panel ${!canShowRelated(rm, showEmptySections) ? CLASS_NAMES.HIDDEN : ''}`}
        id={`rt-heading-${makeSafeIdAttr(rm.initialReference.displayname.value)}`}
        as='div'
      >
        <Accordion.Button as='div' onClick={toggleRelatedSection(rm)} className='panel-heading'>
          <RelatedTableHeader relatedModel={rm} />
        </Accordion.Button>
        <Accordion.Body>
          <RelatedTable
            relatedModel={rm}
            displaynameForID={rm.initialReference.displayname.value}
            showSingleScrollbar={true}
          />
        </Accordion.Body>
      </Accordion.Item>
    );
  }

  const renderMainContainer = () => {
    const group1: RecordRelatedModel[] = [], group2: RecordRelatedModel[] = [], group3: RecordRelatedModel[] = [];
    relatedModels.forEach((rm, index) => {
      if (index < 4) {
        group1.push(rm);
      } else if (index >= 4 && index < 9) {
        group2.push(rm);
      } else {
        group3.push(rm);
      }
    });

    return <div className='main-container dynamic-padding' ref={mainContainer}>
      <div className='main-body'>
        <RecordMainSection />
        {/* related section */}
        {relatedModels.length > 0 &&
          <div className='related-section-container chaise-accordions'>
            <Accordion className='chaise-accordion-groups' defaultActiveKey={['project', 'donor', 'sample']} alwaysOpen>
              <Accordion.Item eventKey='project' className='chaise-accordion-group-item'>
                <Accordion.Header className='chaise-accordion-group-item-header'>Project</Accordion.Header>
                <Accordion.Body className='chaise-accordion-group-item-body'>
                  <Accordion className='panel-group' activeKey={openRelatedSections} alwaysOpen >
                    {group1.map((rm: RecordRelatedModel) => (renderRelatedTableAccordion(rm)))}
                  </Accordion>
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey='donor' className='chaise-accordion-group-item'>
                <Accordion.Header className='chaise-accordion-group-item-header'>Donor</Accordion.Header>
                <Accordion.Body className='chaise-accordion-group-item-body'>
                  <Accordion className='panel-group' activeKey={openRelatedSections} alwaysOpen >
                    {group2.map((rm: RecordRelatedModel) => (renderRelatedTableAccordion(rm)))}
                  </Accordion>
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey='sample' className='chaise-accordion-group-item'>
                <Accordion.Header className='chaise-accordion-group-item-header'>Sample</Accordion.Header>
                <Accordion.Body className='chaise-accordion-group-item-body'>
                  <Accordion className='panel-group' activeKey={openRelatedSections} alwaysOpen >
                    {group3.map((rm: RecordRelatedModel) => (renderRelatedTableAccordion(rm)))}
                  </Accordion>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>

          </div>
        }
        {/* the related-section-spinner must be inside the main-body to ensure proper positioning */}
        {/* we want to show the spinner if there's any update is happening on the page. */}
        {errors.length === 0 && (showMainSectionSpinner || relatedModels.some((rm) => rm.recordsetState.isLoading)) &&
          <ChaiseSpinner
            className='related-section-spinner bottom-left-spinner' spinnerSize='sm'
            message={relatedSectionInitialized ? 'Updating...' : 'Loading...'}
          />
        }
        {showScrollToTopBtn &&
          <ChaiseTooltip placement='left' tooltip='Scroll to top of the page.'>
            <div className='chaise-btn chaise-btn-primary back-to-top-btn' onClick={() => scrollMainContainerToTop(LogActions.SCROLL_TOP)}>
              <i className='fa-solid fa-caret-up'></i>
            </div>
          </ChaiseTooltip>
        }
      </div>
      {initialized && relatedSectionInitialized && <Footer />}
    </div>
  };

  /**
   * The left panels that should be resized together
   * This will take care of the resizing the modal header as well
   * implementation copied from components/recordset.tsx
   */
  const leftPartners: HTMLElement[] = [];
  parentContainer?.querySelectorAll('.top-left-panel').forEach((el) => {
    leftPartners.push(el as HTMLElement);
  });

  const btnClasses = 'chaise-btn chaise-btn-primary';
  return (
    <div className='record-container app-content-container'>
      {errors.length === 0 && showDeleteSpinner &&
        <div className='app-blocking-spinner-container'>
          <div className='app-blocking-spinner-backdrop'></div>
          <ChaiseSpinner className='delete-spinner' message='Deleting...' />
        </div>
      }
      <div className='top-panel-container'>
        <Alerts />
        <div className='top-flex-panel'>
          <div
            className={`top-left-panel small-panel ${showPanel && !disablePanel ? 'open-panel' : 'close-panel'
              }`}
          >
            <div className='panel-header'>
              <div className='pull-left'>
                <h3 className='side-panel-heading'>Sections</h3>
              </div>
              <div className='float-right'>
                <ChaiseTooltip
                  placement='top'
                  tooltip='Click to hide table of contents'
                >
                  <button
                    className='chaise-btn chaise-btn-tertiary hide-toc-btn'
                    onClick={toggleSidePanel}
                  >
                    <span className='chaise-btn-icon chaise-icon chaise-sidebar-close'></span>
                    <span>Hide panel</span>
                  </button>
                </ChaiseTooltip>
              </div>
            </div>
          </div>
          <div className='top-right-panel'>
            <div className='page-action-btns'>
              <div className='float-right'>
                <ChaiseTooltip
                  placement='bottom-start'
                  tooltip={`Click here to ${showEmptySections ? 'hide empty related sections.' : 'show empty related sections too.'}`}
                >
                  <button className='chaise-btn chaise-btn-primary toggle-empty-sections' onClick={toggleShowEmptySections}>
                    <span className='chaise-btn-icon fa fa-th-list'></span>
                    <span>{showEmptySections ? 'Hide' : 'Show'} empty sections</span>
                  </button>
                </ChaiseTooltip>
                <Export reference={reference} tuple={page.tuples[0]} disabled={false} csvOptionName={'This record (CSV)'} />
                <ShareCiteButton reference={reference} tuple={page.tuples[0]} citation={citation} />
              </div>
            </div>
            <div className='title'>
              <div className='entity-display-header'>
                <div className='title-container'>
                  <h1 id='page-title'>
                    <Title
                      addLink={true}
                      reference={reference}
                      displayname={reference.displayname}
                      className='entity-subtitle'
                    />
                    <span>: </span>
                    <DisplayValue className='entity-title' value={page.tuples[0].displayname} />
                    {(canCreate || canEdit || canDelete) &&
                      <div className='title-buttons record-action-btns-container'>
                        {/* create */}
                        <ChaiseTooltip
                          placement='bottom-start'
                          tooltip={canCreate ? 'Click here to create a record.' : 'You cannot perform this action.'}
                        >
                          <a
                            aria-disabled={!canCreate}
                            className={btnClasses + ' create-record-btn' + (!canCreate ? ' disabled' : '')}
                            href={reference.table.reference.unfilteredReference.contextualize.entryCreate.appLink}
                          >
                            <span className='chaise-btn-icon fa fa-plus'></span>
                            <span>Create</span>
                          </a>
                        </ChaiseTooltip>
                        {/* edit */}
                        <ChaiseTooltip
                          placement='bottom-start'
                          tooltip={canCreate ? 'Click here to create a copy of this record.' : 'You cannot perform this action.'}
                        >
                          <a
                            aria-disabled={!canCreate}
                            className={btnClasses + ' copy-record-btn' + (!canCreate ? ' disabled' : '')}
                            href={copyRecord()}
                          >
                            <span className='chaise-btn-icon  fa fa-clipboard'></span>
                            <span>Copy</span>
                          </a>
                        </ChaiseTooltip>
                        {/* copy */}
                        <ChaiseTooltip
                          placement='bottom-start'
                          tooltip={canEdit ? 'Click here to edit this record.' : 'You cannot perform this action.'}
                        >
                          <a
                            aria-disabled={!canEdit}
                            className={btnClasses + ' edit-record-btn' + (!canEdit ? ' disabled' : '')}
                            href={reference.contextualize.entryEdit.appLink}
                          >
                            <span className='chaise-btn-icon  fa fa-pencil'></span>
                            <span>Edit</span>
                          </a>
                        </ChaiseTooltip>
                        {/* delete */}
                        <ChaiseTooltip
                          placement='bottom-start'
                          tooltip={canDelete ? 'Click here to delete this record.' : 'You cannot perform this action.'}
                        >
                          <button
                            aria-disabled={!canDelete}
                            className={btnClasses + ' delete-record-btn' + (!canDelete ? ' disabled' : '')}
                            onClick={deleteRecord}
                          >
                            <span className='chaise-btn-icon fa fa-trash-alt'></span>
                            <span>Delete</span>
                          </button>
                        </ChaiseTooltip>
                      </div>
                    }
                  </h1>
                  {!showPanel && !disablePanel && (
                    <ChaiseTooltip
                      placement='top'
                      tooltip='Click to show table of contents'
                    >
                      <div
                        onClick={toggleSidePanel}
                        className='chaise-btn chaise-btn-tertiary show-toc-btn'
                      >
                        <span className='chaise-btn-icon chaise-icon chaise-sidebar-open'></span>
                        <span>Show side panel</span>
                      </div>
                    </ChaiseTooltip>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SplitView
        parentContainer={parentContainer}
        left={renderTableOfContents}
        leftPartners={leftPartners}
        right={renderMainContainer}
        minWidth={200}
        maxWidth={40}
        // NOTE the following must have the same value as the one in css.
        // which is $left-panel-width-sm variable in _variables.scss
        initialWidth={15}
        className='bottom-panel-container'
        convertMaxWidth
        convertInitialWidth
      />
      {showDeleteConfirmationModal &&
        <DeleteConfirmationModal
          show={!!showDeleteConfirmationModal}
          message={showDeleteConfirmationModal.message}
          buttonLabel={showDeleteConfirmationModal.buttonLabel}
          onConfirm={showDeleteConfirmationModal.onConfirm}
          onCancel={showDeleteConfirmationModal.onCancel}
          reference={showDeleteConfirmationModal.reference}
          context={DeleteConfirmationModalTypes.RECORD_MAIN}
        />
      }
    </div>
  );
};

export default Record;
