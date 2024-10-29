// components
import RecordsetTable from '@isrd-isi-edu/chaise/src/components/recordset/recordset-table';

// models
import { LogStackPaths } from '@isrd-isi-edu/chaise/src/models/log';
import { RecordsetConfig, RecordsetDisplayMode, RecordsetSelectMode } from '@isrd-isi-edu/chaise/src/models/recordset';

// providers
import RecordsetProvider from '@isrd-isi-edu/chaise/src/providers/recordset';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

type ResultsetTableProps = {
  page: any,
  intersectScroll: boolean,
}

const ResultsetTable = ({
  page,
  intersectScroll,
}: ResultsetTableProps) : JSX.Element => {

  const logStack = [LogService.getStackNode(LogStackPaths.SET, page.reference.table, page.reference.filterInfo)];

  // TODO this whole thing should be passed from recordedit
  // so it can get the parent stackPath instead of assuming root
  const logStackPath = LogService.getStackPath(null, LogStackPaths.RESULT_DISABLED_SET);

  const config : RecordsetConfig = {
    viewable: false,
    editable: false,
    deletable: false,
    sortable: false,
    selectMode: RecordsetSelectMode.NO_SELECT,
    disableFaceting: true,
    displayMode: RecordsetDisplayMode.TABLE
  }

  return (
    <RecordsetProvider
      initialReference={page.reference}
      initialPageLimit={page.length}
      config={config}
      logInfo={{
        logStack,
        logStackPath
      }}
      initialPage={page}
    >
      <ResultsetTableInner config={config} reference={page.reference} intersectScroll={intersectScroll}/>
    </RecordsetProvider>
  )
}

const ResultsetTableInner = ({
  reference,
  config,
  intersectScroll,
}: {
  config: RecordsetConfig
  reference: any
  intersectScroll: boolean,
}) : JSX.Element => {
  return (
    <div>
      <RecordsetTable config={config} initialSortObject={reference.location.sortObject} intersectScroll={intersectScroll}/>
    </div>
  )
}

export default ResultsetTable;
