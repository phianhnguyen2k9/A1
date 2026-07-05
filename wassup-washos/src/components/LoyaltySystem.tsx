import React, { useState } from 'react';
import { LoyaltyMember } from '../types';
import { 
  Trophy, Gift, Sparkles, UserPlus, Search, Phone, CreditCard, 
  ChevronRight, BadgeCheck, Zap, Plus, CheckCircle, RefreshCw, AlertTriangle
} from 'lucide-react';
import { TIER_PERKS, REDEMPTION_OPTIONS, POINT_ACCUMULATION_RATE } from '../data';
import VirtualKeyboard from './VirtualKeyboard';

interface LoyaltySystemProps {
  members: LoyaltyMember[];
  setMembers: React.Dispatch<React.SetStateAction<LoyaltyMember[]>>;
  onMemberSelected?: (member: LoyaltyMember) => void;
  selectedMemberId?: string | null;
}

export default function LoyaltySystem({ 
  members, 
  setMembers, 
  onMemberSelected, 
  selectedMemberId 
}: LoyaltySystemProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPlate, setRegisterPlate] = useState('');
  const [focusedField, setFocusedField] = useState<'name' | 'phone' | 'plate' | 'search' | null>(null);
  const [showRegForm, setShowRegForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'tiers' | 'redeem'>('members');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search filter
  const filteredMembers = members.filter(m => 
    m.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone.includes(searchQuery) ||
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMember = members.find(m => m.id === selectedMemberId) || 
                         (filteredMembers.length > 0 ? filteredMembers[0] : null);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerPhone || !registerPlate) {
      setMsg({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin!' });
      return;
    }

    // Check duplicate plate
    if (members.some(m => m.plate.toUpperCase() === registerPlate.toUpperCase())) {
      setMsg({ type: 'error', text: 'Biển số xe này đã được đăng ký thành viên!' });
      return;
    }

    const newMember: LoyaltyMember = {
      id: `member-${Date.now()}`,
      name: registerName,
      phone: registerPhone,
      plate: registerPlate.toUpperCase(),
      points: 100, // Welcome points
      tier: 'Đồng',
      historyCount: 0,
      spentTotal: 0,
      vouchers: []
    };

    setMembers(prev => [...prev, newMember]);
    setRegisterName('');
    setRegisterPhone('');
    setRegisterPlate('');
    setShowRegForm(false);
    setMsg({ type: 'success', text: `Đăng ký thành viên ${newMember.name} thành công! Nhận ngay 100 điểm chào mừng!` });
    
    if (onMemberSelected) {
      onMemberSelected(newMember);
    }
    
    setTimeout(() => setMsg(null), 4000);
  };

  const handleRedeem = (redeemOption: typeof REDEMPTION_OPTIONS[0]) => {
    if (!selectedMember) {
      setMsg({ type: 'error', text: 'Vui lòng chọn thành viên cần đổi quà!' });
      return;
    }

    if (selectedMember.points < redeemOption.points) {
      setMsg({ type: 'error', text: 'Không đủ điểm tích luỹ để đổi món quà này!' });
      return;
    }

    // Deduct points and append voucher
    setMembers(prev => prev.map(m => {
      if (m.id === selectedMember.id) {
        const updatedPoints = m.points - redeemOption.points;
        let nextTier = m.tier;
        // recalculate tier based on total spending or points accrued (standard simplicity based on spentTotal remains)
        
        const newVoucher = {
          code: `${redeemOption.id === 'r-1' ? 'GIAM50' : redeemOption.id === 'r-2' ? 'WASSUP100' : 'FREE_' + redeemOption.id.toUpperCase()}_${Math.floor(Math.random()*900 + 100)}`,
          value: redeemOption.value,
          description: redeemOption.name
        };

        return {
          ...m,
          points: updatedPoints,
          vouchers: [...m.vouchers, newVoucher]
        };
      }
      return m;
    }));

    setMsg({ 
      type: 'success', 
      text: `Đổi thành công "${redeemOption.name}"! Trừ ${redeemOption.points} điểm. Voucher đã được thêm vào ví của thành viên.` 
    });
    setTimeout(() => setMsg(null), 5000);
  };

  // Get color for tier badge
  const getTierColor = (tier: LoyaltyMember['tier']) => {
    switch (tier) {
      case 'Đồng': return { bg: 'bg-amber-800/20 text-amber-500 border-amber-800/30', gradient: 'from-amber-900/40 to-amber-700/10' };
      case 'Bạc': return { bg: 'bg-slate-400/20 text-slate-300 border-slate-400/30', gradient: 'from-slate-500/30 to-slate-400/10' };
      case 'Vàng': return { bg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]', gradient: 'from-yellow-600/30 to-yellow-500/10' };
      case 'Kim Cương': return { bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]', gradient: 'from-cyan-600/30 to-cyan-500/10' };
      default: return { bg: 'bg-white/10 text-white/50 border-white/5', gradient: 'from-white/10 to-transparent' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation inside loyalty */}
      <div className="flex justify-between items-center bg-black/30 p-1.5 rounded-xl border border-white/10">
        <div className="flex gap-1.5">
          <button 
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'members' ? 'bg-[#A2C62C] text-black shadow-md' : 'text-white/60 hover:text-white'}`}
          >
            Danh sách & Tìm kiếm
          </button>
          <button 
            onClick={() => setActiveTab('redeem')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'redeem' ? 'bg-[#A2C62C] text-black shadow-md' : 'text-white/60 hover:text-white'}`}
          >
            Đổi quà thưởng ({REDEMPTION_OPTIONS.length})
          </button>
          <button 
            onClick={() => setActiveTab('tiers')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'tiers' ? 'bg-[#A2C62C] text-black shadow-md' : 'text-white/60 hover:text-white'}`}
          >
            Cấp bậc & Quyền lợi
          </button>
        </div>

        <button 
          onClick={() => setShowRegForm(!showRegForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-black text-[11px] font-extrabold rounded-lg transition-all"
        >
          <UserPlus className="w-3.5 h-3.5" />
          {showRegForm ? 'Đóng' : 'Đăng ký mới'}
        </button>
      </div>

      {msg && (
        <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 animate-pulse ${msg.type === 'success' ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}>
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* REGISTRATION FORM (Toggleable) */}
      {showRegForm && (
        <form onSubmit={handleRegister} className="bg-gradient-to-r from-green-950/20 to-black p-5 rounded-2xl border border-green-500/30 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <Sparkles className="w-4 h-4 text-green-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-green-400">ĐĂNG KÝ HỘI VIÊN MỚI (TẶNG 100 ĐIỂM)</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] text-white/40 uppercase block mb-1">Họ và tên khách hàng</label>
              <input 
                type="text" 
                placeholder="Ví dụ: Nguyễn Văn A"
                value={registerName}
                onFocus={() => setFocusedField('name')}
                onChange={e => setRegisterName(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-[#A2C62C] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase block mb-1">Số điện thoại</label>
              <input 
                type="text" 
                placeholder="Ví dụ: 0912345678"
                value={registerPhone}
                onFocus={() => setFocusedField('phone')}
                onChange={e => setRegisterPhone(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-[#A2C62C] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase block mb-1">Biển kiểm soát xe</label>
              <input 
                type="text" 
                placeholder="Ví dụ: 51A-999.99"
                value={registerPlate}
                onFocus={() => setFocusedField('plate')}
                onChange={e => setRegisterPlate(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs uppercase focus:border-[#A2C62C] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Inline Virtual Keyboard for Registration Form */}
          {focusedField && ['name', 'phone', 'plate'].includes(focusedField) && (
            <div className="mt-2 p-2 bg-black/40 border border-white/5 rounded-xl">
              <VirtualKeyboard
                value={
                  focusedField === 'name' 
                    ? registerName 
                    : focusedField === 'phone' 
                      ? registerPhone 
                      : registerPlate
                }
                onChange={(val) => {
                  if (focusedField === 'name') setRegisterName(val);
                  else if (focusedField === 'phone') setRegisterPhone(val);
                  else if (focusedField === 'plate') setRegisterPlate(val.toUpperCase());
                }}
                layoutType={
                  focusedField === 'phone' 
                    ? 'phone' 
                    : focusedField === 'plate' 
                      ? 'plate' 
                      : 'text'
                }
                onClose={() => setFocusedField(null)}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 mt-3">
            <button type="button" onClick={() => { setShowRegForm(false); setFocusedField(null); }} className="px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white text-xs font-bold uppercase">Hủy bỏ</button>
            <button type="submit" className="px-4 py-1.5 bg-green-500 text-black rounded-lg text-xs font-bold uppercase hover:bg-green-400">Đồng ý Đăng ký</button>
          </div>
        </form>
      )}

      {/* TAB 1: MEMBERS SEARCH & HIGHLIGHT */}
      {activeTab === 'members' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Member lookup panel */}
          <div className="col-span-5 bg-black/40 border border-white/5 p-4 rounded-xl flex flex-col gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Tìm tên, SĐT, biển số..." 
                value={searchQuery}
                onFocus={() => setFocusedField('search')}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#A2C62C]"
              />
            </div>

            {focusedField === 'search' && (
              <div className="p-2 bg-black/40 border border-white/5 rounded-xl">
                <VirtualKeyboard
                  value={searchQuery}
                  onChange={setSearchQuery}
                  layoutType="text"
                  onClose={() => setFocusedField(null)}
                />
              </div>
            )}

            <p className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Hội viên hệ thống ({filteredMembers.length})</p>
            <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
              {filteredMembers.map(m => {
                const colors = getTierColor(m.tier);
                return (
                  <div 
                    key={m.id}
                    onClick={() => onMemberSelected && onMemberSelected(m)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center ${selectedMemberId === m.id ? 'bg-[#A2C62C]/10 border-[#A2C62C]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                  >
                    <div>
                      <p className="font-bold text-xs text-white">{m.name}</p>
                      <p className="text-[10px] font-mono text-white/50">{m.plate} • {m.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${colors.bg}`}>
                        {m.tier}
                      </span>
                      <p className="font-mono text-xs text-[#A2C62C] font-bold mt-1">{m.points.toLocaleString()} PTS</p>
                    </div>
                  </div>
                );
              })}
              {filteredMembers.length === 0 && (
                <div className="py-8 text-center text-white/30 text-xs">
                  Không tìm thấy thành viên khớp từ khoá.
                </div>
              )}
            </div>
          </div>

          {/* Member visual card & details */}
          <div className="col-span-7 bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
            {selectedMember ? (
              <>
                {/* Visual Membership Card */}
                <div className={`p-5 rounded-2xl border border-white/10 bg-gradient-to-br ${getTierColor(selectedMember.tier).gradient} relative overflow-hidden shadow-xl mb-4`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 block font-bold">WASSUP CUSTOMER NETWORK</span>
                      <span className="text-base font-extrabold text-white">{selectedMember.name}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${getTierColor(selectedMember.tier).bg}`}>
                      {selectedMember.tier} TIER
                    </span>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] uppercase text-white/40 font-mono">License Plate</p>
                      <p className="font-mono text-lg font-bold tracking-widest text-white">{selectedMember.plate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase text-white/40">Point Accrued</p>
                      <p className="font-mono text-xl font-extrabold text-[#A2C62C]">{selectedMember.points.toLocaleString()} <span className="text-xs font-normal opacity-60">PTS</span></p>
                    </div>
                  </div>
                </div>

                {/* Account status info */}
                <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                    <span className="text-white/40 block mb-0.5">Tổng số tiền đã chi:</span>
                    <span className="font-mono font-bold text-sm text-green-400">{(selectedMember.spentTotal || 0).toLocaleString()}đ</span>
                  </div>
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                    <span className="text-white/40 block mb-0.5">Số lượt rửa & chăm sóc:</span>
                    <span className="font-mono font-bold text-sm text-white">{selectedMember.historyCount || 0} lượt</span>
                  </div>
                </div>

                {/* Active Perks Display */}
                <div className="bg-[#A2C62C]/5 p-3 rounded-xl border border-[#A2C62C]/20 mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#A2C62C] mb-1">QUYỀN LỢI ĐẶC QUYỀN CẤP {selectedMember.tier.toUpperCase()}</p>
                  <p className="text-xs text-white/80 leading-relaxed">{TIER_PERKS[selectedMember.tier]}</p>
                </div>

                {/* Vouchers in wallet */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">Ví voucher khả dụng ({selectedMember.vouchers.length})</p>
                  <div className="flex gap-2 flex-wrap max-h-[80px] overflow-y-auto">
                    {selectedMember.vouchers.length > 0 ? (
                      selectedMember.vouchers.map((v, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                          <Gift className="w-3.5 h-3.5 text-[#A2C62C]" />
                          <div>
                            <span className="font-mono font-bold text-xs text-white tracking-widest uppercase">{v.code}</span>
                            <span className="text-[10px] text-white/40 block">Giảm {v.value.toLocaleString()}đ</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-white/30 italic">Hội viên chưa có voucher nào. Hãy đổi điểm tích luỹ lấy quà ngay!</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-white/30 text-sm flex flex-col items-center justify-center">
                <CreditCard className="w-12 h-12 mb-3 opacity-30" />
                <span>Chưa chọn hoặc đăng ký hội viên nào</span>
                <span className="text-xs text-white/20 mt-1">Chọn ở danh sách bên trái hoặc nhấp đăng ký hội viên mới</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REDEEM OPTIONS PANEL */}
      {activeTab === 'redeem' && (
        <div className="space-y-4">
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-xs text-white/60">
            <p className="font-bold text-white mb-1">Cơ chế quy đổi điểm thưởng:</p>
            <p>Mỗi <span className="font-bold text-[#A2C62C]">{POINT_ACCUMULATION_RATE.toLocaleString()}đ</span> chi tiêu tích được <span className="font-bold text-[#A2C62C]">1 Điểm (PTS)</span>. Điểm số có thể quy đổi trực tiếp lấy dịch vụ đặc trị hoặc mã giảm giá trực tiếp trừ vào hoá đơn tiếp theo.</p>
            {selectedMember && (
              <p className="mt-3 text-white">Thành viên đang thao tác: <span className="font-bold text-[#A2C62C]">{selectedMember.name}</span> | Số dư điểm hiện tại: <span className="font-bold text-[#A2C62C] font-mono">{selectedMember.points.toLocaleString()} PTS</span></p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {REDEMPTION_OPTIONS.map(opt => {
              const disabled = !selectedMember || selectedMember.points < opt.points;
              return (
                <div 
                  key={opt.id} 
                  className={`p-4 rounded-xl border flex flex-col justify-between relative overflow-hidden transition-all ${disabled ? 'bg-black/40 border-white/5 opacity-50' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#A2C62C]/40'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-white/40 block font-mono">{opt.type.toUpperCase()} AWARD</span>
                      <h4 className="text-xs font-bold text-white">{opt.name}</h4>
                      <p className="text-[10px] text-white/50 mt-1">Trị giá: <span className="text-green-400 font-bold">{opt.value.toLocaleString()}đ</span></p>
                    </div>
                    <span className="bg-[#A2C62C]/20 text-[#A2C62C] font-mono text-xs font-bold px-2 py-1 rounded">
                      {opt.points} PTS
                    </span>
                  </div>

                  <button 
                    onClick={() => handleRedeem(opt)}
                    disabled={disabled}
                    className={`w-full py-2.5 rounded-xl text-xs font-extrabold uppercase transition-all flex items-center justify-center gap-1.5 ${disabled ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-[#A2C62C] text-black hover:brightness-110 active:scale-95'}`}
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    Đổi điểm ngay
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: TIERS & PERKS DESCRIPTION */}
      {activeTab === 'tiers' && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">CÁC HẠNG THÀNH VIÊN VÀ QUYỀN LỢI ĐI KÈM</h3>
          
          <div className="space-y-3">
            {[
              { tier: 'Đồng', pts: '0 PTS', perk: TIER_PERKS['Đồng'], style: 'border-amber-800/30 bg-amber-950/10 text-amber-500' },
              { tier: 'Bạc', pts: '500+ PTS', perk: TIER_PERKS['Bạc'], style: 'border-slate-500/30 bg-slate-800/10 text-slate-300' },
              { tier: 'Vàng', pts: '1,500+ PTS', perk: TIER_PERKS['Vàng'], style: 'border-yellow-500/30 bg-yellow-950/10 text-yellow-400' },
              { tier: 'Kim Cương', pts: '3,000+ PTS', perk: TIER_PERKS['Kim Cương'], style: 'border-cyan-500/30 bg-cyan-950/10 text-cyan-400' }
            ].map(item => (
              <div key={item.tier} className={`p-4 rounded-xl border flex items-center justify-between gap-6 ${item.style}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <BadgeCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{item.tier}</h4>
                    <p className="text-xs opacity-80 mt-1">{item.perk}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold block">{item.pts}</span>
                  <span className="text-[9px] uppercase tracking-tight block opacity-60">Chi tiêu đạt mức</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
