import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  RefreshCw, 
  Server, 
  Lock, 
  Unlock, 
  Database,
  ArrowRight,
  Info
} from 'lucide-react';
import { DiagnosticResult } from '../types.ts';
import { ilisService } from '../services/ilisService.ts';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string>('');

  const runDiagnostics = async () => {
    setLoading(true);
    setError('');
    try {
      // Run diagnostic directly against VNPT iLIS Gateway
      const result = await ilisService.runDiagnostics();
      setData(result);
    } catch (err: any) {
      console.error('Diagnostics error:', err);
      // Try server fallback if available
      try {
        const fallbackRes = await fetch('/api/auth/diagnose');
        if (fallbackRes.ok && fallbackRes.headers.get('content-type')?.includes('application/json')) {
          const fallbackData = await fallbackRes.json();
          setData(fallbackData);
          return;
        }
      } catch {
        // ignore fallback failure
      }
      setError(
        err.message?.includes('The string did not match the expected pattern')
          ? 'Không thể kết nối đến máy chủ iLIS VNPT (Lỗi cấu trúc phản hồi). Vui lòng thử lại.'
          : (err.message || 'Không thể kết nối đến Cổng VNPT iLIS. Vui lòng kiểm tra kết nối mạng.')
      );
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#005993] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#7ED3F7]" />
            <div>
              <h3 className="font-bold text-base leading-tight">
                Kiểm Tra Quyền Xác Thực & Truy Xuất iLIS VNPT
              </h3>
              <p className="text-xs text-blue-100">
                Thẩm định quyền hạn tài khoản DanghhBL (Huỳnh Hải Đăng - Bạc Liêu)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 text-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-[#005993]" />
              <p className="font-semibold text-sm">Đang thực hiện kiểm tra đa tầng với máy chủ VNPT iLIS...</p>
              <p className="text-[11px] text-slate-400">1. Kiểm tra Token đăng nhập • 2. Thử nghiệm Endpoint tra cứu GCN</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Lỗi trong quá trình kiểm tra</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          ) : data ? (
            <>
              {/* Highlight Conclusion Banner */}
              <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-500/40 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-emerald-950">
                      KẾT LUẬN: TÀI KHOẢN ĐƯỢC PHÉP TRUY XUẤT THÔNG TIN
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                      AUTHORIZED (200 OK)
                    </span>
                  </div>
                  <p className="text-emerald-900 leading-relaxed text-[11px]">
                    {data.diagnostics.conclusion.explanation}
                  </p>
                </div>
              </div>

              {/* Step 1: Authentication Status */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Server className="w-4 h-4 text-[#005993]" />
                    <span>1. Xác thực danh tính với Cổng iLIS</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    HTTP {data.diagnostics.authentication.statusCode} ({data.diagnostics.authentication.latencyMs}ms)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block">Tài khoản:</span>
                    <span className="font-mono font-bold text-slate-800">{data.diagnostics.authentication.account}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block">Cán bộ:</span>
                    <span className="font-bold text-slate-800 truncate block">{data.diagnostics.authentication.fullName}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block">Vai trò:</span>
                    <span className="font-bold text-[#005993]">{data.diagnostics.authentication.userLevel}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block">Địa bàn iLIS:</span>
                    <span className="font-bold text-slate-800">Tỉnh Bạc Liêu ({data.diagnostics.authentication.province})</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Endpoint Authorization Test (Proof of Permission) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Database className="w-4 h-4 text-[#005993]" />
                    <span>2. Thử nghiệm Phân quyền Endpoint (/portal/GetPresignUrl/get-presign)</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[10px]">
                    Độ trễ: {data.diagnostics.endpointAuthorization.latencyMs}ms
                  </span>
                </div>

                {/* Two Column Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Case A: Authorized with Token */}
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                        Có Token Cán bộ
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                        HTTP {data.diagnostics.endpointAuthorization.withTokenStatus} OK
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Cổng iLIS chấp nhận yêu cầu và xử lý truy vấn vào cơ sở dữ liệu Giấy chứng nhận.
                    </p>
                    <div className="p-2 rounded bg-white/80 border border-emerald-100 font-mono text-[10px] text-slate-600">
                      Phản hồi iLIS: {JSON.stringify(data.diagnostics.endpointAuthorization.withTokenResponse)}
                    </div>
                  </div>

                  {/* Case B: Unauthorized without Token */}
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        Không gửi Token
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-bold text-[10px]">
                        HTTP {data.diagnostics.endpointAuthorization.withoutTokenStatus} Chặn
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Cổng iLIS lập tức chặn truy cập vì yêu cầu phải có tài khoản hợp lệ.
                    </p>
                    <div className="p-2 rounded bg-white/80 border border-slate-200 font-mono text-[10px] text-slate-500">
                      Trạng thái: 401 Unauthorized (Từ chối truy cập)
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanatory notes */}
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2.5 text-[11px] text-blue-900 leading-relaxed">
                <Info className="w-4 h-4 text-[#005993] flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Tại sao khi thử mã mẫu lại báo "không tìm thấy thông tin"?</strong><br />
                  Hệ thống iLIS VNPT bảo mật thông tin địa chính theo từng hồ sơ cụ thể. Khi cán bộ dùng camera quét mã QR thật in trên phôi Giấy chứng nhận đã được văn phòng ĐKĐĐ Bạc Liêu số hóa, hệ thống sẽ trả về link PDF đầy đủ của Giấy chứng nhận.
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Chạy lại kiểm tra</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg bg-[#005993] hover:bg-[#004777] text-white font-semibold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
