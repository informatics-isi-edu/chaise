// hooks
import { createContext, useMemo, useState } from 'react';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import { MultipleRecordError, NoRecordError } from '@isrd-isi-edu/chaise/src/models/errors';

// services
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utilities
import Q from 'q';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { createRedirectLinkFromPath } from '@isrd-isi-edu/chaise/src/utils/uri-utils';

export const RecordContext = createContext<{
  page: any,
  recordValues: any,
  readMainEntity: any,
  reference: any,
  initialized: boolean
} | null>(null);

type RecordProviderProps = {
  children: JSX.Element,
  reference: any,
};

export default function RecordProvider({
  children,
  reference
}: RecordProviderProps): JSX.Element {
  const { dispatchError } = useError();

  const [page, setPage] = useState<any>(null);
  const [recordValues, setRecordValues] = useState<any>([]);
  const [initialized, setInitialized] = useState(false);

  const readMainEntity = (isUpdate: boolean, logObj: any) => {
    const defer = Q.defer();

    // TODO
    // clear the value of citation, so we can fetch it again.
    // if (DataUtils.isObjectAndNotNull($rootScope.reference.citation)) {
    //   $rootScope.citationReady = false;
    // } else {
    //   $rootScope.citationReady = true;
    //   $rootScope.citation = null;
    // }

    logObj = logObj || {};
    const action = isUpdate ? LogActions.RELOAD : LogActions.LOAD;
    logObj.action = LogService.getActionString(action);
    logObj.stack = LogService.getStackObject();

    //  TOOD
    // const causes = (Array.isArray($rootScope.reloadCauses) && $rootScope.reloadCauses.length > 0) ? $rootScope.reloadCauses : [];
    // if (causes.length > 0) {
    //   logObj.stack = logService.addCausesToStack(logObj.stack, causes, $rootScope.reloadStartTime);
    // }

    // making sure we're asking for TRS for the main entity
    reference.read(1, logObj, false, false, true).then((page: any) => {
      $log.info(`Page: ${page}`);

      let recordSetLink;
      const tableDisplayName = page.reference.displayname.value;
      if (page.tuples.length < 1) {
        //  recordSetLink should be used to present user with an option in case of no data found
        recordSetLink = page.reference.unfilteredReference.contextualize.compact.appLink;
        dispatchError({ error: new NoRecordError({}, tableDisplayName, recordSetLink) })
      }
      else if (page.hasNext || page.hasPrevious) {
        recordSetLink = page.reference.contextualize.compact.appLink;
        dispatchError({ error: new MultipleRecordError(tableDisplayName, recordSetLink) })
      }

      // // Collate tuple.isHTML and tuple.values into an array of objects
      // // i.e. {isHTML: false, value: 'sample'}
      const rv : any[] = [];
      page.tuples[0].values.forEach(function (value: any, index: number) {
        rv.push({
          isHTML: page.tuples[0].isHTML[index],
          value: value
        });
      });

      setPage(page);
      setRecordValues(rv);
      setInitialized(true);

      // // the initial values for the templateVariables
      // $rootScope.templateVariables = tuple.templateVariables.values;
      // // the aggregate values
      // $rootScope.aggregateResults = {};
      // // indicator that the entityset values are fetched
      // $rootScope.entitySetResults = {};

      // //whether citation is waiting for other data or we can show it on load
      // var citation = $rootScope.reference.citation;
      // if (DataUtils.isObjectAndNotNull(citation)) {
      //   $rootScope.citationReady = !citation.hasWaitFor;
      //   if ($rootScope.citationReady) {
      //     $rootScope.citation = citation.compute(tuple, $rootScope.templateVariables);
      //   }
      // } else {
      //   $rootScope.citationReady = true;
      //   $rootScope.citation = null;
      // }

      // $rootScope.displayReady = true;

      // $rootScope.reloadCauses = [];
      // $rootScope.reloadStartTime = -1;

      defer.resolve(page);
    }).catch(function (exception: any) {
      // show modal with different text if 400 Query Timeout Error
      if (exception instanceof windowRef.ERMrest.QueryTimeoutError) {
        exception.subMessage = exception.message;
        exception.message = 'The main entity cannot be retrieved. Refresh the page later to try again.';
        // TODO on master this was dismissible, but why?
      } else {
        if (isObjectAndKeyDefined(exception.errorData, 'redirectPath')) {
          const redirectLink = createRedirectLinkFromPath(exception.errorData.redirectPath);
          exception.errorData.redirectUrl = redirectLink.replace('record', 'recordset');
        }
      }
      dispatchError({ error: exception });

      defer.reject(exception);
    });

    return defer.promise;
  };

  const providerValue = useMemo(() => {
    return {
      page,
      recordValues,
      // TODO should be changed
      readMainEntity,
      reference,
      initialized,
    };
  }, [page]);

  return (
    <RecordContext.Provider value={providerValue}>
      {children}
    </RecordContext.Provider>
  )
}
