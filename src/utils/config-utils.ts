import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utils
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

export type SavedQuery = {
  defaultNameLimits: {
    facetChoiceLimit: number;
    facetTextLimit: number;
    totalTextLimit: number;
  };
  defaultDescriptionLimits: {
    facetTextLimit: number;
    totalTextLimit: number;
  };
  ermrestTablePath: string | null;
  ermrestAGPath: string | null;
  mapping: {
    catalog?: string;
    schema?: string;
    table?: string;
    columnNameMapping?: {
      catalog: string;
      description: string;
      encodedFacets: string;
      facets: string;
      queryId: string;
      queryName: string;
      schemaName: string;
      tableName: string;
      userId: string;
    };
  };
  rid: string | null;
  showUI: boolean;
  updated: boolean;
  savedQueryReference?: any;
}

/**
* Returns true if the object passed is valid for the terms and conditions feature
* @params {Object} obj - the termaAndConditions object from chaise-config
* @return {boolean} boolean - value to use the terms and conditions config requiring a specific globus group for access
*
* termsAndConditionsConfig: {
*     "groupId": "https://auth.globus.org/123a4bcd-ef5a-67bc-8912-d34e5fa67b89",
*     "joinUrl": "https://app.globus.org/groups/123a4bcd-ef5a-67bc-8912-d34e5fa67b89/join",
*     "groupName": "Globus group name"
* },
*/
export function validateTermsAndConditionsConfig(obj: any) {
  if (!obj || typeof obj !== 'object') return false;
  const tacConfig = ConfigService.chaiseConfig.termsAndConditionsConfig;

  // all 3 properties must be defined for this to function, if not the old login app will be used
  return (isStringAndNotEmpty(tacConfig.groupId) && isStringAndNotEmpty(tacConfig.joinUrl) && isStringAndNotEmpty(tacConfig.groupName));
}

// The properties defined in the 
function validateColumnNameMapping(columnMap: any) {
  const properties = ['catalog', 'description', 'encodedFacets', 'facets', 'queryId', 'queryName', 'schemaName', 'tableName', 'userId'];

  let isValid = true;
  for (let i=0; i < properties.length; i++) {
    const colName = columnMap[properties[i]];
    if (!colName || !isStringAndNotEmpty(colName)) {
      isValid = false;
      break;
    }
  }
  return isValid;
}

export function initializeSavingQueries(reference: any, queryParams: any) {
  const chaiseConfig = windowRef.chaiseConfig;
  // initalize to null as if there is no saved query table
  // savedQuery object should be defined with showUI true || false for UI purposes
  const savedQuery: SavedQuery = {
    // default limits to apply when generating a default name
    defaultNameLimits: {
      facetChoiceLimit: 5,
      facetTextLimit: 60,
      totalTextLimit: 300
    },
    defaultDescriptionLimits: {
      facetTextLimit: 600,
      // totalTextLimit: 3000
      totalTextLimit: 1000
    },
    ermrestTablePath: null,
    ermrestAGPath: null,
    mapping: {},
    rid: null,
    showUI: Boolean(reference.display.showSavedQuery),
    updated: true
  }

  // NOTE: if this is not set, saved query UI should be turned off
  if (chaiseConfig?.savedQueryConfig && typeof chaiseConfig.savedQueryConfig.storageTable === 'object') {
    const mapping = savedQuery.mapping = chaiseConfig.savedQueryConfig.storageTable;
    // limits for when to use a modified simpler syntax for the default name value
    // set the 3 threshold properties: facetChoiceLimit, facetTextLimit, totalTextLimit
    const limits = chaiseConfig.savedQueryConfig.defaultName || {};
    if (!isNaN(limits.facetChoiceLimit)) savedQuery.defaultNameLimits.facetChoiceLimit = limits.facetChoiceLimit;
    if (!isNaN(limits.facetTextLimit)) savedQuery.defaultNameLimits.facetTextLimit = limits.facetTextLimit;
    if (!isNaN(limits.totalTextLimit)) savedQuery.defaultNameLimits.totalTextLimit = limits.totalTextLimit;

    const validMapping = isStringAndNotEmpty(mapping.catalog) && isStringAndNotEmpty(mapping.schema) && isStringAndNotEmpty(mapping.table);

    // validate all expected defined column names are in the config
    const validColumnMapping = validateColumnNameMapping(mapping.columnNameMapping);

    // match ermrestUri with the savedQuery.mapping to verify if we are looking at saved query recordset page
    if (validMapping && validColumnMapping) {
      savedQuery.ermrestTablePath = '/ermrest/catalog/' + mapping.catalog + '/entity/' + mapping.schema + ':' + mapping.table
      savedQuery.ermrestAGPath = '/ermrest/catalog/' + mapping.catalog + '/attributegroup/' + mapping.schema + ':' + mapping.table

      // should only be set if mapping is valid as well since we can't update the last_execution_time without a valid mapping
      if (queryParams && queryParams.savedQueryRid) {
        savedQuery.rid = queryParams.savedQueryRid;
        savedQuery.updated = false; // initialized here to track that the query's last execution time has been updated
      }
    } else {
      // if mapping is invalid, the config is ill-defined and the feature will be turned off
      savedQuery.showUI = false;
    }
  } else {
    // if storage table is not defined, the config is ill-defined and the feature will be turned off
    savedQuery.showUI = false;
  }

  return savedQuery;
}
