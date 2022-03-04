import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * what's stored in the store must be a plain serializable objects...
 * so it's better if we just map everything in the showError function
 * to something that will be used in the modal...
 * then modal just uses those and shows the error
 */
interface ErrorState {
  isDisplayed: boolean;
  isDismissible: boolean;
  isPopup: boolean;
  isGlobal: boolean;
  // error: {
  //   status: string;
  //   message: string;
  //   subMessage?: string;
  // }
  error: {
    name?: string,
    message: string
  } | null;
}

interface ErrorPayloadAction {
  error: Error;
  isDismissible?: boolean;
  isPopup?: boolean;
  isGlobal?: boolean;
}

const initialState: ErrorState = {
  isDisplayed: false,
  error: null,
  isDismissible: false,
  isPopup: true,
  isGlobal: false,
};

export const errorSlice = createSlice({
  name: 'error',
  initialState,
  reducers: {
    showError: (state, action: PayloadAction<ErrorPayloadAction>) => {
      const {
        error,
        isDismissible = initialState.isDismissible,
        isPopup = initialState.isPopup,
        isGlobal = initialState.isGlobal,
      } = action.payload;
      state.isDisplayed = true;
      state.error = {
        name: error.name,
        message: error.message,
      };
      state.isDismissible = isDismissible;
      state.isPopup = isPopup;
      state.isGlobal = isGlobal;

      // set the state properly based on the object...
    },
    hideError: (state) => {
      state.isDisplayed = initialState.isDisplayed;
      state.error = initialState.error;
      state.isDismissible = initialState.isDismissible;
      state.isPopup = initialState.isPopup;
      state.isGlobal = initialState.isGlobal;
    },
  },
});

export const { showError, hideError } = errorSlice.actions;

export default errorSlice.reducer;
