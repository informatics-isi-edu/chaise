import React from 'react';
// import spinner from '@chaise/assets/images/loader.gif';
import Spinner from 'react-bootstrap/Spinner';

interface SpinnerProps {
  message?: string;
}

const ChaiseSpinner = ({
  message,
}: SpinnerProps): JSX.Element => (
  <div id="spinner">
    {/* <img src={spinner} className="spinner" /> */}
    <Spinner animation="border" />
    <div style={{ marginTop: '15px' }}>
      { message || 'Loading...' }
    </div>
  </div>
);

export default ChaiseSpinner;
