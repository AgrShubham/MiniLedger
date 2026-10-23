import { apiClient, API_BASE_URL } from './client';
import * as SecureStore from 'expo-secure-store';

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
  const formData = new FormData();

  formData.append('friendName', params.friendName.trim());
  formData.append('amount', params.amount.toString());
  formData.append('dueDate', params.dueDate);

  if (params.notes && params.notes.trim()) {
    formData.append('notes', params.notes.trim());
  }

  if (params.receiptUri) {
    const uri = params.receiptUri;
    const filename = uri.split('/').pop() || 'receipt.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // React Native FormData file specification
    formData.append('receipt', {
      uri,
      name: filename,
      type,
    } as any);
  }

  // Using native fetch for multipart upload avoids Axios header boundary conflicts in RN
  const response = await fetch(`${API_BASE_URL}/api/loans`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Do NOT set 'Content-Type' so the browser/engine sets boundary automatically
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Failed to create loan');
  }

  return data;
}
