// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// hooks
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';

const KeyColumn = (): JSX.Element => {

  const { columnModels } = useRecordedit();

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
      {columnModels.map((cm: any, cmIndex: number) => {
        const column = cm.column;
        const colName = column.name;

        // try changing to div if height adjustment does not work
        return (
          // NOTE `entity-key-${cmIndex}` is used in form-container.tsx
          // to ensure consistent height between this element and FormRow
          <span key={colName} className={`entity-key entity-key-${cmIndex}`} >
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
