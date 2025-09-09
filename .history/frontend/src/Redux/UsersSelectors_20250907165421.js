// exporting the selectors of usersSlice
// use selector 

export const selectUsers = (state) => state.users;
export const selectLoading = (state) => state.users.loading;
export const selectError = (state) => state.users.error;