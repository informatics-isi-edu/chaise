// models
import { RecordRelatedModel } from '@isrd-isi-edu/chaise/src/models/record';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utils
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
 *  - related table has data.
 *  - related table's tableMarkdownContent is not empty string
 */
export function allowCustomModeRelated(relatedModel: RecordRelatedModel): boolean {
  return relatedModel.initialReference.display.type === 'markdown' && relatedModel.recordsetState.page != null &&
    relatedModel.recordsetState.page.length > 0 && relatedModel.tableMarkdownContentInitialized && relatedModel.tableMarkdownContent !== '';
}

/**
 * whether we should display the custom mode or not
 */
export function displayCustomModeRelated(relatedModel: RecordRelatedModel): boolean {
  return !relatedModel.isTableDisplay && allowCustomModeRelated(relatedModel);
}
