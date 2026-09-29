import React, { useState } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  Printer, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Maximize2, 
  Minimize2,
  AlertCircle
} from 'lucide-react';
import { VietinBankLogo } from './VietinBankLogo.tsx';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  maQr: string;
  timestamp?: string;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  pdfUrl,
  maQr,
  timestamp
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);

  if (!isOpen || !pdfUrl) return null;

  const handlePrint = () => {
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `GCN_${maQr.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className={`bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 border border-slate-200 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[92vh]'
        }`}
      >
        {/* Header Toolbar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#005993] text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10 text-[#7ED3F7]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base leading-tight">
                  Giấy Chứng Nhận Quyền Sử Dụng Đất (iLIS)
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <CheckCircle2 className="w-3 h-3" /> Đã xác thực
                </span>
              </div>
              <p className="text-xs text-blue-100/80 font-mono truncate max-w-xs sm:max-w-md">
                Mã tra cứu: {maQr}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Tải tệp PDF về máy"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Tải về</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="In Giấy chứng nhận"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">In</span>
            </button>

            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Mở trong tab mới"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Tab mới</span>
            </a>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <div className="h-6 w-[1px] bg-white/20 mx-1" />

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#D71249] hover:bg-[#b00f3c] text-white transition-colors"
              title="Đóng cửa sổ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metadata sub-bar */}
        <div className="px-6 py-2 bg-slate-100 border-b border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#005993]" />
              Dữ liệu số hóa VNPT iLIS tỉnh Bạc Liêu
            </span>
            {timestamp && (
              <span className="text-slate-400">| Truy xuất lúc: {new Date(timestamp).toLocaleString('vi-VN')}</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 italic">
            Cán bộ tín dụng VietinBank lưu ý đối chiếu phôi gốc và kiểm tra tình trạng ngăn chặn
          </div>
        </div>

        {/* PDF Frame Viewer */}
        <div className="flex-1 bg-slate-800 relative overflow-hidden flex items-center justify-center">
          {loadError ? (
            <div className="p-8 max-w-md bg-white rounded-2xl text-center space-y-4 shadow-xl m-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Trình duyệt chặn nhúng trực tiếp</h4>
              <p className="text-xs text-slate-600">
                Để bảo vệ quyền riêng tư, một số trình duyệt không cho phép xem trước trực tiếp file presigned từ máy chủ bên thứ ba. Bạn có thể mở trực tiếp tài liệu trong tab mới hoặc tải về máy.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-[#005993] text-white text-xs font-semibold hover:bg-[#004777] flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" /> Mở trong Tab mới
                </a>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300 flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Tải về máy
                </button>
              </div>
            </div>
          ) : (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-none"
              title="Giấy chứng nhận QSD Đất"
              onError={() => setLoadError(true)}
            />
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <VietinBankLogo size="sm" showSlogan={false} />
            <span>• Thẩm định tài sản bảo đảm</span>
          </div>
          <div>
            Nguồn: <span className="font-mono text-slate-700 font-medium">ilis-gateway-c2.vnpt.vn</span>
          </div>
        </div>
      </div>
    </div>
  );
};
