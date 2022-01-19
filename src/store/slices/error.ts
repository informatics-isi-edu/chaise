import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ErrorState {
  isDisplayed: boolean;
  error: Error | null;
  isDismissible: boolean;
  isPopup: boolean;
}

export interface ErrorPayloadAction {
  error: Error;
  isDismissible?: boolean;
  isPopup?: boolean;
}

const initialState: ErrorState = {
  isDisplayed: false,
  error: null,
  isDismissible: false,
  isPopup: true
};

export const errorSlice = createSlice({
  name: 'error',
  initialState,
  reducers: {
    showError: (state, action: PayloadAction<ErrorPayloadAction>) => {
      const {
        error,
        isDismissible=initialState.isDismissible,
        isPopup=initialState.isPopup
      } = action.payload;
      state.isDisplayed = true;
      state.error = error;
      state.isDismissible = isDismissible;
      state.isPopup = isPopup;

      // set the state properly based on the object...
    },
    hideError: (state) => {
      state.isDisplayed = initialState.isDisplayed;
      state.error = initialState.error;
      state.isDismissible = initialState.isDismissible;
      state.isPopup = initialState.isPopup;
    }
  }
});


export const { showError, hideError } = errorSlice.actions;

export default errorSlice.reducer;

