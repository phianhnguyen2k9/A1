import React, { useState } from 'react';
import { Employee } from '../types';
import { 
  Users, UserPlus, Shield, Award, Edit3, Trash2, Check, X, 
  RefreshCw, Calendar, MapPin, Grid, Briefcase, FileText, 
  Phone, Mail, Clock, AlertTriangle, CheckCircle, Sparkles, Plus, Search,
  ArrowRight, UserCheck, ShieldAlert
} from 'lucide-react';
import VirtualKeyboard from './VirtualKeyboard';

interface HRManagerProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  showToast: (msg: string) => void;
}

const ROLES = [
  'Quản lý vận hành trạm',
  'Trưởng nhóm kỹ thuật',
  'Kỹ thuật viên Booth 01',
  'Kỹ thuật viên Booth 02',
  'Kỹ thuật viên Booth 03',
  'Thu ngân quầy POS',
  'Bảo vệ điều phối',
  'Cộng tác viên thời vụ'
];

const LEVELS = [
  'Cấp 5 - Quản trị trạm',
  'Cấp 4 - Chuyên gia kĩ thuật',
  'Cấp 3 - Thợ chính chuyên sâu',
  'Cấp 2 - Thợ phụ rửa sạch',
  'Cấp 1 - Học việc tập sự'
];

const SKILL_OPTIONS = [
  'Rửa xe tự động',
  'Rửa chi tiết khoang máy',
  'Dọn nội thất chuyên sâu',
  'Hút bụi & Vệ sinh khe kẽ',
  'Wax bóng & dưỡng ghế da',
  'Phủ bóng Ceramic bảo vệ',
  'Đánh bóng kính lái',
  'Thu ngân & Giao tiếp POS'
];

const AVATAR_GRADIENTS = [
  'from-pink-500 to-rose-500',
  'from-purple-500 to-indigo-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-red-500 to-orange-500',
  'from-violet-500 to-purple-500',
  'from-[#A2C62C] to-emerald-600'
];

