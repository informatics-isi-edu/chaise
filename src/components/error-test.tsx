import { useState } from "react";
import { Button } from "react-bootstrap"

const ErrorComponent = () : JSX.Element => {
  throw new Error('Something went wrong.');
}

const ErrorTest = () : JSX.Element => {
  const [explode, setExplode] = useState(false);

  return (
    <div>
      <Button onClick={() => setExplode(e => !e)}>throw error</Button>
      {explode ? <ErrorComponent /> : null}
    </div>
  );
};

export default ErrorTest;
