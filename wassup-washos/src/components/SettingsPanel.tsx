import React, { useRef, useState } from 'react';
import { Settings, RefreshCw, AlertCircle, Droplets, ShieldAlert, Sparkles, Sliders } from 'lucide-react';

interface SettingsPanelProps {
  simulationEnabled: boolean;
  onToggleSimulation: (enabled: boolean) => void;
  simulationSpeed: number; // in ms
  onUpdateSimulationSpeed: (speed: number) => void;
  lowStockAlertThreshold: number;
  onUpdateThreshold: (threshold: number) => void;
  stationPasscodes: {
    pos: string;
    mgr: string;
  };
  onUpdateStationPasscode: (station: 'pos' | 'mgr', value: string) => void;
  boothConfigs: Array<{ id: number; name: string; functionLabel: string; isActive: boolean }>;
  boothOperatorPasscodes: Record<number, string>;
  busyBoothIds: number[];
  onAddBooth: () => void;
  onRemoveBooth: (boothId: number) => void;
  onUpdateBoothConfig: (boothId: number, changes: Partial<{ name: string; functionLabel: string; isActive: boolean }>) => void;
  onUpdateBoothPasscode: (boothId: number, passcode: string) => void;
  services: { id: string; name: string }[];
  serviceBoothRules: Record<string, number>;
  onUpdateServiceBoothRule: (serviceId: string, boothId: number) => void;
  onResetServiceBoothRules: () => void;
  onExportConfigJson: () => string;
  onImportConfigJson: (jsonText: string) => { ok: boolean; message: string };
  onResetConfigDefaults: () => void;
  chemicals: {
    water: number;
    foam: number;
    wax: number;
    wheel: number;
  };
  onRefillChemicals: (chem: 'water' | 'foam' | 'wax' | 'wheel') => void;
  onResetAlarms: () => void;
}

type ImportPreviewPayload = {
  boothConfigs: Array<{ id: number; name: string; functionLabel: string; isActive: boolean }>;
  boothOperatorPasscodes: Record<string, string>;
  stationPasscodes: { pos?: string; mgr?: string };
  serviceBoothRules: Record<string, number>;
};

