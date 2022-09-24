// models
import { RecordColumnModel, RecordRelatedModel } from '@isrd-isi-edu/chaise/src/models/record';
import { LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { RecordsetDisplayMode, RecordsetSelectMode } from '@isrd-isi-edu/chaise/src/models/recordset';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { isObjectAndNotNull } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { RELATED_TABLE_DEFAULT_PAGE_SIZE } from '@isrd-isi-edu/chaise/src/utils/constants';


/**
 * Whether we can create new instances of a related reference
 */
export function canCreateRelated(relatedRef: any): boolean {
  if (ConfigService.chaiseConfig.editRecord === false) {
    return false;
  }

  if (relatedRef.pseudoColumn) {
    // we are not supporting add if it's a free-form related table
    if (!relatedRef.pseudoColumn.isInboundForeignKey) {
      return false;
    }

    // if the related table has filter in its source
    if (relatedRef.pseudoColumn.isFiltered && (
      // don't allow add for one hop, if the filter is not on root)
      (!relatedRef.derivedAssociationReference && !relatedRef.pseudoColumn.filterProps.hasRootFilter) ||
      // don't allow add for pb that has filter in between
      relatedRef.pseudoColumn.filterProps.hasFilterInBetween
    )) {
      return false;
    }
  }

  const usedRef = (relatedRef.derivedAssociationReference ? relatedRef.derivedAssociationReference : relatedRef);
  return usedRef.canCreate;
}

/**
 * Whether we should disable the create button because of missing key values
 */
export function CanCreateDisabledRelated(relatedRef: any, mainTuple: any): boolean {
  // return false if user cannot even create
  if (!canCreateRelated(relatedRef)) {
    return false;
  }

  const fkr = relatedRef.derivedAssociationReference ? relatedRef.derivedAssociationReference.origFKR : relatedRef.origFKR
  // some checks for whether at least one element in the array passes the test implemented by the provided function
  // if one column test passes (key data is `null` or `undefined`), the key info is invalid
  return fkr.key.colset.columns.some((col: any) => {
    // check if necessary key material is set/valid
    // checks for equal to null or undefined
    return mainTuple.data[col.name] == null;
  });
}

/**
 * Whether we can edit instances of a related reference
 */
export function canEditRelated(relatedRef: any): boolean {
  return ConfigService.chaiseConfig.editRecord !== false && relatedRef.canUpdate;
}

/**
 * Whether we can delete instances of a related reference
 */
export function canDeleteRelated(relatedRef: any): boolean {
  if (ConfigService.chaiseConfig.editRecord === false) {
    return false;
  }

  if (isObjectAndNotNull(relatedRef.derivedAssociationReference)) {
    return relatedRef.derivedAssociationReference.canDelete
  }

  return relatedRef.canDelete;
}

/**
 * allow related table markdown display if all the following are true:
 *  - reference.display.type is `markdown`
 *  - related table's tableMarkdownContent is not empty string
 *  - in non-inline mode, the page must be non-empty
 */
export function allowCustomModeRelated(relatedModel: RecordRelatedModel): boolean {
  // the display type must be markdown
  if (relatedModel.initialReference.display.type !== 'markdown') {
    return false;
  }
  // the markdown content must be initialized
  if (relatedModel.recordsetState.page == null || !relatedModel.tableMarkdownContentInitialized || relatedModel.tableMarkdownContent === '') {
    return false;
  }
  // in non-inline mode, the page must be non-empty
  if (relatedModel.recordsetState.page.length === 0 && !relatedModel.isInline) {
    return false;
  }
  return true;
}

/**
 * whether we should display the custom mode or not
 */
export function displayCustomModeRelated(relatedModel: RecordRelatedModel): boolean {
  return !relatedModel.isTableDisplay && allowCustomModeRelated(relatedModel);
}

/**
 * create a related record model
 * @param ref the refernce
 * @param index the index of the model in its list
 * @param isInline whether its inline or not
 * @param mainTuple the main tuple data
 */
export function generateRelatedRecordModel(ref: any, index: number, isInline: boolean, mainTuple: any, mainReference: any): RecordRelatedModel {
  let initialPageLimit = ref.display.defaultPageSize;
  if (!initialPageLimit) {
    initialPageLimit = RELATED_TABLE_DEFAULT_PAGE_SIZE;
  }
  const stackNode = LogService.getStackNode(
    LogStackTypes.RELATED,
    ref.table,
    { source: ref.compressedDataSource, entity: true }
  );
  return {
    index,
    isInline,
    isPureBinary: isObjectAndNotNull(ref.derivedAssociationReference),
    initialReference: ref,
    isTableDisplay: ref.display.type === 'table',
    tableMarkdownContentInitialized: false,
    tableMarkdownContent: null,
    recordsetState: {
      page: null,
      isLoading: false,
      isInitialized: false,
      hasTimeoutError: false,
    },
    recordsetProps: {
      initialPageLimit,
      config: {
        viewable: true,
        editable: true,
        deletable: true,
        sortable: true,
        selectMode: RecordsetSelectMode.NO_SELECT,
        showFaceting: false,
        disableFaceting: true,
        displayMode: RecordsetDisplayMode.RELATED
      },
      logInfo: {
        logStack: LogService.getStackObject(stackNode),
        logStackPath: LogService.getStackPath(null, LogStackPaths.RELATED)
      },
      parentTuple: mainTuple,
      parentReference: mainReference
    },
    canCreate: canCreateRelated(ref),
    canCreateDisabled: CanCreateDisabledRelated(ref, mainTuple),
    canEdit: canEditRelated(ref),
    canDelete: canDeleteRelated(ref)
  }
}

let lastRenderedTableIndex = 0;
function allPreviousRelatedInitialized(relatedModel: RecordRelatedModel): boolean {
  if (!relatedModel.recordsetState.isInitialized || !relatedModel.tableMarkdownContentInitialized) {
    return false;
  }
  if (relatedModel.index === 0 || lastRenderedTableIndex === relatedModel.index - 1) {
    lastRenderedTableIndex = relatedModel.index;

    // don't show the loading if it's done
    // if (showRelatedSectionSpinnerRef.current && lastRenderedIndex.current === relatedModels.length - 1) {
    // setShowRelatedSectionSpinner(false);

    // TODO
    // defer autoscroll to next digest cycle to ensure aggregates and images were fetched and loaded for last RT
    // $timeout(autoScroll, 0);
    // }
    return true;
  }

  return false;
}

/**
 * Whether we can show the related table or not
 * TODO this should be refactored. we want to capture this value instead of computing it multiple times
 */
export function canShowRelated(relatedModel: RecordRelatedModel, showEmptySections: boolean): boolean {
  if (!allPreviousRelatedInitialized(relatedModel)) {
    return false;
  }

  // this flag signals that the returned data is non-empty and is returned
  const nonEmpty = relatedModel.recordsetState.page && relatedModel.recordsetState.page.length > 0;

  // if the filter is based on the main table and returns empty, the related table should be hidden
  const ref = relatedModel.initialReference;
  if (ref.pseudoColumn && ref.pseudoColumn.isFiltered && ref.pseudoColumn.filterProps.hasRootFilter) {
    return nonEmpty;
  }

  // display based on the state of the show/hide empty section button
  return (showEmptySections || nonEmpty);
}

/**
 * Whether we can show the inline value or not
 * TODO this should be refactored. we want to capture this value instead of computing it multiple times
 */
export function canShowInlineRelated (columnModel: RecordColumnModel, showEmptySections: boolean): boolean {
  if (!columnModel.relatedModel) return false;

  // this flag signals that the returned data is non-empty and is returned
  const nonEmpty = (columnModel.relatedModel.recordsetState.page && columnModel.relatedModel.recordsetState.page.length > 0 &&
    columnModel.relatedModel.tableMarkdownContentInitialized);

  // filter-in-source if the filter is based on the main table and returns empty, the related table should be hidden
  const ref = columnModel.relatedModel.initialReference;
  if (ref.pseudoColumn && ref.pseudoColumn.isFiltered && ref.pseudoColumn.filterProps.hasRootFilter) {
    return nonEmpty;
  }
  return (showEmptySections || nonEmpty);
}
