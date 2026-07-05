import React, { useState } from 'react';
import { Tag, DollarSign, Plus, Trash2, Edit, Save, CheckCircle, Percent, Gift } from 'lucide-react';
import VirtualKeyboard from './VirtualKeyboard';

interface ServiceItem {
  id: string;
  code: string;
  name: string;
  desc: string;
  price45: number;
  price79: number;
  popular?: boolean;
}

interface AddonItem {
  id: string;
  cat: string;
  name: string;
  price45: number;
  price79: number;
}

interface PromoCampaign {
  code: string;
  value: number; // raw value or percentage (e.g. 100000 or 0.3)
  type: 'fixed' | 'percent';
  description: string;
}

interface PromoPricingManagerProps {
  services: ServiceItem[];
  onUpdateServices: (updated: ServiceItem[]) => void;
  addons: AddonItem[];
  onUpdateAddons: (updated: AddonItem[]) => void;
  promotions: PromoCampaign[];
  onUpdatePromotions: (updated: PromoCampaign[]) => void;
}

export default function PromoPricingManager({
  services,
  onUpdateServices,
  addons,
  onUpdateAddons,
  promotions,
  onUpdatePromotions
}: PromoPricingManagerProps) {
  const [subTab, setSubTab] = useState<'services' | 'addons' | 'promos'>('services');
  
  // State for active item edit
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editSvcCode, setEditSvcCode] = useState('');
  const [editSvcName, setEditSvcName] = useState('');
  const [editSvcDesc, setEditSvcDesc] = useState('');
  const [editSvcPrice45, setEditSvcPrice45] = useState<number>(0);
  const [editSvcPrice79, setEditSvcPrice79] = useState<number>(0);

  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [editAddonCat, setEditAddonCat] = useState('');
  const [editAddonName, setEditAddonName] = useState('');
  const [editAddonPrice45, setEditAddonPrice45] = useState<number>(0);
  const [editAddonPrice79, setEditAddonPrice79] = useState<number>(0);

  // New promo form state
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoValue, setNewPromoValue] = useState<number>(0);
  const [newPromoType, setNewPromoType] = useState<'fixed' | 'percent'>('fixed');
  const [newPromoDesc, setNewPromoDesc] = useState('');
  const [showAddPromo, setShowAddPromo] = useState(false);

  // Virtual Keyboard integration state
  const [keyboardTarget, setKeyboardTarget] = useState<'promoCode' | 'promoDesc' | null>(null);

  const handleSaveService = (id: string) => {
    onUpdateServices(
      services.map(s => s.id === id ? {
        ...s,
        code: editSvcCode.trim() || s.code,
        name: editSvcName.trim() || s.name,
        desc: editSvcDesc.trim() || s.desc,
        price45: editSvcPrice45,
        price79: editSvcPrice79
      } : s)
    );
    setEditingServiceId(null);
  };

  const handleSaveAddon = (id: string) => {
    onUpdateAddons(
      addons.map(a => a.id === id ? {
        ...a,
        cat: editAddonCat.trim() || a.cat,
        name: editAddonName.trim() || a.name,
        price45: editAddonPrice45,
        price79: editAddonPrice79
      } : a)
    );
    setEditingAddonId(null);
  };

  const handleAddPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode) return;

    const newCampaign: PromoCampaign = {
      code: newPromoCode.trim().toUpperCase(),
      value: newPromoType === 'percent' ? Number((newPromoValue / 100).toFixed(2)) : newPromoValue,
      type: newPromoType,
      description: newPromoDesc || `Voucher giảm ${newPromoType === 'percent' ? `${newPromoValue}%` : `${newPromoValue.toLocaleString()}đ`}`
    };

    onUpdatePromotions([...promotions, newCampaign]);
    
    // Reset form
    setNewPromoCode('');
    setNewPromoValue(0);
    setNewPromoDesc('');
    setShowAddPromo(false);
    setKeyboardTarget(null);
  };

  const handleDeletePromo = (code: string) => {
    onUpdatePromotions(promotions.filter(p => p.code !== code));
  };

  const handleAddService = () => {
    const newService: ServiceItem = {
      id: `svc-${Date.now()}`,
      code: `NEW${services.length + 1}`,
      name: 'Gói mới',
      desc: 'Nhập mô tả gói dịch vụ',
      price45: 0,
      price79: 0
    };

    onUpdateServices([...services, newService]);
    setEditingServiceId(newService.id);
    setEditSvcCode(newService.code);
    setEditSvcName(newService.name);
    setEditSvcDesc(newService.desc);
    setEditSvcPrice45(newService.price45);
    setEditSvcPrice79(newService.price79);
  };

  const handleAddAddon = () => {
    const newAddon: AddonItem = {
      id: `addon-${Date.now()}`,
      cat: 'MỚI',
      name: 'Dịch vụ lẻ mới',
      price45: 0,
      price79: 0
    };

    onUpdateAddons([...addons, newAddon]);
    setEditingAddonId(newAddon.id);
    setEditAddonCat(newAddon.cat);
    setEditAddonName(newAddon.name);
    setEditAddonPrice45(newAddon.price45);
    setEditAddonPrice79(newAddon.price79);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">ĐIỀU CHỈNH ĐƠN GIÁ & KHUYẾN MÃI</h3>
          <p className="text-[11px] text-white/50">Cập nhật bảng giá dịch vụ rửa xe và quản lý mã coupon toàn hệ thống</p>
        </div>
        
        {/* Navigation tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={subTab === 'services' ? handleAddService : subTab === 'addons' ? handleAddAddon : undefined}
            className="bg-[#A2C62C]/15 text-[#A2C62C] border border-[#A2C62C]/30 hover:bg-[#A2C62C]/25 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> {subTab === 'services' ? 'Thêm mới gói/dịch vụ lẻ' : subTab === 'addons' ? 'Thêm mới gói/dịch vụ lẻ' : 'Thêm mới'}
          </button>
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setSubTab('services')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${subTab === 'services' ? 'bg-[#A2C62C] text-black' : 'text-white/60 hover:text-white'}`}
          >
            Gói Rửa Xe
          </button>
          <button
            onClick={() => setSubTab('addons')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${subTab === 'addons' ? 'bg-[#A2C62C] text-black' : 'text-white/60 hover:text-white'}`}
          >
            Addons Cộng Thêm
          </button>
          <button
            onClick={() => setSubTab('promos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${subTab === 'promos' ? 'bg-[#A2C62C] text-black' : 'text-white/60 hover:text-white'}`}
          >
            Mã Khuyến Mãi
          </button>
          </div>
        </div>
      </div>

      {/* Services List Section */}
      {subTab === 'services' && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white/80">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase text-white/40 font-bold">
                  <th className="py-2.5">Gói Dịch Vụ</th>
                  <th className="py-2.5">Giá Xe 4-5 Chỗ</th>
                  <th className="py-2.5">Giá Xe 7-9 Chỗ</th>
                  <th className="py-2.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {services.map(s => {
                  const isEditing = editingServiceId === s.id;
                  return (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              value={editSvcCode}
                              onChange={(e) => setEditSvcCode(e.target.value.toUpperCase())}
                              className="w-full max-w-[96px] bg-black/80 border border-[#A2C62C]/40 rounded px-2 py-1 text-[10px] text-white font-mono uppercase focus:outline-none focus:border-[#A2C62C]"
                              placeholder="Mã"
                            />
                            <input
                              value={editSvcName}
                              onChange={(e) => setEditSvcName(e.target.value)}
                              className="w-full bg-black/80 border border-[#A2C62C]/40 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#A2C62C]"
                              placeholder="Tên gói"
                            />
                            <textarea
                              value={editSvcDesc}
                              onChange={(e) => setEditSvcDesc(e.target.value)}
                              rows={2}
                              className="w-full bg-black/80 border border-[#A2C62C]/40 rounded px-2 py-1 text-[10px] text-white/80 focus:outline-none focus:border-[#A2C62C]"
                              placeholder="Mô tả"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span className="text-[#A2C62C] font-mono bg-[#A2C62C]/10 px-1.5 py-0.5 rounded text-[10px]">{s.code}</span>
                              {s.name}
                            </div>
                            <p className="text-[10px] text-white/40 max-w-sm mt-0.5">{s.desc}</p>
                          </>
                        )}
                      </td>
                      <td className="py-3 font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editSvcPrice45}
                            onChange={(e) => setEditSvcPrice45(Number(e.target.value))}
                            className="bg-black/80 border border-[#A2C62C]/40 rounded px-2 py-1 w-28 text-white focus:outline-none focus:border-[#A2C62C]"
                          />
                        ) : (
                          `${s.price45.toLocaleString()}đ`
                        )}
                      </td>
                      <td className="py-3 font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editSvcPrice79}
                            onChange={(e) => setEditSvcPrice79(Number(e.target.value))}
                            className="bg-black/80 border border-[#A2C62C]/40 rounded px-2 py-1 w-28 text-white focus:outline-none focus:border-[#A2C62C]"
                          />
                        ) : (
                          `${s.price79.toLocaleString()}đ`
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setEditingServiceId(null)}
                              className="px-2.5 py-1 bg-white/10 hover:bg-white/15 rounded text-[10px] font-bold"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() => handleSaveService(s.id)}
                              className="px-2.5 py-1 bg-[#A2C62C] text-black hover:brightness-110 rounded text-[10px] font-bold flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" /> Lưu
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingServiceId(s.id);
                              setEditSvcCode(s.code);
                              setEditSvcName(s.name);
                              setEditSvcDesc(s.desc);
                              setEditSvcPrice45(s.price45);
                              setEditSvcPrice79(s.price79);
                            }}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[10px] font-bold text-[#A2C62C] inline-flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" /> Sửa chi tiết
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Addons List Section */}
      {subTab === 'addons' && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white/80">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase text-white/40 font-bold">
                  <th className="py-2.5">Danh Mục & Phụ Trợ</th>
                  <th className="py-2.5">Giá Xe 4-5 Chỗ</th>
                  <th className="py-2.5">Giá Xe 7-9 Chỗ</th>
                  <th className="py-2.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {addons.map(a => {
                  const isEditing = editingAddonId === a.id;
                  return (
                    <tr key={a.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              value={editAddonCat}
                              onChange={(e) => setEditAddonCat(e.target.value.toUpperCase())}
                              className="w-full max-w-[140px] bg-black/80 border border-[#A2C62C]/40 rounded px-2 py-1 text-[10px] text-white uppercase focus:outline-none focus:border-[#A2C62C]"
                              placeholder="Danh mục"
                            />
                            <input
                              value={editAddonName}
                              onChange={(e) => setEditAddonName(e.target.value)}
                              className="w-full bg-black/80 border border-[#A2C62C]/40 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#A2C62C]"
                              placeholder="Tên dịch vụ lẻ"
                            />
                          </div>
                        ) : (
                          <>
                            <span className="text-[9px] font-mono tracking-wider font-extrabold text-[#A2C62C] uppercase bg-[#A2C62C]/5 px-2 py-0.5 rounded block w-fit mb-1">{a.cat}</span>
                            <span className="font-bold text-white">{a.name}</span>
                          </>
                        )}
                      </td>
                      <td className="py-3 font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editAddonPrice45}
                            onChange={(e) => setEditAddonPrice45(Number(e.target.value))}
                            className="bg-black/80 border border-[#A2C62C]/40 rounded px-2 py-1 w-28 text-white focus:outline-none focus:border-[#A2C62C]"
                          />
                        ) : (
                          `${a.price45.toLocaleString()}đ`
                        )}
                      </td>
                      <td className="py-3 font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editAddonPrice79}
                            onChange={(e) => setEditAddonPrice79(Number(e.target.value))}
                            className="bg-black/80 border border-[#A2C62C]/40 rounded px-2 py-1 w-28 text-white focus:outline-none focus:border-[#A2C62C]"
                          />
                        ) : (
                          `${a.price79.toLocaleString()}đ`
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setEditingAddonId(null)}
                              className="px-2.5 py-1 bg-white/10 hover:bg-white/15 rounded text-[10px] font-bold"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() => handleSaveAddon(a.id)}
                              className="px-2.5 py-1 bg-[#A2C62C] text-black hover:brightness-110 rounded text-[10px] font-bold flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" /> Lưu
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingAddonId(a.id);
                              setEditAddonCat(a.cat);
                              setEditAddonName(a.name);
                              setEditAddonPrice45(a.price45);
                              setEditAddonPrice79(a.price79);
                            }}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[10px] font-bold text-[#A2C62C] inline-flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" /> Sửa chi tiết
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Promos Section */}
      {subTab === 'promos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/50 uppercase tracking-widest font-bold">Danh sách coupon active</span>
            <button
              onClick={() => {
                setShowAddPromo(!showAddPromo);
                setKeyboardTarget(null);
              }}
              className="bg-[#A2C62C]/15 text-[#A2C62C] border border-[#A2C62C]/30 hover:bg-[#A2C62C]/25 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo Voucher Mới
            </button>
          </div>

          {/* New Promo Form */}
          {showAddPromo && (
            <form onSubmit={handleAddPromo} className="bg-black/30 border border-white/5 p-5 rounded-xl space-y-4">
              <h4 className="text-xs font-bold uppercase text-[#A2C62C]">CẤU HÌNH VOUCHER MỚI</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] uppercase text-white/40 block mb-1">Mã Coupon</label>
                  <input
                    type="text"
                    required
                    placeholder="MÃ COUPON..."
                    value={newPromoCode}
                    onFocus={() => setKeyboardTarget('promoCode')}
                    onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white uppercase font-mono focus:border-[#A2C62C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-white/40 block mb-1">Loại chiết khấu</label>
                  <div className="flex bg-black/50 p-0.5 rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => setNewPromoType('fixed')}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold ${newPromoType === 'fixed' ? 'bg-[#A2C62C] text-black' : 'text-white/60'}`}
                    >
                      Số tiền (VNĐ)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPromoType('percent')}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold ${newPromoType === 'percent' ? 'bg-[#A2C62C] text-black' : 'text-white/60'}`}
                    >
                      Phần trăm (%)
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-white/40 block mb-1">
                    Giá trị giảm ({newPromoType === 'fixed' ? 'VNĐ' : '%'})
                  </label>
                  <input
                    type="number"
                    required
                    placeholder={newPromoType === 'fixed' ? 'Ví dụ: 50000' : 'Ví dụ: 20'}
                    value={newPromoValue || ''}
                    onChange={(e) => setNewPromoValue(Number(e.target.value))}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:border-[#A2C62C] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase text-white/40 block mb-1">Mô tả hiển thị</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Voucher sảnh chờ giảm giá 50k..."
                  value={newPromoDesc}
                  onFocus={() => setKeyboardTarget('promoDesc')}
                  onChange={(e) => setNewPromoDesc(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:border-[#A2C62C] focus:outline-none"
                />
              </div>

              {/* Inline Keyboard Integration */}
              {keyboardTarget && (
                <div className="pt-2 animate-fadeIn">
                  <VirtualKeyboard
                    value={keyboardTarget === 'promoCode' ? newPromoCode : newPromoDesc}
                    layoutType="text"
                    onChange={(val) => {
                      if (keyboardTarget === 'promoCode') {
                        setNewPromoCode(val.toUpperCase());
                      } else {
                        setNewPromoDesc(val);
                      }
                    }}
                    onClose={() => setKeyboardTarget(null)}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPromo(false);
                    setKeyboardTarget(null);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white/80"
                >
                  Đóng Form
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#A2C62C] text-black hover:brightness-110 rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Tạo & Đưa Vào Áp Dụng
                </button>
              </div>
            </form>
          )}

          {/* Promos Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promotions.map(p => (
              <div key={p.code} className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#A2C62C]/10 text-[#A2C62C] rounded-lg flex items-center justify-center border border-[#A2C62C]/20">
                    {p.type === 'percent' ? <Percent className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">{p.code}</span>
                      <span className="text-[10px] font-bold text-[#A2C62C] bg-[#A2C62C]/10 px-1.5 py-0.5 rounded">
                        {p.type === 'percent' ? `Giảm ${(p.value * 100)}%` : `Giảm ${p.value.toLocaleString()}đ`}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40 mt-1">{p.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeletePromo(p.code)}
                  className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Xoá voucher"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
