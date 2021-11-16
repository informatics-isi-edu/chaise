import spinner from '@chaise/assets/images/loader.gif';

interface SpinnerProps {
  message?: string;
}

const Spinner = ({
  message
}: SpinnerProps): JSX.Element => {
  return (
  <div>
    <img src={spinner} className="spinner"/>
    <div style={{"marginTop": "15px"}}>
      { message ? message : "Loading..." }
    </div>
  </div>
  )
};


export default Spinner;
