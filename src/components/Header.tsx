import React, { useState } from 'react';
import { VietinBankLogo } from './VietinBankLogo.tsx';
import { UserProfile } from '../types.ts';
import { 
  ShieldCheck, 
  RefreshCw, 
  ExternalLink, 
  User, 
  MapPin, 
  Phone, 
  CreditCard, 
  X,
  CheckCircle2,
  Server
} from 'lucide-react';

interface HeaderProps {
  user: UserProfile | null;
  onRefreshSession: () => Promise<void>;
  isRefreshing: boolean;
  onOpenDiagnostics: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onRefreshSession,
  isRefreshing,
  onOpenDiagnostics
}) => {
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left: VietinBank Branding */}
            <div className="flex items-center gap-4">
              <VietinBankLogo size="md" />
              <div className="hidden md:block h-8 w-[1px] bg-slate-200" />
              <div className="hidden lg:flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-[#005993]">
                  Hệ Thống Tra Cứu GCN Đất Đai
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Cổng tích hợp trực tiếp dữ liệu VNPT iLIS
                </span>
              </div>
            </div>

            {/* Right: Authenticated User Status & Direct Access Badge */}
            <div className="flex items-center gap-3">
              {/* Direct Bypass Badge & Diagnostics button */}
              <button
                onClick={onOpenDiagnostics}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Bấm để kiểm tra chi tiết quyền truy xuất cổng VNPT iLIS"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                </span>
                <span>Bỏ qua đăng nhập • Kiểm tra quyền</span>
              </button>

              {/* User Pill Button */}
              {user ? (
                <button
                  onClick={() => setShowUserInfoModal(true)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-[#005993]/5 hover:bg-[#005993]/10 border border-[#005993]/20 transition-all text-left group"
                  title="Xem thông tin tài khoản iLIS"
                >
                  <div className="w-8 h-8 rounded-full bg-[#005993] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.fullName.split(' ').pop()?.charAt(0) || 'Đ'}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-[#005993] transition-colors">
                      {user.fullName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {user.username} (Bạc Liêu)
                    </span>
                  </div>
                </button>
              ) : (
                <div className="text-xs text-slate-500 animate-pulse">
                  Đang xác thực iLIS...
                </div>
              )}

              {/* Refresh Session Button */}
              <button
                onClick={onRefreshSession}
                disabled={isRefreshing}
                className="p-2 text-slate-500 hover:text-[#005993] hover:bg-slate-100 rounded-lg transition-colors"
                title="Làm mới phiên kết nối iLIS"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#005993]' : ''}`} />
              </button>

              {/* Link to original iLIS portal */}
              <a
                href="https://ilis-tracuugcn.vnpt.vn/login"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-[#005993] hover:bg-slate-100 transition-colors border border-slate-200"
                title="Mở cổng gốc ilis-tracuugcn.vnpt.vn"
              >
                <span>Cổng gốc iLIS</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* User Information Modal */}
      {showUserInfoModal && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 bg-[#005993] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#7ED3F7]" />
                <h3 className="font-bold text-base">Thông tin Tài khoản iLIS VNPT</h3>
              </div>
              <button
                onClick={() => setShowUserInfoModal(false)}
                className="p-1 rounded-full hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile body */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 rounded-full bg-[#005993] text-white flex items-center justify-center text-lg font-bold">
                  {user.fullName.split(' ').pop()?.charAt(0) || 'Đ'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{user.fullName}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-100/70 text-[#005993] font-semibold">
                      @{user.username}
                    </span>
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Hoạt động
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-slate-400" /> Số CCCD/Định danh:
                  </span>
                  <span className="font-semibold text-slate-800 font-mono">{user.identityNumber || 'Chưa cập nhật'}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-slate-400" /> Số điện thoại:
                  </span>
                  <span className="font-semibold text-slate-800 font-mono">{user.phoneNumber || '0907704429'}</span>
                </div>

                <div className="flex items-start justify-between p-2.5 rounded-lg bg-slate-50">
                  <span className="text-slate-500 flex items-center gap-1.5 flex-shrink-0">
                    <MapPin className="w-4 h-4 text-slate-400" /> Địa chỉ công tác/thường trú:
                  </span>
                  <span className="font-semibold text-slate-800 text-right ml-2">{user.address || 'Bạc Liêu'}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-slate-400" /> Khu vực quản lý iLIS:
                  </span>
                  <span className="font-semibold text-slate-800">
                    Tỉnh Bạc Liêu (Mã {user.maTinh}) / Huyện {user.maHuyen}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
                <span className="font-bold">Cơ chế tự động:</span> Ứng dụng này đã được cấu hình sẵn thông tin đăng nhập với người dùng <code className="font-bold">DanghhBL</code>. Mọi tác vụ tra cứu Giấy chứng nhận được hệ thống tự động xác thực và ủy quyền trực tiếp tới Gateway VNPT iLIS mà không yêu cầu nhập mật khẩu thủ công.
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">VietinBank • Cán bộ tín dụng</span>
              <button
                onClick={() => setShowUserInfoModal(false)}
                className="px-4 py-1.5 rounded-lg bg-[#005993] text-white text-xs font-semibold hover:bg-[#004777] transition-colors"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
