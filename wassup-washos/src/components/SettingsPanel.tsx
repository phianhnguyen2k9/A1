import React, { useState } from 'react';
import { Settings, RefreshCw, AlertCircle, Droplets, ShieldAlert, Sparkles, Sliders } from 'lucide-react';

interface SettingsPanelProps {
  simulationEnabled: boolean;
  onToggleSimulation: (enabled: boolean) => void;
  simulationSpeed: number; // in ms
  onUpdateSimulationSpeed: (speed: number) => void;
  lowStockAlertThreshold: number;
  onUpdateThreshold: (threshold: number) => void;
  stationPasscodes: {
    opr: string;
    pos: string;
    mgr: string;
  };
  onUpdateStationPasscode: (station: 'opr' | 'pos' | 'mgr', value: string) => void;
  chemicals: {
    water: number;
    foam: number;
    wax: number;
    wheel: number;
  };
  onRefillChemicals: (chem: 'water' | 'foam' | 'wax' | 'wheel') => void;
  onResetAlarms: () => void;
}

export default function SettingsPanel({
  simulationEnabled,
  onToggleSimulation,
  simulationSpeed,
  onUpdateSimulationSpeed,
  lowStockAlertThreshold,
  onUpdateThreshold,
  stationPasscodes,
  onUpdateStationPasscode,
  chemicals,
  onRefillChemicals,
  onResetAlarms
}: SettingsPanelProps) {
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#A2C62C]" /> CẤU HÌNH HỆ THỐNG TRẠM (MANAGER SETTINGS)
          </h3>
          <p className="text-[11px] text-white/50">Quản trị cấp cao và tối ưu vận hành tự động trạm WASSUP WashOS</p>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-[#A2C62C]/20 border border-[#A2C62C]/50 text-[#A2C62C] p-3 rounded-xl text-xs font-bold text-center animate-pulse">
          ✓ ĐÃ CẬP NHẬT CẤU HÌNH HỆ THỐNG THÀNH CÔNG!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Right and left settings groups */}
        <div className="space-y-6">
          {/* Automatic Simulation Loop Config */}
          <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-4">
            <h4 className="text-xs font-bold uppercase text-[#A2C62C] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Bộ Lọc Giả Lập Tự Động
            </h4>
            
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <div>
                <span className="text-xs font-bold text-white block">Tự động hoá Trạm Rửa xe</span>
                <span className="text-[10px] text-white/40 block">Tự động đẩy lùi tiến trình & tăng xe rải rác</span>
              </div>
              <button
                onClick={() => {
                  onToggleSimulation(!simulationEnabled);
                  handleSave();
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all uppercase ${simulationEnabled ? 'bg-green-500 text-black' : 'bg-white/10 text-white/60'}`}
              >
                {simulationEnabled ? 'ĐANG BẬT (ON)' : 'ĐANG TẮT (OFF)'}
              </button>
            </div>

            {simulationEnabled && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-white/40 block">Tốc độ cập nhật tiến độ (Giây / %)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1000"
                    max="10000"
                    step="1000"
                    value={simulationSpeed}
                    onChange={(e) => {
                      onUpdateSimulationSpeed(Number(e.target.value));
                      handleSave();
                    }}
                    className="flex-1 accent-[#A2C62C]"
                  />
                  <span className="text-xs font-mono font-bold text-white w-14 text-right">
                    {(simulationSpeed / 1000).toFixed(0)} giây
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Alarm system threshold settings */}
          <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-4">
            <h4 className="text-xs font-bold uppercase text-[#A2C62C] flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Quản Lý Mức Cảnh Báo
            </h4>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-white block">Ngưỡng báo động tồn kho thấp</span>
                  <span className="text-xs font-mono text-[#A2C62C] font-bold">{lowStockAlertThreshold}%</span>
                </div>
                <span className="text-[10px] text-white/40 block mb-2">Hệ thống sẽ nháy đỏ nếu hóa chất xuống dưới mức này</span>
                
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="5"
                    value={lowStockAlertThreshold}
                    onChange={(e) => {
                      onUpdateThreshold(Number(e.target.value));
                      handleSave();
                    }}
                    className="w-full accent-[#A2C62C]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 space-y-3">
                <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Mã Pin phân theo trạm</span>
                    <span className="text-[10px] text-[#A2C62C] font-bold">6 chữ số</span>
                  </div>
                  {(['opr', 'pos', 'mgr'] as const).map((station) => (
                    <div key={station}>
                      <label className="text-[10px] uppercase text-white/40 block mb-1">
                        {station === 'opr' ? 'Operator' : station === 'pos' ? 'POS' : 'Manager'}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={stationPasscodes[station]}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                          onUpdateStationPasscode(station, cleaned);
                          handleSave();
                        }}
                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-[#A2C62C] focus:outline-none font-mono text-white"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    onResetAlarms();
                    handleSave();
                  }}
                  className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-xs uppercase rounded-lg transition-all"
                >
                  Xoá toàn bộ cảnh báo lỗi kỹ thuật
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Refill stations & chemistry refills */}
        <div className="space-y-6">
          <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-4">
            <h4 className="text-xs font-bold uppercase text-[#A2C62C] flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5" /> Bơm Nạp Hóa Chất Trực Tiếp
            </h4>
            <p className="text-[10px] text-white/40">Giả lập nạp đầy các bể chứa hóa chất rửa và phụ gia đánh bóng ngay lập tức:</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-white/50 block">Water Tank (RO)</span>
                  <span className="text-sm font-mono font-bold text-white">{chemicals.water}%</span>
                </div>
                <button
                  onClick={() => {
                    onRefillChemicals('water');
                    handleSave();
                  }}
                  className="mt-2.5 py-1 text-[10px] font-bold bg-[#A2C62C] text-black rounded hover:brightness-110"
                >
                  Nạp đầy 100%
                </button>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-white/50 block">Active Foam</span>
                  <span className="text-sm font-mono font-bold text-white">{chemicals.foam}%</span>
                </div>
                <button
                  onClick={() => {
                    onRefillChemicals('foam');
                    handleSave();
                  }}
                  className="mt-2.5 py-1 text-[10px] font-bold bg-[#A2C62C] text-black rounded hover:brightness-110"
                >
                  Nạp đầy 100%
                </button>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-white/50 block">Carnauba Wax</span>
                  <span className="text-sm font-mono font-bold text-white">{chemicals.wax}%</span>
                </div>
                <button
                  onClick={() => {
                    onRefillChemicals('wax');
                    handleSave();
                  }}
                  className="mt-2.5 py-1 text-[10px] font-bold bg-[#A2C62C] text-black rounded hover:brightness-110"
                >
                  Nạp đầy 100%
                </button>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-white/50 block">Wheel Cleaner</span>
                  <span className="text-sm font-mono font-bold text-white">{chemicals.wheel}%</span>
                </div>
                <button
                  onClick={() => {
                    onRefillChemicals('wheel');
                    handleSave();
                  }}
                  className="mt-2.5 py-1 text-[10px] font-bold bg-[#A2C62C] text-black rounded hover:brightness-110"
                >
                  Nạp đầy 100%
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#A2C62C]/5 to-transparent border border-[#A2C62C]/20 p-4 rounded-xl">
            <h4 className="text-xs font-bold uppercase text-[#A2C62C] flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Ghi Chú Bản Quyền
            </h4>
            <p className="text-[10.5px] text-white/60 leading-relaxed">
              Phần mềm quản lý vận hành WASSUP WashOS v3.2. Đã đồng bộ với hạ tầng Cloud ERP của trạm trung tâm. Mọi thay đổi về đơn giá và voucher sẽ được tự động đồng bộ hóa xuống Kiosk khách hàng ngoài trời và Máy POS nội bộ trong 1-2 giây.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
