// use UsersSlice fetch users and actions
import { createSlice } from '@reduxjs/toolkit';
import { fetchUsers } from './UsersThunks';

const usersSlice = createSlice({

    name: "users",
    initialState: {
        users: [],
        loading: false,
        error: null,
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    },
})