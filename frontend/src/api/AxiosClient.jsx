// api calling the axios client

import axios from 'axios';

export const AxiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL, // Use environment variable or default to localhost
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Include cookies for cross-origin requests if needed
});

 // adding the axios for csrf token without api call 

 export const CsrfClient = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL, // Use environment variable or default to localhost
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Include cookies for cross-origin requests if needed
});



