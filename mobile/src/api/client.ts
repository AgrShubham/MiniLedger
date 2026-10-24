import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function resolveBaseUrl(): string {
  // 1. Try to dynamically detect the host IP from the Expo Metro bundler connection
  // When running in Expo Go on a physical device or emulator, hostUri is "IP:8081"
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ??
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:4000`;
    }
  }

  // 2. Explicit environment variable if configured
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim();
  }

  // 3. Fallback for Android (physical device LAN or emulator)
  if (Platform.OS === 'android') {
    return 'http://192.168.1.13:4000';
  }

  return 'http://localhost:4000';
}

export const API_BASE_URL = resolveBaseUrl();

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

console.log('>>> [MiniLedger] API_BASE_URL is:', API_BASE_URL);

// Request interceptor: attach Bearer token if present
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('user_token');
    console.log(`>>> [MiniLedger] Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url} (Token present: ${!!token})`);
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
  (response) => {
    console.log(`>>> [MiniLedger] Success response: ${response.status} from ${response.config.url}`);
    return response;
  },
  async (error: AxiosError<{ error?: { code?: string; message?: string } }>) => {
    console.log(`>>> [MiniLedger] Response Error: ${error.message} on ${error.config?.url}`, error.response?.status);
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
