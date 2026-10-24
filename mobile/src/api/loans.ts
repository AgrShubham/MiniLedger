import { apiClient, API_BASE_URL } from './client';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';

export type LoanStatus = 'PENDING' | 'REPAID';

export interface Loan {
  id: string;
  friendName: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  status: LoanStatus;
  isOverdue: boolean;
  repaidAt: string | null;
  receiptUrl: string | null;
  notes: string | null;
  createdAt: string;
}

export interface LoansSummary {
  totalLent: number;
  totalRepaid: number;
  totalPending: number;
  overdueAmount: number;
  counts: {
    total: number;
    repaid: number;
    pending: number;
    overdue: number;
  };
}

export interface CreateLoanParams {
  friendName: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  notes?: string;
  receiptUri?: string;
}

export async function fetchLoans(status: string = 'ALL'): Promise<Loan[]> {
  const params: Record<string, string> = {};
  if (status && status !== 'ALL') {
    params.status = status;
  }
  const response = await apiClient.get<Loan[]>('/loans', { params });
  return response.data;
}

export async function fetchSummary(): Promise<LoansSummary> {
  const response = await apiClient.get<LoansSummary>('/loans/summary');
  return response.data;
}

export async function markLoanAsRepaid(loanId: string): Promise<Loan> {
  const response = await apiClient.patch<Loan>(`/loans/${loanId}/repay`);
  return response.data;
}

export async function createLoan(params: CreateLoanParams): Promise<Loan> {
  const token = await SecureStore.getItemAsync('user_token');

  // Case 1: Simple JSON creation when no receipt image is provided
  if (!params.receiptUri) {
    const response = await apiClient.post<Loan>('/loans', {
      friendName: params.friendName.trim(),
      amount: params.amount,
      dueDate: params.dueDate,
      notes: params.notes?.trim() || undefined,
    });
    return response.data;
  }

  // Case 2: Multipart upload with receipt image using native FileSystem.uploadAsync
  const uri = params.receiptUri;
  const filename = uri.split('/').pop() || 'receipt.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  try {
    const uploadResult = await FileSystem.uploadAsync(
      `${API_BASE_URL}/api/loans`,
      uri,
      {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'receipt',
        mimeType,
        parameters: {
          friendName: params.friendName.trim(),
          amount: params.amount.toString(),
          dueDate: params.dueDate,
          ...(params.notes && params.notes.trim() ? { notes: params.notes.trim() } : {}),
        },
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    let data: any;
    try {
      data = JSON.parse(uploadResult.body);
    } catch {
      data = { message: uploadResult.body };
    }

    if (uploadResult.status >= 400) {
      throw new Error(data?.error?.message || data?.message || 'Failed to create loan');
    }

    return data;
  } catch (fsErr: any) {
    // If native FileSystem upload fails, attempt standard Blob fallback
    console.warn('Native FileSystem upload fallback:', fsErr?.message);
    const fileRes = await fetch(uri);
    const rawBlob = await fileRes.blob();
    const blob = new Blob([rawBlob], { type: mimeType });

    const formData = new FormData();
    formData.append('friendName', params.friendName.trim());
    formData.append('amount', params.amount.toString());
    formData.append('dueDate', params.dueDate);
    if (params.notes && params.notes.trim()) {
      formData.append('notes', params.notes.trim());
    }
    formData.append('receipt', blob, filename);

    const response = await fetch(`${API_BASE_URL}/api/loans`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || 'Failed to create loan');
    }
    return data;
  }
}

