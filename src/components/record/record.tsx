import '@isrd-isi-edu/chaise/src/assets/scss/_record.scss';

// components
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import Export from '@isrd-isi-edu/chaise/src/components/export';
import Footer from '@isrd-isi-edu/chaise/src/components/footer';
import RecordMainSection from '@isrd-isi-edu/chaise/src/components/record/record-main-section';
import RecordRelatedSection from '@isrd-isi-edu/chaise/src/components/record/record-related-section';
import SplitView from '@isrd-isi-edu/chaise/src/components/split-view';
import Title from '@isrd-isi-edu/chaise/src/components/title';

// hooks
import { useEffect, useLayoutEffect, useState } from 'react';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useRecord from '@isrd-isi-edu/chaise/src/hooks/record';

// models
import { LogActions, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';

// providers
import AlertsProvider from '@isrd-isi-edu/chaise/src/providers/alerts';
import RecordProvider from '@isrd-isi-edu/chaise/src/providers/record';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utilities
import { attachContainerHeightSensors } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { getDisplaynameInnerText } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';

export type RecordProps = {
  /**
   * The parent container that recordset will be part of
   * (used for scrollbar logic)
   */
  parentContainer?: HTMLElement;
  reference: any;
};

const Record = ({
  parentContainer = document.querySelector('#chaise-app-root') as HTMLElement,
  reference
}: RecordProps): JSX.Element => {
  return (
    <AlertsProvider>
      <RecordProvider reference={reference}>
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
  // const { validateSessionBeforeMutation } = useAuthn();
  const { dispatchError, errors } = useError();
  const { page, readMainEntity, reference, initialized } = useRecord();
  // TODO: add getLogAction and getLogStack
  // const { page, readMainEntity, reference, initialized, getLogAction, getLogStack } = useRecord();

  /**
   * State variable to show or hide side panel
   */
  const [showPanel, setShowPanel] = useState<boolean>(true);
  const [canCreate, setCanCreate] = useState<boolean>(false);
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [canDelete, setCanDelete] = useState<boolean>(false);

  // initialize the page
  useEffect(() => {
    readMainEntity().then((p: any) => {
      // send string to prepend to "headTitle" format: <table-name>: <row-name>
      const title = `${getDisplaynameInnerText(reference.displayname)}: ${getDisplaynameInnerText(p.tuples[0].displayname)}`;
      updateHeadTitle(title);
    }).catch((error: any) => {
      dispatchError({ error });
    });
  }, []);

  useEffect(() => {
    if (!reference) return;
    const modifyRecord = ConfigService.chaiseConfig.editRecord === false ? false : true;
    setCanCreate(reference.canCreate && modifyRecord);

    if (!page || !page.tuples[0]) return;
    let tuple = page.tuples[0];
    setCanEdit(tuple.canUpdate && modifyRecord);

    const showDeleteButton = ConfigService.chaiseConfig.deleteRecord === true ? true : false;
    setCanDelete(tuple.canDelete && modifyRecord && showDeleteButton);
  }, [page, reference]);

  // properly set scrollable section height
  useLayoutEffect(() => {
    if (!initialized) return;
    const resizeSensors = attachContainerHeightSensors();

    return () => {
      resizeSensors?.forEach((rs) => rs.detach());
    }
  }, [initialized]);

  // TODO does this make sense?
  // we're currently showing the header buttons while loading
  // but I don't see the point and I think not showing anything makes more sense
  {/* TODO spinner was here with this: (!displayReady || showSpinner) && !error */ }
  if (!page) {
    if (errors.length > 0) {
      return <></>;
    }
    return <ChaiseSpinner />;
  }

  // function instead of variable so the link is updated after the app loads instead of being captured on page load
  // no need to create as a useState variable either
  const createRecord = () => reference.table.reference.unfilteredReference.contextualize.entryCreate.appLink;

  const editRecord = () => reference.contextualize.entryEdit.appLink;

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

  // TODO: refactor implementation from table-row to another component for delete
  const deleteRecord = () => {
    // validateSessionBeforeMutation(() => {
    //   if (ConfigService.chaiseConfig.confirmDelete === undefined || ConfigService.chaiseConfig.confirmDelete) {
    //     LogService.logClientAction({
    //       action: getLogAction(LogActions.DELETE_INTEND, LogStackPaths.ENTITY),
    //       stack: getLogStack(LogService.getStackNode(LogStackTypes.ENTITY, reference.table, reference.filterLogInfo))
    //     }, reference.defaultLogInfo);

    //     const confirmMessage: JSX.Element = (
    //       <>
    //         Are you sure you want to delete <code><DisplayValue value={reference.displayname}></DisplayValue></code>
    //         <span>: </span>
    //         <code><DisplayValue value={page.tuples[0].displayname}></DisplayValue></code>?
    //       </>
    //     );

    //     setShowDeleteConfirmationModal({
    //       buttonLabel: isUnlink ? 'Unlink' : 'Delete',
    //       onConfirm: () => { onDeleteUnlinkConfirmation(reference, isRelated, isUnlink) },
    //       onCancel: () => {
    //         setShowDeleteConfirmationModal(null);
    //         const actionVerb = isUnlink ? LogActions.UNLINK_CANCEL : LogActions.DELETE_CANCEL
    //         LogService.logClientAction({
    //           action: getRowLogAction(actionVerb),
    //           stack: logStack
    //         }, reference.defaultLogInfo);
    //       },
    //       message: confirmMessage
    //     });

    //   } else {
    //     onDeleteUnlinkConfirmation(reference, isRelated, isUnlink);
    //   }
    // })
    // $log.debug('deleting tuple!');

    return;
  }

  /**
   * function to change state to show or hide side panel
   */
  const hidePanel = () => {
    setShowPanel(!showPanel);
  };

  const renderTableOfContents = (leftRef: React.RefObject<HTMLDivElement>) => (
    <div
      id='record-side-pan'
      className={`side-panel-resizable record-toc resizable ${showPanel ? 'open-panel' : 'close-panel'
        }`}
      ref={leftRef}
    >
      {/* TODO table of contents */}
      <div className='side-panel-container'>
        <div className='columns-container'>
          Table Content Goes here
        </div>
      </div>

    </div>
  );

  const renderMainContainer = () => (
    <div className='main-container dynamic-padding'>
      <div className='main-body'>
        {/* TODO there's no reason to have these two comps, needs discussion */}
        <RecordMainSection />
        <RecordRelatedSection />
      </div>
      <Footer />
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
                  <div
                    className='chaise-btn chaise-btn-tertiary'
                    onClick={hidePanel}
                  >
                    <span className='record-app-action-icon chaise-icon chaise-sidebar-close'></span>
                    Hide panel
                  </div>
                </ChaiseTooltip>
              </div>
            </div>
          </div>
          <div className='top-right-panel'>
            <div className='page-action-btns'>
              <div className='float-right'>
                <ChaiseTooltip
                  placement='bottom-start'
                  tooltip='Click here to show empty related sections too.'
                >
                  <div className='chaise-btn chaise-btn-primary'>
                    <span className='record-app-action-icon  fa fa-th-list'></span>
                    Show empty sections
                  </div>
                </ChaiseTooltip>
                <Export reference={reference} disabled={false} />
                <ChaiseTooltip
                  placement='bottom-start'
                  tooltip='Click here to show the share dialog.'
                >
                  <div className='chaise-btn chaise-btn-primary'>
                    <span className='record-app-action-icon  fa fa-share-square'></span>
                    Share and cite
                  </div>
                </ChaiseTooltip>
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

                    {(canCreate || canEdit || canDelete) ?
                      <div className='title-buttons record-action-btns-container'>
                        <ChaiseTooltip
                          placement='bottom-start'
                          tooltip='Click here to create a record.'
                        >
                          <a className={btnClasses + (!canCreate ? ' disabled' : '')} href={createRecord()}>
                            <span className='record-app-action-icon fa fa-plus'></span>
                            Create
                          </a>
                        </ChaiseTooltip>
                        <ChaiseTooltip
                          placement='bottom-start'
                          tooltip='Click here to create a copy of this record'
                        >
                          <a className={btnClasses + (!canCreate ? ' disabled' : '')} href={copyRecord()}>
                            <span className='record-app-action-icon  fa fa-clipboard'></span>
                            Copy
                          </a>
                        </ChaiseTooltip>
                        <ChaiseTooltip
                          placement='bottom-start'
                          tooltip='Click here to edit this record'
                        >
                          <a className={btnClasses + (!canEdit ? ' disabled' : '')} href={editRecord()}>
                            <span className='record-app-action-icon  fa fa-pencil'></span>
                            Edit
                          </a>
                        </ChaiseTooltip>
                        <ChaiseTooltip
                          placement='bottom-start'
                          tooltip='Click here to delete this record'
                        >
                          <button className={btnClasses + (!canDelete ? ' disabled' : '')} onClick={deleteRecord}>
                            <span className='record-app-action-icon fa fa-trash-alt'></span>
                            Delete
                          </button>
                        </ChaiseTooltip>
                      </div>
                      : <></>}

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
                        <span className='record-app-action-icon chaise-icon chaise-sidebar-open'></span>
                        Show side panel
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
    </div>
  );
};

export default Record;
