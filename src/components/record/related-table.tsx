import React, { useEffect } from 'react';

// components
import DisplayCommentValue from '@isrd-isi-edu/chaise/src/components/display-comment-value';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import RecordsetTable from '@isrd-isi-edu/chaise/src/components/recordset/recordset-table';
import TableHeader from '@isrd-isi-edu/chaise/src/components/recordset/table-header';

// hooks
import useRecord from '@isrd-isi-edu/chaise/src/hooks/record';
import useRecordset from '@isrd-isi-edu/chaise/src/hooks/recordset';

// models
import { CommentDisplayModes } from '@isrd-isi-edu/chaise/src/models/displayname';
import { RecordRelatedModel } from '@isrd-isi-edu/chaise/src/models/record';

// providers
import RecordsetProvider from '@isrd-isi-edu/chaise/src/providers/recordset';

// services

// utils
import { CLASS_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';
import { displayCustomModeRelated } from '@isrd-isi-edu/chaise/src/utils/record-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';

type RelatedTableProps = {
  /**
   * the related model that we want to represent
   */
  relatedModel: RecordRelatedModel,
  /**
   * the displayname for the reference to be used in the id attached to the container
   */
  displaynameForID: string

  intersectScroll?: boolean,
};

/**
 * Display a related table
 * It will also take care of showing the "custom mode" as well and it's not
 * just limited to tabular view.
 */
const RelatedTable = ({
  relatedModel,
  displaynameForID,
  intersectScroll
}: RelatedTableProps): JSX.Element => {
  return (
    <RecordsetProvider
      initialReference={relatedModel.initialReference}
      {...relatedModel.recordsetProps}
    >
      <RelatedTableInner relatedModel={relatedModel} displaynameForID={displaynameForID} intersectScroll={intersectScroll}/>
    </RecordsetProvider>
  )
}
const RelatedTableInner = ({
  relatedModel,
  displaynameForID,
  intersectScroll
}: RelatedTableProps) => {
  const {
    page, isInitialized, hasTimeoutError, isLoading,
    updateMainEntity, addUpdateCauses, fetchSecondaryRequests,
  } = useRecordset();

  const {
    reference: recordReference, page: recordPage,
    updateRelatedRecordsetState, registerRelatedModel
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
      {!relatedModel.isInline && usedRef.comment && usedRef.comment.displayMode === CommentDisplayModes.INLINE &&
        <div className='inline-tooltip inline-tooltip-lg'><DisplayCommentValue comment={usedRef.comment} /></div>
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
      <div className={`related-table-content${displayCustomMode ? (' ' + CLASS_NAMES.HIDDEN) : ''}`}>
        <TableHeader config={relatedModel.recordsetProps.config}></TableHeader>
        <div id={`rt-${makeSafeIdAttr(displaynameForID)}`}>
          <RecordsetTable
            config={relatedModel.recordsetProps.config}
            initialSortObject={usedRef.location.sortObject}
            intersectScroll={intersectScroll}
          />
        </div>
      </div>
    </div >
  )
};

export default React.memo(RelatedTable);
