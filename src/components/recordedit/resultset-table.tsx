// components
import RecordsetTable from '@isrd-isi-edu/chaise/src/components/recordset/recordset-table';

// models
import { RecordsetConfig } from '@isrd-isi-edu/chaise/src/models/recordset'
import { RecordsetDisplayMode, RecordsetSelectMode } from '@isrd-isi-edu/chaise/src/models/recordset';
import { LogStackPaths } from '@isrd-isi-edu/chaise/src/models/log';

// providers
import RecordsetProvider from '@isrd-isi-edu/chaise/src/providers/recordset';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

type ResultsetTableProps = {
  page: any,
  /**
  * Determines if both horizontal scrollbars should always be visible, or if only one should appear at a time.
  */
  showSingleScrollbar: boolean,
}

const ResultsetTable = ({
  page,
  showSingleScrollbar,
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
      <ResultsetTableInner config={config} reference={page.reference} showSingleScrollbar={showSingleScrollbar}/>
    </RecordsetProvider>
  )
}

const ResultsetTableInner = ({
  reference,
  config,
  showSingleScrollbar,
}: {
  config: RecordsetConfig
  reference: any
  showSingleScrollbar: boolean,
}) : JSX.Element => {
  return (
    <div>
      <RecordsetTable config={config} initialSortObject={reference.location.sortObject} showSingleScrollbar={showSingleScrollbar}/>
    </div>
  )
}

export default ResultsetTable;
