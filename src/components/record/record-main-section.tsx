import '@isrd-isi-edu/chaise/src/assets/scss/_record-main-section.scss';

// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// hooks
import useRecord from '@isrd-isi-edu/chaise/src/hooks/record';

/**
 * Returns Main Section of the record page.
 */
const RecordMainSection = (): JSX.Element => {

  const { reference, recordValues } = useRecord();

  return (
    <div className='record-display entity-container'>
      <table className='table table-fixed-layout' id='tblRecord'>
        <tbody>
          {reference.columns.map((column: any, index: any) => {
            return (
              <tr
                key={`col-${index}`}
                // TODO: id attr
                id={`row-${index}`}
                className='row'
              >
                <td className='entity-key col-xs-4 col-sm-4 col-md-3 col-lg-2'>
                  {column?.comment ? (
                    <ChaiseTooltip placement='right' tooltip={column.comment}>
                      <span>
                        <span className='column-displayname'>
                          <DisplayValue value={column.displayname}></DisplayValue>
                        </span>
                        <span className='chaise-icon-for-tooltip align-center-icon'></span>
                      </span>
                    </ChaiseTooltip>
                  ) : (
                    <span className='column-displayname'>
                      <DisplayValue value={column.displayname}></DisplayValue>
                    </span>
                  )}
                </td>
                <td className='entity-value col-xs-8 col-sm-8 col-md-9 col-lg-10'>
                  <DisplayValue addClass={true} value={recordValues[index]} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RecordMainSection;
