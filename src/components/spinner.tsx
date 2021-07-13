
import React from 'react'

interface SpinnerProps {
  message?: string;
}

const Spinner: React.FC<SpinnerProps> = (props: SpinnerProps): JSX.Element => {
  return (
  <div>
    <img className="spinner"/>
    <div style={{"marginTop": "15px"}}>
      { props.message ? props.message : "Loading..." }
    </div>
  </div>
  )
};


export default Spinner;
