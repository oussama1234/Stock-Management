//creating a usersSlice  for users and their actions
import { createAsyncThunk } from '@reduxjs/toolkit';    
import { axiosClient } from "@/api/AxiosClient"; // Import your Axios client

export const fetchUsers = createAsyncThunk('users/fetchUsers', async ({_, rejectWithValue}) => {
    try
    {
        const response = await axiosClient.get('/users');
        return response.data;
    }
    catch(error)
    {
        return rejectWithValue(error.response.data);
    }
})

