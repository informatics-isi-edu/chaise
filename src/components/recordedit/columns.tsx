
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';


const Columns = ({ columns }: { columns: any }) => {
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
      {columns.map((c: any, idx: number) => (
        <span key={idx} className='entity-key'>
          {!c.nullok && !c.inputDisabled && <span className='text-danger'><b>*</b> </span>}
          {c.comment ? 
            <ChaiseTooltip
              placement='right'
              tooltip={c.comment}
            >
              {renderColumnHeader(c)}
            </ChaiseTooltip> : 
            renderColumnHeader(c)
          }
        </span>
      ))}
    </div>
  );
}

export default Columns;