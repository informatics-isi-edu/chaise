import { Handle, Position, type NodeProps } from '@xyflow/react';
import { type JSX } from 'react';

// providers
import { useModelStore, ModelDetailLevel } from '@isrd-isi-edu/chaise/src/providers/model';

// utilities
import {
  FOCUS_RELATION_TEXT,
  visibleColumns,
  type ModelTableNodeModel,
} from '@isrd-isi-edu/chaise/src/utils/model-utils';

/**
 * custom react-flow node for a table: a header band plus one row per visible
 * column. the detail level comes straight from the store, so toggling levels
 * re-renders the rows without the node objects changing.
 */
const ModelTableNode = ({ id, data }: NodeProps<ModelTableNodeModel>): JSX.Element => {
  const detail = useModelStore((state) => state.detail);
  const focusTableId = useModelStore((state) => state.focusTableId);
  const relation = useModelStore((state) => state.focusRelations.get(id));
  const columns = visibleColumns(data.table, detail);

  let className = 'model-table-node';
  if (focusTableId === id) className += ' model-table-node-focus';
  else if (relation) className += ` model-table-node-${relation}`;

  // the color alone shouldn't carry the meaning
  let headerTitle = `${data.table.schema}:${data.table.name}`;
  if (relation) headerTitle += ` (${FOCUS_RELATION_TEXT[relation].tooltip} ${focusTableId})`;

  return (
    <div className={className}>
      {/* custom nodes have no built-in handles; without these, edges won't render */}
      <Handle type='target' position={Position.Left} />
      <Handle type='source' position={Position.Right} />
      <div className='model-table-node-header' title={headerTitle}>
        {data.table.name}
      </div>
      {columns.map((col) => (
        <div key={col.name} className='model-table-node-row'>
          <span className={`model-column-name${col.isPrimaryKey ? ' model-column-pk' : ''}`}>
            {col.name}
            {col.isForeignKey && detail !== ModelDetailLevel.KEYS && <span className='model-column-fk-badge'>FK</span>}
          </span>
          <span className='model-column-type'>{col.type}</span>
        </div>
      ))}
    </div>
  );
};

export default ModelTableNode;
