// services
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utils
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { isObjectAndNotNull } from '@isrd-isi-edu/chaise/src/utils/type-utils';

/**
 * Attach the JSON-LD to the page
 * @param reference
 * @param tuple
 * @param templateVariables
 * @returns
 */
export function attachGoogleDatasetJsonLd(reference: any, tuple: any, templateVariables: any) {
  // check the googleDatasetConfig global variable
  // that is defined in google-dataset-config.js file
  const catalogID = tuple.reference.location.catalogId, //getting the catalog-id without version
    schemaName = tuple.reference.table.schema.name,
    tableName = tuple.reference.table.name;
  if (typeof windowRef.googleDatasetConfig !== 'undefined') {
    const allowlist = getAllowListForCurrentHost(windowRef.googleDatasetConfig);

    // if config is defined, but there's no allowlist for this host
    if (!isObjectAndNotNull(allowlist)) {
      return;
    }

    if (isObjectAndNotNull(allowlist[catalogID]) &&
      isObjectAndNotNull(allowlist[catalogID][schemaName]) &&
      isObjectAndNotNull(allowlist[catalogID][schemaName][tableName])
    ) {
      const currConfig = allowlist[catalogID][schemaName][tableName];
      if (currConfig) {
        const columns = currConfig.columns;
        const allValuesArray = currConfig.values;

        if (!Array.isArray(columns) || !Array.isArray(allValuesArray)) {
          $log.warn('Invalid google metadata config!');
          return;
        }

        const matchFound = allValuesArray.some(function (v) {
          // make sure the value is an array
          const val = Array.isArray(v) ? v : [v];

          // make sure we have value for all the columns
          if (val.length !== columns.length) {
            $log.warn('Invalid google metadata config!');
            return false;
          }

          // all the values match
          return columns.every(function (col, index) {
            return tuple.data[col] == val[index];
          });

        });

        // didn't find a match: don't add json-ld
        if (!matchFound) {
          return;
        }
      }
    }
  }

  // use ermrestjs and attach to dom if annotation exists
  const metadata = reference.googleDatasetMetadata;
  if (isObjectAndNotNull(metadata)) {
    const computedMetadata = metadata.compute(tuple, templateVariables);
    if (isObjectAndNotNull(computedMetadata)) {
      const script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.textContent = JSON.stringify(computedMetadata);
      document.head.appendChild(script);
    }
  }
}

/**
 * Find the allow-list defined in the config for the current host
 * @param config
 * @returns
 */
function getAllowListForCurrentHost(config: any) {
  let result: any;
  if (Array.isArray(config.configRules)) {
    // loop through each config rule and look for a set that matches the current host
    config.configRules.forEach(function (ruleset: any) {
      // we have 1 host
      if (typeof ruleset.host === 'string') {
        const arr = [];
        arr.push(ruleset.host);
        ruleset.host = arr;
      }
      if (Array.isArray(ruleset.host)) {
        for (let i = 0; i < ruleset.host.length; i++) {
          // if there is a config rule for the current host, overwrite the properties defined
          // windowRef.location.host refers to the hostname and port (www.something.com:0000)
          // windowRef.location.hostname refers to just the hostname (www.something.com)
          if (ruleset.host[i] === windowRef.location.hostname && (ruleset.config && typeof ruleset.config === 'object')) {
            result = ruleset.config;
          }
        }
      }
    });
  }
  if (result && result.allowlist) {
    return result.allowlist;
  }
}
