import { configureStore } from '@reduxjs/toolkit';
import authnReducer from '@chaise/store/slices/authn';
import errorReducer from '@chaise/store/slices/error';

export const store = configureStore({
  reducer: {
    authn: authnReducer,
    error: errorReducer
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
