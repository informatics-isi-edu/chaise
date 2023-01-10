/**
 * Utility functions related to recordedit and other create/update functionality
 */

// constants
import { dataFormats } from '@isrd-isi-edu/chaise/src/utils/constants';

// models
import { LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { RecordeditColumnModel, TimestampOptions } from '@isrd-isi-edu/chaise/src/models/recordedit'

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utilities
import { formatDatetime, formatFloat, formatInt, getInputType,
  replaceNullOrUndefined, isDisabled } from '@isrd-isi-edu/chaise/src/utils/input-utils';

/**
 * Create a columnModel based on the given column that can be used in a recordedit form
 * @param column the column object from ermrestJS
 */
export function columnToColumnModel(column: any): RecordeditColumnModel {
  const isInputDisabled: boolean = isDisabled(column);
  const stackNode = LogService.getStackNode(
    column.isForeignKey ? LogStackTypes.FOREIGN_KEY : LogStackTypes.COLUMN,
    column.table,
    { source: column.compressedDataSource, entity: column.isForeignKey }
  );
  const stackPath = column.isForeignKey ? LogStackPaths.FOREIGN_KEY : LogStackPaths.COLUMN;

  let type;
  if (column.isAsset) {
    type = 'file'
  } else if (isInputDisabled) {
    type = 'disabled';
  } else if (column.isForeignKey) {
    type = 'popup-select';
  } else {
    type = getInputType(column.type);
  }


  return {
    // allInput: undefined,
    column: column,
    isDisabled: isInputDisabled,
    isRequired: !column.nullok && !isInputDisabled,
    inputType: type,
    // highlightRow: false,
    // showSelectAll: false,
    logStackNode: stackNode, // should not be used directly, take a look at getColumnModelLogStack
    logStackPathChild: stackPath // should not be used directly, use getColumnModelLogAction getting the action string
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
  prefillQueryParam?: string
) {
  const values: any = {};
  // get the prefilled values
  let prefilledColumns: any = {}, prefilledFks: string[] = [], oldRows: any[] = [];
  // TODO: foreign key create
  // if (prefillQueryParam) {
  //     // get the cookie with the prefill value
  //     // const cookie = $cookies.getObject(prefillQueryParam);

  //     // make sure cookie is correct
  //     const hasAllKeys = cookie && ['keys', 'fkColumnNames', 'origUrl', 'rowname'].every((k: string) => {
  //         return cookie.hasOwnProperty(k);
  //     });
  //     if (hasAllKeys) {
  //         // TODO
  //         // $rootScope.cookieObj = cookie;

  //         // keep a record of freignkeys that are prefilled
  //         prefilledFks = cookie.fkColumnNames;

  //         // keep a record of columns that are prefilled
  //         prefilledColumns = cookie.keys;

  //         // process the list of prefilled foreignkeys to get additional data
  //         // TODO
  //         // _processPrefilledForeignKeys(model, reference, cookie.fkColumnNames, cookie.keys, cookie.origUrl, cookie.rowname);

  //         // Keep a copy of the initial rows data so that we can see if user has made any changes later
  //         oldRows = values;
  //     }
  // }

  // TODO: add initialValues to submissionRows (viewer feature)
  // if (DataUtils.isObjectAndNotNull(initialValues)) {
  //     model.submissionRows[0] = initialValues;
  // }

  // populate defaults
  // NOTE: should only be 1 form
  forms.forEach((formValue: number) => {
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

      // if it's a prefilled foreignkey, the value is already set
      if (column.isForeignKey && prefilledFks.indexOf(column.name) !== -1) {
        colModel.isDisabled = true;
        colModel.inputType = 'disabled';
        continue;
      }

      // if the column is prefilled, get the prefilled value instead of default
      if (column.name in prefilledColumns) {
        defaultValue = prefilledColumns[column.name];
        colModel.isDisabled = true;
        colModel.inputType = 'disabled';
      }

      const tsOptions: TimestampOptions = { outputMomentFormat: '' };

      let isTimestamp = false;
      switch (column.type.name) {
        // timestamp[tz] and asset columns have default model objects if their inputs are NOT disabled
        case 'timestamp':
          tsOptions.outputMomentFormat = dataFormats.datetime.display;
          // formatDatetime takes care of column.default if null || undefined
          initialModelValue = formatDatetime(defaultValue, tsOptions);
          isTimestamp = true;
          break;
        case 'timestamptz':
          tsOptions.outputMomentFormat = dataFormats.datetime.displayZ;
          // formatDatetime takes care of column.default if null || undefined
          initialModelValue = formatDatetime(defaultValue, tsOptions);
          isTimestamp = true;
          break;
        default:
          if (column.isAsset) {
            const metaObj: any = {};
            metaObj[column.name] = defaultValue;

            // TODO: asset metadata type
            const metadata: any = column.getMetadata(metaObj);
            initialModelValue = {
              url: metadata.url || '',
              filename: metadata.filename || metadata.caption || '',
              filesize: metadata.byteCount || ''
            }
          } else if (column.isForeignKey) {
            // TODO: Implement foreign key initial values
            // if all the columns of the foreignkey are prefilled, use that instead of default
            // const allPrefilled = column.foreignKey.colset.columns.every((col: any) => {
            //     return prefilledColumns[col.name] !== null;
            // });

            // // if all the columns of the foreignkey are initialized, use that instead of default
            // const allInitialized = column.foreignKey.colset.columns.every((col: any) => {
            //     return values[col.name] !== null;
            // });

            // if (allPrefilled || allInitialized) {
            //     const defaultDisplay = column.getDefaultDisplay(allPrefilled ? prefilledColumns : values);
            //     // const logObj;

            //     if (allPrefilled) {
            //         colModel.isDisabled = true;
            //         colModel.inputType = 'disabled';
            //     }
            //     // display the initial value
            //     initialModelValue = defaultDisplay.rowname.value;
            //     // initialize foreignKey data
            //     // model.foreignKeyData[0][column.foreignKey.name] = defaultDisplay.values;

            //     // populate the log object
            //     // logObj = {
            //     //     action: getColumnModelLogAction(
            //     //         logService.logActions.FOREIGN_KEY_PRESELECT,
            //     //         colModel,
            //     //         model
            //     //     ),
            //     //     stack: getColumnModelLogStack(colModel, model)
            //     // };

            //     // get the actual foreign key data
            //     // _getForeignKeyData(model, 0, [column.name], defaultDisplay.reference, logObj);
            // } else if (defaultValue !== null) {
            //     initialModelValue = defaultValue;
            //     // initialize foreignKey data
            //     // model.foreignKeyData[0][column.foreignKey.name] = column.defaultValues;

            //     // populate the log object
            //     // logObj = {
            //     //     action: getColumnModelLogAction(
            //     //         logService.logActions.FOREIGN_KEY_DEFAULT,
            //     //         colModel,
            //     //         model
            //     //     ),
            //     //     stack: getColumnModelLogStack(colModel, model)
            //     // };

            //     // get the actual foreign key data
            //     // _getForeignKeyData(model, 0, [column.name], column.defaultReference, logObj);
            // }
          } else {
            // all other column types
            if (defaultValue !== null) {
              initialModelValue = defaultValue;
            }
          }
      }

      if (isTimestamp) {
        // string implies the input is disabled
        if (colModel.inputType === 'disabled') {
          values[`${formValue}-${column.name}`] = initialModelValue?.datetime || '';
        } else {
          values[`${formValue}-${column.name}`] = '';
          values[`${formValue}-${column.name}-date`] = initialModelValue?.date || '';
          values[`${formValue}-${column.name}-time`] = initialModelValue?.time || '';
        }
      } else {
        values[`${formValue}-${column.name}`] = replaceNullOrUndefined(initialModelValue, '');
      }
    }
  });

  return { values, oldRows }
}

export function populateEditInitialValues(
  columnModels: RecordeditColumnModel[],
  forms: number[],
  columns: any[],
  tuples: any[],
  isCopy: boolean
) {
  // initialize row objects {column-name: value,...}
  const values: any = {};

  // needs to be initialized so foreign keys can be set
  // these are the values that we're sending to ermrestjs,
  // chaise should not use these values and we should just populate the values
  // model.submissionRows[tupleIndex] = {};

  const canUpdateRows: any[] = [];
  const foreignKeyData: any[] = [];
  forms.forEach((formValue: any, formIndex: number) => {
    const tupleIndex = formIndex;
    const tuple = tuples[tupleIndex];

    if (!isCopy) canUpdateRows[tupleIndex] = {};

    const tupleValues = tuple.values;

    // attach the foreign key data of the tuple
    foreignKeyData[tupleIndex] = tuple.linkedData;

    columnModels.forEach((colModel: RecordeditColumnModel) => {
      const column = colModel.column;
      let value;

      // columnModels array might not be the same size as column list
      const i = columns.findIndex((col: any) => { return col.name === column.name });

      // If input is disabled, and it's copy, we don't want to copy the value
      let isDisabled = colModel.inputType === 'disabled';
      if (isDisabled && isCopy) return;

      if (!isCopy) {
        // whether certain columns are disabled or not
        canUpdateRows[tupleIndex][column.name] = tuple.canUpdate && tuple.canUpdateValues[i];
        isDisabled = isDisabled || !(tuple.canUpdate && tuple.canUpdateValues[i]);
      }

      // stringify the returned array value
      if (column.type.isArray) {
        if (tupleValues[i] !== null) {
          values[`${tupleIndex}-${column.name}`] = JSON.stringify(tupleValues[i], undefined, 2);
        }
        return;
      }

      // Transform column values for use in view model
      const options: TimestampOptions = { outputMomentFormat: '' }
      let isTimestamp = false
      switch (column.type.name) {
        case 'timestamp':
          value = formatDatetime(tupleValues[i], options);
          isTimestamp = true;
          break;
        case 'timestamptz':
          if (isDisabled) options.outputMomentFormat = dataFormats.datetime.return;
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
          } else {
            value = tupleValues[i];
          }

          // TODO: Copy + asset
          // if in copy mode and copying an asset column with metadata available, attach that to the submission model
          // if (column.isAsset && isCopy) {
          //   // may not have been set or fetched above because of disabled case
          //   // we still want to copy the metadata
          //   metadata = column.getMetadata(tuple.data);

          //   // I don't think this should be done brute force like this
          //   if (metadata.filename) model.submissionRows[tupleIndex][column.filenameColumn.name] = metadata.filename;
          //   if (metadata.byteCount) model.submissionRows[tupleIndex][column.byteCountColumn.name] = metadata.byteCount;
          //   if (metadata.md5) model.submissionRows[tupleIndex][column.md5.name] = metadata.md5;
          //   if (metadata.sha256) model.submissionRows[tupleIndex][column.sha256.name] = metadata.sha256;
          // }
          break;
      }

      // no need to check for copy here because the case above guards against the negative case for copy

      if (isTimestamp) {
        // string implies the input is disabled
        if (colModel.inputType === 'disabled') {
          values[`${formValue}-${column.name}`] = value?.datetime || '';
        } else {
          values[`${formValue}-${column.name}`] = '';
          values[`${formValue}-${column.name}-date`] = value?.date || '';
          values[`${formValue}-${column.name}-time`] = value?.time || '';
        }
      } else {
        values[`${formValue}-${column.name}`] = replaceNullOrUndefined(value, '');
      }

    });
  });

  return { values };
}

/**
 * populate the raw data that can be submitted to ermrestjs
 * @param reference the reference object
 * @param formNumber indicate which form the data belongs to
 * @param formData the data for all the displayed fields
 * @returns
 */
export function populateSubmissionRow(reference: any, formNumber: number, formData: any) {
  const setSubmission = (col: any) => {
    const v = formData[formNumber + '-' + col.name];
    submissionRow[col.name] = (v === undefined || v === '') ? null : v;
  }

  const submissionRow: any = {};
  reference.columns.forEach((col: any) => {
    // we should get the raw column values (not the displayed rowname)
    if (col.isForeignKey) {
      col.foreignKey.colset.columns.forEach((fkCol: any) => {
        setSubmission(fkCol);
      });
    } else {
      setSubmission(col);
    }
  });
  return submissionRow;
}
