import '@chaise/assets/scss/_recordset-table.scss';
import DisplayValue from './display-value';

// TODO proper props
const RecordSetTable = (props: any): JSX.Element => {

  // TODO needs to be updated to use ellipsis and have all the functionalities,
  // I only did this to test the overall structure and flow-control logic

  const renderColumnHeaders = () => {
    return props.columnModels.map((col: any, index: number) => {
      return (
        <th key={index}>
          <span className='table-column-displayname' >
            <DisplayValue value={col.column.displayname} />
          </span>
        </th>
      )
    })
  }

  const renderRows = () => {
    if (!props.page) return;

    if (props.page.length == 0) {
      return (
        <tr>
          <td colSpan={props.vm.columnModels.length} style={{ textAlign: 'center' }}>
            <span>No results found</span>
          </td>
        </tr>
      )
    }

    return props.page.tuples.map((tuple: any, index: number) => {
      return (
        <tr key={tuple.uniqueId} className='chaise-table-row' style={{ 'position': 'relative' }}>
          <td className='block action-btns'>
            <div className='chaise-btn-group'>
              <a
                type='button'
                className='view-action-button chaise-btn chaise-btn-tertiary chaise-btn-link icon-btn'
                href={tuple.reference.appLink}
              >
                <span className='chaise-btn-icon chaise-icon chaise-view-details'></span>
              </a>
            </div>
          </td>
          {renderCells(tuple)}
        </tr>

      )
    })
  }

  const renderCells = (tuple: any) => {
    if (!tuple) return;
    return tuple.values.map((val: any, index: number) => {
      return (
        <td key={index}>
          <div className='showContent'>
            <DisplayValue addClass={true} value={{ value: val, isHTML: tuple.isHTML[index] }} />
          </div>
        </td>
      )
    })
  }

  return (
    <div className='recordset-table-container'>
      <div className='chaise-table-top-scroll-wrapper'>
        <div className='chaise-table-top-scroll'></div>
      </div>
      <div className='outer-table recordset-table'>
        <table className='table chaise-table table-hover'>
          <thead className='table-heading'>
            <tr>
              <th className='actions-header view-header'>
                <span className='chaise-icon-for-tooltip'>View </span>
              </th>
              {renderColumnHeaders()}
            </tr>
          </thead>
          <tbody>
            {renderRows()}
          </tbody>
        </table>
      </div>
      <div className='chaise-table-pagination' ng-if='vm.initialized'>
        <button type='button' className='chaise-table-previous-btn chaise-btn chaise-btn-primary'>
          <span>Previous</span>
        </button>
        <button type='button' className='chaise-table-next-btn chaise-btn chaise-btn-primary'>
          <span>Next</span>
        </button>
      </div>
    </div>
  )
}

export default RecordSetTable;
