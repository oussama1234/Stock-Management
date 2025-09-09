// api calling the axios client

import axios from 'axios';

const AxiosClient = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Include cookies for cross-origin requests if needed
});

export default AxiosClient;



