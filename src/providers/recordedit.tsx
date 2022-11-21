// hooks
import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useStateRef from '@isrd-isi-edu/chaise/src/hooks/state-ref';

// models
import { RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';
import { createImportSpecifier } from 'typescript';
// import { LogActions, LogReloadCauses, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
// import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
// import { MultipleRecordError, NoRecordError } from '@isrd-isi-edu/chaise/src/models/errors';

// services
// import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utilities
import { simpleDeepCopy } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
// import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';


export const RecordeditContext = createContext<{
  /**
   * The main page
   */
  page: any,
  /**
   * The main record values
   */
  recordValues?: any,
  /**
   * the main entity reference
   */
  reference: any,
  /**
   * Whether the data for the main entity is fetched or not
   */
  initialized: boolean,
  forms: number[],
  addForm: Function,
  removeForm: Function,
  keysHeightMap: any,
  updateKeysHeightMap: Function,
  formsHeightMap: any,
  updateFormsHeightMap: Function,
  handleInputHeightAdjustment: Function,
  /**
   * The column models
   */
  columnModels: RecordeditColumnModel[],
  onSubmit: (data: any) => void,
  onInvalid: (data: any) => void,
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

  const { validateSessionBeforeMutation } = useAuthn();
  const { dispatchError } = useError();

  const [page, setPage, pageRef] = useStateRef<any>(null);
  const [columnModels, setColumnModels] = useState<any[]>([])
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
   * Object to keep track of height changes for each column name display cell
   *  - each key is the column name 
   *  - each value is -1 if not changed or the corresponding height value to apply
   */
  const [formsHeightMap, setFormsHeightMap] = useState<any>({})

  useEffect(() => {
    if (!reference) return;

    const tempColumnModels: any[] = [];
    reference.columns.forEach((column: any) => {
      tempColumnModels.push({
        column: column
      })
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

    console.log("recordedit initialized");
    setInitialized(true);
  }, [reference])

  const onSubmit = (data: any) => {
    console.log('on submit')
    console.log(data);

    const submissionRows: any[] = []
    forms.forEach((f: number, idx: number) => {
      const currRow: any = {};
      reference.columns.forEach((col: any) => {
        // TODO: fix indexing
        currRow[col.name] = data[idx + '-' + col.displayname.value] || null
      });
      submissionRows.push(currRow);
    })

    console.log(submissionRows);

    validateSessionBeforeMutation(() => {
      reference.create(submissionRows).then((response: any) => {
        console.log(response);
      }).catch((err: any) => {
        console.log(err);
        dispatchError({ error: err });
      })

    });
  }

  const onInvalid = (data: any) => {
    console.log('on invalid');
    console.log(data)
  }

  const addForm = (count: number) => {
    // add 'count' number of forms
    setForms((forms: any) => {
      for (let i = 0; i < count; i++) {
        forms.push(forms[forms.length - 1] + 1)
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

  const updateFormsHeightMap = (colName: string, idx: string, height: any) => {
    setFormsHeightMap((formsHeightMap: any) => {
      const hMapCpy = simpleDeepCopy(formsHeightMap);
      hMapCpy[colName][idx] = height;
  
      updateKeysHeightMap(colName, Math.max(...hMapCpy[colName]));
  
      return hMapCpy;
    });
  }

  const handleInputHeightAdjustment = (fieldName: string, msgCleared: boolean) => {
    const ele: HTMLElement | null = document.querySelector(`.input-switch-container-${fieldName}`);
    const height = ele?.offsetHeight || 0;
    // how to handle this ? get default heights
    const newHeight = height == 47 || msgCleared ? -1 : height;

    // execute the regexp to get individual values from the inputFieldName
    const r = /(\d*)-(.*)/;
    const result = r.exec(fieldName) || [];
    const idx = result[1];
    const colName = result[2];

    updateFormsHeightMap(colName, idx, newHeight);
  }

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
      page,
      columnModels,
      reference,
      initialized,
      forms,
      addForm,
      removeForm,
      keysHeightMap,
      updateKeysHeightMap,
      formsHeightMap,
      updateFormsHeightMap,
      handleInputHeightAdjustment,

      //   // log related:
      //   logRecordClientAction,
      //   getRecordLogAction,
      //   getRecordLogStack,
      onSubmit,
      onInvalid,
      MAX_ROWS_TO_ADD: 201
    };
  }, [
    // main entity:
    page, columnModels, initialized, 
    forms, keysHeightMap, formsHeightMap,
  ]);

  return (
    <RecordeditContext.Provider value={providerValue}>
      {children}
    </RecordeditContext.Provider>
  )
}
