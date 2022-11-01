
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';


const Columns = ({ columns }) => {
    return (
        <div className='record-edit-column'>
            {columns.map(c => (
                <>
                    <DisplayValue value={c?.displayname} className='column-cell'/>
              </>
            ))}
        </div>
    );
}

export default Columns;