import { apiClient } from './client';

export interface User {
  id: string;
  phone: string;
}

export interface SendOtpResponse {
  success: boolean;
  message?: string;
}

export interface VerifyOtpResponse {
  token: string;
  user: User;
}

export async function sendOtp(phone: string): Promise<SendOtpResponse> {
  const response = await apiClient.post<SendOtpResponse>('/auth/send-otp', { phone });
  return response.data;
}

export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResponse> {
  const response = await apiClient.post<VerifyOtpResponse>('/auth/verify-otp', {
    phone,
    code,
  });
  return response.data;
}
