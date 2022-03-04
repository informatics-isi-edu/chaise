import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ExampleComponent from '@chaise/components/example';
import ErrorTest from '@chaise/components/error-test';
import { RecordsetViewModel } from '@chaise/services/table';
import Spinner from '@chaise/components/spinner';

type RecordSetProps = {
  vm: RecordsetViewModel
}

const RecordSet = ({
  vm
}: RecordSetProps): JSX.Element => {

  return (
    <div className='recordset-container app-content-container'>
      {/* <Spinner/> */}
      Table name is : {vm.displayname.value}
      {/* <div className='top-panel-container'>
        <div className='top-flex-panel'>
          <div className='top-left-panel'>

          </div>
        </div>
      </div>
      <div className='bottom-panel-container'>

      </div> */}
    </div>
  )
}


export default RecordSet;
