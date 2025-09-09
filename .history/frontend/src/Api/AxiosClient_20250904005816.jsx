// api calling the axios client

import axios from 'axios';

const AxiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api', // Use environment variable or default to localhost
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Include cookies for cross-origin requests if needed
});

export default AxiosClient;



