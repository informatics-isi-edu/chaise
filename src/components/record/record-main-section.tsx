import '@isrd-isi-edu/chaise/src/assets/scss/_record_main_container.scss';

import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

export type RecordMainSectionProps = {
  /**
   * The displayed reference
   */
  reference: any;

  /**
   * tuple reference
   */
  tuple: any;
};

/**
 * Returns Main Section of the record page.
 */
const RecordMainSection = ({
  reference,
  tuple,
}: RecordMainSectionProps): JSX.Element => {
    
  /**
   * Function to display key in the main section of record page
   * @param value takes value parameter
   * @returns DisplayValue Component
   */
  const getKey = (value: any) => {
    return (
      <>
        <span className='column-displayname'>
          <DisplayValue value={value.displayname}></DisplayValue>
        </span>
        {value?.comment && (
          <ChaiseTooltip placement='right' tooltip={value?.comment}>
            <span className='chaise-icon-for-tooltip align-center-icon'></span>
          </ChaiseTooltip>
        )}
      </>
    );
  };

  /**
   * Function to display value in the main section of record page
   * @param value takes value parameter
   * @returns DisplayValue Component
   */
  const getValue = (index: number) => {
    return (
      <DisplayValue
        addClass={true}
        value={{ isHTML: tuple.isHTML[index], value: tuple.values[index] }}
      />
    );
  };

  return (
    <div className='record-display'>
      <table className='table table-fixed-layout' id='tblRecord'>
        <tbody>
          {reference.columns.map((column: any, index: any) => {
            return (
              <tr key={`col-${index}`}>
                <td className='entity-key col-xs-4 col-sm-4 col-md-3 col-lg-2'>
                  {getKey(column)}
                </td>
                <td className='entity-value col-xs-8 col-sm-8 col-md-9 col-lg-10'>{getValue(index)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RecordMainSection;
