import { MouseEvent } from 'react';

// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// hooks
import useRecord from '@isrd-isi-edu/chaise/src/hooks/record';

// models
import { RecordRelatedModel } from '@isrd-isi-edu/chaise/src/models/record';
import { LogParentActions, LogReloadCauses } from '@isrd-isi-edu/chaise/src/models/log';

// utils
import { addQueryParamsToURL } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { allowCustomModeRelated, displayCustomModeRelated } from '@isrd-isi-edu/chaise/src/utils/record-utils';

type RelatedTableActionsProps = {
  relatedModel: RecordRelatedModel
}

const RelatedTableActions = ({
  relatedModel
}: RelatedTableActionsProps): JSX.Element => {

  const { reference, toggleRelatedDisplayMode, updateRecordPage } = useRecord();

  let containerClassName = 'related-table-actions';
  // if (relatedModel.isInline) {
  //   containerClassName = relatedModel.isTableDisplay ?  ' action-bar-entity-table-mode' : ' action-bar-entity-display-mode';
  // }

  const usedRef = relatedModel.initialReference;

  /**
   * this is to avoid the accordion header to recieve the click
   */
  const onExplore = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
  };

  const onToggleDisplayMode = (e: MouseEvent<HTMLElement>) => {
    // this is to avoid the accordion header to recieve the click
    e.stopPropagation();
    toggleRelatedDisplayMode(relatedModel.index, relatedModel.isInline);
  }

  const onCreate = (e: MouseEvent<HTMLElement>) => {
    // this is to avoid the accordion header to recieve the click
    e.stopPropagation();

    // TODO implement add related and p&b

    // TODO this is added for test purposes and should be removed
    updateRecordPage(true, LogReloadCauses.RELATED_UPDATE);
  };

  const onUnlink = (e: MouseEvent<HTMLElement>) => {
    // this is to avoid the accordion header to recieve the click
    e.stopPropagation();

    // TODO implement unlink p&b

    // TODO this is added for test purposes and should be removed
    updateRecordPage(true, LogReloadCauses.RELATED_UPDATE);
  };

  const mainTable = <code><DisplayValue value={reference.displayname}></DisplayValue></code>;
  const currentTable = <code><DisplayValue value={usedRef.displayname}></DisplayValue></code>;

  const exploreLink = addQueryParamsToURL(usedRef.appLink, {
    paction: LogParentActions.EXPLORE
  });

  const renderCustomModeBtn = () => {
    let tooltip: string | JSX.Element = '', icon = '', label = '';
    if (displayCustomModeRelated(relatedModel)) {
      icon = 'fas fa-table';
      if (relatedModel.canEdit) {
        tooltip = <span>Display edit controls for {currentTable} related to this {mainTable}.</span>;
        label = 'Edit mode';
      } else {
        tooltip = <span>Displayed related {currentTable} in tabular mode.</span>
        label = 'Table mode';
      }
    } else {
      icon = 'fa-solid fa-grip';
      tooltip = 'Switch back to the custom display mode';
      label = 'Custom mode';
    }

    return (
      <ChaiseTooltip
        placement='top'
        tooltip={tooltip}
      >
        <div className='chaise-btn chaise-btn-secondary toggle-display-link' onClick={onToggleDisplayMode}>
          <span className={`chaise-btn-icon ${icon}`}></span>
          <span>{label}</span>
        </div>
      </ChaiseTooltip>
    )
  };

  return (
    <div className={containerClassName}>
      {relatedModel.canCreate &&
        <ChaiseTooltip
          placement='top'
          tooltip={<span>Connect {currentTable} records to this {mainTable}.</span>}
        >
          <div className='chaise-btn chaise-btn-secondary add-records-link' onClick={onCreate}>
            <span className='chaise-btn-icon fa-solid fa-plus'></span>
            <span>{relatedModel.isPureBinary ? 'Link' : 'Add'} records</span>
          </div>
        </ChaiseTooltip>
      }
      {relatedModel.isPureBinary && relatedModel.canDelete &&
        <ChaiseTooltip
          placement='top'
          tooltip={<span>Disconnect {currentTable} records from this {mainTable}.</span>}
        >
          <div className='chaise-btn chaise-btn-secondary unlink-records-link' onClick={onUnlink}>
            <span className='chaise-btn-icon fa-regular fa-circle-xmark'></span>
            <span>Unlink records</span>
          </div>
        </ChaiseTooltip>
      }
      {allowCustomModeRelated(relatedModel) && renderCustomModeBtn()}
      <ChaiseTooltip
        placement='top'
        tooltip={<span>Explore more {currentTable} records related to this {mainTable}.</span>}
      >
        <a className='chaise-btn chaise-btn-secondary more-results-link' href={exploreLink} onClick={onExplore}>
          <span className='chaise-btn-icon fa-solid fa-magnifying-glass'></span>
          <span>Explore</span>
        </a>
      </ChaiseTooltip>
    </div>
  );
};

export default RelatedTableActions;
