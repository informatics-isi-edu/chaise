import { useState } from "react";
import { Alert, Button, ButtonGroup } from "react-bootstrap";
import { ErrorBoundary, FallbackProps} from 'react-error-boundary';
import { useAppDispatch } from '@chaise/store/hooks';
import { showError } from '@chaise/store/slices/error';

type ErrorComponentProps = {
  catchError?: boolean;
}

const ExplodeComponent = ({catchError}: ErrorComponentProps) : JSX.Element => {
  const dispatch = useAppDispatch();
  if (catchError) {
    try {
      throw new Error('Something went wrong in the component.');
    } catch (exp) {
      if (exp instanceof Error) {
        dispatch(showError({error: exp}));
      }
    }
  } else {
    throw new Error('Something went wrong in the component.');
  }

  return <></>;
}

const ErrorComponent = ({catchError}: ErrorComponentProps) : JSX.Element => {
  const dispatch = useAppDispatch();

  const [explode, setExplode] = useState(false);

  const onClickError = () => {
    if (catchError) {
      try {
        throw new Error('Something went wrong in the event handler.');
      } catch (exp) {
        if (exp instanceof Error) {
          dispatch(showError({error: exp}));
        }
        return null;
      }
    } else {
      throw new Error('Something went wrong in the event handler.');
    }
  };

  return (
    <>
      <ButtonGroup>
        <Button onClick={() => setExplode(e => !e)}>throw error</Button>
        <Button onClick={onClickError}>throw error on click</Button>
      </ButtonGroup>
      {explode ? <ExplodeComponent catchError={catchError}/> : null}
    </>
  );
}

const errorFallback = ({ error }: FallbackProps) => {
  return (<Alert variant="danger">{error.message}</Alert>);
};

const ErrorComponentWithBoundary = () : JSX.Element => {
  return (
    <ErrorBoundary
      FallbackComponent={errorFallback}
    >
      <ErrorComponent/>
    </ErrorBoundary>
  )
}

const ErrorComponentWithCatch = () : JSX.Element => {
  return (
    <ErrorComponent catchError={true}/>
  )
}

const ErrorTest = () : JSX.Element => {

  return (
    <div>
      <div>
        <p>testing comp error vs. event listener error:</p>
        <ErrorComponent/>
      </div>
      <br/>
      <div>
        <p>Testing local comp error boundary:</p>
        <ErrorComponentWithBoundary/>
      </div>
      <div>
        <p>Testing local handling of error:</p>
        <ErrorComponentWithCatch/>
      </div>
    </div>
  );
};

export default ErrorTest;
