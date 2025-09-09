// exporting the selectors of usersSlice
// use selector 

export const selectUsers = (state) => state.users;
export const selectLoading = (state) => state.loading;
export const selectError = (state) => state.users.error;