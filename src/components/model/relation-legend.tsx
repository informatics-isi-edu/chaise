import { type JSX } from 'react';

// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// models
import type { ModelFocusRelation } from '@isrd-isi-edu/chaise/src/models/model-app';

// providers
import { useModelStore } from '@isrd-isi-edu/chaise/src/providers/model';

// utilities
import { FOCUS_RELATION_TEXT } from '@isrd-isi-edu/chaise/src/utils/model-utils';

const RELATION_ORDER: ModelFocusRelation[] = ['inbound', 'outbound', 'both'];

interface ModelRelationLegendProps {
  /**
   * the tables in the diagram; kinds with none of them drawn are left out
   */
  drawnTableIds: Set<string>;
}

/**
 * explains the header colors while a table's neighbors are shown, next to the
 * zoom controls. lists only the kinds that are drawn.
 */
const ModelRelationLegend = ({ drawnTableIds }: ModelRelationLegendProps): JSX.Element | null => {
  const focusTableId = useModelStore((state) => state.focusTableId);
  const focusRelations = useModelStore((state) => state.focusRelations);
  // e.g. after a failed layout cleared the canvas
  if (!focusTableId || !drawnTableIds.has(focusTableId)) return null;

  const present = new Set<ModelFocusRelation>();
  focusRelations.forEach((relation, id) => {
    if (drawnTableIds.has(id)) present.add(relation);
  });
  return (
    <div className='model-relation-legend'>
      <ChaiseTooltip placement='top' tooltip='The table picked in Model Scope. The other tables are its neighbors.'>
        <span className='model-relation-legend-item'>
          <span className='model-relation-legend-swatch model-relation-legend-focus' />
          Focused table
        </span>
      </ChaiseTooltip>
      {RELATION_ORDER.filter((relation) => present.has(relation)).map((relation) => (
        <ChaiseTooltip key={relation} placement='top' tooltip={FOCUS_RELATION_TEXT[relation].legendTooltip}>
          <span className='model-relation-legend-item'>
            <span className={`model-relation-legend-swatch model-relation-legend-${relation}`} />
            {FOCUS_RELATION_TEXT[relation].legend}
          </span>
        </ChaiseTooltip>
      ))}
    </div>
  );
};

export default ModelRelationLegend;
