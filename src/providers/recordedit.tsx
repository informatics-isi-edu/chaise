// hooks
import { createContext, useEffect, useMemo, useState } from 'react';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useStateRef from '@isrd-isi-edu/chaise/src/hooks/state-ref';

// models
import { RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';
// import { LogActions, LogReloadCauses, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
// import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
// import { MultipleRecordError, NoRecordError } from '@isrd-isi-edu/chaise/src/models/errors';

// providers
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utilities
import { simpleDeepCopy } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { columnToColumnModel, populateCreateInitialValues } from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { DEFAULT_HEGHT_MAP } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';


export const RecordeditContext = createContext<{
  /* the main entity reference */
  reference: any,
  /* the main page from reading the reference */
  page: any,
  /* the created column models from reference.columns */
  columnModels: RecordeditColumnModel[],
  /* Whether the data for the main entity is fetched or not */
  initialized: boolean,
  /* Array of numbers for initalizing form data */
  forms: number[],
  /* callback to add a form to the forms array */
  addForm: (count: number) => number[],
  /* callback to remove a form from the forms array */
  removeForm: (index: number) => void,
  /* Object to keep track of height changes for each column name display cell */
  keysHeightMap: any,
  /* callback to manipulate the keys height map */
  updateKeysHeightMap: (colName: string, height: number) => void,
  /* Object to keep track of height changes for each input cell */
  formsHeightMap: any,
  /* callback to manipulate the forms height map */
  handleInputHeightAdjustment: (fieldName: string, msgCleared: boolean) => void,
  /* returns the initial values for all forms to display */
  getInitialFormValues: (forms: number[], columnModels: RecordeditColumnModel[]) => any,
  /* callback for react-hook-form to call when forms are valid */
  onSubmitValid: (data: any) => void,
  /* callback for react-hook-form to call when forms are NOT valid */
  onSubmitInvalid: (data: any) => void,
  /* max rows allowed to add constant */
  MAX_ROWS_TO_ADD: number
} | null>(null);

type RecordeditProviderProps = {
  children: JSX.Element,
  reference: any,
  // logInfo: {
  //   logObject?: any,
  //   logStack: any,
  //   logStackPath: string,
  //   logAppMode?: string
  // }
};

export default function RecordeditProvider({
  children,
  reference,
  // logInfo
}: RecordeditProviderProps): JSX.Element {

  const { addAlert } = useAlert();
  const { validateSessionBeforeMutation } = useAuthn();
  const { dispatchError } = useError();

  const [page, setPage, pageRef] = useStateRef<any>(null);
  const [columnModels, setColumnModels] = useState<RecordeditColumnModel[]>([])
  const [initialized, setInitialized, initializedRef] = useStateRef(false);

  // an array of unique keys to for referencing each form
  const [forms, setForms] = useState<number[]>([1]);
  /*
   * Object to keep track of height changes for each column name display cell
   *  - each key is the column name 
   *  - each value is -1 if not changed or the corresponding height value to apply
   */
  const [keysHeightMap, setKeysHeightMap] = useState<any>({})
  /*
   * Object to keep track of height changes for each input cell
   *  - each key is the column name 
   *  - each value is an array
   *    - the length of the arrays is equal to the total number of forms
   *    - each value in the  array is 1 if not changed or the corresponding height value to apply
   */
  const [formsHeightMap, setFormsHeightMap] = useState<any>({})

  useEffect(() => {
    if (!reference) return;

    const tempColumnModels: RecordeditColumnModel[] = [];
    reference.columns.forEach((column: any) => {
      tempColumnModels.push(columnToColumnModel(column));
    })
    setColumnModels([...tempColumnModels]);

    // generate initial forms hmap
    const tempKeysHMap: any = {};
    const tempFormsHMap: any = {};
    tempColumnModels.forEach((cm: any) => {
      const colname = makeSafeIdAttr(cm.column.displayname.value);
      tempKeysHMap[colname] = -1;
      tempFormsHMap[colname] = [-1];
    });

    setKeysHeightMap(tempKeysHMap);
    setFormsHeightMap(tempFormsHMap);

    console.log('recordedit initialized');
    setInitialized(true);
  }, [reference])

  const onSubmitValid = (data: any) => {
    const submissionRows: any[] = []
    forms.forEach((f: number, idx: number) => {
      const currRow: any = {};
      reference.columns.forEach((col: any) => {
        // TODO: fix indexing
        currRow[col.name] = data[idx + '-' + col.displayname.value] || null
      });
      submissionRows.push(currRow);
    })


    validateSessionBeforeMutation(() => {
      reference.create(submissionRows).then((response: any) => {
        console.log(response);

        // if (isUpdate) {
        //   var data = checkUpdate(submissionRowsCopy, rsTuples);
        //   try {
        //     // check if there is a window that opened the current one
        //     // make sure the update function is defined for that window
        //     // verify whether we still have a valid vaue to call that function with
        //     if (window.opener && window.opener.updated && rsQueryParams.invalidate) {
        //       window.opener.updated(rsQueryParams.invalidate);
        //     }
        //   } catch (exp) {
        //     // if window.opener is from another origin, this will result in error on accessing any attribute in window.opener
        //     // And if it's from another origin, we don't need to call updated since it's not
        //     // the same row that we wanted to update in recordset (table directive)
        //   }
        // } else {
        //   if (!isModalUpdate) {
        //     $cookies.remove(rsQueryParams.prefill);


        //     // add cookie indicating record added
        //     if (rsQueryParams.invalidate) {
        //       $cookies.put(rsQueryParams.invalidate, submissionRowsCopy.length, {
        //         expires: new Date(Date.now() + (60 * 60 * 24 * 1000))
        //       });
        //     }
        //   }
        // }

        const page = response.successful;
        // const failedPage = response.failed;
        // const disabledPage = response.disabled;

        if (forms.length === 1) {
          let redirectUrl = '../';

          // Created a single entity or Updated one
          addAlert('Your data has been submitted. Redirecting you now to the record...', ChaiseAlertType.SUCCESS);
          // TODO can be replaced with page.reference.appLink.detailed
          redirectUrl += 'record/#' + page.reference.location.catalog + '/' + page.reference.location.compactPath;

          // append pcid
          const qCharacter = redirectUrl.indexOf('?') !== -1 ? '&' : '?';
          const contextHeaderParams = ConfigService.contextHeaderParams;
          // Redirect to record or recordset app..
          windowRef.location = redirectUrl + qCharacter + 'pcid=' + contextHeaderParams.cid + '&ppid=' + contextHeaderParams.pid;
        }
        // else {
        //   AlertsService.addAlert("Your data has been submitted. Showing you the result set...", "success");

        //   var resultsReference = page.reference;
        //   // NOTE currently this has been added just to make sure nothing is broken,
        //   // but it's not used since the displayed table doesn't have any controls.
        //   // if we end up adding more controls and needed to log them, we might want to
        //   // revisit the filters that we're logging here.
        //   var logStackNode = logService.getStackNode(
        //     logService.logStackTypes.SET,
        //     resultsReference.table,
        //     resultsReference.filterLogInfo
        //   );

        //   // create the link based on the initial link that users used to 
        //   // navigate to this page for edit mode so it has the filters
        //   if (vm.editMode) {
        //     vm.resultsetRecordsetLink = $rootScope.reference.contextualize.compact.appLink;
        //   }
        //   // for create and copy mode we want unfiltered links
        //   else {
        //     vm.resultsetRecordsetLink = $rootScope.reference.unfilteredReference.contextualize.compact.appLink;
        //   }

        //   // set values for the view to flip to recordedit resultset view
        //   vm.resultsetModel = {
        //     hasLoaded: true,
        //     reference: resultsReference,
        //     enableSort: false,
        //     sortby: null,
        //     sortOrder: null,
        //     page: page,
        //     pageLimit: model.rows.length,
        //     rowValues: DataUtils.getRowValuesFromTuples(page.tuples),
        //     selectedRows: [],
        //     search: null,
        //     config: {
        //       viewable: false,
        //       editable: false,
        //       deletable: false,
        //       selectMode: modalBox.noSelect, //'no-select'
        //       displayMode: recordsetDisplayModes.table
        //     },
        //     logStack: logService.getStackObject(logStackNode),
        //     logStackPath: logService.getStackPath("", logService.logStackPaths.RESULT_SUCCESFUL_SET)
        //   };

        //   if (failedPage !== null) {
        //     var failedReference = failedPage.reference;

        //     vm.omittedResultsetModel = {
        //       hasLoaded: true,
        //       reference: failedReference,
        //       enableSort: false,
        //       sortby: null,
        //       sortOrder: null,
        //       page: failedPage,
        //       pageLimit: model.rows.length,
        //       rowValues: DataUtils.getRowValuesFromTuples(failedPage.tuples),
        //       selectedRows: [],
        //       search: null,
        //       config: {
        //         viewable: false,
        //         editable: false,
        //         deletable: false,
        //         selectMode: modalBox.noSelect,
        //         displayMode: recordsetDisplayModes.table
        //       },
        //       logStack: logService.getStackObject(logStackNode),
        //       logStackPath: logService.getStackPath("", logService.logStackPaths.RESULT_FAILED_SET)
        //     };
        //   }

        //   // NOTE: This case is for the unchanged rows
        //   // When multiple rows are updated and a smaller set is returned,
        //   // the user doesn't have permission to update those rows based on row-level security
        //   if (disabledPage !== null) {
        //     var disabledReference = disabledPage.reference;

        //     vm.disabledResultsetModel = {
        //       hasLoaded: true,
        //       reference: disabledReference,
        //       enableSort: false,
        //       sortby: null,
        //       sortOrder: null,
        //       page: disabledPage,
        //       pageLimit: model.rows.length,
        //       rowValues: DataUtils.getRowValuesFromTuples(disabledPage.tuples),
        //       selectedRows: [],
        //       search: null,
        //       config: {
        //         viewable: false,
        //         editable: false,
        //         deletable: false,
        //         selectMode: modalBox.noSelect,
        //         displayMode: recordsetDisplayModes.table
        //       },
        //       logStack: logService.getStackObject(logStackNode),
        //       logStackPath: logService.getStackPath("", logService.logStackPaths.RESULT_DISABLED_SET)
        //     };
        //   }

        //   vm.resultset = true;
        //   // delay updating the height of DOM elements so the current digest cycle can complete and "show" the resultset view
        //   $timeout(function () {
        //     // remove the old resize sensors since we're switching the display to resultset
        //     detachResizeSensors();

        //     // create new resize sensors for the resultset view
        //     attachResizeSensors();
        //   }, 0);
        // }
      }).catch((err: any) => {
        console.log(err);
        dispatchError({ error: err });
      })

    });
  }

  // NOTE: most likely not needed
  const onSubmitInvalid = (data: any) => {
    console.log(data);

    const invalidMessage = 'Sorry, the data could not be submitted because there are errors on the form. Please check all fields and try again.';
    addAlert(invalidMessage, ChaiseAlertType.ERROR);
  }

  const addForm = (count: number) => {
    const newFormIndexValues: number[] = [];
    // add 'count' number of forms
    setForms((forms: number[]) => {
      for (let i = 0; i < count; i++) {
        forms.push(forms[forms.length - 1] + 1);
        newFormIndexValues.push(forms.length - 1);
      }

      return [...forms]
    })

    // for each form added, push another '-1' into the array for each column
    setFormsHeightMap((formsHeightMap: any) => {
      const formsHeightMapCpy = simpleDeepCopy(formsHeightMap);
      for (let i = 0; i < count; i++) {
        Object.keys(formsHeightMapCpy).forEach(k => {
          formsHeightMapCpy[k].push(-1);
        });
      }
      return formsHeightMapCpy;
    });

    return newFormIndexValues;
  };

  // TODO: event type
  const removeForm = (idx: number) => {
    // remove the form at 'idx'
    setForms((forms: any) => {
      forms.splice(idx, 1);

      return [...forms];
    });

    // remove the entry at 'idx' in the array for each column
    setFormsHeightMap((formsHeightMap: any) => {
      const formsHeightMapCpy = simpleDeepCopy(formsHeightMap);
      Object.keys(formsHeightMapCpy).forEach(k => {
        formsHeightMapCpy[k].splice(idx, 1);
      });
      return formsHeightMapCpy;
    });
  }

  const updateKeysHeightMap = (colName: string, height: number) => {
    setKeysHeightMap((keysHeightMap: any) => {
      const hMapCopy = simpleDeepCopy(keysHeightMap);
      hMapCopy[colName] = height;
      return hMapCopy;
    })
  }

  const updateFormsHeightMap = (colName: string, idx: string, height: string | number) => {
    setFormsHeightMap((formsHeightMap: any) => {
      const hMapCpy = simpleDeepCopy(formsHeightMap);
      hMapCpy[colName][idx] = height;

      updateKeysHeightMap(colName, Math.max(...hMapCpy[colName]));

      return hMapCpy;
    });
  }

  const handleInputHeightAdjustment = (fieldName: string, msgCleared: boolean, fieldType: string) => {
    
    const ele: HTMLElement | null = document.querySelector(`.input-switch-container-${fieldName}`);
    const height = ele?.offsetHeight || 0;
    // how to handle this ? get default heights

    const defaultHeight = DEFAULT_HEGHT_MAP[fieldType];
    
    const newHeight = height == defaultHeight || msgCleared ? -1 : height;

    // execute the regexp to get individual values from the inputFieldName
    const r = /(\d*)-(.*)/;
    const result = r.exec(fieldName) || [];
    const idx = result[1];
    const colName = result[2];

    updateFormsHeightMap(colName, idx, newHeight);
  }

  const getInitialFormValues = (forms: number[], columnModels: RecordeditColumnModel[]) => {
    let formValues: any = {};
    // if create
    // NOTE: should only be 1 form for create...
    forms.forEach((form: number, idx: number) => {
      const initialModel = populateCreateInitialValues(formValues, columnModels, idx);
      formValues = initialModel.values;
    })
    // else if edit/copy
    // TODO: get rows data 
    // iterate over rows from read and intialize form values first
    // forms.forEach((form: number, idx: number) => {
    //   columnModels.forEach((cm: RecordeditColumnModel) => {
    //     const colname = makeSafeIdAttr(cm.column.displayname.value)
    //     // TODO: initialize inputs based on different types
    //     formValues[`${idx}-${colname}`] = '';
    //   });
    // })
    return formValues;
  };


  // ---------------- log related function --------------------------- //

  // const logRecordClientAction = (action: LogActions, childStackElement?: any, extraInfo?: any, ref?: any) => {
  //   const usedRef = ref ? ref : reference;
  //   LogService.logClientAction({
  //     action: flowControl.current.getLogAction(action),
  //     stack: flowControl.current.getLogStack(childStackElement, extraInfo)
  //   }, usedRef.defaultLogInfo)
  // };

  // const getRecordLogAction = (actionPath: LogActions, childStackPath?: any) => {
  //   return flowControl.current.getLogAction(actionPath, childStackPath);
  // }

  // const getRecordLogStack = (childStackElement?: any, extraInfo?: any) => {
  //   return flowControl.current.getLogStack(childStackElement, extraInfo);
  // }

  const providerValue = useMemo(() => {
    return {
      // main entity:
      reference,
      page,
      columnModels,
      initialized,

      // form 
      forms,
      addForm,
      removeForm,
      keysHeightMap,
      updateKeysHeightMap,
      formsHeightMap,
      handleInputHeightAdjustment,
      getInitialFormValues,

      //   // log related:
      //   logRecordClientAction,
      //   getRecordLogAction,
      //   getRecordLogStack,
      onSubmitValid,
      onSubmitInvalid,
      MAX_ROWS_TO_ADD: 201
    };
  }, [
    // main entity:
    reference, page, columnModels, initialized,
    forms, keysHeightMap, formsHeightMap
  ]);

  return (
    <RecordeditContext.Provider value={providerValue}>
      {children}
    </RecordeditContext.Provider>
  )
}
