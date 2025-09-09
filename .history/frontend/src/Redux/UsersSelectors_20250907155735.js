// exporting the selectors of usersSlice

export const selectUsers = (state) => state.users.users;
export const selectLoading = (state) => state.users.loading;
export const selectError = (state) => state.users.error;