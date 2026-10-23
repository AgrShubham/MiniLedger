import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.12:4000';

let onUnauthorizedCallback: (() => void) | null = null;

export function setUnauthorizedHandler(callback: () => void) {
  onUnauthorizedCallback = callback;
}

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token if present
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('user_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('Failed to retrieve token from SecureStore:', err);
  }
  return config;
});

// Response interceptor: handle 401 and extract backend error message
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: { code?: string; message?: string } }>) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('user_token').catch(() => {});
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    const backendMessage = error.response?.data?.error?.message;
    if (backendMessage) {
      return Promise.reject(new Error(backendMessage));
    }
    return Promise.reject(error);
  }
);

export function getFullMediaUrl(receiptPath: string | null | undefined): string | null {
  if (!receiptPath) return null;
  if (receiptPath.startsWith('http://') || receiptPath.startsWith('https://')) {
    return receiptPath;
  }
  return `${API_BASE_URL}${receiptPath}`;
}
