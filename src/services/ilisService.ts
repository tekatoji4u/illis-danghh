import { UserProfile, LookupResponse, DiagnosticResult } from '../types.ts';

class IlisService {
  private user: UserProfile | null = null;

  private async fetchApi(path: string, options: RequestInit = {}): Promise<any> {
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();

    if (!contentType.includes('application/json')) {
      if (text.trim().startsWith('<!doctype') || text.trim().startsWith('<html')) {
        throw new Error(
          'Máy chủ phản hồi trang web thay vì dữ liệu JSON. Nếu bạn đang chạy trên Vercel, vui lòng đảm bảo đã commit thư mục /api và file vercel.json lên Git repository.'
        );
      }
      throw new Error(`Phản hồi máy chủ không hợp lệ (${res.status}): ${text.slice(0, 100)}`);
    }

    try {
      const json = JSON.parse(text);
      if (!res.ok && !json.status) {
        throw new Error(json.error || json.message || `Lỗi máy chủ (${res.status})`);
      }
      return json;
    } catch (parseErr: any) {
      throw new Error(`Không thể phân tích phản hồi JSON: ${parseErr.message}`);
    }
  }

  // Get active session with auto-login bypass
  async getCurrentUser(): Promise<UserProfile> {
    if (this.user) {
      return this.user;
    }
    const data = await this.fetchApi('/api/auth/session');
    if (data.user) {
      this.user = data.user;
      return data.user;
    }
    throw new Error(data.error || 'Không nhận được thông tin cán bộ từ iLIS');
  }

  // Force re-authenticate
  async authenticate(): Promise<UserProfile> {
    const data = await this.fetchApi('/api/auth/reconnect', { method: 'POST' });
    if (data.user) {
      this.user = data.user;
      return data.user;
    }
    throw new Error(data.error || 'Đăng nhập lại thất bại');
  }

  // Tra cứu GCN
  async lookupGCN(maQr: string): Promise<LookupResponse> {
    const cleanMaQr = maQr.trim();
    if (!cleanMaQr) {
      return {
        success: false,
        status: false,
        message: 'Mã tra cứu không được để trống!'
      };
    }

    try {
      const data = await this.fetchApi('/api/tracuu/gcn', {
        method: 'POST',
        body: JSON.stringify({ maQr: cleanMaQr })
      });
      return data;
    } catch (err: any) {
      return {
        success: false,
        status: false,
        message: err.message || 'Lỗi kết nối khi tra cứu Giấy chứng nhận',
        maQr: cleanMaQr
      };
    }
  }

  // Run full diagnostics
  async runDiagnostics(): Promise<DiagnosticResult> {
    return await this.fetchApi('/api/auth/diagnose');
  }
}

export const ilisService = new IlisService();
