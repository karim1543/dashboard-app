import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../auth/authSlice";
import dataReducer from "../data/dataSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      data: dataReducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        
          serializableCheck: {
            ignoredActionPaths: ['payload.createdAt'],
            ignoredPaths: ['data.items.createdAt'],
        },
      }),
  });
};

