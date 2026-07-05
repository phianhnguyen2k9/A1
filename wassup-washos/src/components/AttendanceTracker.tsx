import React, { useState } from 'react';
import { AttendanceRecord } from '../types';
import { 
  Clock, CheckCircle, UserCheck, Calendar, Search, Plus, 
  Trash2, Award, Zap, Sparkles, LogOut, Coffee, ArrowUpRight
} from 'lucide-react';
import VirtualKeyboard from './VirtualKeyboard';

interface AttendanceTrackerProps {
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  role: 'pos' | 'mgr';
}

const CONSTANT_EMPLOYEES = [
  { name: 'Nguyễn Văn Hùng', role: 'Kỹ thuật viên Booth 01' },
  { name: 'Lê Hoàng Long', role: 'Kỹ thuật viên Booth 02' },
  { name: 'Phạm Minh Đức', role: 'Kỹ thuật viên Booth 03' },
  { name: 'Trần Thị Mai', role: 'Thu ngân quầy POS' },
  { name: 'Nguyễn Quốc Bảo', role: 'Bảo vệ điều phối' },
  { name: 'Đặng Thùy Dương', role: 'Quản lý vận hành trạm' }
];

export default function AttendanceTracker({ attendance, setAttendance, role }: AttendanceTrackerProps) {
  const [selectedEmpIndex, setSelectedEmpIndex] = useState<number>(0);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState('Kỹ thuật viên');
  const [isRegisteringCustom, setIsRegisteringCustom] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCheckIn = () => {
    let name = '';
    let empRole = '';

    if (isRegisteringCustom) {
      if (!customName.trim()) {
        setMsg({ type: 'error', text: 'Vui lòng nhập họ tên nhân viên!' });
        return;
      }
      name = customName.trim();
      empRole = customRole;
    } else {
      const emp = CONSTANT_EMPLOYEES[selectedEmpIndex];
      name = emp.name;
      empRole = emp.role;
    }

    // Check if already checked-in today and hasn't checked out yet
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const existingActive = attendance.find(
      r => r.employeeName === name && r.date === todayStr && r.status === 'Đang làm'
    );

    if (existingActive) {
      setMsg({ type: 'error', text: `${name} đã thực hiện Check-in rồi và đang làm việc!` });
      return;
    }

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeName: name,
      role: empRole,
      date: todayStr,
      checkInTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      checkOutTime: null,
      status: 'Đang làm'
    };

    setAttendance(prev => [newRecord, ...prev]);
    setCustomName('');
    setIsRegisteringCustom(false);
    setShowKeyboard(false);
    setMsg({ type: 'success', text: `✓ Check-in thành công cho ${name}!` });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleCheckOut = (recordId: string) => {
    const timeOut = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setAttendance(prev => prev.map(rec => {
      if (rec.id === recordId) {
        return {
          ...rec,
          checkOutTime: timeOut,
          status: 'Đã về'
        };
      }
      return rec;
    }));
    setMsg({ type: 'success', text: '✓ Đăng ký Check-out thành công! Chúc nhân viên về an toàn.' });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDeleteRecord = (id: string) => {
    setAttendance(prev => prev.filter(r => r.id !== id));
    setMsg({ type: 'success', text: '✓ Đã xóa lịch sử chấm công!' });
    setTimeout(() => setMsg(null), 3000);
  };

  const activeWorkersCount = attendance.filter(r => r.status === 'Đang làm').length;

  return (
    <div className="space-y-6">
      {/* Attendance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase text-white/40 tracking-wider font-bold mb-1">Nhân viên đang trực</p>
            <p className="text-2xl font-bold font-mono text-[#A2C62C]">{activeWorkersCount} nhân sự</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#A2C62C]/10 flex items-center justify-center animate-pulse">
            <Clock className="w-5 h-5 text-[#A2C62C]" />
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase text-white/40 tracking-wider font-bold mb-1">Tổng lượt ca hôm nay</p>
            <p className="text-2xl font-bold font-mono text-white">
              {attendance.filter(r => r.date === new Date().toLocaleDateString('vi-VN')).length} lượt
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-[10px] uppercase text-white/40 tracking-wider font-bold mb-1">Trạng thái vận hành</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
            <span className="text-xs font-bold text-green-400 font-mono">ĐỦ NHÂN SỰ VẬN HÀNH</span>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl border text-xs font-bold text-center ${msg.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHECK-IN CONTROLLER */}
        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <Sparkles className="w-4 h-4 text-[#A2C62C]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Điểm danh Check-in trạm</h4>
          </div>

          {!isRegisteringCustom ? (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-white/40 uppercase block mb-1">Chọn nhân viên hệ thống</label>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                  {CONSTANT_EMPLOYEES.map((emp, idx) => (
                    <div
                      key={emp.name}
                      onClick={() => setSelectedEmpIndex(idx)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                        selectedEmpIndex === idx 
                          ? 'bg-[#A2C62C]/15 border-[#A2C62C] font-bold text-white' 
                          : 'bg-black/30 border-white/5 hover:bg-white/5 text-white/70'
                      }`}
                    >
                      <div>
                        <p>{emp.name}</p>
                        <p className="text-[10px] opacity-60 font-medium">{emp.role}</p>
                      </div>
                      {selectedEmpIndex === idx && <UserCheck className="w-4 h-4 text-[#A2C62C]" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-white/40 font-bold uppercase pt-1">
                <span>Nhân viên ngoài biên chế?</span>
                <button
                  type="button"
                  onClick={() => setIsRegisteringCustom(true)}
                  className="text-[#A2C62C] hover:underline transition-all"
                >
                  Nhập tên thủ công →
                </button>
              </div>

              <button
                type="button"
                onClick={handleCheckIn}
                className="w-full py-3 bg-[#A2C62C] hover:brightness-110 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Clock className="w-4 h-4 stroke-[3]" /> Điểm danh Check-In
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-white/40 uppercase block mb-1">Họ tên nhân viên mới</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Hoàng Văn Định"
                  value={customName}
                  onFocus={() => setShowKeyboard(true)}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#A2C62C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/40 uppercase block mb-1">Vai trò công việc</label>
                <select
                  value={customRole}
                  onChange={e => setCustomRole(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#A2C62C] focus:outline-none font-medium"
                >
                  <option value="Kỹ thuật viên">Kỹ thuật viên Booth</option>
                  <option value="Thu ngân">Thu ngân quầy POS</option>
                  <option value="Quản lý">Quản lý ca / ERP</option>
                  <option value="Cộng tác viên">Cộng tác viên thời vụ</option>
                </select>
              </div>

              {showKeyboard && (
                <div className="p-2 bg-black border border-white/10 rounded-xl">
                  <VirtualKeyboard
                    value={customName}
                    onChange={setCustomName}
                    layoutType="text"
                    onClose={() => setShowKeyboard(false)}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setIsRegisteringCustom(false); setShowKeyboard(false); }}
                  className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white text-xs font-bold uppercase transition-all"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleCheckIn}
                  className="flex-1 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-lg text-xs uppercase transition-all"
                >
                  Đăng ký
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ATTENDANCE SHEET */}
        <div className="lg:col-span-8 bg-black/40 border border-white/10 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50">Nhật ký trực ca - Hôm nay</h4>
            <span className="text-[10px] text-[#A2C62C] font-mono font-bold bg-[#A2C62C]/10 px-2 py-0.5 rounded uppercase">Bảng trực tiếp</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white/80 border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-[10px] uppercase font-bold tracking-widest bg-white/5">
                  <th className="p-3">Họ và tên</th>
                  <th className="p-3">Vị trí</th>
                  <th className="p-3">Giờ Check-in</th>
                  <th className="p-3">Giờ Check-out</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {attendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-bold text-white">{rec.employeeName}</td>
                    <td className="p-3 text-white/60 text-[11px]">{rec.role}</td>
                    <td className="p-3 font-mono text-[#A2C62C] font-bold">{rec.checkInTime}</td>
                    <td className="p-3 font-mono text-white/50 font-bold">{rec.checkOutTime || '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        rec.status === 'Đang làm' 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : 'bg-white/5 text-white/40 border border-white/5'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="p-3 text-right flex items-center justify-end gap-1.5">
                      {rec.status === 'Đang làm' && (
                        <button
                          onClick={() => handleCheckOut(rec.id)}
                          className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded text-[9px] font-bold uppercase text-red-400 flex items-center gap-1 transition-all"
                          title="Check-out nhân viên này"
                        >
                          <LogOut className="w-2.5 h-2.5" /> Ra ca
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteRecord(rec.id)}
                        className="p-1 hover:bg-red-500/10 rounded text-white/30 hover:text-red-400 transition-all inline-flex"
                        title="Xóa dòng"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {attendance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-white/20 italic">
                      Chưa có ai check-in trực ca hôm nay.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
