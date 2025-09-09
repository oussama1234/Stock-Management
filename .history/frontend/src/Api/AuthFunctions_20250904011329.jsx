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

// You can add more authentication-related functions here, such as logout, register, etc.

// function for logout
export const logout = async () => {
    try {
        await AxiosClient.post('/logout');
    }
    catch (error) {
        throw error;
    }
};