import React, { useEffect, useState } from 'react';
import { InventoryItem } from '../types';
import { 
  ShieldAlert, RefreshCw, Plus, Minus, FileText, BarChart3,
  TrendingDown, CheckCircle, Package, ArrowUpRight, ArrowDownRight,
  FileSpreadsheet, Download, Search
} from 'lucide-react';
import { SERVICE_USAGE_RATES } from '../data';

interface InventorySystemProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  completedJobsCount?: { [serviceId: string]: number }; // e.g. {'W1': 5, 'W2': 3}
  lowStockAlertThreshold?: number;
}

export default function InventorySystem({ 
  inventory, 
  setInventory,
  completedJobsCount = {},
  lowStockAlertThreshold = 20
}: InventorySystemProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Hóa chất' | 'Vật tư' | 'Công cụ'>('All');
  const [adjustItem, setAdjustItem] = useState<string | null>(null);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkItems, setBulkItems] = useState('');
  const [draftItemName, setDraftItemName] = useState('');
  const [draftItemCategory, setDraftItemCategory] = useState<'Hóa chất' | 'Vật tư' | 'Công cụ'>('Hóa chất');
  const [draftItemUnit, setDraftItemUnit] = useState('Lít');
  const [draftItemMinThreshold, setDraftItemMinThreshold] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredInventory = inventory.filter(item => {
    const categoryMatch = selectedCategory === 'All' ? true : item.category === selectedCategory;
    if (!categoryMatch) return false;
    if (!normalizedSearch) return true;

    const haystack = `${item.name} ${item.category} ${item.unit}`.toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  useEffect(() => {
    if (!adjustItem) {
      setDraftItemName('');
      setDraftItemCategory('Hóa chất');
      setDraftItemUnit('Lít');
      setDraftItemMinThreshold(10);
      return;
    }

    const current = inventory.find(item => item.id === adjustItem);
    if (current) {
      setDraftItemName(current.name);
      setDraftItemCategory(current.category);
      setDraftItemUnit(current.unit);
      setDraftItemMinThreshold(current.minThreshold);
    }
  }, [adjustItem, inventory]);

  // Calculate simulated consumption based on actual completed jobs
  const consumptionStats = {
    foam: 0,
    wax: 0,
    ceramic: 0,
    water: 0
  };

  Object.entries(completedJobsCount).forEach(([svcId, count]) => {
    const rate = SERVICE_USAGE_RATES.find(r => r.serviceId === svcId);
    if (rate) {
      consumptionStats.foam += rate.foamLiters * count;
      consumptionStats.wax += rate.waxLiters * count;
      consumptionStats.ceramic += rate.ceramicLiters * count;
      consumptionStats.water += rate.waterLiters * count;
    }
  });

  const handleSaveDraftItem = (e?: React.FormEvent) => {
    e?.preventDefault();

    const trimmedName = draftItemName.trim();
    if (!trimmedName) {
      setMsg({ type: 'error', text: 'Vui lòng nhập tên hàng trước khi lưu.' });
      return;
    }

    const todayString = new Date().toLocaleDateString('vi-VN');

    if (adjustItem) {
      const current = inventory.find(item => item.id === adjustItem);
      if (current) {
        setInventory(prev => prev.map(item => item.id === current.id ? {
          ...item,
          name: trimmedName,
          category: draftItemCategory,
          unit: draftItemUnit || item.unit,
          minThreshold: draftItemMinThreshold,
          lastUpdated: todayString
        } : item));
        setMsg({ type: 'success', text: `Đã cập nhật thông tin hàng "${trimmedName}".` });
        return;
      }
    }

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: trimmedName,
      category: draftItemCategory,
      quantity: 0,
      unit: draftItemUnit || 'Cái',
      minThreshold: draftItemMinThreshold,
      lastUpdated: todayString,
      history: [{ id: `new-${Date.now()}`, type: 'IN', qty: 0, reason: 'Tạo mới hàng trong kho', timestamp: todayString }]
    };

    setInventory(prev => [newItem, ...prev]);
    setAdjustItem(newItem.id);
    setMsg({ type: 'success', text: `Đã thêm hàng mới "${trimmedName}" vào kho.` });
  };

  const handleDeleteItem = (itemId: string) => {
    const target = inventory.find(i => i.id === itemId);
    if (!target) return;
    if (!window.confirm(`Xóa hàng "${target.name}" khỏi kho?`)) return;

    setInventory(prev => prev.filter(i => i.id !== itemId));
    if (adjustItem === itemId) setAdjustItem(null);
    setMsg({ type: 'success', text: `Đã xóa hàng "${target.name}" khỏi danh sách kho.` });
  };

  const handleBulkAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    const items = bulkItems
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    if (!items.length) {
      setMsg({ type: 'error', text: 'Vui lòng nhập ít nhất một hàng để thêm.' });
      return;
    }

    const todayString = new Date().toLocaleDateString('vi-VN');
    const newItems: InventoryItem[] = items.map((name, idx) => ({
      id: `inv-bulk-${Date.now()}-${idx}`,
      name,
      category: idx % 3 === 0 ? 'Hóa chất' : idx % 3 === 1 ? 'Vật tư' : 'Công cụ',
      quantity: 0,
      unit: 'Cái',
      minThreshold: 5,
      lastUpdated: todayString,
      history: [{ id: `bulk-${Date.now()}-${idx}`, type: 'IN', qty: 0, reason: 'Thêm hàng theo lô', timestamp: todayString }]
    }));

    setInventory(prev => [...newItems, ...prev]);
    setBulkItems('');
    setBulkMode(false);
    setMsg({ type: 'success', text: `Đã thêm ${items.length} hàng mới bằng chế độ nhập lô.` });
  };

  const handleExportMonthlyReport = () => {
    const monthLabel = new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    const csvRows = [
      ['Thang', 'TenVatTu', 'Nhom', 'TonKho', 'DonVi', 'MucMin', 'TrangThai'],
      ...inventory.map(item => {
        const warningFloor = Math.max(item.minThreshold, lowStockAlertThreshold);
        const status = item.quantity < warningFloor ? 'CanhBao' : 'BinhThuong';
        return [monthLabel, item.name, item.category, item.quantity, item.unit, item.minThreshold, status];
      })
    ];

    const csvContent = csvRows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wassup_washos_inventory_monthly_${new Date().toISOString().slice(0, 7)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMsg({ type: 'success', text: `Đã xuất báo cáo kho tháng ${monthLabel}.` });
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem) {
      setMsg({ type: 'error', text: 'Vui lòng chọn vật tư cần cập nhật!' });
      return;
    }
    if (adjustQty <= 0) {
      setMsg({ type: 'error', text: 'Số lượng điều chỉnh phải lớn hơn 0!' });
      return;
    }
    if (!adjustReason) {
      setMsg({ type: 'error', text: 'Vui lòng nhập lý do điều chỉnh kho!' });
      return;
    }

    const itemToAdjust = inventory.find(i => i.id === adjustItem);
    if (!itemToAdjust) return;

    if (adjustType === 'OUT' && itemToAdjust.quantity < adjustQty) {
      setMsg({ type: 'error', text: 'Không thể xuất quá số lượng tồn kho khả dụng!' });
      return;
    }

    const todayString = new Date().toLocaleDateString('vi-VN');

    setInventory(prev => prev.map(item => {
      if (item.id === adjustItem) {
        const newQty = adjustType === 'IN' 
          ? item.quantity + adjustQty 
          : item.quantity - adjustQty;

        const newLog = {
          id: `log-${Date.now()}`,
          type: adjustType,
          qty: adjustQty,
          reason: adjustReason,
          timestamp: todayString
        };

        return {
          ...item,
          quantity: newQty,
          lastUpdated: todayString,
          history: [newLog, ...item.history]
        };
      }
      return item;
    }));

    setMsg({ 
      type: 'success', 
      text: `Đã ${adjustType === 'IN' ? 'NHẬP THÊM' : 'XUẤT KHO'} ${adjustQty} ${itemToAdjust.unit} cho "${itemToAdjust.name}" thành công!` 
    });
    setAdjustQty(0);
    setAdjustReason('');
    setAdjustItem(null);

    setTimeout(() => setMsg(null), 4000);
  };

  // Get status color & ratio of item
  const getItemStatus = (item: InventoryItem) => {
    const warningFloor = Math.max(item.minThreshold, lowStockAlertThreshold);
    const isLow = item.quantity < warningFloor;
    const ratio = Math.min(100, Math.max(0, (item.quantity / (item.minThreshold * 3)) * 100)); // normalized visual level
    return { isLow, ratio };
  };

  return (
    <div className="space-y-6">
      {/* Upper header section with metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0f1115] border border-white/5 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-white/40 block font-bold uppercase tracking-wider">CẢNH BÁO THIẾU HỤT</span>
            <span className="text-xl font-bold font-mono text-red-400">
              {inventory.filter(i => i.quantity < Math.max(i.minThreshold, lowStockAlertThreshold)).length} Vật tư
            </span>
          </div>
          <div className="p-3 bg-red-500/10 rounded-xl">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
        </div>

        <div className="bg-[#0f1115] border border-white/5 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-white/40 block font-bold uppercase tracking-wider">HÓA CHẤT AN TOÀN</span>
            <span className="text-xl font-bold font-mono text-green-400">
              {inventory.filter(i => i.category === 'Hóa chất' && i.quantity >= i.minThreshold).length} loại
            </span>
          </div>
          <div className="p-3 bg-green-500/10 rounded-xl">
            <Package className="w-5 h-5 text-green-400" />
          </div>
        </div>

        <div className="bg-[#A2C62C]/10 border border-[#A2C62C]/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-[10px] text-[#A2C62C] block font-bold uppercase tracking-wider">TIÊU THỤ ƯỚC TÍNH NẰM TRONG VÉ</span>
            <span className="text-xs font-bold text-white leading-tight block mt-1 break-words">
              {consumptionStats.foam.toFixed(1)}L Foam | {consumptionStats.wax.toFixed(1)}L Wax | {consumptionStats.water}L Nước RO
            </span>
          </div>
          <div className="p-2.5 bg-[#A2C62C]/20 rounded-lg self-start sm:self-auto">
            <TrendingDown className="w-4 h-4 text-[#A2C62C]" />
          </div>
        </div>
      </div>

      {msg && (
        <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}>
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: LIST AND FILTER */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-center">
            <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-lg border border-white/10 overflow-x-auto">
              {(['All', 'Hóa chất', 'Vật tư', 'Công cụ'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-[#A2C62C] text-black' : 'text-white/60 hover:text-white'}`}
                >
                  {cat === 'All' ? 'Tất cả' : cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full lg:w-auto">
              <button 
                onClick={handleExportMonthlyReport}
                className="px-3 py-2 bg-[#A2C62C]/15 hover:bg-[#A2C62C]/25 border border-[#A2C62C]/20 rounded-lg text-[10px] font-bold text-[#A2C62C] uppercase flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <Download className="w-3.5 h-3.5" />
                Xuất báo cáo kho theo tháng
              </button>
              <button 
                onClick={() => {
                  // Quick export template
                  const csvData = "data:text/csv;charset=utf-8,ID,TenVatTu,Nhom,TonKho,DonVi,MucMin\n" + 
                    inventory.map(i => `${i.id},${i.name},${i.category},${i.quantity},${i.unit},${i.minThreshold}`).join("\n");
                  const encodedUri = encodeURI(csvData);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", "wassup_washos_inventory_report.csv");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-white uppercase flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Báo cáo Excel (.CSV)
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm vật tư/hóa chất..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-white/35 focus:border-[#A2C62C] focus:outline-none"
            />
          </div>

          {normalizedSearch && (
            <p className="text-[10px] text-white/45">
              Kết quả tìm kiếm: <span className="text-white">{filteredInventory.length}</span> mục
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredInventory.map(item => {
              const { isLow, ratio } = getItemStatus(item);
              return (
                <div 
                  key={item.id}
                  className={`bg-white/5 border rounded-2xl p-4 max-[389px]:p-3 relative overflow-hidden transition-all flex flex-col justify-between ${isLow ? 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : 'border-white/10 hover:border-[#A2C62C]/40'}`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] max-[389px]:text-[8px] bg-white/10 text-white/60 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                        {item.category}
                      </span>
                      {isLow && (
                        <span className="bg-red-500 text-black text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded animate-pulse max-[389px]:px-1 max-[389px]:text-[7px]">
                          <span className="max-[389px]:hidden">Cảnh báo sắp hết</span>
                          <span className="hidden max-[389px]:inline">Sắp hết</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs max-[389px]:text-[11px] font-bold text-white mb-2 leading-snug">{item.name}</h4>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 mb-2">
                      <span className="text-xl max-[389px]:text-lg font-bold font-mono text-white">
                        {item.quantity.toLocaleString()} <span className="text-xs max-[389px]:text-[10px] font-normal opacity-50">{item.unit}</span>
                      </span>
                      <span className="text-[10px] max-[389px]:text-[9px] text-white/40">
                        Min: {item.minThreshold} {item.unit}
                      </span>
                    </div>

                    {/* Progress visual bar */}
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-3">
                      <div 
                        className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-[#A2C62C]'}`}
                        style={{ width: `${ratio}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-t border-white/5 pt-2.5 mt-1">
                    <span className="text-[9px] max-[389px]:text-[8px] text-white/30">Cập nhật: {item.lastUpdated}</span>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => setAdjustItem(item.id)}
                        className="text-[10px] max-[389px]:text-[9px] text-[#A2C62C] hover:underline font-bold uppercase tracking-wider flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span className="max-[389px]:hidden">Điều chỉnh kho</span>
                        <span className="hidden max-[389px]:inline">Điều chỉnh</span>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-[10px] max-[389px]:text-[9px] text-red-400 hover:underline font-bold uppercase tracking-wider flex items-center gap-1"
                      >
                        <Minus className="w-3 h-3" />
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!filteredInventory.length && (
            <div className="bg-black/30 border border-white/10 rounded-xl p-4 text-center text-xs text-white/60">
              Không tìm thấy vật tư phù hợp với bộ lọc hiện tại.
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: UPDATE / ADJ FORM & RECENT TRANSACTION LOGS */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Action Adjustment Form */}
          <div className="bg-[#0f1115] border border-white/10 rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-[#A2C62C]" />
              XUẤT NHẬP KHO NHANH (ADJUST STOCK)
            </h3>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase text-white/40 block mb-1">Tên hàng / vật tư</label>
                <input
                  type="text"
                  placeholder="Nhập tên hàng mới hoặc sửa tên hiện có"
                  value={draftItemName}
                  onChange={(e) => setDraftItemName(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-[#A2C62C] focus:outline-none text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase text-white/40 block mb-1">Danh mục</label>
                  <select
                    value={draftItemCategory}
                    onChange={(e) => setDraftItemCategory(e.target.value as 'Hóa chất' | 'Vật tư' | 'Công cụ')} 
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-[#A2C62C] focus:outline-none"
                  >
                    <option value="Hóa chất">Hóa chất</option>
                    <option value="Vật tư">Vật tư</option>
                    <option value="Công cụ">Công cụ</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-white/40 block mb-1">Đơn vị</label>
                  <input
                    type="text"
                    placeholder="Lít / Cái / Hộp"
                    value={draftItemUnit}
                    onChange={(e) => setDraftItemUnit(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-[#A2C62C] focus:outline-none text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase text-white/40 block mb-1">Ngưỡng min cảnh báo</label>
                <input
                  type="number"
                  placeholder="Nhập mức tối thiểu"
                  value={draftItemMinThreshold || ''}
                  onChange={(e) => setDraftItemMinThreshold(Number(e.target.value))}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-[#A2C62C] focus:outline-none font-mono text-white"
                />
              </div>

              <button
                type="button"
                onClick={() => handleSaveDraftItem()}
                className="w-full py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Lưu tên / thêm hàng mới
              </button>

              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase text-white/40">Nhập lô hàng nhanh</span>
                <button type="button" onClick={() => setBulkMode(!bulkMode)} className="text-[10px] text-[#A2C62C] font-bold uppercase tracking-wider">
                  {bulkMode ? 'Đóng' : 'Nhập nhiều hàng'}
                </button>
              </div>

              {bulkMode && (
                <div className="space-y-2 rounded-xl border border-white/10 bg-black/40 p-3">
                  <label className="text-[10px] uppercase text-white/40 block">Mỗi dòng = 1 hàng mới</label>
                  <textarea
                    rows={4}
                    value={bulkItems}
                    onChange={(e) => setBulkItems(e.target.value)}
                    placeholder="Ví dụ:&#10;Bình xịt bọt mới&#10;Máy đo áp suất lốp"
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-[#A2C62C] focus:outline-none text-white"
                  />
                  <button type="button" onClick={() => handleBulkAdd()} className="w-full py-2 bg-[#A2C62C] text-black rounded-xl text-xs font-bold uppercase tracking-wider">Thêm hàng lô</button>
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase text-white/40 block mb-1">Chọn vật tư / hóa chất</label>
                <select 
                  value={adjustItem || ''} 
                  onChange={e => setAdjustItem(e.target.value || null)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-[#A2C62C] focus:outline-none"
                >
                  <option value="">-- Chọn danh mục hàng --</option>
                  {inventory.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.quantity} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase text-white/40 block mb-1">Loại giao dịch</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('IN')}
                    className={`py-2 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all ${adjustType === 'IN' ? 'bg-green-500 text-black' : 'bg-white/5 text-white/60'}`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Nhập thêm kho
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('OUT')}
                    className={`py-2 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all ${adjustType === 'OUT' ? 'bg-red-500 text-black' : 'bg-white/5 text-white/60'}`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    Xuất tiêu hao
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase text-white/40 block mb-1">Số lượng cập nhật</label>
                <input 
                  type="number"
                  placeholder="Nhập số lượng..."
                  value={adjustQty || ''}
                  onChange={e => setAdjustQty(Number(e.target.value))}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-[#A2C62C] focus:outline-none font-mono text-white"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-white/40 block mb-1">Lý do điều chỉnh</label>
                <input 
                  type="text"
                  placeholder="Nhập lý do xuất/nhập..."
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-[#A2C62C] focus:outline-none text-white"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-[#A2C62C] hover:brightness-110 active:scale-95 text-black rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
              >
                Cập nhật tồn kho
              </button>
            </form>
          </div>

          <div className="bg-[#0f1115] border border-white/10 rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#A2C62C]" />
              BIỂU ĐỒ TỒN KHO THEO THỜI GIAN
            </h3>
            <div className="space-y-3">
              {inventory.slice(0, 6).map(item => {
                const maxValue = Math.max(item.minThreshold * 3, 30);
                const ratio = Math.min(100, Math.round((item.quantity / maxValue) * 100));
                return (
                  <div key={item.id}>
                    <div className="flex justify-between items-center mb-1 text-[10px] text-white/60">
                      <span className="truncate pr-2">{item.name}</span>
                      <span className="font-mono text-white">{item.quantity}/{maxValue}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#A2C62C] to-emerald-400" style={{ width: `${ratio}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Service Consumption Formulas & Logs */}
          <div className="bg-[#0f1115] border border-white/10 rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#A2C62C]" />
              LỊCH SỬ KHO GẦN ĐÂY
            </h3>

            <div className="space-y-3.5 max-h-[180px] overflow-y-auto pr-1">
              {inventory.flatMap(i => 
                i.history.map(h => ({ ...h, itemName: i.name, itemUnit: i.unit }))
              ).sort((a,b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 5).map((log, idx) => (
                <div key={idx} className="bg-black/30 p-2.5 rounded-lg border border-white/5 flex items-start justify-between text-[11px]">
                  <div>
                    <span className="font-bold text-white block truncate max-w-[150px]">{log.itemName}</span>
                    <span className="text-[9px] text-white/40 block mt-0.5">{log.reason} • {log.timestamp}</span>
                  </div>
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${log.type === 'IN' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {log.type === 'IN' ? '+' : '-'}{log.qty} {log.itemUnit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
