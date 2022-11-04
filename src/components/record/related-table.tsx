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
import { CLASS_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';

type RelatedTableProps = {
  /**
   * the related model that we want to represent
   */
  relatedModel: RecordRelatedModel,
  /**
   * the id attached to the container
   */
  tableContainerID: string
};

/**
 * Display a related table
 * It will also take care of showing the "custom mode" as well and it's not
 * just limited to tabular view.
 */
const RelatedTable = ({
  relatedModel,
  tableContainerID
}: RelatedTableProps): JSX.Element => {
  return (
    <RecordsetProvider
      initialReference={relatedModel.initialReference}
      {...relatedModel.recordsetProps}
    >
      <RelatedTableInner relatedModel={relatedModel} tableContainerID={tableContainerID} />
    </RecordsetProvider>
  )
}
const RelatedTableInner = ({
  relatedModel,
  tableContainerID
}: RelatedTableProps) => {
  const {
    page, isInitialized, hasTimeoutError, isLoading,
    updateMainEntity, addUpdateCauses, fetchSecondaryRequests,
  } = useRecordset();
  const {
    reference: recordReference, page : recordPage, updateRelatedRecordsetState, registerRelatedModel
  } = useRecord();

  /**
   * update the recordset state in recordProvider
   * In here we should list every recordset provider state variables that we want to have
   * access to in the record provider.
   */
  useEffect(() => {
    updateRelatedRecordsetState(relatedModel.index, relatedModel.isInline, { page, isInitialized, hasTimeoutError, isLoading });
  }, [page, isInitialized, hasTimeoutError, isLoading]);

  /**
   * register the recordset functions in the recordProvider
   * This function will capture references to the functions, that's why we don't need to
   * repeat this registration.
   */
  useEffect(() => {
    registerRelatedModel(relatedModel.index, relatedModel.isInline, updateMainEntity, fetchSecondaryRequests, addUpdateCauses);
  }, []);

  const usedRef = relatedModel.initialReference;
  const displayCustomMode = displayCustomModeRelated(relatedModel);

  return (
    <div>
      {/* in case of inline, the comments are already handled */}
      {!relatedModel.isInline && usedRef.commentDisplay === 'inline' && usedRef.comment &&
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
      <div className={`related-table-content ${displayCustomMode ? CLASS_NAMES.HIDDEN : ''}`}>
        <TableHeader config={relatedModel.recordsetProps.config}></TableHeader>
        <div id={tableContainerID}>
          <RecordsetTable
            config={relatedModel.recordsetProps.config}
            initialSortObject={usedRef.location.sortObject}
          />
        </div>
      </div>
    </div >
  )
};

export default RelatedTable;
