import ChaiseModal from '@chaise/components/modal';
import { useAppSelector, useAppDispatch } from '@chaise/store/hooks';
import { RootState } from '@chaise/store/store';

const ErrorModal = () : JSX.Element | null => {
  const error = useAppSelector((state: RootState) => state.error);

  const errorTitle = (
    <div>{error.error?.name}</div>
  );

  const errorBody = (
    <div>{error.error?.message}</div>
  );

  const errorFooter = (
    <div></div>
  );

  if (!error.error || !error.isDisplayed) {
    return null;
  }

  // the logic to do something differently based on the error

  return (
    <ChaiseModal
      title={errorTitle}
      body={errorBody}
      footer={errorFooter}
      show={error.isDisplayed}
    />
  );
};

export default ErrorModal;
