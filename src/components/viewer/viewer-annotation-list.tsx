
// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import ShareCiteButton from '@isrd-isi-edu/chaise/src/components/share-cite-button';

// hooks
import useViewer from '@isrd-isi-edu/chaise/src/hooks/viewer';
import { useRef, useState } from 'react';

// models
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';
import { ViewerAnnotationModal } from '@isrd-isi-edu/chaise/src/models/viewer';

// services
import ViewerAnnotationService from '@isrd-isi-edu/chaise/src/services/viewer-annotation';
import ViewerConfigService from '@isrd-isi-edu/chaise/src/services/viewer-config';

// utils
import { VIEWER_CONSTANT } from '@isrd-isi-edu/chaise/src/utils/constants';

const ViewerAnnotationList = (): JSX.Element => {
  const {
    annotationModels, loadingAnnotations, toggleAnnotationDisplay, changeAllAnnotationVisibility,
    toggleHighlightAnnotation, highlightedAnnotationIndex, logViewerClientAction,
    canCreateAnnotation, startAnnotationEdit, startAnnotationCreate, startAnnotationDelete
  } = useViewer();

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
        logViewerClientAction(LogActions.SEARCH_BOX_AUTO, true, undefined, { search_str: term });
        searchTimeout.current = null;
      }, VIEWER_CONSTANT.ANNOTATIONS.SEARCH_LOG_TIMEOUT);
    }
  }

  const clearSearchTerm = () => {
    setSearchTerm('');
    logViewerClientAction(LogActions.SEARCH_BOX_CLEAR, true);
  }

  // ----------------------- render functions --------------------- //

  const renderAnnotation = (annot: ViewerAnnotationModal, index: number) => {
    const isDisplayed = annot.isDisplayed;

    return (
      <div
        key={annot.name} className={`annotation-row${highlightedAnnotationIndex === index ? ' highlighted' : ''}`}
        onClick={(e) => toggleHighlightAnnotation(index, e)}
      >
        <div className='annotation-row-btns'>
          <ChaiseTooltip placement='bottom' tooltip={isDisplayed ? 'Toggle to hide this annitation' : 'Toggle to show this annotation'}>
            <button className='chaise-btn chaise-btn-tertiary chaise-btn-sm annotation-row-btn' onClick={(e) => toggleAnnotationDisplay(index, e)}>
              <i className={`fa-solid ${isDisplayed ? 'fa-eye' : 'fa-eye-slash'}`}></i>
            </button>
          </ChaiseTooltip>
          {annot.canUpdate && <ChaiseTooltip placement='bottom' tooltip='Edit this annotation'>
            <button className='chaise-btn chaise-btn-tertiary chaise-btn-sm annotation-row-btn' onClick={(e) => startAnnotationEdit(index, e)}>
              <i className='fa-solid fa-pencil'></i>
            </button>
          </ChaiseTooltip>}
          {(annot.canDelete && annot.isStoredInDB) && <ChaiseTooltip placement='bottom' tooltip='Delete this annotation'>
            <button className='chaise-btn chaise-btn-tertiary chaise-btn-sm annotation-row-btn' onClick={(e) => startAnnotationDelete(index, e)}>
              <i className='fa-regular fa-trash-alt'></i>
            </button>
          </ChaiseTooltip>}
          {annot.tuple &&
            <ShareCiteButton
              reference={annot.tuple.reference} tuple={annot.tuple} citation={{ isReady: true, value: null }}
              title='Share Annotation'
              logStack={ViewerAnnotationService.getAnnotationLogStack(annot)}
              logStackPath={ViewerAnnotationService.getAnnotationLogStackPath(annot)}
              hideHeaders
              extraInfo={[
                {
                  title: 'RID',
                  value: annot.tuple.data.RID,
                  link: annot.tuple.reference.contextualize.detailed.appLink
                },
                {
                  title: ViewerConfigService.annotationConfig.annotated_term_displayname,
                  value: annot.name + (annot.id ? ` (${annot.id})` : '')
                }
              ]}
              btnClass='chaise-btn chaise-btn-tertiary chaise-btn-sm annotation-row-btn share-btn'
              btnTooltip={{ ready: 'Share this annotation', pending: 'Opening the share links...' }}
              onBtnClick={e => {
                // avoid the highlight toggle event
                e.stopPropagation();
                // make sure the annotation is highlighted
                toggleHighlightAnnotation(index, undefined, false, true);
              }}
            />
          }
        </div>
        <div className='annotation-row-colors'>
          {annot.colors.map((color, i) => (
            <span
              key={`annotation-color-${i}`}
              className='annotation-row-color'
              style={{ backgroundColor: color, width: 100 / annot.colors.length + '%' }}
            />
          ))}
        </div>
        <div className='annotation-row-name'>
          <span>{annot.name} </span>
          {annot.url && <ChaiseTooltip placement='bottom' tooltip='View details and associated data'>
            <a href={annot.url} target='_blank' rel='noreferrer' >({annot.id})</a>
          </ChaiseTooltip>}
        </div>
      </div>
    )
  };

  const renderAnnotations = () => {
    const keyword = searchTerm.toLocaleLowerCase();
    let displayedCount = 0;
    const renderedAnnots: ViewerAnnotationModal[] = [];
    annotationModels.forEach((annot) => {
      const id = annot.id ? annot.id.toLocaleLowerCase() : '';
      const name = annot.name ? annot.name.toLocaleLowerCase() : '';
      const isRendered = !keyword || ((id.indexOf(keyword) >= 0) || (name.indexOf(keyword) >= 0));

      if (isRendered && annot.isDisplayed) displayedCount++;
      if (isRendered) renderedAnnots.push(annot);
    });

    return (
      <>
        <div className='annotation-summary-row'>
          <span>Found {renderedAnnots.length} of {annotationModels.length} ({displayedCount} Displayed)</span>
          <div className='chaise-btn-group'>
            <ChaiseTooltip tooltip='Show all the annotations' placement='bottom'>
              <button className='chaise-btn chaise-btn-secondary' onClick={() => changeAllAnnotationVisibility(true)}>
                <i className='fa-solid fa-eye'></i>
              </button>
            </ChaiseTooltip>
            <ChaiseTooltip tooltip='Hide all the annotations' placement='bottom'>
              <button className='chaise-btn chaise-btn-secondary' onClick={() => changeAllAnnotationVisibility(false)}>
                <i className='fa-solid fa-eye-slash'></i>
              </button>
            </ChaiseTooltip>
          </div>
        </div>
        {renderedAnnots.length === 0 && <div className='no-annotation-message'>No annotation found.</div>}
        {renderedAnnots.length > 0 && <div className='annotation-rows'>{renderedAnnots.map((ann, i) => renderAnnotation(ann, i))}</div>}
      </>
    )

  }

  return (
    <div className='annotation-list-container'>
      {/* not using SearchInput here because this button and that comp are very different */}
      <div className='search-box-row'>
        <div className={`chaise-search-box chaise-input-group${loadingAnnotations ? ' disabled-element' : ''}`}>
          <div className={`chaise-input-control has-feedback${loadingAnnotations ? ' input-disabled' : ''}`}>
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
        {canCreateAnnotation &&
          <ChaiseTooltip placement='bottom' tooltip='Create new annotation'>
            <button className='btn chaise-btn chaise-btn-primary' onClick={startAnnotationCreate} disabled={loadingAnnotations}>New</button>
          </ChaiseTooltip>
        }
      </div>
      {!loadingAnnotations && renderAnnotations()}
    </div>
  )
}


export default ViewerAnnotationList;
