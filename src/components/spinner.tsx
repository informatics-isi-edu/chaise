import Spinner from 'react-bootstrap/Spinner';

interface SpinnerProps {
  /**
   * displayed message
   * default: Loading...
   */
  message?: string;
  /**
   * added class name to the element.
   */
  className?: string;
  /**
   * size of the spinner
   * (if missing we will use the default size. use `sm` to make the spinner smaller)
   */
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
