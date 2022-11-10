
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';


const Columns = ({ columns }: { columns: any }) => {
  return (
    <div className='entity-key-column'>
      {columns.map((c: any, idx: number) => (
        <span key={idx} className='entity-key'>
          <DisplayValue value={c?.displayname} />
        </span>
      ))}
    </div>
  );
}

export default Columns;