import '@isrd-isi-edu/chaise/src/assets/scss/_record.scss';

// components
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import Accordion from 'react-bootstrap/Accordion';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DeleteConfirmationModal from '@isrd-isi-edu/chaise/src/components/modals/delete-confirmation-modal';
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
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useRecord from '@isrd-isi-edu/chaise/src/hooks/record';

// models
import { LogActions, LogReloadCauses, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { RecordColumnModel, RecordRelatedModel } from '@isrd-isi-edu/chaise/src/models/record';

// providers
import AlertsProvider from '@isrd-isi-edu/chaise/src/providers/alerts';
import RecordProvider from '@isrd-isi-edu/chaise/src/providers/record';

// services
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { CookieService } from '@isrd-isi-edu/chaise/src/services/cookie';

// utilities
import { attachContainerHeightSensors } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { getDisplaynameInnerText } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { canShowInlineRelated, canShowRelated } from '@isrd-isi-edu/chaise/src/utils/record-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { CLASS_NAMES, CUSTOM_EVENTS } from '@isrd-isi-edu/chaise/src/utils/constants';
import { isObjectAndNotNull } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { getQueryParam } from '@isrd-isi-edu/chaise/src/utils/uri-utils';

export type RecordProps = {
  /**
   * The parent container that record will be part of
   * (used for scrollbar logic)
   */
  parentContainer?: HTMLElement;
  reference: any;
  logInfo: {
    logObject?: any,
    logStack: any,
    logStackPath: string,
    logAppMode?: string
  }
};

const Record = ({
  parentContainer = document.querySelector('#chaise-app-root') as HTMLElement,
  reference,
  logInfo
}: RecordProps): JSX.Element => {
  return (
    <AlertsProvider>
      <RecordProvider reference={reference} logInfo={logInfo}>
        <RecordInner
          parentContainer={parentContainer}
        />
      </RecordProvider>
    </AlertsProvider>
  );
};

type RecordInnerProps = {
  parentContainer?: HTMLElement
};

const RecordInner = ({
  parentContainer,
}: RecordInnerProps): JSX.Element => {
  const { validateSessionBeforeMutation } = useAuthn();
  const { dispatchError, errors } = useError();

  // TODO: add getLogAction and getLogStack to record provider
  const {
    showRelatedSectionSpinner,
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
    message: JSX.Element
  } | null>(null);
  const [showDeleteSpinner, setShowDeleteSpinner] = useState(false);

  // by default open all the sections
  const [openRelatedSections, setOpenRelatedSections] = useState<string[]>(Array.from(Array(reference.related.length), (e, i) => `${i}`));

  const [showScrollToTopBtn, setShowScrollToTopBtn] = useState(false);

  // the original href when the page was loaded
  // includes query parameters including 'scrollTo' for autoscroll
  const [initialHref] = useState<string>(windowRef.location.href);

  /**
   * used to see if there are any pending create requests
   */
  const addRecordRequests = useRef<any>({});

  /**
   * used to figure out if we need to update the page after edit request or not
   */
  const editRecordRequests = useRef<any>({});

  const mainContainer = useRef<HTMLDivElement>(null);

  // initialize the page
  useEffect(() => {
    readMainEntity().then((p: any) => {
      const tuple = p.tuples[0];

      // send string to prepend to "headTitle" format: <table-name>: <row-name>
      const title = `${getDisplaynameInnerText(reference.displayname)}: ${getDisplaynameInnerText(tuple.displayname)}`;
      updateHeadTitle(title);

      // update the window location with tuple to remove query params (namely ppid and pcid)
      // and also change the url to always be based on RID
      let url = tuple.reference.contextualize.detailed.appLink;
      url = url.substring(0, url.lastIndexOf('?'));

      // add hideNavbar param back if true
      if (ConfigService.appSettings.hideNavbar) url += `?hideNavbar=${ConfigService.appSettings.hideNavbar}`;
      windowRef.history.replaceState({}, '', url);
    }).catch((error: any) => {
      dispatchError({ error });
    });
  }, []);

  // properly set scrollable section height
  useLayoutEffect(() => {
    if (!initialized) return;
    const resizeSensors = attachContainerHeightSensors();

    const toggleScrollToTopBtn = () => {
      if (!mainContainer.current) return;
      setShowScrollToTopBtn(mainContainer.current.scrollTop > 300);
    }
    mainContainer.current?.addEventListener('scroll', toggleScrollToTopBtn);

    return () => {
      resizeSensors?.forEach((rs) => rs.detach());

      mainContainer.current?.removeEventListener('scroll', toggleScrollToTopBtn);
    }
  }, [initialized]);

  /**
   * attach the onFocus event listener
   * NOTE: we have to make sure the event listener is updated when the
   * updateRecordPage function changes
   */
  useEffect(() => {
    window.removeEventListener(CUSTOM_EVENTS.ADD_INTEND, onAddIntend);
    window.addEventListener(CUSTOM_EVENTS.ADD_INTEND, onAddIntend);

    windowRef.removeEventListener(CUSTOM_EVENTS.ROW_EDIT_INTEND, onEditRowIntend);
    windowRef.addEventListener(CUSTOM_EVENTS.ROW_EDIT_INTEND, onEditRowIntend);

    windowRef.removeEventListener(CUSTOM_EVENTS.ROW_DELETE_SUCCESS, onDeleteRowSuccess);
    windowRef.addEventListener(CUSTOM_EVENTS.ROW_DELETE_SUCCESS, onDeleteRowSuccess);

    windowRef.removeEventListener('focus', onFocus);
    windowRef.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener(CUSTOM_EVENTS.ADD_INTEND, onAddIntend);
      windowRef.removeEventListener(CUSTOM_EVENTS.ROW_EDIT_INTEND, onEditRowIntend);
      windowRef.removeEventListener(CUSTOM_EVENTS.ROW_DELETE_SUCCESS, onDeleteRowSuccess);
      windowRef.removeEventListener('focus', onFocus);
    };
  }, [updateRecordPage]);

  /**
   * if all related tables are empty, hide the ToC
   * check when the related section spinner is hidden meaning the requests have all finished
   */
  useEffect(() => {
    if (showEmptySections) return;
    if (!showRelatedSectionSpinner) {
      const queryParam = getQueryParam(initialHref, "scrollTo");
      // return if no query parameter, nothing to scroll to
      if (queryParam) scrollToSection(queryParam);

      // TODO: recordsetState soemtimes isn't updated until after the below is called, even with a 500ms delay
      // setTimeout(() => {
      //   let rm, hasRelatedContent = false;
      //   for (let i = 0; i < columnModels.length; i++) {
      //     rm = columnModels[i].relatedModel;
      //     if (rm && rm.recordsetState.page?.length > 0) {
      //       hasRelatedContent = true;
      //       break;
      //     }
      //   }

      //   if (!hasRelatedContent) {
      //     for (let j = 0; j < relatedModels.length; j++) {
      //       rm = relatedModels[j];
      //       if (rm.recordsetState.page?.length > 0) {
      //         hasRelatedContent = true;
      //         break;
      //       }
      //     }
      //   }

      //   setShowPanel(hasRelatedContent);
      // }, 500);
    }
  }, [showRelatedSectionSpinner]);

  /**
     * On window focus, remove request and update the page
     */
  const onFocus = () => {
    const uc = LogReloadCauses;

    // where in the page has been changed
    const changedContainers: any = [];

    const addToChangedContainers = (details: any, causeDefs: string[]) => {
      changedContainers.push({
        ...details,
        cause: causeDefs[details.isInline ? 1 : 0],
      });
    };

    //find the completed edit requests
    for (const id in editRecordRequests.current) {
      if (editRecordRequests.current[id].completed) {
        addToChangedContainers(editRecordRequests.current[id], [uc.RELATED_UPDATE, uc.RELATED_INLINE_UPDATE]);
        delete editRecordRequests.current[id];
      }
    }

    // find the completed create requests
    for (const id in addRecordRequests.current) {
      if (CookieService.checkIfCookieExists(id)) { // add request has been completed
        addToChangedContainers(addRecordRequests.current[id], [uc.RELATED_CREATE, uc.RELATED_INLINE_CREATE]);

        // remove cookie and request
        CookieService.deleteCookie(id);
        delete addRecordRequests.current[id];
      }
    }

    // if something has changed
    if (changedContainers.length > 0) {
      updateRecordPage(true, '', changedContainers);
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
    addRecordRequests.current[id] = containerDetails;
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
   * The callback that recoredit app expects and calls after edit is done.
   */
  windowRef.updated = (id: string) => {
    if (!!editRecordRequests.current[id]) {
      editRecordRequests.current[id].completed = true;
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
  const canDelete = tuple.canDelete && modifyRecord && ConfigService.chaiseConfig.deleteRecord === true;

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
          message: confirmMessage
        });

      } else {
        onDeleteConfirmation();
      }
    })
    $log.debug('deleting tuple!');

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
    reference.delete(logObj).then(function deleteSuccess() {
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
  const hidePanel = () => {
    setShowPanel(!showPanel);
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

        // TODO shouldn't we use logRecordCleintAction here?
        // TODO should technically be based on the latest reference
        // log the action
        // LogService.logClientAction({
        //   action: LogService.getActionString(action, relatedModel.recordsetProps.logInfo.logStackPath),
        //   stack: relatedModel.recordsetProps.logInfo.logStack
        // }, relatedModel.initialReference.defaultLogInfo);

        return isOpen ? [...currState.slice(0, currIndex), ...currState.slice(currIndex + 1)] : currState.concat(relatedModel.index.toString());
      });
    }
  };

  const scrollMainContainerToTop = () => {
    if (!mainContainer.current) return;

    mainContainer.current.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // sectionId is displayname.value
  const scrollToSection = (displayname: string) => {
    if (!mainContainer.current) return;

    const relatedObj = determineScrollElement(displayname);
    if (!relatedObj) return;

    let delayScroll = 0;
    // if not inline and the related table is closed, add it to the set of open related sections to be opened
    if (!relatedObj.rtm.isInline && openRelatedSections.indexOf(relatedObj.rtm.index.toString()) === -1) {
      delayScroll = 200;
      setOpenRelatedSections((currState: string[]) => {
        // const action = LogActions.OPEN;

        return currState.concat(relatedObj.rtm.index.toString());
      });
    }

    const element = relatedObj.element as HTMLElement;
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
    }, delayScroll)
  }

  const determineScrollElement = (displayname: string): { element: Element, rtm: RecordRelatedModel } | false => {
    let matchingRtm;
    // id enocde query param    
    const htmlId = makeSafeIdAttr(displayname);
    // "entity-" is used for record entity section
    let el = document.querySelector('#entity-' + htmlId);

    if (el) {
      // if in entity section, grab parent
      el = el.parentElement;

      matchingRtm = columnModels.filter((cm) => {
        return cm.column.displayname.value == displayname;
      })[0].relatedModel;
    } else {
      // "rt-heading-" is used for related table section
      el = document.querySelector('#rt-heading-' + htmlId);

      matchingRtm = relatedModels.filter(function (rm) {
        return rm.initialReference.displayname.value == displayname;
      })[0];
    }

    if (!el || !matchingRtm) return false;

    return {
      element: el,
      rtm: matchingRtm
    }
  }

  // Function to render the summary section of the table of contents
  // Iterates over the columnModels for any with a relatedModel
  const renderSummaryTOC = () => {
    return columnModels.map((cm: RecordColumnModel, index: number) => {
      // if the column is not an inline related table, it should not be shown in ToC
      if (!canShowInlineRelated(cm, showEmptySections)) return;

      // canShowInlineRelated checks for relatedModel, so this should always be defined if this code is reached
      const relatedPage = cm.relatedModel?.recordsetState.page;
      const displayname = cm.column.displayname;

      let tooltip = <div>Scroll to the <code>{displayname.value}</code> section (containing {relatedPage.length}{relatedPage.hasNext && ' or more'} record{relatedPage.length != 1 && 's'})</div>

      return (
        <li
          key={`toc-inline-heading-${cm.index}`}
          id={'recordSidePan-heading-' + index}
          className='toc-heading toc-inline-heading'
          onClick={() => { scrollToSection(displayname.value) }}
        >
          <ChaiseTooltip
            placement='right'
            tooltip={tooltip}
          >
            <a className={relatedPage.length === 0 ? 'empty-toc-heading' : ''}>
              <DisplayValue value={displayname} />
              <span> ({relatedPage.length}{relatedPage.hasNext ? '+' : ''})</span>
            </a>
          </ChaiseTooltip>
        </li>
      )
    });
  };

  const renderRelatedTOC = () => {
    return relatedModels.map((rm: RecordRelatedModel, index: number) => {
      if (!canShowRelated(rm, showEmptySections)) return;

      const relatedPage = rm.recordsetState.page;
      const displayname = rm.initialReference.displayname;

      let tooltip = <div>Scroll to the <code>{displayname.value}</code> section (containing {relatedPage.length}{relatedPage.hasNext && ' or more'} record{relatedPage.length != 1 && 's'})</div>
      return (
        <li
          key={`toc-heading-${rm.index}`}
          id={'recordSidePan-heading-' + index}
          className='toc-heading'
          onClick={() => { scrollToSection(displayname.value) }}
        >
          <ChaiseTooltip
            placement='right'
            tooltip={tooltip}
          >
            <a className={relatedPage.length === 0 ? 'empty-toc-heading' : ''}>
              <DisplayValue value={displayname} />
              <span> ({relatedPage.length}{relatedPage.hasNext ? '+' : ''})</span>
            </a>
          </ChaiseTooltip>
        </li>
      )
    })
  };

  // Function to render the full table of contents
  const renderTableOfContents = (leftRef: React.RefObject<HTMLDivElement>) => (
    <div
      id='record-side-pan'
      className={`side-panel-resizable record-toc resizable ${showPanel ? 'open-panel' : 'close-panel'
        }`}
      ref={leftRef}
    >
      <div className='side-panel-container'>
        <div className='columns-container'>
          <ul>
            <li id='main-to-top' className='toc-heading' onClick={scrollMainContainerToTop}>
              <ChaiseTooltip placement='right' tooltip='Click to go to top of page'><a>Summary</a></ChaiseTooltip>
            </li>
            {renderSummaryTOC()}
            {renderRelatedTOC()}
            {errors.length === 0 && showRelatedSectionSpinner &&
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

  const renderMainContainer = () => (
    <div className='main-container dynamic-padding' ref={mainContainer}>
      <div className='main-body'>
        {/* TODO there's no reason to have these two comps, needs discussion */}
        <RecordMainSection />
        {/* related section */}
        {relatedModels.length > 0 &&
          <div className='related-section-container'>
            <Accordion className='panel-group' activeKey={openRelatedSections} alwaysOpen >
              {relatedModels.map((rm: RecordRelatedModel) => (
                <Accordion.Item
                  key={`record-related-${rm.index}`}
                  eventKey={rm.index + ''}
                  className={`related-table-accordion panel ${!canShowRelated(rm, showEmptySections) ? CLASS_NAMES.HIDDEN : ''}`}
                  id={`rt-heading-${makeSafeIdAttr(rm.initialReference.displayname.value)}`}
                  as='div'
                >
                  <Accordion.Button as='div' onClick={toggleRelatedSection(rm)} className='panel-heading'>
                    <RelatedTableHeader relatedModel={rm} />
                  </Accordion.Button>
                  <Accordion.Body>
                    <RelatedTable
                      relatedModel={rm}
                      tableContainerID={`rt-${makeSafeIdAttr(rm.initialReference.displayname.value)}`}
                    />
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </div>
        }
        {/* the related-spinner must be inside the main-body to ensure proper positioning */}
        {errors.length === 0 && showRelatedSectionSpinner &&
          <ChaiseSpinner className='related-spinner bottom-left-spinner' spinnerSize='sm' />
        }
        {showScrollToTopBtn &&
          <ChaiseTooltip placement='left' tooltip='Scroll to top'>
            <div className='chaise-btn chaise-btn-primary back-to-top-btn' onClick={scrollMainContainerToTop}>
              <i className='fa-solid fa-caret-up'></i>
            </div>
          </ChaiseTooltip>
        }
      </div>
      {initialized && !showRelatedSectionSpinner && <Footer />}
    </div>
  );

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
        <div className='delete-spinner-container'>
          <div className='delete-spinner-backdrop'></div>
          <ChaiseSpinner className='delete-spinner' message='Deleting...' />
        </div>
      }
      <div className='top-panel-container'>
        <Alerts />
        {/* TODO */}
        <div className='top-flex-panel'>
          <div
            className={`top-left-panel ${showPanel ? 'open-panel' : 'close-panel'
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
                    className='chaise-btn chaise-btn-tertiary'
                    onClick={hidePanel}
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
                  <button className='chaise-btn chaise-btn-primary' onClick={toggleShowEmptySections}>
                    <span className='chaise-btn-icon fa fa-th-list'></span>
                    <span>{showEmptySections ? 'Hide' : 'Show'} empty sections</span>
                  </button>
                </ChaiseTooltip>
                <Export reference={reference} disabled={false} />
                <ShareCiteButton title={'Share and Cite'} reference={reference} tuple={page.tuples[0]} citation={citation} />
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
                    />
                    <span>: </span>
                    <DisplayValue value={page.tuples[0].displayname} />
                    {(canCreate || canEdit || canDelete) &&
                      <div className='title-buttons record-action-btns-container'>
                        {/* create */}
                        <ChaiseTooltip
                          placement='bottom-start'
                          tooltip='Click here to create a record.'
                        >
                          <a
                            className={btnClasses + (!canCreate ? ' disabled' : '')}
                            href={reference.table.reference.unfilteredReference.contextualize.entryCreate.appLink}
                          >
                            <span className='chaise-btn-icon fa fa-plus'></span>
                            <span>Create</span>
                          </a>
                        </ChaiseTooltip>
                        {/* edit */}
                        <ChaiseTooltip
                          placement='bottom-start'
                          tooltip='Click here to create a copy of this record'
                        >
                          <a className={btnClasses + (!canCreate ? ' disabled' : '')} href={copyRecord()}>
                            <span className='chaise-btn-icon  fa fa-clipboard'></span>
                            <span>Copy</span>
                          </a>
                        </ChaiseTooltip>
                        {/* copy */}
                        <ChaiseTooltip
                          placement='bottom-start'
                          tooltip='Click here to edit this record'
                        >
                          <a
                            className={btnClasses + (!canEdit ? ' disabled' : '')}
                            href={reference.contextualize.entryEdit.appLink}
                          >
                            <span className='chaise-btn-icon  fa fa-pencil'></span>
                            <span>Edit</span>
                          </a>
                        </ChaiseTooltip>
                        {/* delete */}
                        <ChaiseTooltip
                          placement='bottom-start'
                          tooltip='Click here to delete this record'
                        >
                          <button className={btnClasses + (!canDelete ? ' disabled' : '')} onClick={deleteRecord}>
                            <span className='chaise-btn-icon fa fa-trash-alt'></span>
                            <span>Delete</span>
                          </button>
                        </ChaiseTooltip>
                      </div>
                    }
                  </h1>
                  {!showPanel && (
                    <ChaiseTooltip
                      placement='top'
                      tooltip='Click to show table of contents'
                    >
                      <div
                        onClick={hidePanel}
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
        initialWidth={21}
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
        />
      }
    </div>
  );
};

export default Record;
