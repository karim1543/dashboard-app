import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../auth/authSlice";
import dataReducer from "../data/dataSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      data: dataReducer
    }
  });
};

