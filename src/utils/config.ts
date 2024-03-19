
// models
import { CustomError } from '@isrd-isi-edu/chaise/src/models/errors';

// utils
import { isObjectAndNotNull, isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { getQueryParam } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';


const throwCustomError = (header: string, message: string) => {
  throw new CustomError(header, message);
}

/**
 * return the config object based on the query parameter in the URL.
 *
 * Will throw an error if the config was missing or had issues.
 */
export const getConfigObject = (configObj: any): any => {
  const errorHeader = 'Invalid Config';
  const defaultConfig = '*';

  // if the urls is defined like `?config` or `?config=`, getQueryParam returns `true`
  let configName = getQueryParam(windowRef.location.href, 'config');
  if (!isStringAndNotEmpty(configName) || configName === 'true') {
    configName = defaultConfig;
  }

  if (!isObjectAndNotNull(configObj)) {
    throwCustomError(errorHeader, 'Config is not defined.');
  }

  if (!(configName in configObj)) {
    throwCustomError(errorHeader, 'Invalid config parameter in the url');
  }

  /**
   * This will recursively go through "aliases" trying to fetch a config object
   * will continue to look for an object if one alias points to another alias
   * if config name ends in an invalid or undefined config, the default config is used
   *   - default config would be named '*' in the document
   */
  const recursiveConfigName = (name: string): string => {
    const plotConfig = configObj[name];
    if (typeof plotConfig === 'string') {
      return recursiveConfigName(plotConfig);
    } else if (name !== defaultConfig && !isObjectAndNotNull(configObj[name])){
      // if the alias doesn't match any known configs, check for `default config` to show
      // make sure we don't recursively keep trying to fetch the default config
      return recursiveConfigName(defaultConfig);
    } else {
      return name;
    }
  }

  configName = recursiveConfigName(configName);
  if (!isObjectAndNotNull(configObj[configName])) {
    throwCustomError(errorHeader, 'Defined config object is not valid.');
  }

  return configObj[configName];
}
