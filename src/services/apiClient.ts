import axios from 'axios';
import { getDeviceId } from './deviceId';

export const BASE_URL = 'https://ohaj.alsirhamory.com';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Automatically attach mac_address (device ID) to every request
apiClient.interceptors.request.use(async (config) => {
  const deviceId = await getDeviceId();

  // Attach to POST/PUT/PATCH body
  if (config.data && typeof config.data === 'object') {
    config.data = { ...config.data, mac_address: deviceId };
  } else if (config.method === 'post' || config.method === 'put' || config.method === 'patch') {
    config.data = { mac_address: deviceId };
  }

  // Attach to GET/DELETE query params
  if (config.method === 'get' || config.method === 'delete') {
    config.params = { ...config.params, mac_address: deviceId };
  }

  return config;
});

export default apiClient;
