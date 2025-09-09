// this is AUTH functions file for getCsrfToken AND Login

import { AxiosClient, CsrfClient } from './AxiosClient';

// Function to get CSRF token
export const getCsrfToken = async () => {
    return await CsrfClient.get('/sanctum/csrf-cookie');
};

// Function to handle user login
export const login = async (email, password) => {
    try {
        await getCsrfToken(); // Ensure CSRF token is set before login
        const response = await AxiosClient.post('/login', { email, password });
        return response.data;
    }
    catch (error) {
        throw error;
    }
};


// function for logout
export const logout = async () => {
    try {
        await getCsrfToken(); // Ensure CSRF token is set before logout
        await AxiosClient.post('/logout');
    }
    catch (error) {
        throw error;
    }
};

// adding function to fetch user

export const GetUser = async () => {
    try {
        await getCsrfToken(); // Ensure CSRF token is set before fetching user
        const response = await AxiosClient.get('/user');
        return response.data;
    }
    catch (error) {
        throw error;
    }
};


// Function to update the profile

export const PostUpdateProfile = async (userData,file) => {

    //get the csrf token first 
    try {
        const formdata = new FormData();
        formdata.append("name", userData.name);
        formdata.append("email", userData.email);
        formdata.append("currentPassword", userData.currentPassword);
        formdata.append("newPassword", userData.newPassword);
        formdata.append("newPassword_confirmation", userData.confirmPassword);
        formdata.append("notifications", userData.notifications);
        formdata.append("twoFactor", userData.twoFactor);
        if(file)
        {
            formdata.append("profileImage", file);
        }
        

        await getCsrfToken();
        const response = await AxiosClient.post('/profile/update',formdata , {
            headers : {
                'Content-Type': 'multipart/form-data',
            }
        });

        return response.data;
       
    }
    catch (error) {
        throw error;
    }

};