export default function HRManager({ employees, setEmployees, showToast }: HRManagerProps) {
  const maxEmployees = 30;
  // Navigation within HR tab
  const [hrSubTab, setHrSubTab] = useState<'list' | 'booth' | 'logs'>('list');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Profile Form state (New/Edit)
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState(ROLES[2]); // Default KTV Booth 01
  const [formLevel, setFormLevel] = useState(LEVELS[3]); // Default Thợ phụ
  const [formStatus, setFormStatus] = useState<'Đang làm việc' | 'Nghỉ phép' | 'Đã nghỉ việc'>('Đang làm việc');
  const [formBoothId, setFormBoothId] = useState<string>('none');
  const [formSkills, setFormSkills] = useState<string[]>([SKILL_OPTIONS[0], SKILL_OPTIONS[3]]);
  const [formNotes, setFormNotes] = useState('');
  const [formHireDate, setFormHireDate] = useState(new Date().toLocaleDateString('vi-VN'));

  // Virtual keyboard helper states
  const [activeInput, setActiveInput] = useState<'name' | 'phone' | 'email' | 'notes' | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);

  // Swap / Replacement assistant helper state
  const [swapAlert, setSwapAlert] = useState<{
    show: boolean;
    employeeId: string;
    employeeName: string;
    affectedBoothId: number;
  } | null>(null);

  // HR internal audit trail logs
  const [hrLogs, setHrLogs] = useState<{
    id: string;
    timestamp: string;
    action: string;
    details: string;
    type: 'info' | 'warn' | 'success';
  }[]>([
    {
      id: 'log-1',
      timestamp: '05/07/2026 08:00 AM',
      action: 'Bố trí ca trực',
      details: 'Đã bố trí Nguyễn Văn Hùng đứng trực tại Booth 01.',
      type: 'success'
    },
    {
      id: 'log-2',
      timestamp: '05/07/2026 08:15 AM',
      action: 'Khởi động trạm',
      details: 'Bố trí Lê Hoàng Long làm thợ chính tại Booth 02.',
      type: 'info'
    }
  ]);

  const addLog = (action: string, details: string, type: 'info' | 'warn' | 'success' = 'info') => {
    const timeStr = new Date().toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    setHrLogs(prev => [
      { id: `log-${Date.now()}`, timestamp: timeStr, action, details, type },
      ...prev
    ]);
  };

  // Helper to open virtual keyboard
  const handleInputFocus = (inputType: 'name' | 'phone' | 'email' | 'notes') => {
    setActiveInput(inputType);
    setShowKeyboard(true);
  };

  const handleKeyboardChange = (val: string) => {
    if (activeInput === 'name') setFormName(val);
    else if (activeInput === 'phone') setFormPhone(val);
    else if (activeInput === 'email') setFormEmail(val);
    else if (activeInput === 'notes') setFormNotes(val);
  };

  const toggleSkill = (skill: string) => {
    if (formSkills.includes(skill)) {
      setFormSkills(prev => prev.filter(s => s !== skill));
    } else {
      setFormSkills(prev => [...prev, skill]);
    }
  };

  // Create or Update employee
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('⚠️ Vui lòng nhập họ tên nhân viên!');
      return;
    }
    if (!formPhone.trim()) {
      showToast('⚠️ Vui lòng cung cấp số điện thoại!');
      return;
    }
    if (!isEditing && employees.length >= maxEmployees) {
      showToast(`⚠️ Hệ thống đã đạt giới hạn ${maxEmployees} hồ sơ nhân sự.`);
      return;
    }

    const assignedBooth = formBoothId === 'none' ? null : parseInt(formBoothId);

    // If changing standing status to off/left, and they were at a booth, we need to handle vacancy
    if ((formStatus === 'Nghỉ phép' || formStatus === 'Đã nghỉ việc') && assignedBooth !== null) {
      setSwapAlert({
        show: true,
        employeeId: editingId || `emp-${Date.now()}`,
        employeeName: formName.trim(),
        affectedBoothId: assignedBooth
      });
    }

    if (isEditing && editingId) {
      // Edit mode
      setEmployees(prev => prev.map(emp => {
        if (emp.id === editingId) {
          // Check if status changed to rest, reset booth assignment
          const finalBooth = (formStatus === 'Nghỉ phép' || formStatus === 'Đã nghỉ việc') ? null : assignedBooth;
          return {
            ...emp,
            name: formName.trim(),
            phone: formPhone.trim(),
            email: formEmail.trim(),
            role: formRole,
            level: formLevel,
            status: formStatus,
            boothId: finalBooth,
            skills: formSkills,
            notes: formNotes,
            hireDate: formHireDate
          };
        }
        return emp;
      }));

      addLog(
        'Cập nhật hồ sơ', 
        `Đã cập nhật hồ sơ nhân sự của ${formName.trim()} (${formRole}). Trạng thái: ${formStatus}.`, 
        formStatus === 'Đang làm việc' ? 'info' : 'warn'
      );
      showToast(`✓ Đã cập nhật hồ sơ của nhân viên ${formName.trim()}!`);
    } else {
      // Add mode
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || `${formPhone}@wassup.vn`,
        role: formRole,
        level: formLevel,
        status: formStatus,
        boothId: (formStatus === 'Nghỉ phép' || formStatus === 'Đã nghỉ việc') ? null : assignedBooth,
        skills: formSkills,
        notes: formNotes,
        hireDate: new Date().toLocaleDateString('vi-VN'),
        avatarSeed: Math.floor(Math.random() * 8)
      };

      setEmployees(prev => [newEmp, ...prev]);
      addLog('Đăng ký mới', `Đã tuyển dụng & đăng ký hồ sơ nhân sự mới: ${newEmp.name} - ${newEmp.role}.`, 'success');
      showToast(`✓ Đăng ký thành công nhân sự mới: ${newEmp.name}!`);
    }

    // Reset Form
    resetForm();
  };

  const resetForm = () => {
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormRole(ROLES[2]);
    setFormLevel(LEVELS[3]);
    setFormStatus('Đang làm việc');
    setFormBoothId('none');
    setFormSkills([SKILL_OPTIONS[0], SKILL_OPTIONS[3]]);
    setFormNotes('');
    setFormHireDate(new Date().toLocaleDateString('vi-VN'));
    setIsEditing(false);
    setEditingId(null);
    setActiveInput(null);
    setShowKeyboard(false);
  };

  const handleEditClick = (emp: Employee) => {
    setFormName(emp.name);
    setFormPhone(emp.phone);
    setFormEmail(emp.email);
    setFormRole(emp.role);
    setFormLevel(emp.level);
    setFormStatus(emp.status);
    setFormBoothId(emp.boothId !== null ? emp.boothId.toString() : 'none');
    setFormSkills(emp.skills);
    setFormNotes(emp.notes);
    setFormHireDate(emp.hireDate);
    setIsEditing(true);
    setEditingId(emp.id);
    setHrSubTab('list'); // switch to list view containing the form
  };

  const handleDeleteClick = (empId: string, empName: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa hồ sơ nhân sự của ${empName}? Hành động này không thể hoàn tác.`)) {
      setEmployees(prev => prev.filter(emp => emp.id !== empId));
      addLog('Xoá nhân viên', `Đã xoá vĩnh viễn hồ sơ nhân sự của ${empName} khỏi cơ sở dữ liệu.`, 'warn');
      showToast(`✓ Đã xóa hồ sơ nhân viên ${empName}!`);
    }
  };

  // Change Shift / Assign Booth daily
  const handleAssignBooth = (employeeId: string, targetBoothId: number | null) => {
    // If targetBoothId is assigned to someone else, we free them (unassign them first to prevent 2 people in 1 booth)
    setEmployees(prev => prev.map(emp => {
      // If assigning to a booth, unassign whoever was in that booth
      if (targetBoothId !== null && emp.boothId === targetBoothId) {
        addLog('Giải phóng Booth', `${emp.name} được thu hồi nhiệm vụ tại Booth 0${targetBoothId}.`, 'info');
        return { ...emp, boothId: null };
      }
      return emp;
    }));

    setEmployees(prev => prev.map(emp => {
      if (emp.id === employeeId) {
        const prevBooth = emp.boothId;
        addLog(
          'Điều động đứng booth', 
          `Bố trí ${emp.name} từ ${prevBooth ? `Booth 0${prevBooth}` : 'Khu vực chờ'} sang đứng trực ${targetBoothId ? `Booth 0${targetBoothId}` : 'Khu vực ngoại biên'}.`, 
          'success'
        );
        return { ...emp, boothId: targetBoothId };
      }
      return emp;
    }));

    showToast(`✓ Đã điều động nhân sự thành công!`);
  };

  // Swapping/Replacement action from Alert
  const handlePerformSwap = (replacementEmpId: string) => {
    if (!swapAlert) return;

    const { affectedBoothId, employeeName } = swapAlert;
    
    // Set replacement employee to standing at the booth
    setEmployees(prev => prev.map(emp => {
      if (emp.id === replacementEmpId) {
        addLog(
          'Đổi nhân viên khẩn cấp', 
          `Đã thế vai thành công: Điều động ${emp.name} thay thế cho ${employeeName} đang nghỉ trực tại Booth 0${affectedBoothId}.`, 
          'success'
        );
        return { ...emp, boothId: affectedBoothId };
      }
      return emp;
    }));

    showToast(`✓ Đã điều động thay thế thành công tại Booth 0${affectedBoothId}!`);
    setSwapAlert(null);
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.phone.includes(searchQuery) ||
                          emp.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Get booth occupants
  const booth1Occupant = employees.find(e => e.boothId === 1 && e.status === 'Đang làm việc');
  const booth2Occupant = employees.find(e => e.boothId === 2 && e.status === 'Đang làm việc');
  const booth3Occupant = employees.find(e => e.boothId === 3 && e.status === 'Đang làm việc');

  // Available technicians (not assigned and active)
  const availableTechnicians = employees.filter(e => e.status === 'Đang làm việc' && e.role.toLowerCase().includes('kỹ thuật viên') && e.boothId === null);

  return (
    <div className="space-y-6">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/10">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#A2C62C]" /> PHÂN HỆ QUẢN TRỊ NHÂN SỰ & BỐ TRÍ CA TRỰC BOOTH CO.
          </h2>
          <p className="text-[10px] text-white/40 mt-1">Lưu trữ hồ sơ lý lịch, phân cấp vai trò, phân công booth kỹ thuật và giải quyết nhân viên xin nghỉ khẩn cấp. Hệ thống hỗ trợ tối đa {maxEmployees} hồ sơ.</p>
        </div>

        <div className="flex gap-2 bg-black/50 border border-white/10 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setHrSubTab('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 shrink-0 ${hrSubTab === 'list' ? 'bg-[#A2C62C] text-black font-black' : 'text-white/60 hover:text-white'}`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Hồ sơ & Đăng ký
          </button>
          <button
            type="button"
            onClick={() => setHrSubTab('booth')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 shrink-0 ${hrSubTab === 'booth' ? 'bg-[#A2C62C] text-black font-black' : 'text-white/60 hover:text-white'}`}
          >
            <Grid className="w-3.5 h-3.5" /> Bố trí Booth ngày
          </button>
          <button
            type="button"
            onClick={() => setHrSubTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 shrink-0 ${hrSubTab === 'logs' ? 'bg-[#A2C62C] text-black font-black' : 'text-white/60 hover:text-white'}`}
          >
            <Clock className="w-3.5 h-3.5" /> Nhật ký điều động
          </button>
        </div>
      </div>

      {/* SWAP ASSISTANT MODAL/POPUP */}
      {swapAlert && (
        <div className="bg-red-500/10 border-2 border-red-500/30 p-5 rounded-2xl relative overflow-hidden animate-pulse">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-xl"></div>
          <div className="flex items-start gap-4">
            <ShieldAlert className="w-8 h-8 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-3 flex-1">
              <div>
                <h4 className="text-xs font-black uppercase text-red-400 tracking-wider">Cảnh báo khuyết vị trí Booth 0{swapAlert.affectedBoothId}!</h4>
                <p className="text-xs text-white/80 mt-1 leading-relaxed">
                  Nhân sự <strong>{swapAlert.employeeName}</strong> được thay đổi trạng thái sang <strong>Nghỉ</strong>, dẫn tới khuyết người trực chính tại <strong>Booth 0{swapAlert.affectedBoothId}</strong>.
                </p>
              </div>

              {availableTechnicians.length > 0 ? (
                <div>
                  <p className="text-[10px] font-bold uppercase text-white/40 mb-2">Đề xuất nhân sự thay thế rảnh tay có sẵn:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTechnicians.map(tech => (
                      <button
                        key={tech.id}
                        type="button"
                        onClick={() => handlePerformSwap(tech.id)}
                        className="bg-black/50 hover:bg-green-500 hover:text-black border border-white/15 hover:border-green-500 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all text-white"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{tech.name}</span>
                        <span className="text-[9px] bg-white/10 px-1 py-0.5 rounded font-mono text-[8px] font-medium uppercase">{tech.level.split(' - ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-black/40 p-3 rounded-xl text-xs text-yellow-400 border border-yellow-500/20">
                  ⚠️ <strong>Không có kỹ thuật viên rảnh tay:</strong> Tất cả thợ đều đang bận trực các booth hoặc nghỉ ca. Vui lòng tuyển dụng đăng ký mới hoặc điều phối từ bộ phận khác.
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setSwapAlert(null)}
                  className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white/60 transition-all uppercase"
                >
                  Bỏ qua, bố trí sau
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* TAB CONTENT 1: PROFILES DIRECTORY AND ENTRY INPUT FORM */}
      {hrSubTab === 'list' && (
        <div className="grid grid-cols-12 gap-6">
          
          {/* LEFT: HR INPUT FORM */}
          <div className="col-span-12 lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-5 h-fit space-y-4">
            <div className="pb-3 border-b border-white/5">
              <h3 className="text-xs font-black uppercase text-[#A2C62C] tracking-widest flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> {isEditing ? 'CẬP NHẬT HỒ SƠ NHÂN SỰ' : 'ĐĂNG KÝ HỒ SƠ NHÂN SỰ MỚI'}
              </h3>
              <p className="text-[9px] text-white/40 mt-1">Nhập liệu đầy đủ thông tin để định danh và phân cấp nhân viên.</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              
              <div>
                <label className="text-[10px] text-white/40 uppercase block mb-1">Họ và tên nhân viên</label>
                <input
                  type="text"
                  placeholder="Họ tên đầy đủ (Ví dụ: Nguyễn Văn Hùng)"
                  value={formName}
                  onFocus={() => handleInputFocus('name')}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 focus:border-[#A2C62C] rounded-xl px-3 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/40 uppercase block mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="09xx..."
                    value={formPhone}
                    onFocus={() => handleInputFocus('phone')}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 focus:border-[#A2C62C] rounded-xl px-3 py-2.5 text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase block mb-1">Thư điện tử (Email)</label>
                  <input
                    type="email"
                    placeholder="email@wassup.vn"
                    value={formEmail}
                    onFocus={() => handleInputFocus('email')}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 focus:border-[#A2C62C] rounded-xl px-3 py-2.5 text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-white/40 uppercase block mb-1">Phân cấp vai trò công việc (Role)</label>
                <select
                  value={formRole}
                  onChange={e => setFormRole(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 focus:border-[#A2C62C] rounded-xl px-3 py-2.5 text-white focus:outline-none font-medium"
                >
                  {ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/40 uppercase block mb-1">Hệ bậc năng lực (Level)</label>
                  <select
                    value={formLevel}
                    onChange={e => setFormLevel(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 focus:border-[#A2C62C] rounded-xl px-3 py-2.5 text-white focus:outline-none font-medium"
                  >
                    {LEVELS.map(lvl => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-white/40 uppercase block mb-1">Tình trạng xin nghỉ (Leave status)</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full bg-black/60 border border-white/10 focus:border-[#A2C62C] rounded-xl px-3 py-2.5 text-white focus:outline-none font-bold"
                  >
                    <option value="Đang làm việc" className="text-green-400">Đang làm việc (Active)</option>
                    <option value="Nghỉ phép" className="text-yellow-400">Nghỉ phép (On Leave)</option>
                    <option value="Đã nghỉ việc" className="text-red-400">Đã nghỉ việc (Resigned)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-white/40 uppercase block mb-1">Bố trí nhanh Booth trực ngày</label>
                <select
                  value={formBoothId}
                  onChange={e => setFormBoothId(e.target.value)}
                  disabled={formStatus !== 'Đang làm việc'}
                  className="w-full bg-black/60 border border-white/10 focus:border-[#A2C62C] rounded-xl px-3 py-2.5 text-white focus:outline-none font-medium disabled:opacity-40"
                >
                  <option value="none">Không gán Booth trực (Ngoại vi / Chờ điều lệnh)</option>
                  <option value="1">Booth 01 (Buồng máy rửa 1)</option>
                  <option value="2">Booth 02 (Buồng máy rửa 2)</option>
                  <option value="3">Booth 03 (Buồng máy rửa 3)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-white/40 uppercase block mb-2">Chứng chỉ tay nghề / Kỹ năng</label>
                <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1 border border-white/5 bg-black/30 p-2.5 rounded-xl">
                  {SKILL_OPTIONS.map(skill => {
                    const hasSkill = formSkills.includes(skill);
                    return (
                      <button
                        type="button"
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`p-2 rounded-lg text-left text-[10px] transition-all border ${hasSkill ? 'bg-[#A2C62C]/10 border-[#A2C62C] text-[#A2C62C] font-semibold' : 'bg-black/20 border-white/5 text-white/60 hover:border-white/10'}`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-white/40 uppercase block mb-1">Ghi chú hồ sơ lý lịch / Tiểu sử</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả kỹ năng thế mạnh, số năm kinh nghiệm, tiểu sử đào tạo..."
                  value={formNotes}
                  onFocus={() => handleInputFocus('notes')}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 focus:border-[#A2C62C] rounded-xl px-3 py-2.5 text-white focus:outline-none"
                />
              </div>

              {showKeyboard && (
                <div className="p-2 bg-black border border-white/10 rounded-xl">
                  <VirtualKeyboard
                    value={
                      activeInput === 'name' ? formName :
                      activeInput === 'phone' ? formPhone :
                      activeInput === 'email' ? formEmail :
                      formNotes
                    }
                    onChange={handleKeyboardChange}
                    layoutType={activeInput === 'phone' ? 'phone' : 'text'}
                    onClose={() => setShowKeyboard(false)}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 border border-white/10 rounded-xl hover:bg-white/5 font-bold transition-all text-white/60"
                >
                  Xoá Trắng
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#A2C62C] hover:brightness-110 text-black font-extrabold rounded-xl uppercase transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" /> {isEditing ? 'LƯU HỒ SƠ' : 'ĐĂNG KÝ MỚI'}
                </button>
              </div>

            </form>
          </div>

          {/* RIGHT: PROFILES DATABASE VIEW */}
          <div className="col-span-12 lg:col-span-8 bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-white/5">
                <div>
                  <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                    DANH SÁCH HỒ SƠ NHÂN SỰ LƯU TRỮ ({filteredEmployees.length} NHÂN VIÊN)
                  </h3>
                  <p className="text-[10px] text-white/40 mt-1">Nhấp sửa hồ sơ để đăng ký thông tin, bổ nhiệm vai trò hoặc cho nhân viên nghỉ phép.</p>
                </div>
                
                {/* Search query input */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Tìm tên, SĐT, vai trò..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl pl-8.5 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#A2C62C]"
                  />
                </div>
              </div>

              {/* Filters line */}
              <div className="flex flex-wrap gap-2 items-center text-xs">
                <span className="text-white/40 text-[10px] font-bold uppercase mr-1">Bộ lọc nhanh:</span>
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 px-2 py-1 rounded text-white/80 focus:outline-none focus:border-[#A2C62C]"
                >
                  <option value="all">Tất cả vai trò</option>
                  {ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 px-2 py-1 rounded text-white/80 focus:outline-none focus:border-[#A2C62C]"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="Đang làm việc">Đang làm việc (Active)</option>
                  <option value="Nghỉ phép">Nghỉ phép (On Leave)</option>
                  <option value="Đã nghỉ việc">Đã nghỉ việc (Resigned)</option>
                </select>
              </div>

              {/* Profiles GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[580px] overflow-y-auto pr-1">
                {filteredEmployees.map(emp => {
                  const avatarColor = AVATAR_GRADIENTS[emp.avatarSeed % AVATAR_GRADIENTS.length];
                  const initials = emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <div 
                      key={emp.id} 
                      className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-white/20 transition-all shadow-md group relative overflow-hidden"
                    >
                      {/* Decorative backdrop glow for assigned booth */}
                      {emp.boothId !== null && (
                        <div className="absolute top-0 right-0 w-16 h-16 bg-[#A2C62C]/5 rounded-full blur-xl"></div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          {/* Colored dynamic avatar */}
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center font-bold text-black shadow-md shrink-0 text-sm`}>
                            {initials}
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                              {emp.name}
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                emp.status === 'Đang làm việc' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                emp.status === 'Nghỉ phép' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {emp.status === 'Đang làm việc' ? 'Active' : emp.status === 'Nghỉ phép' ? 'Leave' : 'Resigned'}
                              </span>
                            </h4>
                            <p className="text-[10px] text-white/50 flex items-center gap-1">
                              <Briefcase className="w-3 h-3 text-[#A2C62C]" /> {emp.role}
                            </p>
                            <p className="text-[9px] text-[#A2C62C] font-semibold">{emp.level}</p>
                          </div>
                        </div>

                        {/* Contacts & booth assignment details */}
                        <div className="space-y-1 bg-black/20 p-2.5 rounded-lg text-[10px] text-white/60 font-mono">
                          <p className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-white/40" /> {emp.phone}
                          </p>
                          <p className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3 h-3 text-white/40" /> {emp.email}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-white/40" /> Tuyển dụng: {emp.hireDate}
                          </p>
                          <p className="flex items-center gap-1.5 mt-1 border-t border-white/5 pt-1">
                            <MapPin className="w-3 h-3 text-white/40" /> 
                            <span>Vị trí trực:</span>
                            <span className={`font-bold ${emp.boothId ? 'text-[#A2C62C]' : 'text-white/40 font-normal'}`}>
                              {emp.boothId !== null ? `TRỰC BOOTH 0${emp.boothId}` : 'CHƯA PHÂN BOOTH'}
                            </span>
                          </p>
                        </div>

                        {/* Skills badges */}
                        {emp.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {emp.skills.slice(0, 3).map(skill => (
                              <span key={skill} className="bg-white/5 text-white/50 border border-white/5 px-1.5 py-0.5 rounded text-[8px]">
                                {skill}
                              </span>
                            ))}
                            {emp.skills.length > 3 && (
                              <span className="bg-white/5 text-[#A2C62C] border border-white/5 px-1 py-0.5 rounded text-[8px] font-bold">
                                +{emp.skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Bio note */}
                        {emp.notes && (
                          <p className="text-[10px] italic text-white/40 line-clamp-2 leading-relaxed bg-white/5 p-1.5 rounded">
                            "{emp.notes}"
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="mt-4 flex gap-2 justify-end pt-2 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => handleEditClick(emp)}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-md text-[9px] font-bold uppercase text-white/70 hover:text-white flex items-center gap-1 transition-all"
                        >
                          <Edit3 className="w-3 h-3" /> Chỉnh sửa hồ sơ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(emp.id, emp.name)}
                          className="px-2 py-1 bg-red-500/5 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/10 hover:border-red-500/25 rounded-md text-[9px] font-bold uppercase flex items-center gap-1 transition-all"
                        >
                          <Trash2 className="w-3 h-3" /> Xóa
                        </button>
                      </div>

                    </div>
                  );
                })}

                {filteredEmployees.length === 0 && (
                  <div className="col-span-full py-16 text-center text-white/30 border border-dashed border-white/10 rounded-2xl bg-black/20 flex flex-col items-center justify-center">
                    <Users className="w-12 h-12 mb-3 opacity-25 text-[#A2C62C]" />
                    <p className="text-xs font-bold">Không tìm thấy hồ sơ nhân viên nào phù hợp</p>
                    <p className="text-[10px] text-white/40 mt-1">Vui lòng thay đổi từ khóa tìm kiếm hoặc bấm Đăng ký mới nhân sự.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pagination / bottom status */}
            <div className="mt-4 text-[10px] text-white/30 flex justify-between items-center border-t border-white/5 pt-3">
              <span>Đang hiển thị {filteredEmployees.length} nhân sự trên hệ thống</span>
              <span>Lưu trữ cục bộ - Kết nối PLC đồng bộ thiết bị</span>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT 2: DAILY BOOTH ASSIGNMENT (BỐ TRÍ VỊ TRÍ ĐỨNG BOOTH HÀNG NGÀY) */}
      {hrSubTab === 'booth' && (
        <div className="space-y-6">
          
          {/* Active Booth Layout Map */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Booth 1 card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-xs font-black text-[#A2C62C] uppercase tracking-wider">BOOTH 01 (CƠ BẢN)</span>
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-mono text-[8px] font-black uppercase">ĐANG CHẠY</span>
                </div>
                <p className="text-[10px] text-white/40 mt-1">Chuyên phục vụ các dòng xe 4-5 chỗ và gói cơ bản W1/W2.</p>
              </div>

              {booth1Occupant ? (
                <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-3 relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[booth1Occupant.avatarSeed % AVATAR_GRADIENTS.length]} flex items-center justify-center font-bold text-black text-xs shrink-0`}>
                      {booth1Occupant.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{booth1Occupant.name}</h4>
                      <p className="text-[10px] text-white/50">{booth1Occupant.role}</p>
                      <p className="text-[9px] text-[#A2C62C] font-semibold font-mono">{booth1Occupant.level}</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-white/40 pt-1.5 border-t border-white/5 flex justify-between items-center">
                    <span>SĐT: {booth1Occupant.phone}</span>
                    <span className="text-[#A2C62C] font-bold">Thợ chính trực chính</span>
                  </div>
                </div>
              ) : (
                <div className="py-8 bg-red-500/10 border border-dashed border-red-500/20 rounded-xl text-center text-red-400 flex flex-col items-center justify-center space-y-2">
                  <AlertTriangle className="w-8 h-8 animate-bounce text-red-500" />
                  <div>
                    <p className="text-xs font-bold uppercase">Booth khuyết nhân viên!</p>
                    <p className="text-[9px] text-white/40 max-w-[200px] mt-0.5 mx-auto">Chưa có thợ trực. Hãy chọn một nhân sự rảnh tay bên dưới để bổ nhiệm khẩn cấp.</p>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] text-white/40 uppercase block font-bold">Đổi nhanh thợ trực Booth 01</label>
                <select
                  onChange={e => {
                    if (e.target.value === 'unassign') {
                      if (booth1Occupant) handleAssignBooth(booth1Occupant.id, null);
                    } else if (e.target.value) {
                      handleAssignBooth(e.target.value, 1);
                    }
                    e.target.value = ''; // reset select
                  }}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="">-- Chọn nhân viên thay thế --</option>
                  {employees.filter(e => e.status === 'Đang làm việc' && e.boothId !== 1).map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role} {emp.boothId !== null ? `- Đang ở Booth 0${emp.boothId}` : ''})
                    </option>
                  ))}
                  {booth1Occupant && (
                    <option value="unassign" className="text-red-400">Gỡ nhiệm vụ thợ hiện tại (Unassign)</option>
                  )}
                </select>
              </div>
            </div>

            {/* Booth 2 card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-xs font-black text-[#A2C62C] uppercase tracking-wider">BOOTH 02 (NÂNG CAO)</span>
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-mono text-[8px] font-black uppercase">ĐANG CHẠY</span>
                </div>
                <p className="text-[10px] text-white/40 mt-1">Chuyên phục vụ dòng xe SUV 7-9 chỗ và dịch vụ nâng cao W3/W4.</p>
              </div>

              {booth2Occupant ? (
                <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-3 relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[booth2Occupant.avatarSeed % AVATAR_GRADIENTS.length]} flex items-center justify-center font-bold text-black text-xs shrink-0`}>
                      {booth2Occupant.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{booth2Occupant.name}</h4>
                      <p className="text-[10px] text-white/50">{booth2Occupant.role}</p>
                      <p className="text-[9px] text-[#A2C62C] font-semibold font-mono">{booth2Occupant.level}</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-white/40 pt-1.5 border-t border-white/5 flex justify-between items-center">
                    <span>SĐT: {booth2Occupant.phone}</span>
                    <span className="text-[#A2C62C] font-bold">Thợ chính trực chính</span>
                  </div>
                </div>
              ) : (
                <div className="py-8 bg-red-500/10 border border-dashed border-red-500/20 rounded-xl text-center text-red-400 flex flex-col items-center justify-center space-y-2">
                  <AlertTriangle className="w-8 h-8 animate-bounce text-red-500" />
                  <div>
                    <p className="text-xs font-bold uppercase">Booth khuyết nhân viên!</p>
                    <p className="text-[9px] text-white/40 max-w-[200px] mt-0.5 mx-auto">Chưa có thợ trực. Hãy chọn một nhân sự rảnh tay bên dưới để bổ nhiệm khẩn cấp.</p>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] text-white/40 uppercase block font-bold">Đổi nhanh thợ trực Booth 02</label>
                <select
                  onChange={e => {
                    if (e.target.value === 'unassign') {
                      if (booth2Occupant) handleAssignBooth(booth2Occupant.id, null);
                    } else if (e.target.value) {
                      handleAssignBooth(e.target.value, 2);
                    }
                    e.target.value = ''; // reset select
                  }}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="">-- Chọn nhân viên thay thế --</option>
                  {employees.filter(e => e.status === 'Đang làm việc' && e.boothId !== 2).map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role} {emp.boothId !== null ? `- Đang ở Booth 0${emp.boothId}` : ''})
                    </option>
                  ))}
                  {booth2Occupant && (
                    <option value="unassign" className="text-red-400">Gỡ nhiệm vụ thợ hiện tại (Unassign)</option>
                  )}
                </select>
              </div>
            </div>

            {/* Booth 3 card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-xs font-black text-[#A2C62C] uppercase tracking-wider">BOOTH 03 (DETAILED & CERAMIC)</span>
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-mono text-[8px] font-black uppercase">ĐANG CHẠY</span>
                </div>
                <p className="text-[10px] text-white/40 mt-1">Gói rửa đặc biệt, tẩy nhựa sơn hông xe, và phủ bóng Ceramic đỉnh cao W5.</p>
              </div>

              {booth3Occupant ? (
                <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-3 relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[booth3Occupant.avatarSeed % AVATAR_GRADIENTS.length]} flex items-center justify-center font-bold text-black text-xs shrink-0`}>
                      {booth3Occupant.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{booth3Occupant.name}</h4>
                      <p className="text-[10px] text-white/50">{booth3Occupant.role}</p>
                      <p className="text-[9px] text-[#A2C62C] font-semibold font-mono">{booth3Occupant.level}</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-white/40 pt-1.5 border-t border-white/5 flex justify-between items-center">
                    <span>SĐT: {booth3Occupant.phone}</span>
                    <span className="text-[#A2C62C] font-bold">Thợ chính trực chính</span>
                  </div>
                </div>
              ) : (
                <div className="py-8 bg-red-500/10 border border-dashed border-red-500/20 rounded-xl text-center text-red-400 flex flex-col items-center justify-center space-y-2">
                  <AlertTriangle className="w-8 h-8 animate-bounce text-red-500" />
                  <div>
                    <p className="text-xs font-bold uppercase">Booth khuyết nhân viên!</p>
                    <p className="text-[9px] text-white/40 max-w-[200px] mt-0.5 mx-auto">Chưa có thợ trực. Hãy chọn một nhân sự rảnh tay bên dưới để bổ nhiệm khẩn cấp.</p>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] text-white/40 uppercase block font-bold">Đổi nhanh thợ trực Booth 03</label>
                <select
                  onChange={e => {
                    if (e.target.value === 'unassign') {
                      if (booth3Occupant) handleAssignBooth(booth3Occupant.id, null);
                    } else if (e.target.value) {
                      handleAssignBooth(e.target.value, 3);
                    }
                    e.target.value = ''; // reset select
                  }}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="">-- Chọn nhân viên thay thế --</option>
                  {employees.filter(e => e.status === 'Đang làm việc' && e.boothId !== 3).map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role} {emp.boothId !== null ? `- Đang ở Booth 0${emp.boothId}` : ''})
                    </option>
                  ))}
                  {booth3Occupant && (
                    <option value="unassign" className="text-red-400">Gỡ nhiệm vụ thợ hiện tại (Unassign)</option>
                  )}
                </select>
              </div>
            </div>

          </div>

          {/* Quick staffing control center */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-xs font-black uppercase text-white tracking-widest mb-4 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#A2C62C]" /> ĐIỀU ĐỘNG VÀ THAY THẾ NHÂN SỰ TOÀN TRẠM NHANH
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white/80 border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-[10px] uppercase font-bold tracking-widest bg-white/5">
                    <th className="p-3">Họ và tên</th>
                    <th className="p-3">Hệ bậc năng lực</th>
                    <th className="p-3">Vai trò hiện tại</th>
                    <th className="p-3">Trạng thái làm</th>
                    <th className="p-3">Vị trí đứng Booth hiện tại</th>
                    <th className="p-3 text-right">Điều động nhanh sang Booth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {employees.filter(e => e.status === 'Đang làm việc').map(emp => (
                    <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-bold text-white">{emp.name}</td>
                      <td className="p-3 text-white/60 font-mono text-[10px] text-[#A2C62C]">{emp.level}</td>
                      <td className="p-3 text-white/50">{emp.role}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 font-bold uppercase">SẴN SÀNG</span>
                      </td>
                      <td className="p-3 font-bold text-[#A2C62C]">
                        {emp.boothId !== null ? `🎯 Booth 0${emp.boothId}` : '— Đang chờ phân công —'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => handleAssignBooth(emp.id, 1)}
                            className={`px-2 py-1 rounded text-[9px] font-bold transition-all uppercase ${emp.boothId === 1 ? 'bg-[#A2C62C] text-black shadow font-black' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70'}`}
                          >
                            Booth 01
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAssignBooth(emp.id, 2)}
                            className={`px-2 py-1 rounded text-[9px] font-bold transition-all uppercase ${emp.boothId === 2 ? 'bg-[#A2C62C] text-black shadow font-black' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70'}`}
                          >
                            Booth 02
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAssignBooth(emp.id, 3)}
                            className={`px-2 py-1 rounded text-[9px] font-bold transition-all uppercase ${emp.boothId === 3 ? 'bg-[#A2C62C] text-black shadow font-black' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70'}`}
                          >
                            Booth 03
                          </button>
                          {emp.boothId !== null && (
                            <button
                              type="button"
                              onClick={() => handleAssignBooth(emp.id, null)}
                              className="px-2 py-1 rounded text-[9px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 transition-all uppercase"
                            >
                              Gỡ booth
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {employees.filter(e => e.status === 'Đang làm việc').length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-white/20 italic">
                        Không có nhân viên hoạt động nào khả dụng để điều động đứng booth.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* TAB CONTENT 3: HR AUDIT TRAIL LOGS (NHẬT KÝ ĐIỀU ĐỘNG) */}
      {hrSubTab === 'logs' && (
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <div>
              <h3 className="text-xs font-black uppercase text-white tracking-wider">NHẬT KÝ ĐIỀU ĐỘNG & BIẾN ĐỘNG NHÂN SỰ REAL-TIME</h3>
              <p className="text-[10px] text-white/40 mt-1">Lịch sử ghi lại tất cả các hoạt động gán ca, thay đổi người khi nghỉ phép hoặc tuyển dụng mới.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setHrLogs([
                  {
                    id: 'log-seed',
                    timestamp: new Date().toLocaleString('vi-VN'),
                    action: 'Hệ thống khởi động',
                    details: 'Đã thiết lập lại nhật ký nhân sự trạm.',
                    type: 'info'
                  }
                ]);
                showToast('✓ Đã làm trống lịch sử logs tạm thời!');
              }}
              className="px-3 py-1 bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 rounded-lg text-[10px] font-bold uppercase transition-all"
            >
              Làm sạch nhật ký
            </button>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {hrLogs.map(log => (
              <div 
                key={log.id} 
                className={`p-3 rounded-xl border flex items-start gap-3.5 text-xs transition-all hover:bg-white/5 ${
                  log.type === 'success' ? 'bg-green-500/5 border-green-500/20' :
                  log.type === 'warn' ? 'bg-red-500/5 border-red-500/20' :
                  'bg-white/5 border-white/5'
                }`}
              >
                {/* Visual side indicator */}
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  log.type === 'success' ? 'bg-green-500 animate-pulse' :
                  log.type === 'warn' ? 'bg-red-500 animate-ping' :
                  'bg-blue-400'
                }`}></span>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap justify-between items-center gap-1">
                    <span className="font-bold text-white uppercase tracking-wider text-[10px]">{log.action}</span>
                    <span className="font-mono text-[9px] text-white/30">{log.timestamp}</span>
                  </div>
                  <p className="text-white/70 leading-relaxed text-[11px]">{log.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
