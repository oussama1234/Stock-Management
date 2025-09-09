//creating a usersSlice  for users and their actions
import { createAsyncThunk } from '@reduxjs/toolkit';    
import { AxiosClient } from "@/api/AxiosClient"; // Import your Axios client

export const fetchUsers = createAsyncThunk('users/fetchUsers', async (_, { rejectWithValue }) => {
    try
    {
        const response = await AxiosClient.get('/users');
        console.log("response called:", response);
        return response.data;
    }
    catch(error)
    {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const addUser = createAsyncThunk('users/addUser', async(userdata, { rejectWithValue }) => {
    try
    {
        const response = await AxiosClient.post('/users', userdata, {
            headers: {
                "Content-Type": "multipart/form-data",
                Accept: "application/json",
            },
        });
        console.log("response called:", response);
        return response.data;
    }
    catch(error)
    {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
})

