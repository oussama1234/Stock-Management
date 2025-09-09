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

export const addUser = createAsyncThunk('users/addUser', async({userdata, file}, { rejectWithValue }) => {
    try
    {
        const formData = new FormData();
        formData.append('name', userdata.name);
        formData.append('email', userdata.email);
        formData.append('password', userdata.password);
        formData.append('role', userdata.role);
        if(file)
        {
            formData.append('profileImage', file);
        }

        const response = await AxiosClient.post('/users', formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                Accept: "application/json",
            },
        });
        console.log("Adding user response called:", response);
        return response.data;
    }
    catch(error)
    {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

// Deliting the User function

export const deleteUser = createAsyncThunk('users/deleteUser', async (user, { rejectWithValue }) => {
    
    try
    {
        const response = await AxiosClient.delete(`/users/${user.id}`);
        console.log("Deleting user response called:", response);
        return response.data;
    }
    catch(error)
    {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
})

// Updating user Data

export const updateUser = createAsyncThunk('users/updateUser', async({userData, file}, { rejectWithValue }) => {
    
    try
    {
        const formData = new FormData();
        formData.append('name', userData.name);
        formData.append('email', userData.email);
        formData.append('role', userData.role);
        if(file)
        {
            formData.append('profileImage', file);
        }

        const response = await AxiosClient.post(`/users/update/${userData.id}`, formData, {
            headers: {
                'content:type': 'multipart/form-data',
                Accept: "application/json",
            },
        });
        console.log("Updating user response called:", response);
        
        return response.data;
    }
    catch(error)
    {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
 
})    
