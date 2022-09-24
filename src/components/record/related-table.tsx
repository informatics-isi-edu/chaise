import { useEffect } from 'react';

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
import { displayCustomModeRelated } from '@isrd-isi-edu/chaise/src/utils/record-utils';

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
  relatedModel,
}: RelatedTableProps) => {
  const {
    page, isInitialized, hasTimeoutError, isLoading,
    updateMainEntity, addUpdateCauses, fetchSecondaryRequests,
  } = useRecordset();
  const {
    reference: recordReference, page : recordPage, updateRelatedRecordsetState, registerRelatedModel
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
  const displayCustomMode = displayCustomModeRelated(relatedModel);

  const contaienrClassName = relatedModel.isInline && relatedModel.isTableDisplay ? '' : '';

  return (
    <div className={contaienrClassName}>
      {usedRef.commentDisplay === 'inline' && usedRef.comment &&
        <div className='inline-tooltip'>{usedRef.comment}</div>
      }
      {displayCustomMode &&
        <>
          {relatedModel.tableMarkdownContent === null &&
            <span className='markdown-container'><em><strong>None</strong></em></span>
          }
          {relatedModel.tableMarkdownContent !== null &&
            <DisplayValue className='related-markdown-content' addClass={true} value={{ isHTML: true, value: relatedModel.tableMarkdownContent }} />
          }
        </>

      }
      {/* TODO the following was span for inline, but shouldn't matter */}
      {/* TODO related-table and related-table-accordion classes removed  */}
      <div className={`related-table-content ${displayCustomMode ? 'forced-hidden' : ''}`} style={{ display: displayCustomMode ? 'none' : 'block' }}>
        <TableHeader config={relatedModel.recordsetProps.config}></TableHeader>
        <RecordsetTable
          config={relatedModel.recordsetProps.config}
          initialSortObject={usedRef.location.sortObject}
        />
      </div>
    </div >
  )
};

export default RelatedTable;
