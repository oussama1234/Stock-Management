// this is AUTH functions file for getCsrfToken AND Login

import { AxiosClient, CsrfClient } from "./AxiosClient";

// Function to get CSRF token
export const getCsrfToken = async () => {
  return await CsrfClient.get("/sanctum/csrf-cookie");
};

// Function to handle user login
export const login = async (email, password) => {
  try {
    await getCsrfToken(); // Ensure CSRF token is set before login
    const response = await AxiosClient.post("/login", { email, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// function for logout
export const logout = async () => {
  try {
    await getCsrfToken(); // Ensure CSRF token is set before logout
    await AxiosClient.post("/logout");
  } catch (error) {
    throw error;
  }
};

// adding function to fetch user

export const GetUser = async () => {
  try {
    console.log('🌐 API: Getting CSRF token for user fetch...');
    await getCsrfToken(); // Ensure CSRF token is set before fetching user
    console.log('🌐 API: Fetching user from /user endpoint...');
    const response = await AxiosClient.get("/user");
    console.log('🌐 API: User response received', { status: response.status, userData: !!response.data });
    return response.data;
  } catch (error) {
    console.error('🌐 API: Error in GetUser', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message,
      url: error.config?.url
    });
    throw error;
  }
};

// Function to update the profile

// PostUpdateProfile.js
export const PostUpdateProfile = async (userData, file) => {
  try {
    await getCsrfToken(); // Ensure CSRF token is set
    const formdata = new FormData();
    
    // Basic profile fields
    if (userData.name) formdata.append("name", userData.name);
    if (userData.email) formdata.append("email", userData.email);
    
    // New profile fields
    if (userData.phone) formdata.append("phone", userData.phone);
    if (userData.location) formdata.append("location", userData.location);
    if (userData.bio) formdata.append("bio", userData.bio);
    if (userData.website) formdata.append("website", userData.website);
    if (userData.job_title) formdata.append("job_title", userData.job_title);
    
    // Password fields (only append if they have values)
    if (userData.currentPassword) formdata.append("currentPassword", userData.currentPassword);
    if (userData.newPassword) formdata.append("newPassword", userData.newPassword);
    if (userData.confirmPassword) formdata.append("newPassword_confirmation", userData.confirmPassword);
    
    // Security settings
    if (userData.two_factor_enabled !== undefined) {
      formdata.append("two_factor_enabled", userData.two_factor_enabled ? '1' : '0');
    }
    
    // Legacy fields for backward compatibility
    if (userData.notifications !== undefined) formdata.append("notifications", userData.notifications);
    if (userData.twoFactor !== undefined) formdata.append("twoFactor", userData.twoFactor);

    // Handle file upload
    if (file) {
      formdata.append("profileImage", file);
    }
    

    const response = await AxiosClient.post("/profile/update", formdata, {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "application/json",
      },
    });

    return {
      success: true,
      status: response.status,
      message: response.data?.message || "Profile updated successfully",
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Failed to update Profile",
      data: error.response?.data || null,
    };
  }
};

// User Management Functions

// Function to fetch all users with pagination and filters
export const getUsers = async (params = {}) => {
  try {
    await getCsrfToken();
    const response = await AxiosClient.get("/users", { params });
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch users",
      status: error.response?.status || 500,
      data: null
    };
  }
};

// Function to create a new user
export const createUser = async (userData) => {
  try {
    await getCsrfToken();
    const response = await AxiosClient.post("/users", userData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "application/json",
      },
    });
    return {
      success: true,
      data: response.data,
      status: response.status,
      message: response.data?.message || "User created successfully"
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create user",
      status: error.response?.status || 500,
      data: error.response?.data || null,
      errors: error.response?.data?.errors || null
    };
  }
};

// Function to update an existing user
export const updateUser = async (userId, userData) => {
  try {
    await getCsrfToken();
    const response = await AxiosClient.post(`/users/update/${userId}`, userData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "application/json",
      },
    });
    return {
      success: true,
      data: response.data,
      status: response.status,
      message: response.data?.message || "User updated successfully"
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update user",
      status: error.response?.status || 500,
      data: error.response?.data || null,
      errors: error.response?.data?.errors || null
    };
  }
};

// Function to delete a user
export const deleteUser = async (userId) => {
  try {
    await getCsrfToken();
    const response = await AxiosClient.delete(`/users/${userId}`);
    return {
      success: true,
      data: response.data,
      status: response.status,
      message: response.data?.message || "User deleted successfully"
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete user",
      status: error.response?.status || 500,
      data: error.response?.data || null
    };
  }
};

// Function to get a single user
export const getUser = async (userId) => {
  try {
    await getCsrfToken();
    const response = await AxiosClient.get(`/users/${userId}`);
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch user",
      status: error.response?.status || 500,
      data: null
    };
  }
};
