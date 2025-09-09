import { configureStore } from "@reduxjs/toolkit";
import usersReducer from "./UsersSlice";


export const configureStore = () => {
  return configureStore({
    reducer : {
      users : usersReducer
    }
  });
}