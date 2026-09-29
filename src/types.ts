export interface UserProfile {
  id: number;
  fullName: string;
  username: string;
  phoneNumber: string;
  identityNumber: string;
  address: string;
  maTinh: string;
  maHuyen: string;
  maXa: string;
  createDate?: string;
}

export interface SessionResponse {
  success: boolean;
  authenticated: boolean;
  user?: UserProfile;
  expiresAt?: number;
  error?: string;
}

export interface LookupResponse {
  success: boolean;
  status: boolean;
  data?: string; // Presigned URL of the GCN PDF
  message?: string;
  maQr?: string;
  timestamp?: string;
  error?: string;
}

export interface LookupHistoryItem {
  id: string;
  maQr: string;
  searchedAt: string;
  status: 'success' | 'not_found' | 'error';
  pdfUrl?: string;
  note?: string;
}
