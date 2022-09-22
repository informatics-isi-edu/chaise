// import spinner from '@isrd-isi-edu/chaise/src/assets/images/loader.gif';
import Spinner from 'react-bootstrap/Spinner';

interface SpinnerProps {
  message?: string;
  id?: string;
  className?: string;
  spinnerSize?: 'sm';
}

const ChaiseSpinner = ({
  message,
  id,
  className,
  spinnerSize
}: SpinnerProps): JSX.Element => {
  const usedClassName = 'spinner-container' + (className ? ` ${className}` : '');
  return (
    <div id={id} className={usedClassName}>
      <Spinner animation='border' size={spinnerSize} />
      <div className='spinner-message'>
        {message || 'Loading...'}
      </div>
    </div>
  );
};

export default ChaiseSpinner;
