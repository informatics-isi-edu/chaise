import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ExampleComponent from '@chaise/components/example';
import ErrorTest from '@chaise/components/error-test';

const RecordSet = (): JSX.Element => {
  return (
    <div>
      <div>This is the recordset app</div>
      <div>
        fontawesome works: <FontAwesomeIcon icon="coffee" />
      </div>
      <div className="alert alert-primary">
        Bootstrap works!
      </div>
      <Button>bootstrap button</Button>
      <div>
        <ExampleComponent app="recordset" />
      </div>
      <div>
        <br /><br />
        Test error handling:
        <ErrorTest />
      </div>
    </div>
  )
}


export default RecordSet;
