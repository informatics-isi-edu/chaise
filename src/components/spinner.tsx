import React from 'react';
import spinner from '@chaise/assets/images/loader.gif';

interface SpinnerProps {
  message?: string;
}

const Spinner = ({
  message,
}: SpinnerProps): JSX.Element => (
  <div id="spinner">
    <img src={spinner} className="spinner" />
    <div style={{ marginTop: '15px' }}>
      { message || 'Loading...' }
    </div>
  </div>
);

export default Spinner;
