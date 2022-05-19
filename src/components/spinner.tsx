// import spinner from '@isrd-isi-edu/chaise/src/assets/images/loader.gif';
import Spinner from 'react-bootstrap/Spinner';

interface SpinnerProps {
  message?: string;
  id?: string;
}

const ChaiseSpinner = ({
  message,
  id,
}: SpinnerProps): JSX.Element => (
  <div id={id} className='spinner-container'>
    <Spinner animation='border' />
    <div style={{ marginTop: '15px' }}>
      { message || 'Loading...' }
    </div>
  </div>
);

export default ChaiseSpinner;
