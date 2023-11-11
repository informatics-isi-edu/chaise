
// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';

// hooks
import useViewer from '@isrd-isi-edu/chaise/src/hooks/viewer';
import { useRef, useState } from 'react';

// models
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';
import { ViewerAnnotationModal } from '@isrd-isi-edu/chaise/src/models/viewer';

// services
import ViewerAnnotationService from '@isrd-isi-edu/chaise/src/services/viewer-annotation';

// utils
import { VIEWER_CONSTANT } from '@isrd-isi-edu/chaise/src/utils/constants';

const ViewerAnnotationList = (): JSX.Element => {
  const { annotationModels, loadingAnnotations, canCreateAnnotation, switchToCreateMode } = useViewer();

  const [searchTerm, setSearchTerm] = useState<string>('');

  const searchTimeout = useRef<any>();

  // ------------------------ callbacks ------------------------- //

  const onSearchTermChange = (e: any) => {
    let term = e.target.value;
    setSearchTerm(term);

    if (term) term = term.trim();
    if (term) {
      // if a log promise is already fired, remove it
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }

      // create a timeout to log the search
      searchTimeout.current = setTimeout(() => {
        ViewerAnnotationService.logAnnotationClientAction(
          LogActions.SEARCH_BOX_AUTO,
          null,
          {
            search_str: term
          }
        );

        searchTimeout.current = null;
      }, VIEWER_CONSTANT.ANNOTATIONS.SEARCH_LOG_TIMEOUT);
    }
  }

  const clearSearchTerm = () => {
    setSearchTerm('');
    ViewerAnnotationService.logAnnotationClientAction(LogActions.SEARCH_BOX_CLEAR);
  }

  // ----------------------- render functions --------------------- //

  const renderAnnotation = (annot: ViewerAnnotationModal) => {
    // TODO proper ui elements and styles
    // TODO Aref highlight
    // TODO Aref display/hide
    // TODO Aref edit
    // TODO share
    return (
      <div key={annot.name}>
        <span>{annot.name}</span>
        {annot.url && <a href={annot.url} target='_blank' rel='noreferrer' >{annot.id}</a>}
        <button><i className='fa-solid fa-pencil'></i></button>
      </div>
    )
  };

  const renderAnnotations = () => {
    const keyword = searchTerm.toLocaleLowerCase();
    const renderedAnnots = !keyword ? annotationModels : annotationModels.filter((annot) => {
      const id = annot.id ? annot.id.toLocaleLowerCase() : '';
      const name = annot.name ? annot.name.toLocaleLowerCase() : '';
      return (id.indexOf(keyword) >= 0) || (name.indexOf(keyword) >= 0);
    })

    let displayingMessage = `Displaying ${renderedAnnots.length}`;
    if (!loadingAnnotations) {
      displayingMessage += ` of ${annotationModels.length} ${keyword ? 'matching annotations' : 'annotations'}`;
    }

    return (
      <>
        <span>{displayingMessage}</span>
        {!loadingAnnotations && renderedAnnots.length === 0 && <div className='no-annotation-message'>No annotation found.</div>}
        {renderedAnnots.length > 0 && <div>{renderedAnnots.map((ann) => renderAnnotation(ann))}</div>}
      </>
    )

  }

  return (
    <div className='annotation-list-container'>
      {/* TODO display all/none. */}
      {/* not using SearchInput here because this button and that comp are very different */}
      <div>
        <div className={`chaise-search-box chaise-input-group${loadingAnnotations ? ' disabled-element' : ''}`}>
          <div className='chaise-input-control has-feedback'>
            <input type='text' placeholder='Search in the list' value={searchTerm} onChange={onSearchTermChange} disabled={loadingAnnotations} />
            <ClearInputBtn btnClassName='remove-search-btn' clickCallback={clearSearchTerm} show={!!searchTerm} />
          </div>
          <div className='chaise-input-group-append'>
            <ChaiseTooltip placement='bottom-start' tooltip='Search any keyword to filter anatomy'>
              <button className='chaise-search-btn chaise-btn chaise-btn-primary' disabled={loadingAnnotations}>
                <span className='chaise-btn-icon fa-solid fa-magnifying-glass' />
              </button>
            </ChaiseTooltip>
          </div>
        </div>
        {canCreateAnnotation && <button className='btn chaise-btn chaise-btn-primary' onClick={switchToCreateMode}>New</button>}
      </div>
      <div>{renderAnnotations()}</div>
    </div>
  )
}


export default ViewerAnnotationList;
