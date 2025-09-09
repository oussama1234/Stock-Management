import { configureStore } from "@reduxjs/toolkit";
import usersReducer from "@/Redux/UsersSlice";


/**
 * Configures the Redux store with the given options.
 *
 * @param {Object} options An object containing options for configuring the store.
 * @returns {Object} The configured store.
 */
export const store = configureStore({
  reducer: {
    users: users
  }
});


