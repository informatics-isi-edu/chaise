import Q from 'q';
import { createContext, useMemo, useState } from 'react';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import $log from '@isrd-isi-edu/chaise/src/services/logger';


export const RecordContext = createContext<{
  page: any,
  readMainEntity: any,
  reference: any
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
        dispatchError({error: new Error('No record found!')})

        //  recordSetLink should be used to present user with an option in case of no data found
        // TODO
        // recordSetLink = page.reference.unfilteredReference.contextualize.compact.appLink;
        // throw new Errors.noRecordError({}, tableDisplayName, recordSetLink);
      }
      else if (page.hasNext || page.hasPrevious) {
        dispatchError({error: new Error('More than one record found!')})
        // TOD
        // recordSetLink = page.reference.contextualize.compact.appLink;
        // throw new Errors.multipleRecordError(tableDisplayName, recordSetLink);
      }

      setPage(page);
      // TODO
      // $rootScope.page = page;
      // var tuple = $rootScope.tuple = page.tuples[0];

      // // Used directly in the record-display directive
      // $rootScope.recordDisplayname = tuple.displayname;

      // // Collate tuple.isHTML and tuple.values into an array of objects
      // // i.e. {isHTML: false, value: 'sample'}
      // $rootScope.recordValues = [];
      // tuple.values.forEach(function (value, index) {
      //   $rootScope.recordValues.push({
      //     isHTML: tuple.isHTML[index],
      //     value: value
      //   });
      // });

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
    }).catch(function (err: any) {
      defer.reject(err);
    });


    return defer.promise;
  };

  const providerValue = useMemo(() => {
    return {
      page,
      // TODO should be changed
      readMainEntity,
      reference
    };
  }, [page]);

  return (
    <RecordContext.Provider value={providerValue}>
      {children}
    </RecordContext.Provider>
  )
}
