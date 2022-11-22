// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// hooks
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';

// utils
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';

const KeyColumn = (): JSX.Element => {
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
      <span className='form-header entity-key'>Record Number</span>
      {columnModels.map((cm: any) => {
        const column = cm.column; 
        const colName = makeSafeIdAttr(column?.displayname?.value);
        const height = keysHeightMap[colName];
        const heightparam = height == -1 ? 'auto' : `${height}px`;

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