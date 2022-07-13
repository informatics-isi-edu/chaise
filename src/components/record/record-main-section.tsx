import '@isrd-isi-edu/chaise/src/assets/scss/_record.scss';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

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
    return <DisplayValue value={value.displayname}></DisplayValue>;
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
    <table className='table table-fixed-layout' id='tblRecord'>
      <tbody>
        {reference.columns.map((column: any, index: any) => {
          return (
            <tr key={`col-${index}`}>
              <td className='entity-key col-xs-4 col-sm-4 col-md-3 col-lg-2'>
                {getKey(column)}
              </td>
              <td className='entity-value'>{getValue(index)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default RecordMainSection;
