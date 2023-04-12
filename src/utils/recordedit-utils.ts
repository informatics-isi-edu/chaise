/**
 * Utility functions related to recordedit and other create/update functionality
 */

// constants
import { dataFormats } from '@isrd-isi-edu/chaise/src/utils/constants';

// models
import { LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import {
  appModes, PrefillObject, RecordeditColumnModel,
  SELECT_ALL_INPUT_FORM_VALUE, TimestampOptions
} from '@isrd-isi-edu/chaise/src/models/recordedit'

// services
import { CookieService } from '@isrd-isi-edu/chaise/src/services/cookie';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utilities
import {
  formatDatetime, formatFloat, formatInt, getInputType,
  replaceNullOrUndefined, isDisabled
} from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { simpleDeepCopy } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

/**
 * Create a columnModel based on the given column that can be used in a recordedit form
 * @param column the column object from ermrestJS
 */
export function columnToColumnModel(column: any, queryParams?: any): RecordeditColumnModel {
  const isInputDisabled: boolean = isDisabled(column);
  const logStackNode = LogService.getStackNode(
    column.isForeignKey ? LogStackTypes.FOREIGN_KEY : LogStackTypes.COLUMN,
    column.table,
    { source: column.compressedDataSource, entity: column.isForeignKey }
  );
  const logStackPathChild = column.isForeignKey ? LogStackPaths.FOREIGN_KEY : LogStackPaths.COLUMN;

  let type;
  if (column.isAsset) {
    type = 'file'
  } else if (column.isForeignKey) {
    type = 'popup-select';
  } else {
    type = getInputType(column.type);
  }

  const prefillObj = getPrefillObject(queryParams);
  let isPrefilled = false, hasDomainFilter = false;
  if (prefillObj) {
    if (column.isForeignKey) {
      hasDomainFilter = column.hasDomainFilter;
      if (
        // whether the fk is already marked as prefilled
        prefillObj.fkColumnNames.indexOf(column.name) !== -1 ||
        // or all the columns have the prefilled value, and therefore it should be marked as prefilled.
        allForeignKeyColumnsPrefilled(column, prefillObj)
      ) {
        isPrefilled = true;
      }

    } else if (column.name in prefillObj.keys) {
      isPrefilled = true;
    }
  }

  return {
    column: column,
    isDisabled: isInputDisabled || isPrefilled,
    isRequired: !column.nullok && !isInputDisabled,
    inputType: type,
    logStackNode, // should not be used directly, take a look at getColumnModelLogStack
    logStackPathChild, // should not be used directly, use getColumnModelLogAction getting the action string
    hasDomainFilter
  };
}

/**
 * Given a columnModel and the parent model that it belongs to, return the log stack that should be used.
 * NOTES:
 *   - The parentModel might have a logStack object that is different from $rootScope,
 *     so this function will merge the columnModel.logStackNode with its parent object.
 *   - In some cases (currently viewer annotation form), the logStack that is present on the
 *     parentModel might change, so we cannot create the whole stack while creating the columnModel.
 *     So while creating columnModel I'm just creating the node and on run time the parentLogStack will be added.
 *
 */
export function getColumnModelLogStack(colModel: RecordeditColumnModel, parentStack: any) {
  return LogService.getStackObject(colModel.logStackNode, parentStack);
}

/**
* Given a columnModel and the parent model that is belogns to, returns the action string that should be used.
* Take a look at the Notes on getColumnModelLogStack function for more info
*/
export function getColumnModelLogAction(action: string, colModel: RecordeditColumnModel, parentLogStackPath: string | null) {
  const logStackPath = LogService.getStackPath(parentLogStackPath, colModel.logStackPathChild);
  return LogService.getActionString(action, logStackPath);
}

/**
 * sets value for a form by either clearing, or using the existing values
 * of another form.
 *
 * NOTE this function is immutating the given value
 * @param columnModel the column that we want to copy its value
 * @param values the FormContext.getValues()
 * @param foreignKeyData the foreign key data
 * @param destFormValue the from where the new data should go
 * @param srcFormValue if we're copying, the form that the data will be copied from.
 * @param clearValue signal that we want to clear the inputs.
 * @param skipFkColumns if the column is fk, we will copy/clear the raw values too. set this
 * flag to skip doing so.
 * @returns
 */
export function copyOrClearValue(
  columnModel: RecordeditColumnModel, values: any, foreignKeyData: any,
  destFormValue: number, srcFormValue?: number, clearValue?: boolean, skipFkColumns?: boolean
) {

  const column = columnModel.column;

  const srcKey = typeof srcFormValue === 'number' ? `${srcFormValue}-${column.name}` : null;

  const dstKey = `${destFormValue}-${column.name}`;


  if (clearValue) {
    values[dstKey] = '';
  } else if (srcKey) {
    values[dstKey] = replaceNullOrUndefined(values[srcKey], '');
  }

  if (columnModel.column.type.name.indexOf('timestamp') !== -1) {
    if (clearValue) {
      values[`${dstKey}-date`] = '';
      values[`${dstKey}-time`] = '';
    } else if (srcKey) {
      values[`${dstKey}-date`] = values[`${srcKey}-date`] || '';
      values[`${dstKey}-time`] = values[`${srcKey}-time`] || '';
    }
  }

  if (!skipFkColumns && columnModel.column.isForeignKey) {
    // copy the foreignKeyData (used for domain-filter support in foreignkey-field.tsx)
    if (clearValue) {
      foreignKeyData[dstKey] = {};
    } else if (srcKey) {
      foreignKeyData[dstKey] = simpleDeepCopy(foreignKeyData[srcKey]);
    }

    // the code above is just copying the displayed rowname for foreignkey
    // we still need to copy the raw values
    columnModel.column.foreignKey.colset.columns.forEach((col: any) => {
      let val;
      if (clearValue) {
        val = '';
      } else if (typeof srcFormValue === 'number') {
        val = values[`${srcFormValue}-${col.name}`];
      }
      if (val === null || val === undefined) return;
      values[`${destFormValue}-${col.name}`] = val;
    });
  }

  return values;
}

/**
 *
 * @returns
 * @param columnModels
 * @param forms
 * @param prefillQueryParam
 * --not implemented - used by viewer app @param initialValues
 */
export function populateCreateInitialValues(
  columnModels: RecordeditColumnModel[],
  forms: number[],
  queryParams?: any
) {
  const values: any = {};
  let shouldWaitForForeignKeyData = false;

  // get the prefilled values
  const prefillObj = getPrefillObject(queryParams);
  if (prefillObj) {
    shouldWaitForForeignKeyData = true;
  }

  // the data associated with the foreignkeys
  const foreignKeyData: any = {};

  // TODO: add initialValues to submissionRows (viewer feature)
  // is this even needed?
  // if (DataUtils.isObjectAndNotNull(initialValues)) {
  //     model.submissionRows[0] = initialValues;
  // }

  // populate defaults
  // NOTE: should only be 1 form
  forms.forEach((formValue: number, formIndex: number) => {
    for (let i = 0; i < columnModels.length; i++) {
      // default model initialiation is null
      let initialModelValue = null;
      const colModel = columnModels[i];
      const column = colModel.column;

      let defaultValue = column.default;

      // only want to set primitive values in the input fields so make sure it isn't a function, null, or undefined
      // TODO: use initialValue if defined (viewer app)
      // if (DataUtils.isObjectAndNotNull(initialValues) && initialValues[column.name] && !column.isForeignKey) {
      //     defaultValue = initialValues[column.name];
      // }

      // if it's a prefilled foreignkey, the value is going to be set by processPrefilledForeignKeys
      if (column.isForeignKey && prefillObj && prefillObj.fkColumnNames.indexOf(column.name) !== -1) {
        continue;
      }

      // if the column is prefilled, get the prefilled value instead of default
      if (prefillObj && column.name in prefillObj.keys) {
        defaultValue = prefillObj.keys[column.name];
      }

      const tsOptions: TimestampOptions = { outputMomentFormat: '' };

      let isTimestamp = false;
      switch (column.type.rootName) {
        // timestamp[tz] and asset columns have default model objects if their inputs are NOT disabled
        case 'timestamp':
          // this is only going to change the underlying raw value
          tsOptions.outputMomentFormat = dataFormats.timestamp;
          // formatDatetime takes care of column.default if null || undefined
          initialModelValue = formatDatetime(defaultValue, tsOptions);
          isTimestamp = true;
          break;
        case 'timestamptz':
          // this is only going to change the underlying raw value
          tsOptions.outputMomentFormat = dataFormats.datetime.return;
          // formatDatetime takes care of column.default if null || undefined
          initialModelValue = formatDatetime(defaultValue, tsOptions);
          isTimestamp = true;
          break;
        default:
          if (column.isAsset) {
            const metaObj: any = {};
            metaObj[column.name] = defaultValue;

            const metadata: any = column.getMetadata(metaObj);
            initialModelValue = {
              url: metadata.url || '',
              filename: metadata.filename || metadata.caption || '',
              filesize: metadata.byteCount || ''
            }

            /**
             * populate the metadata values based on the default value as well
             * (same thing is done in copy mode)
             */
            if (metadata.filename) {
              values[`${formValue}-${column.filenameColumn.name}`] = metadata.filename;
            }
            if (metadata.byteCount) {
              values[`${formValue}-${column.byteCountColumn.name}`] = metadata.byteCount;
            }
            if (metadata.md5) {
              values[`${formValue}-${column.md5.name}`] = metadata.md5;
            }
            if (metadata.sha256) {
              values[`${formValue}-${column.sha256.name}`] = metadata.sha256;
            }

          } else if (column.isForeignKey) {
            // if all the columns of the foreignkey are prefilled, use that instead of default
            const allPrefilled = prefillObj && allForeignKeyColumnsPrefilled(column.foreignKey, prefillObj);

            // TODO viewer feature
            // if all the columns of the foreignkey are initialized, use that instead of default
            // const allInitialized = column.foreignKey.colset.columns.every((col: any) => {
            //     return values[col.name] !== null;
            // });

            if (allPrefilled) {
              const defaultDisplay = column.getDefaultDisplay(prefillObj.keys);

              // display the initial value
              initialModelValue = defaultDisplay.rowname.value;
              // initialize foreignKey data
              foreignKeyData[`${formValue}-${column.name}`] = defaultDisplay.values;

              shouldWaitForForeignKeyData = true;

            } else if (defaultValue !== null) {
              initialModelValue = defaultValue;
              // initialize foreignKey data
              foreignKeyData[`${formValue}-${column.name}`] = column.defaultValues;

              shouldWaitForForeignKeyData = true;
            }
          } else {
            // all other column types
            if (defaultValue !== null) {
              initialModelValue = defaultValue;
            }
          }
      }

      if (isTimestamp) {
        values[`${formValue}-${column.name}`] = initialModelValue?.datetime || '';
        values[`${formValue}-${column.name}-date`] = initialModelValue?.date || '';
        values[`${formValue}-${column.name}-time`] = initialModelValue?.time || '';

        // add the select-all input value
        if (formIndex === 0) {
          values[`${SELECT_ALL_INPUT_FORM_VALUE}-${column.name}`] = '';
          values[`${SELECT_ALL_INPUT_FORM_VALUE}-${column.name}-date`] = '';
          values[`${SELECT_ALL_INPUT_FORM_VALUE}-${column.name}-time`] = '';
        }
      } else {
        values[`${formValue}-${column.name}`] = replaceNullOrUndefined(initialModelValue, '');

        // add the select-all input value
        if (formIndex === 0) {
          values[`${SELECT_ALL_INPUT_FORM_VALUE}-${column.name}`] = '';
        }
      }
    }
  });

  return { values, foreignKeyData, shouldWaitForForeignKeyData }
}

export function populateEditInitialValues(
  reference: any,
  columnModels: RecordeditColumnModel[],
  forms: number[],
  tuples: any[],
  appMode: string
) {
  // initialize row objects {column-name: value,...}
  const values: any = {};

  // the data associated with the foreignkeys
  const foreignKeyData: any = {};

  // whether the value can be updated or not
  const canUpdateValues: { [key: string]: boolean } = {};

  forms.forEach((formValue: any, formIndex: number) => {
    const tupleIndex = formIndex;
    const tuple = tuples[tupleIndex];

    const tupleValues = tuple.values;

    // attach the foreign key data of the tuple
    Object.keys(tuple.linkedData).forEach((k) => {
      foreignKeyData[`${formValue}-${k}`] = tuple.linkedData[k];
    });

    columnModels.forEach((colModel: RecordeditColumnModel, i: number) => {
      const column = colModel.column;
      let value;

      // add the select-all input values
      if (formIndex === 0) {
        // just use empty value (this is to make sure react-hook-forms has this key from the beginning)
        // NOTE if we actually want to show the default values, we should send extra requests.
        copyOrClearValue(colModel, values, foreignKeyData, SELECT_ALL_INPUT_FORM_VALUE, undefined, true);
      }

      // If input is disabled, and it's copy, we don't want to copy the value
      let isDisabled = colModel.isDisabled;
      if (isDisabled && appMode === appModes.COPY) return;

      if (appMode !== appModes.COPY) {
        // whether certain columns are disabled or not
        canUpdateValues[`${formValue}-${column.name}`] = tuple.canUpdate && tuple.canUpdateValues[i];

        // while we cannot change the isDisabled state, this will be
        // taken care of by calling getInputTypeOrDisabled in other places
        isDisabled = isDisabled || !(tuple.canUpdate && tuple.canUpdateValues[i]);
      }

      // stringify the returned array value
      if (column.type.isArray) {
        if (tupleValues[i] !== null) {
          values[`${formValue}-${column.name}`] = JSON.stringify(tupleValues[i], undefined, 2);
        }
        return;
      }

      // Transform column values for use in view model
      const options: TimestampOptions = { outputMomentFormat: '' }
      let isTimestamp = false
      // we're using rootName so we can properly handle system columns
      switch (column.type.rootName) {
        case 'timestamp':
          // this is only going to change the underlying raw value
          options.outputMomentFormat = dataFormats.timestamp;
          value = formatDatetime(tupleValues[i], options);
          isTimestamp = true;
          break;
        case 'timestamptz':
          // this is only going to change the underlying raw value
          options.outputMomentFormat = dataFormats.datetime.return;
          value = formatDatetime(tupleValues[i], options);
          isTimestamp = true;
          break;
        case 'int2':
        case 'int4':
        case 'int8':
          // If input is disabled, there's no need to transform the column value.
          value = isDisabled ? tupleValues[i] : formatInt(tupleValues[i]);
          break;
        case 'float4':
        case 'float8':
        case 'numeric':
          // If input is disabled, there's no need to transform the column value.
          value = isDisabled ? tupleValues[i] : formatFloat(tupleValues[i]);
          break;
        default:
          // the structure for asset type columns is an object with a 'url' property
          let metadata;
          if (column.isAsset) {
            metadata = column.getMetadata(tuple.data);
            value = {
              url: tupleValues[i] || '',
              filename: metadata.filename || metadata.caption,
              filesize: metadata.byteCount
            };

            /**
             * make sure we're also copying the metadata values.
             *
             * we don't need to do this in edit mode as we're not showing any of these values
             * and won't need to submit any of these values in update mode.
             * if user selects a new file, these values will be populated by ermrest.js based
             * on the new file.
             */
            if (appMode === appModes.COPY) {
              if (metadata.filename) {
                values[`${formValue}-${column.filenameColumn.name}`] = metadata.filename;
              }
              if (metadata.byteCount) {
                values[`${formValue}-${column.byteCountColumn.name}`] = metadata.byteCount;
              }
              if (metadata.md5) {
                values[`${formValue}-${column.md5.name}`] = metadata.md5;
              }
              if (metadata.sha256) {
                values[`${formValue}-${column.sha256.name}`] = metadata.sha256;
              }
            }

          } else {
            value = tupleValues[i];
          }

          break;
      }

      // no need to check for copy here because the case above guards against the negative case for copy
      if (isTimestamp) {
        values[`${formValue}-${column.name}`] = value?.datetime || '';
        values[`${formValue}-${column.name}-date`] = value?.date || '';
        values[`${formValue}-${column.name}-time`] = value?.time || '';
      } else {
        values[`${formValue}-${column.name}`] = replaceNullOrUndefined(value, '');
      }

      // capture the raw values of the columns that create the fk relationship
      // the `value` above is what users sees and not the raw value that we will
      // send to the database.
      if (column.isForeignKey) {
        if (value !== null || value !== undefined) {
          column.foreignKey.colset.columns.forEach((col: any) => {
            values[`${formValue}-${col.name}`] = tuple.data[col.name];
          });
        }
      }

    });
  });

  return { values, foreignKeyData, canUpdateValues };
}

/**
 * populate the raw data that can be submitted to ermrestjs
 * @param reference the reference object
 * @param formNumber indicate which form the data belongs to
 * @param formData the data for all the displayed fields
 * @returns
 */
export function populateSubmissionRow(reference: any, formNumber: number, formData: any) {
  const submissionRow: any = {};
  const setSubmission = (col: any, skipEmpty?: boolean) => {
    let v = formData[formNumber + '-' + col.name];

    if (v && !col.isDisabled) {
      if (col.type.isArray) {
        v = JSON.parse(v);
      } else if (col.isAsset) {
        // dereference formData so we aren't modifying content in react-hook-form
        // v is an object with `file`, `filename`, `filesize`, and `url` defined
        const tempVal = { ...v };
        tempVal.hatracObj = new windowRef.ERMrest.Upload(v.file, {
          column: col,
          reference: reference
        });

        v = tempVal;
      } else {
        // Special cases for formatting data
        switch (col.type.name) {
          case 'json':
          case 'jsonb':
            v = JSON.parse(v);
            break;
          default:
            break;
        }
      }
    }

    const isEmpty = (v === undefined || v === '');
    if (!(skipEmpty && isEmpty)) {
      submissionRow[col.name] = isEmpty ? null : v;
    }
  }

  // some outbound-fks might not be visible and prefilled
  // so instead of going based on the visible-columns, we're going based on all-outbounds
  reference.activeList.allOutBounds.forEach((col: any) => {
    col.foreignKey.colset.columns.forEach((fkCol: any) => {
      // set the submission only if it has value
      setSubmission(fkCol, true);
    });
  });

  reference.columns.forEach((col: any) => {
    if (col.isForeignKey) {
      // the column value is just for display
      // the difference between here and above is that if a fk input is
      // visible and empty, we have to treat it as "null" instead of skipping it.
      col.foreignKey.colset.columns.forEach((fkCol: any) => {
        setSubmission(fkCol);
      });
    } else if (col.isAsset) {
      // if due to copy the metadata values are set, use them
      if (col.filenameColumn) setSubmission(col.filenameColumn, true);
      if (col.byteCountColumn) setSubmission(col.byteCountColumn, true);
      if (col.md5) setSubmission(col.md5, true);
      if (col.sha256) setSubmission(col.sha256, true);

      setSubmission(col);
    } else {
      setSubmission(col);
    }
  });

  return submissionRow;
}

/**
 * This function will make sure the prefill object is valid before returning it.
 * since this is needed while generating the columnModels as well as setting the initial
 * values, it's been added here.
 * TODO better type matching
 * @param queryParams
 * @returns
 */
export function getPrefillObject(queryParams: any): null | PrefillObject {
  if (!queryParams.prefill) return null;
  const cookie = CookieService.getCookie(queryParams.prefill, true);
  if (cookie == null || typeof cookie !== 'object') {
    return null;
  }

  // make sure all the keys are in the object
  if (!(('keys' in cookie) && ('fkColumnNames' in cookie) && ('origUrl' in cookie) && ('rowname' in cookie))) {
    return null;
  }

  // valide the values
  if (!Array.isArray(cookie.fkColumnNames) || typeof cookie.origUrl !== 'string') {
    return null;
  }

  return {
    keys: cookie.keys,
    fkColumnNames: cookie.fkColumnNames,
    origUrl: cookie.origUrl,
    rowname: cookie.rowname
  }
}

/**
 * Whether all the columns for a foreignkey are all prefilled or not
 * @param column the visible column
 * @param prefillObj the prefill object
 */
export function allForeignKeyColumnsPrefilled(column: any, prefillObj: PrefillObject | null): boolean {
  // must be foreignkey and object must be defined
  if (!column.isForeignKey) return false;
  if (!prefillObj) return false;

  // just to double check, see if all the columns are prefilled.
  // the prefillObj should already have handled this, but
  // this has been part of the angularjs implementation and
  // I decided to keep it.
  return column.foreignKey.colset.columns.every((col: any) => (
    // != to guard against both null and undefined
    // eslint-disable-next-line eqeqeq
    col.name in prefillObj.keys && prefillObj.keys[col.name] != null
  ));
}
