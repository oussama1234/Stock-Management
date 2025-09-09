// this is AUTH functions file for getCsrfToken AND Login

import { AxiosClient, CsrfClient } from './AxiosClient';

// Function to get CSRF token
export const getCsrfToken = async () => {
    await CsrfClient.get('/sanctum/csrf-cookie');
}