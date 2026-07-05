import React, { useState } from 'react';
import { DailyExpense } from '../types';
import { 
  DollarSign, Calendar, Plus, Trash2, List, Filter, FileText,
  AlertCircle, TrendingUp, Download, PieChart, Sparkles
} from 'lucide-react';
import VirtualKeyboard from './VirtualKeyboard';

interface DailyExpensesProps {
  expenses: DailyExpense[];
  setExpenses: React.Dispatch<React.SetStateAction<DailyExpense[]>>;
  role: 'pos' | 'mgr';
}

export default function DailyExpenses({ expenses, setExpenses, role }: DailyExpensesProps) {
  const [category, setCategory] = useState<'Nước uống' | 'Điện nước' | 'Internet' | 'Dịch vụ khác'>('Nước uống');
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [focusedField, setFocusedField] = useState<'amount' | 'notes' | null>(null);
  const [filterCategory, setFilterCategory] = useState<'All' | 'Nước uống' | 'Điện nước' | 'Internet' | 'Dịch vụ khác'>('All');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setMsg({ type: 'error', text: 'Số tiền chi tiêu phải lớn hơn 0đ!' });
      return;
    }
    if (!notes.trim()) {
      setMsg({ type: 'error', text: 'Vui lòng nhập lý do chi tiêu!' });
      return;
    }

    const newExpense: DailyExpense = {
      id: `exp-${Date.now()}`,
      date: new Date().toLocaleDateString('vi-VN'),
      category,
      amount,
      notes: notes.trim()
    };

    setExpenses(prev => [newExpense, ...prev]);
    setAmount(0);
    setNotes('');
    setFocusedField(null);
    setShowKeyboard(false);
    setMsg({ type: 'success', text: '✓ Đã ghi nhận chi phí thành công!' });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    setMsg({ type: 'success', text: '✓ Đã xóa bản ghi chi phí!' });
    setTimeout(() => setMsg(null), 3000);
  };

  const filteredExpenses = expenses.filter(e => 
    filterCategory === 'All' ? true : e.category === filterCategory
  );

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category for a quick breakdown
  const breakdown = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-[10px] uppercase text-white/40 tracking-wider font-bold mb-1">Tổng chi phí lọc được</p>
          <p className="text-2xl font-bold font-mono text-[#F27D26]">{totalAmount.toLocaleString()}đ</p>
          <span className="text-[9px] text-white/40 mt-1 block">Tất cả danh mục đang lọc</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 col-span-2">
          <p className="text-[10px] uppercase text-white/40 tracking-wider font-bold mb-2">Cơ cấu chi phí phát sinh</p>
          <div className="flex flex-wrap gap-4 text-xs">
            {['Nước uống', 'Điện nước', 'Internet', 'Dịch vụ khác'].map(cat => (
              <div key={cat} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  cat === 'Nước uống' ? 'bg-blue-400' :
                  cat === 'Điện nước' ? 'bg-amber-500' :
                  cat === 'Internet' ? 'bg-cyan-400' : 'bg-purple-400'
                }`}></span>
                <span className="text-white/60">{cat}:</span>
                <span className="font-mono font-bold text-white">{(breakdown[cat as any] || 0).toLocaleString()}đ</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl border text-xs font-bold text-center ${msg.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ADD EXPENSE FORM (Visible to cashiers and managers, but essential for POS Cashier) */}
        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <Sparkles className="w-4 h-4 text-[#A2C62C]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Ghi nhận chi tiêu hàng ngày</h4>
          </div>

          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="text-[10px] text-white/40 uppercase block mb-1">Danh mục chi tiêu</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#A2C62C] focus:outline-none"
              >
                <option value="Nước uống">Nước uống (Khách & KTV)</option>
                <option value="Điện nước">Hóa đơn Điện & Nước trạm</option>
                <option value="Internet">Cước Internet / Wifi / Hosting</option>
                <option value="Dịch vụ khác">Chi phí dịch vụ phát sinh khác</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-white/40 uppercase block mb-1">Số tiền thanh toán (VNĐ)</label>
              <input 
                type="number"
                placeholder="Ví dụ: 150000"
                value={amount || ''}
                onFocus={() => { setFocusedField('amount'); setShowKeyboard(true); }}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-[#A2C62C] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-white/40 uppercase block mb-1">Ghi chú chi tiết / Lý do chi</label>
              <textarea 
                rows={3}
                placeholder="Ví dụ: Mua 5 bình nước 20L cho khách chờ..."
                value={notes}
                onFocus={() => { setFocusedField('notes'); setShowKeyboard(true); }}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#A2C62C] focus:outline-none"
              />
            </div>

            {/* Electronic Virtual Keyboard */}
            {showKeyboard && focusedField && (
              <div className="p-2 bg-black border border-white/10 rounded-xl">
                <VirtualKeyboard
                  value={focusedField === 'amount' ? amount.toString() : notes}
                  onChange={(val) => {
                    if (focusedField === 'amount') setAmount(Number(val));
                    else setNotes(val);
                  }}
                  layoutType={focusedField === 'amount' ? 'phone' : 'text'}
                  onClose={() => setShowKeyboard(false)}
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#A2C62C] hover:brightness-110 text-black font-extrabold rounded-xl text-xs uppercase transition-all tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Đồng ý ghi nhận chi
            </button>
          </form>
        </div>

        {/* EXPENSES LOGS LIST TABLE */}
        <div className="lg:col-span-8 bg-black/40 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-2 border-b border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/50">Sổ nhật ký chi tiêu trạm</h4>
              
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/40 font-bold uppercase font-mono">Lọc:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {['All', 'Nước uống', 'Điện nước', 'Internet', 'Dịch vụ khác'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat as any)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                        filterCategory === cat ? 'bg-[#A2C62C] text-black font-bold' : 'bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      {cat === 'All' ? 'TẤT CẢ' : cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white/80 border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-[10px] uppercase font-bold tracking-widest bg-white/5">
                    <th className="p-3">Ngày chi</th>
                    <th className="p-3">Danh mục</th>
                    <th className="p-3">Số tiền</th>
                    <th className="p-3">Ghi chú</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono text-white/60">{exp.date}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          exp.category === 'Nước uống' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          exp.category === 'Điện nước' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          exp.category === 'Internet' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                          'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-white">{exp.amount.toLocaleString()}đ</td>
                      <td className="p-3 max-w-[200px] truncate text-white/70" title={exp.notes}>{exp.notes}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 hover:bg-red-500/20 rounded-lg text-white/40 hover:text-red-400 transition-colors inline-flex"
                          title="Xóa khoản chi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-white/20 italic">
                        Chưa ghi nhận khoản chi tiêu nào khớp bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-white/40 font-mono">
            <span>Hiển thị {filteredExpenses.length} khoản chi phí trạm</span>
            <button
              onClick={() => {
                const csvContent = "data:text/csv;charset=utf-8,Ngay,DanhMuc,SoTien,GhiChu\n" + 
                  filteredExpenses.map(e => `"${e.date}","${e.category}",${e.amount},"${e.notes.replace(/"/g, '""')}"`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `wassup_expenses_export_${new Date().toISOString().slice(0,10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/15 text-[9px] font-bold flex items-center gap-1.5 transition-all uppercase text-white font-mono"
            >
              <Download className="w-3 h-3" /> Xuất Excel chi phí
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
