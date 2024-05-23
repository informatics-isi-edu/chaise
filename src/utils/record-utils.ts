// models
import { Displayname } from '@isrd-isi-edu/chaise/src/models/displayname';
import { LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { RecordColumnModel, RecordRelatedModel } from '@isrd-isi-edu/chaise/src/models/record';
import { RecordsetDisplayMode, RecordsetSelectMode } from '@isrd-isi-edu/chaise/src/models/recordset';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { CLASS_NAMES, RELATED_TABLE_DEFAULT_PAGE_SIZE } from '@isrd-isi-edu/chaise/src/utils/constants';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { isObjectAndNotNull } from '@isrd-isi-edu/chaise/src/utils/type-utils';


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

  const fkr = relatedRef.derivedAssociationReference ? relatedRef.derivedAssociationReference.origFKR : relatedRef.origFKR;
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
  /**
   * TODO this is replicating the Angularjs behavior but we should consider the following:
   * - why do we need to check editRecord?
   * - why deleteRecord check is backwards?
   */
  if (ConfigService.chaiseConfig.editRecord === false || ConfigService.chaiseConfig.deleteRecord !== true) {
    return false;
  }

  if (isObjectAndNotNull(relatedRef.derivedAssociationReference)) {
    return relatedRef.derivedAssociationReference.canDelete;
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
 * Given a reference return the page limit that we should use
 */
export function getRelatedPageLimit(ref: any) {
  let initialPageLimit = ref.display.defaultPageSize;
  if (!initialPageLimit) {
    initialPageLimit = RELATED_TABLE_DEFAULT_PAGE_SIZE;
  }
  return initialPageLimit
}

/**
 * create a related record model
 * @param ref the refernce
 * @param index the index of the model in its list
 * @param isInline whether its inline or not
 * @param mainTuple the main tuple data
 */
export function generateRelatedRecordModel(ref: any, index: number, isInline: boolean, mainTuple: any, mainReference: any): RecordRelatedModel {
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
      initialPageLimit: getRelatedPageLimit(ref),
      config: {
        viewable: true,
        editable: true,
        deletable: true,
        sortable: true,
        selectMode: RecordsetSelectMode.NO_SELECT,
        showFaceting: false,
        disableFaceting: true,
        displayMode: isInline ? RecordsetDisplayMode.INLINE : RecordsetDisplayMode.RELATED,
        containerDetails: { isInline, index }
      },
      logInfo: {
        logStack: LogService.getStackObject(stackNode),
        logStackPath: LogService.getStackPath(null, isInline ? LogStackPaths.RELATED_INLINE : LogStackPaths.RELATED)
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

// NOTE this solutin won't work if we're going to have multiple record page instances together
let lastRenderedTableIndex = 0;
function allPreviousRelatedInitialized(relatedModel: RecordRelatedModel): boolean {
  if (!relatedModel.recordsetState.isInitialized || !relatedModel.tableMarkdownContentInitialized) {
    return false;
  }
  if (relatedModel.index === 0 || lastRenderedTableIndex === relatedModel.index - 1) {
    lastRenderedTableIndex = relatedModel.index;
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
export function canShowInlineRelated(columnModel: RecordColumnModel, showEmptySections: boolean): boolean {
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

/**
* Whether we can pre-fill the foreignkey value given origFKR as the foreignkey
* relationship between parent and related table.
*
* A foreignkey can only prefilled if it's a superset of the origFKR,
* and extra columns are not-null.
*
* By superset we mean that it must include all the columns of origFKR and
* the mapping must be exactly the same as origFKR. So for example if origFKR
* is T1(c1,c2) -> T2(v1,v2), the candidate foreignkey must have at least
* c1 and c2, and in its definition c1 must map to v1 and c2 must map to v2.
* It could also have any extra not-null columns.
*
* NOTE: Technically we can prefill all the foreignkeys that are supserset
* of "key" definitions that are in origFKR (assuming extra columns are not-null).
* For example assuming origFKR is T1(RID, c1) -> T2(RID, v1). A foreignkey definied as
* T1(RID, c2) -> T2(RID, v2) could be prefilled (assuming c2 is not-null).
* Since the RID alone is defining the one-to-one relation between the current
* row and the rows that we want to add for the related table.
* For now, we decided to not do this complete check and just stick with
* foreignkeys that are supserset of the origFKR.
*
*
* NOTE: recordedit will prefill all the foreignkeys that their constituent
* columns are prefilled. Therefore we don't need to send the foreignkey
* constraint names that must be prefilled and we can only send the "keys" attribute.
* Recordedit page can easily deduce the foreignkey values and rowname itself.
* Although in that case recordedit is going to create different references for
* each foreignkeys eventhough they are referring to the same row of data.
* So instead of multiple reads, we just have to read the parent record once
* and use that data for all the foreignkeys that can be prefilled.
* For this reason, I didn't remove passing of fkColumnNames for now.
*
* @param  {Object} fk foreignkey object that we want to test
* @param  {Object} origFKR the foreignkey from related table to main
* @return {boolean} whether it can be prefilled
*/
function canRelatedForeignKeyBePrefilled(fk: any, origFKR: any) {
  // origFKR will be added by default
  if (fk === origFKR) return true;

  // if fk is not from the same table, or is shorter
  if (fk.colset.length < origFKR.length) return false;
  if (fk.colset.columns[0].table.name !== origFKR.colset.columns[0].table.name) return false;

  let len = 0;
  for (let i = 0; i < fk.colset.length(); i++) {
    const fkCol = fk.colset.columns[i];
    const origCol = origFKR.colset.columns.find((col: any) => col.name === fkCol.name);

    // same column
    if (origCol) {
      // it must map to the same column
      if (fk.mapping.get(fkCol).name !== origFKR.mapping.get(origCol).name) {
        return false;
      }

      len++; // count number of columns that overlap
    } else if (fkCol.nullok) {
      return false;
    }
  }

  // the foriegnkey must be superset of the origFKR
  return len === origFKR.key.colset.length();
}

/**
 * Returns the object that should be used for adding related entities.
 * This value should be stored in the cookie, or can be used to find the
 * existing key values.
 *
 * @param ref the related reference
 * @param mainTuple the main tuple
 * @returns
 */
export function getPrefillCookieObject(ref: any, mainTuple: any): {
  /**
   * the displayed value in the form
   */
  rowname: Displayname,
  /**
   * used for reading the actual foreign key data
   */
  origUrl: string,
  /**
   * the foreignkey columns that should be prefileld
   */
  fkColumnNames: string[],
  /**
   * raw values of the foreign key columns
   */
  keys: { [key: string]: any }
} {

  let origTable;
  if (ref.derivedAssociationReference) {
    // add association relies on the object that this returns for
    // prefilling the data.
    origTable = ref.derivedAssociationReference.table;
  } else {
    // we should contextualize to make sure the same table is shown in create mode
    origTable = ref.contextualize.entryCreate.table;
  }

  const prefilledFks: string[] = [];
  const keys: { [key: string]: any } = {};
  origTable.foreignKeys.all().forEach((fk: any) => {
    if (!canRelatedForeignKeyBePrefilled(fk, ref.origFKR)) return;
    prefilledFks.push(fk.name);

    // add foreign key column data
    fk.mapping._from.forEach((fromColumn: any, i: number) => {
      keys[fromColumn.name] = mainTuple.data[fk.mapping._to[i].name];
    })
  });

  return {
    rowname: mainTuple.displayname,
    origUrl: mainTuple.reference.uri,
    fkColumnNames: prefilledFks,
    keys: keys
  };
}

export function determineScrollElement(displayname: string): Element | false {
  // id encode query param
  const htmlId = makeSafeIdAttr(displayname);
  // "entity-" is used for record entity section
  // we have to make sure the row is visible on the page
  let el = document.querySelector(`tr:not(.${CLASS_NAMES.HIDDEN}) #entity-${htmlId}`);

  if (el) {
    // if in entity section, grab parent
    el = el.parentElement;
  } else {
    // "rt-heading-" is used for related table section
    // we have to make sure the section is visible on the page
    el = document.querySelector(`#rt-heading-${htmlId}:not(.${CLASS_NAMES.HIDDEN})`);
  }

  if (!el) return false;

  return el;
}
