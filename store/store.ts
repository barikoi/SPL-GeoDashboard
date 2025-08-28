// store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import mapReducer from "./mapSlice";
import authReducer from "./authSlice";

export const store = configureStore({
  reducer: {
    map: mapReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
