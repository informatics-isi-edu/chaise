import Spinner from 'react-bootstrap/Spinner';

interface SpinnerProps {
  message?: string;
  className?: string;
  spinnerSize?: 'sm';
}

const ChaiseSpinner = ({
  message,
  className,
  spinnerSize
}: SpinnerProps): JSX.Element => {
  const usedClassName = 'spinner-container' + (className ? ` ${className}` : '');
  return (
    <div className={usedClassName}>
      <Spinner animation='border' size={spinnerSize} />
      <div className='spinner-message'>
        {message || 'Loading...'}
      </div>
    </div>
  );
};

export default ChaiseSpinner;
