import { MouseEvent, useState } from 'react';

// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import RecordsetModal from '@isrd-isi-edu/chaise/src/components/modals/recordset-modal';

// hooks
import useRecord from '@isrd-isi-edu/chaise/src/hooks/record';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { RecordRelatedModel } from '@isrd-isi-edu/chaise/src/models/record';
import { LogActions, LogParentActions, LogReloadCauses } from '@isrd-isi-edu/chaise/src/models/log';
import { RecordsetConfig, RecordsetDisplayMode, RecordsetProps, RecordsetSelectMode, SelectedRow } from '@isrd-isi-edu/chaise/src/models/recordset';
import { LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';

// providers
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { addQueryParamsToURL } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { allowCustomModeRelated, displayCustomModeRelated, getPrefillCookieObject } from '@isrd-isi-edu/chaise/src/utils/record-utils';
import { RECORDSET_DEAFULT_PAGE_SIZE } from '@isrd-isi-edu/chaise/src/utils/constants';
import Q from 'q';

type RelatedTableActionsProps = {
  relatedModel: RecordRelatedModel
}

const RelatedTableActions = ({
  relatedModel
}: RelatedTableActionsProps): JSX.Element => {

  const {
    reference: recordReference, page: recordPage,
    toggleRelatedDisplayMode, updateRecordPage,
    getRecordLogStack
  } = useRecord();

  const { validateSessionBeforeMutation } = useAuthn();
  const { addAlert } = useAlert();
  const { dispatchError  } = useError();

  const [addPureBinaryModalProps, setAddPureBinaryModalProps] = useState<RecordsetProps | null>(null);
  const [submitPureBinaryCB, setAddPureBinarySubmitCB] = useState<((selectedRows: SelectedRow[]) => void) | null>(null);
  const [showPureBinarySpinner, setShowPureBinarySpinner] = useState(false);

  const usedRef = relatedModel.initialReference;

  /**
   * this is to avoid the accordion header to recieve the click
   */
  const onExplore = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
  };

  const onToggleDisplayMode = (e: MouseEvent<HTMLElement>) => {
    // this is to avoid the accordion header to recieve the click
    e.stopPropagation();
    toggleRelatedDisplayMode(relatedModel.index, relatedModel.isInline);
  }

  const onCreate = (e: MouseEvent<HTMLElement>) => {
    // this is to avoid the accordion header to recieve the click
    e.stopPropagation();

    if (relatedModel.isPureBinary) {
      openAddPureBinaryModal();
      return;
    }

    // TODO add related

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
        'source': col.name,
        'hidden': true,
        'not_null': true
      });
    });
    // if filter in source is based on the related table, then we would need to add it as a hidden custom filter here.
    let customFacets: any = [];
    if (domainRef.pseudoColumn && domainRef.pseudoColumn.filterProps && domainRef.pseudoColumn.filterProps.leafFilterString) {
      // NOTE should we display the filters or not?
      customFacets = { ermrest_path: domainRef.pseudoColumn.filterProps.leafFilterString, removable: false };
    }

    const modalReference = domainRef.unfilteredReference.addFacets(andFilters, customFacets).contextualize.compactSelectAssociationLink;

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
      { source: modalReference.compressedDataSource, entity: true, picker: 1 }
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
      page: any, pageLimit: number, logStack: any,
      logStackPath: string, requestCauses: any, reloadStartTime: any
    ) => {
      const defer = Q.defer();
      const disabledRows: any = [];

      let action = LogActions.LOAD, newStack = logStack;
      if (Array.isArray(requestCauses) && requestCauses.length > 0) {
        action = LogActions.RELOAD;
        newStack = LogService.addCausesToStack(logStack, requestCauses, reloadStartTime);
      }
      // using the service instead of the record one since this is called from the modal
      const logObj = {
        action: LogService.getActionString(action, logStackPath),
        stack: newStack
      };
      // fourth input: preserve the paging (read will remove the before if number of results is less than the limit)
      domainRef.setSamePaging(page).read(pageLimit, logObj, false, true).then(function (newPage: any) {
        newPage.tuples.forEach(function (newTuple: any) {
          const index = page.tuples.findIndex(function (tuple: any) {
            return tuple.uniqueId == newTuple.uniqueId;
          });
          if (index > -1) disabledRows.push(page.tuples[index]);
        });

        defer.resolve({ disabledRows: disabledRows, page: page });
      }).catch(function (err: any) {
        defer.reject(err);
      });

      return defer.promise;
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
          stack: logInfo.logStack
        };

        const createRef = derivedRef.unfilteredReference.contextualize.entryCreate;
        createRef.create(submissionRows, logObj).then(() => {
          setAddPureBinaryModalProps(null);
          // TODO better and more costum message
          addAlert('Your data has been submitted. Showing you the result set...', ChaiseAlertType.SUCCESS);

          // TODO properly send the container
          updateRecordPage(true, LogReloadCauses.RELATED_UPDATE);
        }).catch((error: any) => {
          // TODO ask josh about validateSession
          dispatchError({error: error, isDismissible: true});
        }).finally(() => setShowPureBinarySpinner(false));
      });
    }
    setAddPureBinarySubmitCB(() => submitCB);

    setAddPureBinaryModalProps({
      initialReference: modalReference,
      initialPageLimit: RECORDSET_DEAFULT_PAGE_SIZE,
      config: recordsetConfig,
      logInfo,
      getDisabledTuples,
      parentTuple: recordPage.tuples[0],
      parentReference: recordReference
    });
  };

  const closePureBinaryModal = () => {
    // TODO resume update record page
    setAddPureBinaryModalProps(null);
  };

  const onUnlink = (e: MouseEvent<HTMLElement>) => {
    // this is to avoid the accordion header to recieve the click
    e.stopPropagation();

    // TODO implement unlink p&b

    // TODO this is added for test purposes and should be removed
    updateRecordPage(true, LogReloadCauses.RELATED_UPDATE);
  };

  const mainTable = <code><DisplayValue value={recordReference.displayname}></DisplayValue></code>;
  const currentTable = <code><DisplayValue value={usedRef.displayname}></DisplayValue></code>;

  const exploreLink = addQueryParamsToURL(usedRef.appLink, {
    paction: LogParentActions.EXPLORE
  });

  const renderCustomModeBtn = () => {
    let tooltip: string | JSX.Element = '', icon = '', label = '';
    if (displayCustomModeRelated(relatedModel)) {
      icon = 'fas fa-table';
      if (relatedModel.canEdit) {
        tooltip = <span>Display edit controls for {currentTable} related to this {mainTable}.</span>;
        label = 'Edit mode';
      } else {
        tooltip = <span>Displayed related {currentTable} in tabular mode.</span>
        label = 'Table mode';
      }
    } else {
      icon = 'fa-solid fa-grip';
      tooltip = 'Switch back to the custom display mode';
      label = 'Custom mode';
    }

    return (
      <ChaiseTooltip
        placement='top'
        tooltip={tooltip}
      >
        <div className='chaise-btn chaise-btn-secondary toggle-display-link' onClick={onToggleDisplayMode}>
          <span className={`chaise-btn-icon ${icon}`}></span>
          <span>{label}</span>
        </div>
      </ChaiseTooltip>
    )
  };

  return (
    <>
      <div className='related-table-actions'>
        {relatedModel.canCreate &&
          <ChaiseTooltip
            placement='top'
            tooltip={<span>Connect {currentTable} records to this {mainTable}.</span>}
          >
            <div className='chaise-btn chaise-btn-secondary add-records-link' onClick={onCreate}>
              <span className='chaise-btn-icon fa-solid fa-plus'></span>
              <span>{relatedModel.isPureBinary ? 'Link' : 'Add'} records</span>
            </div>
          </ChaiseTooltip>
        }
        {relatedModel.isPureBinary && relatedModel.canDelete &&
          <ChaiseTooltip
            placement='top'
            tooltip={<span>Disconnect {currentTable} records from this {mainTable}.</span>}
          >
            <div className='chaise-btn chaise-btn-secondary unlink-records-link' onClick={onUnlink}>
              <span className='chaise-btn-icon fa-regular fa-circle-xmark'></span>
              <span>Unlink records</span>
            </div>
          </ChaiseTooltip>
        }
        {allowCustomModeRelated(relatedModel) && renderCustomModeBtn()}
        <ChaiseTooltip
          placement='top'
          tooltip={<span>Explore more {currentTable} records related to this {mainTable}.</span>}
        >
          <a className='chaise-btn chaise-btn-secondary more-results-link' href={exploreLink} onClick={onExplore}>
            <span className='chaise-btn-icon fa-solid fa-magnifying-glass'></span>
            <span>Explore</span>
          </a>
        </ChaiseTooltip>
      </div>
      {
        addPureBinaryModalProps && submitPureBinaryCB &&
        <RecordsetModal
          modalClassName='add-pure-and-binary-popup'
          recordsetProps={addPureBinaryModalProps}
          onSubmit={submitPureBinaryCB}
          showSubmitSpinner={showPureBinarySpinner}
          onClose={closePureBinaryModal}
        />
      }
    </>
  );
};

export default RelatedTableActions;
