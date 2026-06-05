import axios from 'axios';
import { getDeviceId } from './deviceId';

export const BASE_URL = 'https://ohaj.alsirhamory.com';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Automatically attach ohaj_device_id (device ID) to every request
apiClient.interceptors.request.use(async (config) => {
  const deviceId = await getDeviceId();

  // Attach to POST/PUT/PATCH body
  if (config.data && typeof config.data === 'object') {
    config.data = { ...config.data, ohaj_device_id: deviceId };
  } else if (config.method === 'post' || config.method === 'put' || config.method === 'patch') {
    config.data = { ohaj_device_id: deviceId };
  }

  // Attach to GET/DELETE query params
  if (config.method === 'get' || config.method === 'delete') {
    config.params = { ...config.params, ohaj_device_id: deviceId };
  }

  return config;
});

export default apiClient;
