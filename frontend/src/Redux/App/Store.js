import usersReducer from "@/Redux/UsersSlice";
import { configureStore } from "@reduxjs/toolkit";

/**
 * Configures the Redux store with the given options.
 *
 * @param {Object} options An object containing options for configuring the store.
 * @returns {Object} The configured store.
 */
export const store = configureStore({
  reducer: {
    users: usersReducer,
  },
});
