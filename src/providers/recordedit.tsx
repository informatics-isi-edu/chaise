// hooks
import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useStateRef from '@isrd-isi-edu/chaise/src/hooks/state-ref';

// models
// import { LogActions, LogReloadCauses, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
// import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
// import { MultipleRecordError, NoRecordError } from '@isrd-isi-edu/chaise/src/models/errors';

// services
// import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utilities
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
  /**
   * The column models
   */
  // columnModels: RecordColumnModel[],
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
  const [recordValues, setRecordValues] = useState<any>([]);
  const [initialized, setInitialized, initializedRef] = useStateRef(false);

  useEffect(() => {
    if (!reference) return;
    setInitialized(true); 
  }, [reference])

  const onSubmit = (data: any) => {
    console.log('on submit')
    console.log(data);
    const submissionRows: any[] = [];
    const columnKeys = Object.keys(data);

    console.log(columnKeys);
    let formIdx = 1;
    while (columnKeys.find((key) => key.includes('' + formIdx))) {
      console.log(formIdx);
      const currRow: any = {};
      reference.columns.forEach((col: any) => {
        currRow[col.name] = data[formIdx + '-0-' + col.displayname.value] || null
      })

      submissionRows.push(currRow);

      formIdx++;
    }
    console.log(submissionRows);

    validateSessionBeforeMutation(() => {
      reference.create(submissionRows).then((response: AnalyserNode) => {
        console.log(response);
      }).catch((err: any) => {
        console.log(err);
      })

    });
  }

  const onInvalid = (data: any) => {
    console.log('on invalid');
    console.log(data)
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
      recordValues,
      reference,
      initialized,
      // columnModels,
    
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
    page, recordValues, initialized,
  ]);

  return (
    <RecordeditContext.Provider value={providerValue}>
      {children}
    </RecordeditContext.Provider>
  )
}
