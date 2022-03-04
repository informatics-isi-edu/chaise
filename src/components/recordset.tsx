import React from 'react';
import { RecordsetViewModel } from '@chaise/services/table';

type RecordSetProps = {
  vm: RecordsetViewModel
}

const RecordSet = ({
  vm,
}: RecordSetProps): JSX.Element => (
  <div className="recordset-container app-content-container">
    {/* <Spinner/> */}
    Table name is :
    {' '}
    {vm.displayname.value}
    {/* <div className='top-panel-container'>
        <div className='top-flex-panel'>
          <div className='top-left-panel'>

          </div>
        </div>
      </div>
      <div className='bottom-panel-container'>

      </div> */}
  </div>
);

export default RecordSet;
