import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { VietinBankLogo } from './components/VietinBankLogo.tsx';
import { QRScannerModal } from './components/QRScannerModal.tsx';
import { PdfViewerModal } from './components/PdfViewerModal.tsx';
import { ManualLookupForm } from './components/ManualLookupForm.tsx';
import { DiagnosticsModal } from './components/DiagnosticsModal.tsx';
import { ilisService } from './services/ilisService.ts';
import { UserProfile, LookupResponse, LookupHistoryItem } from './types.ts';
import jsQR from 'jsqr';
import {
  Search,
  Camera,
  Upload,
  QrCode,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Download,
  Info,
  Layers,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Building,
  RotateCcw,
  BookOpen,
  Activity
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<LookupResponse | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'manual' | 'history'>('qr');
  const [history, setHistory] = useState<LookupHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('vietin_gcn_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load session from server on startup (bypassing login)
  useEffect(() => {
    fetchSession();
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vietin_gcn_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }, [history]);

  const fetchSession = async () => {
    try {
      setIsInitializing(true);
      const userProfile = await ilisService.getCurrentUser();
      setUser(userProfile);
    } catch (err) {
      console.error('Session fetch error:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleRefreshSession = async () => {
    try {
      setIsRefreshing(true);
      const userProfile = await ilisService.authenticate();
      setUser(userProfile);
    } catch (err) {
      console.error('Reconnect error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearch = async (codeToSearch?: string) => {
    const targetCode = (codeToSearch !== undefined ? codeToSearch : searchCode).trim();
    if (!targetCode) {
      alert('Vui lòng nhập hoặc quét mã tra cứu Giấy chứng nhận!');
      return;
    }

    setIsSearching(true);
    setSearchResult(null);

    try {
      const data = await ilisService.lookupGCN(targetCode);
      setSearchResult(data);

      // Append to history
      const historyItem: LookupHistoryItem = {
        id: Date.now().toString(),
        maQr: targetCode,
        searchedAt: new Date().toISOString(),
        status: data.status ? 'success' : 'not_found',
        pdfUrl: data.data,
        note: data.message
      };

      setHistory((prev) => [historyItem, ...prev.slice(0, 24)]);

      // If success, automatically open the PDF viewer modal
      if (data.status && data.data) {
        setIsPdfModalOpen(true);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setSearchResult({
        success: false,
        status: false,
        message: err.message || 'Lỗi mạng hoặc sự cố kết nối tới máy chủ iLIS VNPT',
        maQr: targetCode
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle uploaded image for QR detection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth'
        });

        if (code && code.data && code.data.trim()) {
          setSearchCode(code.data.trim());
          handleSearch(code.data.trim());
        } else {
          alert('Không nhận diện được mã QR trong hình ảnh đã tải lên. Vui lòng thử ảnh rõ nét hơn hoặc nhập mã thủ công.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Header with live session info */}
      <Header
        user={user}
        onRefreshSession={handleRefreshSession}
        isRefreshing={isRefreshing}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section with VietinBank Signature Polygonal Backdrop */}
        <section className="relative bg-vietin-poly text-white py-12 px-4 sm:px-6 lg:px-8 shadow-md overflow-hidden">
          {/* Low-poly crystalline overlay */}
          <div className="absolute inset-0 poly-overlay opacity-80 pointer-events-none" />

          {/* Glowing gradient aura */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D71249]/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#7ED3F7]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-5xl mx-auto space-y-6 text-center">
            {/* Title Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#7ED3F7]" />
                <span>Hệ thống nghiệp vụ tín dụng VietinBank</span>
                <span className="w-1 h-1 rounded-full bg-white/50" />
                <span className="text-[#7ED3F7]">Tự động đăng nhập iLIS VNPT</span>
              </div>

              {/* Diagnostic Button */}
              <button
                type="button"
                onClick={() => setIsDiagnosticsOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 hover:text-white border border-emerald-400/40 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                title="Bấm để kiểm tra chi tiết phản hồi API và quyền truy xuất iLIS"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-300" />
                <span>Kiểm tra quyền truy xuất iLIS</span>
              </button>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
                Tra Cứu Thông Tin Giấy Chứng Nhận QSD Đất
              </h1>
              <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto font-normal">
                Truy xuất trực tiếp phôi Giấy chứng nhận quyền sử dụng đất, thông tin số hóa địa chính và tình trạng ngăn chặn trên Cổng thông tin đất đai iLIS VNPT.
              </p>
            </div>

            {/* Main Interactive Search Card */}
            <div className="pt-2">
              <div className="bg-white rounded-2xl shadow-xl p-3 sm:p-5 border border-slate-200/80 text-slate-800 text-left transition-all">
                {/* Search Mode Tabs */}
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 overflow-x-auto text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('qr')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap ${
                      activeTab === 'qr'
                        ? 'bg-[#005993] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Mã QR / Chuỗi tra cứu</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('manual')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap ${
                      activeTab === 'manual'
                        ? 'bg-[#005993] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Tra cứu theo Thuộc tính thửa đất</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap ml-auto ${
                      activeTab === 'history'
                        ? 'bg-[#005993] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Lịch sử tra cứu ({history.length})</span>
                  </button>
                </div>

                {/* Tab 1: QR & Fast Search */}
                {activeTab === 'qr' && (
                  <div className="space-y-4">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSearch();
                      }}
                      className="flex flex-col sm:flex-row gap-2.5"
                    >
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <QrCode className="w-5 h-5 text-[#005993]" />
                        </div>
                        <input
                          type="text"
                          value={searchCode}
                          onChange={(e) => setSearchCode(e.target.value)}
                          placeholder="Nhập mã QR hoặc dán chuỗi định danh Giấy chứng nhận (ví dụ: 95|954|31840|...)"
                          className="w-full pl-11 pr-10 py-3.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#005993] focus:border-transparent font-mono placeholder:text-slate-400 bg-slate-50/50"
                        />
                        {searchCode && (
                          <button
                            type="button"
                            onClick={() => setSearchCode('')}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSearching || !searchCode.trim()}
                        className="px-7 py-3.5 rounded-xl bg-[#005993] hover:bg-[#004777] disabled:bg-slate-300 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {isSearching ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Đang truy xuất...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4" />
                            <span>Tra cứu ngay</span>
                          </>
                        )}
                      </button>
                    </form>

                    {/* Quick action buttons: Camera scan & Image upload */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsScannerOpen(true)}
                          className="px-3.5 py-2 rounded-xl bg-[#005993]/10 hover:bg-[#005993]/15 text-[#005993] font-semibold transition-colors flex items-center gap-2 border border-[#005993]/20"
                        >
                          <Camera className="w-4 h-4 text-[#005993]" />
                          <span>Quét mã bằng Camera</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors flex items-center gap-2 border border-slate-200"
                        >
                          <Upload className="w-4 h-4 text-slate-500" />
                          <span>Tải ảnh phôi GCN</span>
                        </button>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </div>

                      {/* Sample format hint button */}
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        <Info className="w-3.5 h-3.5 text-[#005993]" />
                        <span>Định dạng chuẩn VNPT: </span>
                        <button
                          type="button"
                          onClick={() => setSearchCode('95|954|31840|DA123456|CS01234')}
                          className="text-[#005993] hover:underline font-mono"
                        >
                          95|954|31840|...
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Manual Attribute Lookup */}
                {activeTab === 'manual' && (
                  <ManualLookupForm
                    onSearch={(code) => {
                      setSearchCode(code);
                      handleSearch(code);
                    }}
                    isLoading={isSearching}
                  />
                )}

                {/* Tab 3: History */}
                {activeTab === 'history' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                      <span>Lịch sử các lần tra cứu trong phiên làm việc</span>
                      {history.length > 0 && (
                        <button
                          onClick={() => setHistory([])}
                          className="text-red-600 hover:underline"
                        >
                          Xóa lịch sử
                        </button>
                      )}
                    </div>

                    {history.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        Chưa có lịch sử tra cứu nào. Hãy nhập mã QR hoặc quét ảnh để bắt đầu.
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                        {history.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs hover:border-[#005993]/40 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    item.status === 'success'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {item.status === 'success' ? 'Có kết quả' : 'Không tìm thấy'}
                                </span>
                                <span className="text-slate-400 text-[11px]">
                                  {new Date(item.searchedAt).toLocaleTimeString('vi-VN')}
                                </span>
                              </div>
                              <p className="font-mono text-slate-700 truncate font-medium">
                                {item.maQr}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {item.pdfUrl && (
                                <button
                                  onClick={() => {
                                    setSearchResult({
                                      success: true,
                                      status: true,
                                      data: item.pdfUrl,
                                      maQr: item.maQr,
                                      timestamp: item.searchedAt
                                    });
                                    setIsPdfModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-[#005993] text-white font-semibold text-[11px] hover:bg-[#004777]"
                                >
                                  Xem lại PDF
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSearchCode(item.maQr);
                                  setActiveTab('qr');
                                  handleSearch(item.maQr);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200"
                                title="Tra cứu lại"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Search Result Section */}
        {searchResult && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            {searchResult.status && searchResult.data ? (
              /* Success Case: GCN Found */
              <div className="p-6 rounded-2xl bg-white border-2 border-emerald-500/30 shadow-lg space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          Đã tìm thấy Giấy chứng nhận quyền sử dụng đất
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[10px]">
                          HỢP LỆ
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Dữ liệu được xác thực trực tiếp từ Cổng iLIS VNPT (Tỉnh Bạc Liêu)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setIsPdfModalOpen(true)}
                      className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#005993] hover:bg-[#004777] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Xem Giấy chứng nhận (PDF)</span>
                    </button>
                    <a
                      href={searchResult.data}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
                      title="Mở liên kết trong tab mới"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Information Preview grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block mb-1">Mã tra cứu / Barcode:</span>
                    <span className="font-mono font-bold text-slate-800 break-all">{searchResult.maQr}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block mb-1">Thời gian phản hồi iLIS:</span>
                    <span className="font-semibold text-slate-800">
                      {new Date().toLocaleTimeString('vi-VN')} - {new Date().toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block mb-1">Cán bộ thẩm định thực hiện:</span>
                    <span className="font-semibold text-slate-800">{user?.fullName || 'DanghhBL'} (VietinBank)</span>
                  </div>
                </div>

                {/* Collateral Advisory Notice for VietinBank Credit Staff */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
                  <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Lưu ý nghiệp vụ VietinBank:</span> Cán bộ tín dụng cần đối chiếu kỹ lưỡng thông tin trên bản số hóa iLIS với phôi gốc Giấy chứng nhận (con dấu, chữ ký của Sở TN&MT / UBND, tọa độ ranh giới thửa đất) và kiểm tra tình trạng ngăn chặn giao dịch đảm bảo trước khi giải ngân.
                  </div>
                </div>
              </div>
            ) : (
              /* Failure / Not Found Case */
              <div className="p-6 rounded-2xl bg-white border border-amber-200 shadow-md space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-base font-bold text-slate-900">
                      Không tìm thấy Giấy chứng nhận trong hệ thống
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {searchResult.message || 'Mã QR không còn hiệu lực hoặc không tìm thấy thông tin Giấy chứng nhận trong hệ thống iLIS!'}
                    </p>
                    <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600 space-y-1 mt-2">
                      <p className="font-semibold text-slate-800">Gợi ý kiểm tra:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-500 text-[11px]">
                        <li>Kiểm tra chất lượng ảnh chụp mã QR trên phôi GCN (tránh bị bóng lóa hoặc mờ góc).</li>
                        <li>Đảm bảo mã QR tuân theo chuẩn iLIS Bạc Liêu phân cách bởi dấu gạch đứng (<code className="font-mono text-slate-700">|</code>).</li>
                        <li>Một số hồ sơ mới cấp đổi hoặc đang trong quá trình chuyển nhượng có thể chưa hoàn tất đồng bộ CSDL từ chi nhánh Văn phòng Đăng ký Đất đai.</li>
                        <li>Chuyển sang tab <strong className="text-slate-700">"Tra cứu theo Thuộc tính thửa đất"</strong> để tìm theo Số phát hành / Số vào sổ.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Feature Cards / Overview Grid */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#005993]/10 text-[#005993] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Tự Động Bỏ Qua Đăng Nhập</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hệ thống tự động duy trì phiên xác thực an toàn với tài khoản cán bộ <span className="font-mono text-slate-700 font-semibold">DanghhBL</span> trên máy chủ VNPT iLIS, cho phép tra cứu ngay mà không mất thời gian nhập lại mật khẩu.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#D71249]/10 text-[#D71249] flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Quét Mã QR & Phôi GCN</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tích hợp camera đa góc độ và bộ giải mã mã vạch/QR code thời gian thực. Hỗ trợ tải trực tiếp hình ảnh chụp từ điện thoại thông minh của cán bộ ngân hàng.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#7ED3F7]/30 text-[#005993] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Xem Trực Tiếp File GCN (PDF)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Truy xuất đường dẫn Presigned URL chính thức từ hệ thống iLIS, hỗ trợ phóng to chi tiết sơ đồ thửa đất, tải tệp tin và in ấn phục vụ hồ sơ cấp tín dụng.
              </p>
            </div>
          </div>

          {/* Quick Info Box on VietinBank Standard & iLIS Portal */}
          <div className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <VietinBankLogo size="sm" showSlogan={false} />
              <div className="text-xs text-slate-600">
                <span className="font-bold text-[#005993]">Chuẩn nhận diện thương hiệu VietinBank</span> • Tông màu Xanh đậm (#005993), Đỏ Vietin (#D71249) và Xanh nhạt (#7ED3F7).
              </div>
            </div>
            <a
              href="https://ilis-tracuugcn.vnpt.vn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#005993] hover:underline flex items-center gap-1 whitespace-nowrap"
            >
              <span>Truy cập Cổng ilis-tracuugcn.vnpt.vn</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>
      </main>

      {/* Camera QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code) => {
          setSearchCode(code);
          setActiveTab('qr');
          handleSearch(code);
        }}
      />

      {/* PDF Document Viewer Modal */}
      {searchResult?.data && (
        <PdfViewerModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          pdfUrl={searchResult.data}
          maQr={searchResult.maQr || searchCode}
          timestamp={searchResult.timestamp}
        />
      )}

      {/* Diagnostics Modal for verifying iLIS permissions */}
      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />

      {/* Footer - Strictly contains 'Design by Hải Đăng' as requested */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <VietinBankLogo size="sm" />
              <div className="hidden sm:block h-6 w-[1px] bg-slate-200" />
              <p className="text-xs text-slate-500">
                Hệ thống Tra cứu Thông tin Giấy chứng nhận QSD Đất (VNPT iLIS)
              </p>
            </div>

            {/* User-requested credit */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs">
              <span className="font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                Design by Hải Đăng
              </span>
              <span className="text-slate-400 text-[11px]">
                © {new Date().getFullYear()} VietinBank
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
