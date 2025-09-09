// api calling the axios client

import axios from 'axios';

const AxiosClient = axios.create({
    baseURL: 'http://localhost:8000/api', // Replace with your backend API URL
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Include cookies for cross-origin requests if needed
});

export default AxiosClient;



