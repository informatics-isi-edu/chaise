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
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utils
import { CLASS_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';
import { determineScrollElement, displayCustomModeRelated } from '@isrd-isi-edu/chaise/src/utils/record-utils';
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
  mainContainerRef: any,
};

/**
 * Display a related table
 * It will also take care of showing the "custom mode" as well and it's not
 * just limited to tabular view.
 */
const RelatedTable = ({
  relatedModel,
  displaynameForID,
  mainContainerRef
}: RelatedTableProps): JSX.Element => {
  return (
    <RecordsetProvider
      initialReference={relatedModel.initialReference}
      {...relatedModel.recordsetProps}
    >
      <RelatedTableInner relatedModel={relatedModel} displaynameForID={displaynameForID} mainContainerRef={mainContainerRef} />
    </RecordsetProvider>
  )
}
const RelatedTableInner = ({
  relatedModel,
  displaynameForID,
  mainContainerRef
}: RelatedTableProps) => {
  const {
    page, isInitialized, hasTimeoutError, isLoading,
    updateMainEntity, addUpdateCauses, fetchSecondaryRequests,
    pagingSuccess, setPagingSuccess
  } = useRecordset();

  const {
    reference: recordReference, page: recordPage,
    relatedSectionInitialized,
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
   * When isLoading changes to false, related table has returned data and we should scroll to top
   */
  useEffect(() => {
    // return if:
    //    related section not initialized
    //    recordset content for related table is still loading
    //    there's no main container ref (should not happen)
    //    pagingSuccess is set to false
    if (!relatedSectionInitialized || isLoading || !mainContainerRef.current) return;

    if (!pagingSuccess) return;
    setPagingSuccess(false);

    const scrollElement = determineScrollElement(displaynameForID);
    if (!scrollElement) {
      $log.debug(`section '${displaynameForID}' not found for scrolling to!`);
      return;
    }

    const scrollElTop = scrollElement.getBoundingClientRect().top;
    const mainContainerTop = mainContainerRef.current.getBoundingClientRect().top;

    // return if related table header is at the top of main container or below the top (it's already visible)
    // NOTE: related table header can't be below the bottom of main container since the user clicked prev/next 
    //    for the related table we are looking at, meaning prev/next is above the bottom of main container and
    //    therefore the related table header is either visible or above the top of main container top
    if (scrollElTop >= mainContainerTop) return;

    const element = scrollElement as HTMLElement;
    mainContainerRef.current?.scrollTo({
      top: element.offsetTop,
      behavior: 'smooth',
    });

    // flash the activeness
    setTimeout(() => {
      element.classList.add('row-focus');
      setTimeout(() => {
        element.classList.remove('row-focus');
      }, 1600);
    }, 100);
  }, [isLoading])

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
          />
        </div>
      </div>
    </div >
  )
};

export default React.memo(RelatedTable);
