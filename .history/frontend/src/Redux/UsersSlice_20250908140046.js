// use UsersSlice fetch users and actions
import { createSlice } from '@reduxjs/toolkit';
import { addUser, fetchUsers } from './UsersThunks';

const usersSlice = createSlice({

    // intiialing the users state to an empty array
    name : "users",
    initialState : {
        users : [],
        loading : false,
        error : null,
    },
    reducers : {},
    /**
     * Define the extra reducers for the users slice.
     * These handle the pending, fulfilled and rejected states of the fetchUsers thunk.
     * @param {Object} builder The builder object.
     */
    extraReducers : (builder) => {
        builder
        /**
         * Handle the pending state of the fetchUsers thunk.
         * Set the loading state to true and error to null.
         * @param {Object} state The current state of the users slice.
         */
        .addCase(fetchUsers.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        /**
         * Handle the fulfilled state of the fetchUsers thunk.
         * Set the loading state to false and users to the payload of the action.
         * @param {Object} state The current state of the users slice.
         * @param {Object} action The action object.
         */
        .addCase(fetchUsers.fulfilled, (state, action) => {
            state.loading = false;
            state.error = null;
            state.users = action.payload;
        })
        /**
         * Handle the rejected state of the fetchUsers thunk.
         * Set the loading state to false and error to the payload of the action.
         * @param {Object} state The current state of the users slice.
         * @param {Object} action The action object.
         */
        .addCase(fetchUsers.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })
        
         .addCase(addUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        });

        .addCase(addUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })
        .addCase(addUser.fulfilled, (state, action) => {
            state.loading = false;
            state.error = null;
            state.users.push(action.payload);
        })
       
    }

});

//export actions if needed
export default usersSlice.reducer;
