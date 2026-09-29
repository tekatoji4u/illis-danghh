import React, { useState } from 'react';
import { Layers, MapPin, Search, Hash, FileCheck, HelpCircle } from 'lucide-react';

interface ManualLookupFormProps {
  onSearch: (maQr: string) => void;
  isLoading: boolean;
}

const BAC_LIEU_DISTRICTS = [
  { code: '954', name: 'Thành phố Bạc Liêu' },
  { code: '956', name: 'Thị xã Giá Rai' },
  { code: '957', name: 'Huyện Hồng Dân' },
  { code: '958', name: 'Huyện Phước Long' },
  { code: '959', name: 'Huyện Vĩnh Lợi' },
  { code: '960', name: 'Huyện Đông Hải' },
  { code: '961', name: 'Huyện Hòa Bình' }
];

export const ManualLookupForm: React.FC<ManualLookupFormProps> = ({
  onSearch,
  isLoading
}) => {
  const [district, setDistrict] = useState('954');
  const [commune, setCommune] = useState('');
  const [soPhatHanh, setSoPhatHanh] = useState('');
  const [soVaoSo, setSoVaoSo] = useState('');
  const [soThua, setSoThua] = useState('');
  const [toBanDo, setToBanDo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Construct pipe-separated string according to VNPT iLIS standard format
    // Format: 95|maHuyen|maXa|soPhatHanh|soVaoSo|soThua|toBanDo
    const parts = [
      '95', // Bac Lieu
      district,
      commune.trim() || '00',
      soPhatHanh.trim(),
      soVaoSo.trim(),
      soThua.trim(),
      toBanDo.trim()
    ].filter(Boolean);

    if (parts.length < 2) {
      alert('Vui lòng nhập ít nhất Số phát hành hoặc Số vào sổ GCN');
      return;
    }

    const maQr = parts.join('|');
    onSearch(maQr);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* District */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#005993]" />
            Quận / Huyện (Bạc Liêu)
          </label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005993]"
          >
            {BAC_LIEU_DISTRICTS.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>

        {/* Commune / Ward */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Phường / Xã (hoặc Mã xã nếu có)
          </label>
          <input
            type="text"
            value={commune}
            onChange={(e) => setCommune(e.target.value)}
            placeholder="Ví dụ: Phường 1, Hiệp Thành..."
            className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005993]"
          />
        </div>

        {/* Số phát hành GCN (Seri phôi) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-[#005993]" />
            Số phát hành GCN (Số Seri phôi)
          </label>
          <input
            type="text"
            value={soPhatHanh}
            onChange={(e) => setSoPhatHanh(e.target.value.toUpperCase())}
            placeholder="Ví dụ: DA 684321, CQ 123456"
            className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005993] font-mono uppercase"
          />
        </div>

        {/* Số vào sổ cấp GCN */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-[#005993]" />
            Số vào sổ cấp GCN
          </label>
          <input
            type="text"
            value={soVaoSo}
            onChange={(e) => setSoVaoSo(e.target.value)}
            placeholder="Ví dụ: CS 01234, CH 00567"
            className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005993] font-mono"
          />
        </div>

        {/* Thửa đất số */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#005993]" />
            Thửa đất số
          </label>
          <input
            type="text"
            value={soThua}
            onChange={(e) => setSoThua(e.target.value)}
            placeholder="Ví dụ: 125"
            className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005993]"
          />
        </div>

        {/* Tờ bản đồ số */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tờ bản đồ số
          </label>
          <input
            type="text"
            value={toBanDo}
            onChange={(e) => setToBanDo(e.target.value)}
            placeholder="Ví dụ: 14"
            className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005993]"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Hệ thống tự động đồng bộ mã truy vấn với Gateway iLIS Bạc Liêu</span>
        </div>

        <button
          type="submit"
          disabled={isLoading || (!soPhatHanh && !soVaoSo && !soThua)}
          className="px-6 py-2.5 rounded-xl bg-[#005993] hover:bg-[#004777] disabled:bg-slate-300 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm"
        >
          <Search className="w-4 h-4" />
          <span>Tra cứu thông tin</span>
        </button>
      </div>
    </form>
  );
};
