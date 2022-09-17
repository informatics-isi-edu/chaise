
// components
import RecordsetTable from '@isrd-isi-edu/chaise/src/components/recordset/recordset-table';
import TableHeader from '@isrd-isi-edu/chaise/src/components/recordset/table-header';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// hooks
import useRecordset from '@isrd-isi-edu/chaise/src/hooks/recordset';
import useRecord from '@isrd-isi-edu/chaise/src/hooks/record';

// models
import { RecordRelatedModel } from '@isrd-isi-edu/chaise/src/models/record';

// providers
import RecordsetProvider from '@isrd-isi-edu/chaise/src/providers/recordset';

// utils
import { useEffect } from 'react';

type RelatedTableProps = {
  relatedModel: RecordRelatedModel
};

const RelatedTable = ({
  relatedModel
}: RelatedTableProps): JSX.Element => {
  return (
    <RecordsetProvider
      initialReference={relatedModel.initialReference}
      // TODO the following most probably should go somewhere else:
      {...relatedModel.recordsetProps}
    >
      <RelatedTableInner relatedModel={relatedModel} />
    </RecordsetProvider>
  )
}
const RelatedTableInner = ({
  relatedModel
}: RelatedTableProps) => {
  const {
    page, isInitialized, hasTimeoutError, isLoading,
    updateMainEntity, addUpdateCauses, fetchSecondaryRequests,
   } = useRecordset();
  const {
    updateRelatedRecordsetState, registerRelatedModel
  } = useRecord();

  // update the recordset state in recordProvider
  useEffect(() => {
    updateRelatedRecordsetState(relatedModel.index, relatedModel.isInline, { page, isInitialized, hasTimeoutError, isLoading });
  }, [page, isInitialized, hasTimeoutError, isLoading]);

  // register the recordset functions in the recordProvider
  useEffect(() => {
    registerRelatedModel(relatedModel.index, relatedModel.isInline, updateMainEntity, fetchSecondaryRequests, addUpdateCauses);
  }, []);

  const usedRef = relatedModel.initialReference;

  /**
   * allow related table markdown display if all the following are true:
   *  - reference.display.type is `markdown`
   *  - related table has data.
   *  - related table's tableMarkdownContent is not empty string
   */
  const allowInlineTableMarkdown = usedRef.display.type === 'markdown' && page &&
    page.length > 0 && relatedModel.tableMarkdownContentInitialized && relatedModel.tableMarkdownContent !== '';

  const displayMarkdown = allowInlineTableMarkdown && !relatedModel.isTableDisplay;

  return (
    // TODO class: 'inline-table-display': col.tableModel.isTableDisplay || !allowInlineTableMarkdown($index)}
    // <div class="row" style="margin-right: 0px; margin-left: 0px;">
    <div>
      {usedRef.commentDisplay === 'inline' && usedRef.comment &&
        <div className='inline-tooltip'>{usedRef.comment}</div>
      }
      {displayMarkdown &&
        <DisplayValue addClass={true} value={{isHTML: true, value: relatedModel.tableMarkdownContent}} />
      }
      {/* TODO the following was span for inline, but shouldn't matter */}
      {/* TODO related-table and related-table-accordion classes removed  */}
      {!displayMarkdown &&
        < div className='related-table-content'>
          <TableHeader config={relatedModel.recordsetProps.config}></TableHeader>
          <RecordsetTable
            config={relatedModel.recordsetProps.config}
            initialSortObject={usedRef.location.sortObject}
          />
        </div>
      }
    </div >
  )
};

export default RelatedTable;