export default function SettingsPanel({
  simulationEnabled,
  onToggleSimulation,
  simulationSpeed,
  onUpdateSimulationSpeed,
  lowStockAlertThreshold,
  onUpdateThreshold,
  stationPasscodes,
  onUpdateStationPasscode,
  boothConfigs,
  boothOperatorPasscodes,
  busyBoothIds,
  onAddBooth,
  onRemoveBooth,
  onUpdateBoothConfig,
  onUpdateBoothPasscode,
  services,
  serviceBoothRules,
  onUpdateServiceBoothRule,
  onResetServiceBoothRules,
  onExportConfigJson,
  onImportConfigJson,
  onResetConfigDefaults,
  chemicals,
  onRefillChemicals,
  onResetAlarms
}: SettingsPanelProps) {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [pendingImportJson, setPendingImportJson] = useState<string | null>(null);
  const [pendingImportSummary, setPendingImportSummary] = useState<string[]>([]);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const invalidGlobalPasscodes = (['pos', 'mgr'] as const).filter(key => stationPasscodes[key].length !== 6);
  const invalidBoothPasscodes = boothConfigs.filter(booth => booth.isActive && (boothOperatorPasscodes[booth.id] || '').length !== 6);
  const darkFieldClass = 'w-full bg-[#060606] border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-white/35 focus:border-[#A2C62C] focus:outline-none';

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExportConfig = () => {
    const jsonContent = onExportConfigJson();
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wassup_booth_config_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const normalizeImportForPreview = (jsonText: string): { ok: true; data: ImportPreviewPayload } | { ok: false; message: string } => {
    try {
      const parsed = JSON.parse(jsonText) as {
        version?: number;
        boothConfigs?: Array<{ id: number; name: string; functionLabel: string; isActive: boolean }>;
        boothOperatorPasscodes?: Record<string, string>;
        stationPasscodes?: { pos?: string; mgr?: string };
        serviceBoothRules?: Record<string, number>;
        config?: {
          boothConfigs?: Array<{ id: number; name: string; functionLabel: string; isActive: boolean }>;
          boothOperatorPasscodes?: Record<string, string>;
          stationPasscodes?: { pos?: string; mgr?: string };
          serviceBoothRules?: Record<string, number>;
        };
      };

      if (parsed.version && parsed.version > 2) {
        return { ok: false, message: 'File backup thuộc phiên bản mới hơn, chưa hỗ trợ import.' };
      }

      const source = parsed.config || parsed;
      if (!Array.isArray(source.boothConfigs) || !source.boothConfigs.length) {
        return { ok: false, message: 'File backup thiếu boothConfigs hợp lệ.' };
      }

      const cleanedBooths = source.boothConfigs
        .map(booth => ({
          id: Number(booth.id),
          name: String(booth.name || `Booth ${booth.id}`).trim() || `Booth ${booth.id}`,
          functionLabel: String(booth.functionLabel || '').trim(),
          isActive: booth.isActive !== false
        }))
        .filter(booth => Number.isFinite(booth.id) && booth.id > 0);

      if (!cleanedBooths.length) {
        return { ok: false, message: 'Danh sách booth sau chuẩn hóa bị rỗng.' };
      }

      return {
        ok: true,
        data: {
          boothConfigs: cleanedBooths,
          boothOperatorPasscodes: source.boothOperatorPasscodes || {},
          stationPasscodes: source.stationPasscodes || {},
          serviceBoothRules: source.serviceBoothRules || {}
        }
      };
    } catch {
      return { ok: false, message: 'File JSON không hợp lệ.' };
    }
  };

  const buildImportDiffSummary = (incoming: ImportPreviewPayload) => {
    const currentBoothIds = boothConfigs.map(b => b.id).sort((a, b) => a - b);
    const incomingBoothIds = incoming.boothConfigs.map(b => b.id).sort((a, b) => a - b);
    const addedBooths = incomingBoothIds.filter(id => !currentBoothIds.includes(id));
    const removedBooths = currentBoothIds.filter(id => !incomingBoothIds.includes(id));

    const boothChangedCount = incoming.boothConfigs.filter(booth => {
      const cur = boothConfigs.find(b => b.id === booth.id);
      return !!cur && (cur.name !== booth.name || cur.functionLabel !== booth.functionLabel || cur.isActive !== booth.isActive);
    }).length;

    const serviceRuleChanged = services.filter(service => (serviceBoothRules[service.id] || 0) !== Number(incoming.serviceBoothRules[service.id] || 0)).length;
    const boothPassChanged = incomingBoothIds.filter(id => {
      const currentVal = String(boothOperatorPasscodes[id] || '').replace(/\D/g, '').slice(0, 6);
      const nextVal = String(incoming.boothOperatorPasscodes[String(id)] || '').replace(/\D/g, '').slice(0, 6);
      return currentVal !== nextVal;
    }).length;
    const posChanged = String(stationPasscodes.pos || '').replace(/\D/g, '').slice(0, 6) !== String(incoming.stationPasscodes.pos || '').replace(/\D/g, '').slice(0, 6);
    const mgrChanged = String(stationPasscodes.mgr || '').replace(/\D/g, '').slice(0, 6) !== String(incoming.stationPasscodes.mgr || '').replace(/\D/g, '').slice(0, 6);

    return [
      `Booth thêm mới: ${addedBooths.length}`,
      `Booth bị gỡ: ${removedBooths.length}`,
      `Booth thay đổi tên/chức năng/trạng thái: ${boothChangedCount}`,
      `Rule Service → Booth thay đổi: ${serviceRuleChanged}`,
      `Passcode booth thay đổi: ${boothPassChanged}`,
      `PIN POS thay đổi: ${posChanged ? 'Có' : 'Không'}`,
      `PIN Manager thay đổi: ${mgrChanged ? 'Có' : 'Không'}`
    ];
  };

  const handleImportFromFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const normalized = normalizeImportForPreview(text);
    if (!normalized.ok) {
      setPendingImportJson(null);
      setPendingImportSummary([]);
      setImportFeedback({ ok: false, message: normalized.message });
      return;
    }

    setPendingImportJson(text);
    setPendingImportSummary(buildImportDiffSummary(normalized.data));
    setImportFeedback({ ok: true, message: 'Đã nạp file backup. Vui lòng xem Preview diff và xác nhận Import.' });
  };

  const handleConfirmImport = () => {
    if (!pendingImportJson) return;
    const result = onImportConfigJson(pendingImportJson);
    setImportFeedback(result);
    if (result.ok) {
      setPendingImportJson(null);
      setPendingImportSummary([]);
      handleSave();
    }
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
                {(invalidGlobalPasscodes.length > 0 || invalidBoothPasscodes.length > 0) && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-200">
                    ⚠️ Một số passcode chưa đủ 6 số. Hệ thống vẫn hiển thị nhưng không nên dùng để đăng nhập.
                  </div>
                )}

                <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Mã Pin phân quyền theo workspace</span>
                    <span className="text-[10px] text-[#A2C62C] font-bold">6 chữ số</span>
                  </div>
                  {(['pos', 'mgr'] as const).map((station) => (
                    <div key={station}>
                      <label className="text-[10px] uppercase text-white/40 block mb-1">
                        {station === 'pos' ? 'POS' : 'Manager'}
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
                        className={`${darkFieldClass} rounded-xl px-3 py-2 font-mono ${stationPasscodes[station].length !== 6 ? 'border-amber-500/40' : ''}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Quản lý Booth mở rộng</span>
                    <button
                      type="button"
                      onClick={() => {
                        onAddBooth();
                        handleSave();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#A2C62C]/20 text-[#A2C62C] text-[10px] font-bold uppercase"
                    >
                      + Thêm Booth
                    </button>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {boothConfigs.map(booth => (
                      <div key={booth.id} className="rounded-lg border border-white/10 bg-black/40 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={booth.name}
                            onChange={(e) => {
                              onUpdateBoothConfig(booth.id, { name: e.target.value });
                              handleSave();
                            }}
                            className={`flex-1 ${darkFieldClass}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateBoothConfig(booth.id, { isActive: !booth.isActive });
                              handleSave();
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${booth.isActive ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/60'}`}
                          >
                            {booth.isActive ? 'Đang mở' : 'Tạm đóng'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onRemoveBooth(booth.id);
                              handleSave();
                            }}
                            disabled={busyBoothIds.includes(booth.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${busyBoothIds.includes(booth.id) ? 'bg-white/10 text-white/35 cursor-not-allowed' : 'bg-red-500/15 text-red-300'}`}
                          >
                            Xóa
                          </button>
                        </div>

                        <input
                          type="text"
                          value={booth.functionLabel}
                          onChange={(e) => {
                            onUpdateBoothConfig(booth.id, { functionLabel: e.target.value });
                            handleSave();
                          }}
                          placeholder="Chức năng booth, ví dụ: Rửa nhanh"
                          className={darkFieldClass}
                        />

                        <div>
                          <label className="text-[10px] uppercase text-white/40 block mb-1">Passcode operator booth {booth.id}</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={boothOperatorPasscodes[booth.id] || ''}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                              onUpdateBoothPasscode(booth.id, cleaned);
                              handleSave();
                            }}
                            className={`${darkFieldClass} font-mono ${((boothOperatorPasscodes[booth.id] || '').length !== 6 && booth.isActive) ? 'border-amber-500/40' : ''}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/45">Booth đang có xe Processing/QC sẽ bị khóa xóa để đảm bảo an toàn vận hành.</p>
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
          <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Rule phân bổ Service → Booth</span>
              <button
                type="button"
                onClick={() => {
                  onResetServiceBoothRules();
                  handleSave();
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 text-white/70 text-[10px] font-bold uppercase hover:bg-white/15"
              >
                Reset về rule mặc định
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {services.map(service => (
                <div key={service.id} className="grid grid-cols-12 items-center gap-2 rounded-lg border border-white/10 bg-black/40 p-2">
                  <div className="col-span-8">
                    <p className="text-xs text-white font-semibold truncate">{service.name}</p>
                    <p className="text-[10px] text-white/40">Mã dịch vụ: {service.id}</p>
                  </div>
                  <div className="col-span-4">
                    <select
                      value={serviceBoothRules[service.id] || 1}
                      onChange={(e) => {
                        onUpdateServiceBoothRule(service.id, Number(e.target.value));
                        handleSave();
                      }}
                      className={darkFieldClass}
                    >
                      {boothConfigs.filter(booth => booth.isActive).map(booth => (
                        <option key={booth.id} value={booth.id}>{booth.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Backup cấu hình Booth + Rule</span>
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleExportConfig}
                  className="px-2.5 py-1 rounded-lg bg-[#A2C62C]/20 text-[#A2C62C] text-[10px] font-bold uppercase"
                >
                  Export JSON
                </button>
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-white/10 text-white/70 text-[10px] font-bold uppercase hover:bg-white/15"
                >
                  Import JSON
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm('Bạn có chắc muốn reset toàn bộ cấu hình về mặc định? Thao tác này sẽ ghi đè rule phân bổ, passcode và cấu hình booth hiện tại.');
                    if (!confirmed) return;
                    onResetConfigDefaults();
                    setPendingImportJson(null);
                    setPendingImportSummary([]);
                    setImportFeedback({ ok: true, message: 'Đã rollback về cấu hình mặc định hệ thống.' });
                    handleSave();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-300 text-[10px] font-bold uppercase hover:bg-red-500/25"
                >
                  Reset mặc định
                </button>
              </div>
            </div>

            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                void handleImportFromFile(file);
                e.currentTarget.value = '';
              }}
            />

            {pendingImportSummary.length > 0 && (
              <div className="rounded-xl border border-[#A2C62C]/30 bg-[#A2C62C]/10 p-3 space-y-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#A2C62C] font-bold">Preview diff trước khi import</p>
                <div className="space-y-1.5">
                  {pendingImportSummary.map((line) => (
                    <p key={line} className="text-[11px] text-white/85">• {line}</p>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="px-3 py-1.5 rounded-lg bg-[#A2C62C] text-black text-[10px] font-bold uppercase hover:brightness-110"
                  >
                    Xác nhận Import
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingImportJson(null);
                      setPendingImportSummary([]);
                      setImportFeedback({ ok: false, message: 'Đã hủy import từ preview.' });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/10 text-white/75 text-[10px] font-bold uppercase hover:bg-white/15"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            {importFeedback && (
              <div className={`rounded-lg border px-3 py-2 text-[11px] ${importFeedback.ok ? 'border-green-500/30 bg-green-500/10 text-green-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
                {importFeedback.message}
              </div>
            )}
          </div>

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
