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
import { formatDatetime, formatFloat, formatInt, getInputType, isDisabled } from '@isrd-isi-edu/chaise/src/utils/input-utils';

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

  // if (type == 'boolean') {
  //   var trueVal = InputUtils.formatBoolean(column, true),
  //     falseVal = InputUtils.formatBoolean(column, false),
  //     booleanArray = [trueVal, falseVal];

  //   // create map
  //   var booleanMap = {};
  //   booleanMap[trueVal] = true;
  //   booleanMap[falseVal] = false;
  // }

  return {
    // allInput: undefined,
    // booleanArray: booleanArray || [],
    // booleanMap: booleanMap || {},
    column: column,
    isDisabled: isInputDisabled,
    isRequired: !column.nullok && !isInputDisabled,
    inputType: type,
    // highlightRow: false,
    // showSelectAll: false,
    // logStackNode: stackNode, // should not be used directly, take a look at getColumnModelLogStack
    // logStackPathChild: stackPath // should not be used directly, use getColumnModelLogAction getting the action string
  };
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
  forms.forEach((formValue: number, formIdx: number) => {
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
        // case 'boolean':
        //     if (defaultValue != null) {
        //         initialModelValue = InputUtils.formatBoolean(column, defaultValue);
        //     }
        //     break;
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
          values[`${formIdx}-${column.name}`] = initialModelValue?.datetime || '';
        } else {
          values[`${formIdx}-${column.name}`] = '';
          values[`${formIdx}-${column.name}-date`] = initialModelValue?.date || '';
          values[`${formIdx}-${column.name}-time`] = initialModelValue?.time || '';
        }
      } else {
        values[`${formIdx}-${column.name}`] = initialModelValue || '';
      }
    }
  });

  return { values, oldRows }
}

export function populateEditInitialValues(
  columnModels: RecordeditColumnModel[],
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
  tuples.forEach((tuple: any, tupleIndex: number) => {
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
      let isTimestamp = false;
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
        case 'boolean':
          // value = formatBoolean(column, tupleValues[i]);
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
          values[`${tupleIndex}-${column.name}`] = value?.datetime || '';
        } else {
          values[`${tupleIndex}-${column.name}`] = '';
          values[`${tupleIndex}-${column.name}-date`] = value?.date || '';
          values[`${tupleIndex}-${column.name}-time`] = value?.time || '';
        }
      } else {
        values[`${tupleIndex}-${column.name}`] = value || '';
      }
      
    });
  });

  return { values };
}