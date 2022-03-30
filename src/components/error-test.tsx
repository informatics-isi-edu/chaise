import { useState } from 'react';
import { Alert, Button, ButtonGroup } from 'react-bootstrap';
import { ErrorBoundary, FallbackProps, useErrorHandler } from 'react-error-boundary';
import $log from '@chaise/services/logger';
import useError from '@chaise/hooks/error';

const ExplodeComponent = () : JSX.Element => {
  throw new Error('Something went wrong in the component.');
};

const ExplodeComponentWithManualHandling = () : JSX.Element => {
  const { dispatchError } = useError();

  try {
    throw new Error('Something went wrong in the component.');
  } catch (exp) {
    if (exp instanceof Error) {
      dispatchError({ error: exp });
    }
  }
  return <></>;
};

const ErrorComponent = () : JSX.Element => {
  const [explode, setExplode] = useState(false);

  const onClickError = () => {
    throw new Error('Something went wrong in the event handler.');
  };

  return (
    <>
      <ButtonGroup>
        <Button onClick={() => setExplode((e) => !e)}>throw error</Button>
        <Button onClick={onClickError}>throw error on click</Button>
      </ButtonGroup>
      {explode ? <ExplodeComponent /> : null}
    </>
  );
};

const ErrorComponentWithBoundary = () : JSX.Element => {
  const handleError = useErrorHandler();
  const [explode, setExplode] = useState(false);

  const onClickError = () => {
    try {
      throw new Error('Something went wrong in the event handler.');
    } catch (exp) {
      $log.log('wow');
      handleError(exp);
    }
  };

  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => (
        <Alert variant='danger'>
          inner:
          {error.message}
        </Alert>
      )}
    >
      <ButtonGroup>
        <Button onClick={() => setExplode((e) => !e)}>throw error</Button>
        <Button onClick={onClickError}>throw error on click</Button>
      </ButtonGroup>
      {explode ? <ExplodeComponent /> : null}
    </ErrorBoundary>
  );
};

const ErrorComponentWithManualHandling = () : JSX.Element => {
  const { dispatchError } = useError();
  const [explode, setExplode] = useState(false);

  const onClickError = () => {
    try {
      throw new Error('Something went wrong in the event handler.');
    } catch (exp) {
      if (exp instanceof Error) {
        dispatchError({error: exp});
      }
      return null;
    }
  };

  return (
    <>
      <ButtonGroup>
        <Button onClick={() => setExplode((e) => !e)}>throw error</Button>
        <Button onClick={onClickError}>throw error on click</Button>
      </ButtonGroup>
      {explode ? <ExplodeComponentWithManualHandling /> : null}
    </>
  );
};

const ErrorTest = () : JSX.Element => {
  let catchedErrorComponent;
  try {
    catchedErrorComponent = <ErrorComponent />;
  } catch (exp) {
    $log.log('caught the error here!');
    catchedErrorComponent = (<div>wow errored!</div>);
  }

  return (
    <div>
      <div>
        <p>General case:</p>
        <ErrorComponent />
      </div>
      <div>
        <p>wrapping the component in a try-catch:</p>
        {catchedErrorComponent}
      </div>
      <br />
      <div>
        <p>Local error boundary:</p>
        <ErrorBoundary
          FallbackComponent={({ error }) => (
            <Alert variant='danger'>
              outer:
              {error.message}
            </Alert>
          )}
        >
          <ErrorComponentWithBoundary />
        </ErrorBoundary>
      </div>
      <div>
        <p>Catching the error and manually calling the handler</p>
        <ErrorComponentWithManualHandling />
      </div>
    </div>
  );
};

export default ErrorTest;
