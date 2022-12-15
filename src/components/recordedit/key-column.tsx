// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// hooks
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';

// utils
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { DEFAULT_HEGHT_MAP } from '@isrd-isi-edu/chaise/src/utils/input-utils';

import { getInputType } from '@isrd-isi-edu/chaise/src/utils/input-utils';


const KeyColumn = (): JSX.Element => {
  const getInputTypeOrDisabled = (column: any) => {
    return 'longtext';
    if (column.inputDisabled) {
      // TODO: if showSelectAll, disable input
      // TODO: create column models, no column model, enable!
      // TODO: is editMode and user cannot update this row, disable
      return 'disabled';
    }
    return getInputType(column.type);
  }

  const { columnModels, keysHeightMap } = useRecordedit();

  const renderColumnHeader = (column: any) => {
    const headerClassName = `column-displayname${column.comment ? ' chaise-icon-for-tooltip' : ''}`;
    return (
      <span className={headerClassName}>
        <DisplayValue value={column.displayname} />
        {column.comment ? ' ' : ''}
      </span>
    )
  }

  return (
    <div className='entity-key-column'>
      <div className='form-header entity-key'>Record Number</div>
      {columnModels.map((cm: any) => {
        const column = cm.column; 
        const colName = makeSafeIdAttr(column?.displayname?.value);
        const height = keysHeightMap[colName];
        const colType = getInputTypeOrDisabled(column);
        const defaultHeight = DEFAULT_HEGHT_MAP[colType];
        const heightparam = height == -1 ? defaultHeight : `${height}px`;
        return (
          <span key={colName} className='entity-key' style={{ 'height': heightparam }}>
            {cm.isRequired && <span className='text-danger'><b>*</b> </span>}
            {column.comment ?
              <ChaiseTooltip
                placement='right'
                tooltip={column.comment}
              >
                {renderColumnHeader(column)}
              </ChaiseTooltip> :
              renderColumnHeader(column)
            }
          </span>
        )
      })}

    </div>
  );
}

export default KeyColumn;