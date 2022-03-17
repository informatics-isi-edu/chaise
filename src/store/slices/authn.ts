import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ClientState {
  display_name: string;
  email: string;
  full_name: string;
  id: string;
  identities: string[];
}

interface AuthnState {
  attributes: ClientState[];
  client: ClientState;
  expires: string;
  seconds_remaining: number;
  since: string;
  tracking: string;
  vary_headers: string[];
}

interface AuthnPayloadAction {
  attributes: Client[];
  client: Client;
  expires: string;
  seconds_remaining: number;
  since: string;
  tracking: string;
  vary_headers: string[];
}

const initialState: AuthnState = {
  attributes: [],
  client: {
    display_name: '',
    email: '',
    full_name: '',
    id: '',
    identities: [],
  },
  expires: '',
  seconds_remaining: 0,
  since: '',
  tracking: '',
  vary_headers: [],
};

export const authnSlice = createSlice({
  name: 'authn',
  initialState,
  reducers: {
    loginUser: (state, action: PayloadAction<AuthnPayloadAction>) => {
      if (!action.payload) {
        return;
      }

      const {
        attributes = initialState.attributes,
        client = initialState.client,
        expires = initialState.expires,
        seconds_remaining = initialState.seconds_remaining,
        since = initialState.since,
        tracking = initialState.tracking,
        vary_headers = initialState.vary_headers,
      } = action.payload;

      state.attributes = attributes;
      state.client = client;
      state.expires = expires;
      state.seconds_remaining = seconds_remaining;
      state.since = since;
      state.tracking = tracking;
      state.vary_headers = vary_headers;
    },
    logoutUser: (state) => {
      state.attributes = initialState.attributes;
      state.client = initialState.client;
      state.expires = initialState.expires;
      state.seconds_remaining = initialState.seconds_remaining;
      state.since = initialState.since;
      state.tracking = initialState.tracking;
      state.vary_headers = initialState.vary_headers;
    },
  },
});

export const { loginUser, logoutUser } = authnSlice.actions;

export default authnSlice.reducer;
