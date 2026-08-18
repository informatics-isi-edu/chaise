import { Handle, Position, type NodeProps } from '@xyflow/react';
import { type JSX } from 'react';

// providers
import { useErdStore } from '@isrd-isi-edu/chaise/src/providers/erd';

// utilities
import { visibleColumns, type ERDTableNodeModel } from '@isrd-isi-edu/chaise/src/utils/erd-utils';

/**
 * custom react-flow node for a table: a header band plus one row per visible
 * column. the detail level comes straight from the store, so toggling levels
 * re-renders the rows without the node objects changing.
 */
const ERDTableNode = ({ data }: NodeProps<ERDTableNodeModel>): JSX.Element => {
  const detail = useErdStore((state) => state.detail);
  const columns = visibleColumns(data.table, detail);

  return (
    <div className='erd-table-node'>
      {/* custom nodes have no built-in handles; without these, edges won't render */}
      <Handle type='target' position={Position.Left} />
      <Handle type='source' position={Position.Right} />
      <div className='erd-table-node-header' title={`${data.table.schema}:${data.table.name}`}>
        {data.table.name}
      </div>
      {columns.map((col) => (
        <div key={col.name} className='erd-table-node-row'>
          <span className={`erd-column-name${col.isPrimaryKey ? ' erd-column-pk' : ''}`}>
            {col.name}
            {col.isForeignKey && <span className='erd-column-fk-badge'>FK</span>}
          </span>
          <span className='erd-column-type'>{col.type}</span>
        </div>
      ))}
    </div>
  );
};

export default ERDTableNode;
