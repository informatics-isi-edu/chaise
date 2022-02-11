import { configureStore } from '@reduxjs/toolkit';
import authenReducer from '@chaise/store/slices/authen';
import errorReducer from '@chaise/store/slices/error';

export const store = configureStore({
  reducer: {
    authen: authenReducer,
    error: errorReducer
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
