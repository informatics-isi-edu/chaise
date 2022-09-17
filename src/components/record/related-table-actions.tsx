// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// models
import { RecordRelatedModel } from '@isrd-isi-edu/chaise/src/models/record';
import { LogParentActions } from '@isrd-isi-edu/chaise/src/models/log';

// utils
import { addQueryParamsToURL } from '@isrd-isi-edu/chaise/src/utils/uri-utils';

type RelatedTableActionsProps = {
  relatedModel: RecordRelatedModel
}

const RelatedTableActions = ({
  relatedModel
}: RelatedTableActionsProps): JSX.Element => {
  let containerClassName = 'action-bar-RT-heading';
  if (relatedModel.isInline) {
    containerClassName = relatedModel.isTableDisplay ? 'action-bar-entity-display-mode' : 'action-bar-entity-table-mode';
  }

  const usedRef = relatedModel.initialReference;

  const exploreLink = addQueryParamsToURL(usedRef.appLink, {
    paction: LogParentActions.EXPLORE
  });

  return (
    <div className={containerClassName}>
      {/* <span ng-if="canCreate" uib-tooltip-html="'{{tooltip.createButton}}'" tooltip-placement="auto top">
          <button class="chaise-btn chaise-btn-secondary add-records-link" ng-click="addRelatedRecord({tableModel:tableModel})" ng-disabled="canCreateDisabled" ng-style="{'pointer-events': canCreateDisabled ? 'none' : ''}">
            <span class="chaise-btn-icon glyphicon glyphicon-plus"></span>
            <span>{{ isPureAndBinary? "Link": "Add" }} records</span>
          </button>
        </span> */}
      {/* <span ng-if="canDelete">
          <button class="chaise-btn chaise-btn-secondary unlink-records-link" ng-click="deleteRelatedRecord({tableModel:tableModel})" uib-tooltip-html="'{{tooltip.deleteButton}}'" tooltip-placement="auto top">
            <span class="chaise-btn-icon glyphicon glyphicon-remove-circle"></span>
            <span>{{ isPureAndBinary? "Unlink": "Delete" }} records</span>
          </button>
        </span> */}
      {/* <span ng-if="showToggleDisplayBtn">
          <span ng-if="!isTableDisplay">
            <button class="chaise-btn chaise-btn-secondary toggle-display-link" ng-click="toggleDisplayMode({dataModel:dataModel})" uib-tooltip-html="'{{tooltip.tableModeButton}}'" tooltip-placement="auto top">
              <span class="chaise-btn-icon fas fa-table"></span>
              <span>{{ canEdit? "Edit mode": "Table mode" }}</span>
            </button>
          </span>
          <span ng-if="isTableDisplay">
            <button class="chaise-btn chaise-btn-secondary toggle-display-link" ng-click="toggleDisplayMode({dataModel:dataModel})" uib-tooltip="Switch back to the custom display mode" tooltip-placement="auto top">
              <span class="chaise-btn-icon glyphicon glyphicon-th"></span>
              <span>Custom mode</span>
            </button>
          </span>
        </span> */}
      <ChaiseTooltip
        placement='top'
        tooltip={
          <span>
            Explore more <code><DisplayValue value={usedRef.displayname}></DisplayValue></code> records
            related to this <code><DisplayValue value={usedRef.table.displayname}></DisplayValue></code>.
          </span>
        }
      >
        <a className='chaise-btn chaise-btn-secondary more-results-link' href={exploreLink}>
          <span className='chaise-btn-icon fa-solid fa-magnifying-glass'></span>
          <span>Explore</span>
        </a>
      </ChaiseTooltip>
    </div>
  );
};

export default RelatedTableActions;
