/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Car, Wrench, Sparkles, Activity, AlertTriangle, CheckCircle, 
  Clock, DollarSign, Search, Star, Camera, Droplet, Zap, Check, 
  ArrowRight, Download, Sliders, ShieldAlert, FileText, RefreshCw, Plus,
  Gift, Trophy, Award, BookOpen, AlertCircle, Settings, Tag, Users, ChevronDown, ChevronUp
} from 'lucide-react';
import { LoyaltyMember, InventoryItem, Job, Employee } from './types';
import { INITIAL_MEMBERS, INITIAL_INVENTORY, POINT_ACCUMULATION_RATE, TIER_PERKS } from './data';
import LoyaltySystem from './components/LoyaltySystem';
import InventorySystem from './components/InventorySystem';
import LiveCctvGrid from './components/LiveCctvGrid';
import LoginGate from './components/LoginGate';
import SettingsPanel from './components/SettingsPanel';
import PromoPricingManager from './components/PromoPricingManager';
import VirtualKeyboard from './components/VirtualKeyboard';
import ShiftHandover from './components/ShiftHandover';
import DailyExpenses from './components/DailyExpenses';
import AttendanceTracker from './components/AttendanceTracker';
import HRManager from './components/HRManager';
import { DailyExpense, AttendanceRecord } from './types';

// Pricing database
const SERVICES = [
  { id: 'W0', code: 'W0', name: 'W0 - Express', desc: 'Rửa tự động ngoài (exterior only)', price45: 59000, price79: 76700 },
  { id: 'W1', code: 'W1', name: 'W1 - Basic Clean', desc: 'Xịt gầm, rửa nhanh, hút bụi, lau nội thất', price45: 149000, price79: 193700 },
  { id: 'W2', code: 'W2', name: 'W2 - Full Clean', desc: 'Gói W1 + Giặt thảm, wax bóng, vệ sinh mâm kẽ', price45: 299000, price79: 388700, popular: true },
  { id: 'W3', code: 'W3', name: 'W3 - Super Shine', desc: 'Gói W2 + dưỡng taplo, dưỡng nhựa, dưỡng da ghế', price45: 649000, price79: 843700 },
  { id: 'W4', code: 'W4', name: 'W4 - Detail Care', desc: 'Rửa chi tiết, tẩy nhựa đường/bụi sơn, phục hồi ngoại thất', price45: 1699000, price79: 2208700 },
  { id: 'W5', code: 'W5', name: 'W5 - WASSUP PRIME', desc: 'Gói W4 + diệt khuẩn cabin ion, phủ bóng Ceramic', price45: 3399000, price79: 4418700 }
];

const DEFAULT_BOOTH_CONFIGS: Array<{ id: number; name: string; functionLabel: string; isActive: boolean }> = [
  { id: 1, name: 'Booth 1', functionLabel: 'Rửa nhanh tiêu chuẩn', isActive: true },
  { id: 2, name: 'Booth 2', functionLabel: 'Chăm sóc nâng cao', isActive: true },
  { id: 3, name: 'Booth 3', functionLabel: 'Detail & premium', isActive: true }
];

const DEFAULT_BOOTH_OPERATOR_PASSCODES: Record<number, string> = { 1: '888881', 2: '888882', 3: '888883' };

const ADDONS = [
  { id: 'A1', cat: 'NỘI THẤT', name: 'Hút bụi sâu + vệ sinh khe kẽ', price45: 99000, price79: 128700 },
  { id: 'A2', cat: 'NỘI THẤT', name: 'Khử mùi diệt khuẩn cabin', price45: 499000, price79: 648700 },
  { id: 'A3', cat: 'NỘI THẤT', name: 'Dưỡng da ghế da cao cấp', price45: 249000, price79: 323700 },
  { id: 'A4', cat: 'NGOẠI THẤT', name: 'Tẩy ố kính chiếu hậu + kính lái', price45: 499000, price79: 648700 },
  { id: 'A5', cat: 'NGOẠI THẤT', name: 'Tẩy nhựa đường hông xe', price45: 399000, price79: 518700 },
  { id: 'A6', cat: 'NGOẠI THẤT', name: 'Wax sealant bảo vệ sơn bóng', price45: 299000, price79: 388700 },
  { id: 'A7', cat: 'BẢO DƯỠNG', name: 'Thay nhớt máy + vệ sinh lọc', price45: 249000, price79: 323700 },
  { id: 'A8', cat: 'BẢO DƯỠNG', name: 'Phủ Ceramic bảo vệ lớp sơn', price45: 599000, price79: 779700 },
  { id: 'A9', cat: 'ĐIỆN TỬ', name: 'Vệ sinh camera hành trình + màn hình', price45: 199000, price79: 258700 },
  { id: 'A10', cat: 'KHÁCH HÀNG', name: 'Thay lọc gió cabin + làm sạch hệ thống', price45: 149000, price79: 193700 }
];

const getDefaultBoothForService = (serviceId: string): number => {
  if (serviceId === 'W0' || serviceId === 'W1') return 1;
  if (serviceId === 'W2' || serviceId === 'W3') return 2;
  return 3;
};

const buildDefaultServiceBoothRules = (availableBooths: number[]) => {
  const fallback = availableBooths[0] || 1;
  const prefer = (id: number) => (availableBooths.includes(id) ? id : fallback);
  return Object.fromEntries(SERVICES.map(service => {
    if (service.id === 'W0' || service.id === 'W1') return [service.id, prefer(1)];
    if (service.id === 'W2' || service.id === 'W3') return [service.id, prefer(2)];
    return [service.id, prefer(3)];
  })) as Record<string, number>;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('kiosk');
  const mainRef = useRef<HTMLElement | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(false);
  
  // Simulation shared state
  const [jobs, setJobs] = useState<Job[]>([
    {
      id: 'job-1',
      plate: '51A-888.88',
      size: '4-5',
      serviceId: 'W2',
      addOnIds: ['A2'],
      price: 798000,
      status: 'Processing',
      boothId: 1,
      progress: 70,
      checklist: { surface: true, crevices: true, wheelWellRim: true, interior: false, floorMat: false, glass: false, tirePlasticDressing: false, engineBay: false, airFilter: false, frontRearBrakes: false },
      timestamp: '09:15 AM',
      rating: null,
      paymentMethod: 'Visa'
    },
    {
      id: 'job-2',
      plate: '60B-123.45',
      size: '7-9',
      serviceId: 'W4',
      addOnIds: ['A5'],
      price: 2727400,
      status: 'Processing',
      boothId: 2,
      progress: 45,
      checklist: { surface: true, crevices: false, wheelWellRim: true, interior: false, floorMat: false, glass: false, tirePlasticDressing: false, engineBay: false, airFilter: false, frontRearBrakes: false },
      timestamp: '08:45 AM',
      rating: null,
      paymentMethod: 'Membership'
    },
    {
      id: 'job-3',
      plate: '29C-999.99',
      size: '4-5',
      serviceId: 'W1',
      addOnIds: [],
      price: 149000,
      status: 'Waiting',
      boothId: null,
      progress: 0,
      checklist: { surface: false, crevices: false, wheelWellRim: false, interior: false, floorMat: false, glass: false, tirePlasticDressing: false, engineBay: false, airFilter: false, frontRearBrakes: false },
      timestamp: '10:10 AM',
      rating: null,
      paymentMethod: null
    },
    {
      id: 'job-4',
      plate: '51F-777.77',
      size: '4-5',
      serviceId: 'W3',
      addOnIds: ['A1', 'A6'],
      price: 1047000,
      status: 'QC',
      boothId: 3,
      progress: 100,
      checklist: { surface: true, crevices: true, wheelWellRim: true, interior: true, floorMat: true, glass: true, tirePlasticDressing: true, engineBay: true, airFilter: true, frontRearBrakes: true },
      timestamp: '09:30 AM',
      rating: null,
      paymentMethod: 'QR Pay'
    }
  ]);

  // General operations settings
  const [chemicals, setChemicals] = useState({ foam: 68, wax: 42, ceramic: 91, water: 12, wheel: 74 });
  const [alarms, setAlarms] = useState({ pressure: true, tankLow: true, emergency: false });
  const [hardware, setHardware] = useState({ pump: true, valve: false, foam: false });
  const [selectedBooth, setSelectedBooth] = useState<number>(1);
  const [lang, setLang] = useState<'vi' | 'en'>('vi');

  // Authentication & Security gates
  const [boothConfigs, setBoothConfigs] = useState<Array<{ id: number; name: string; functionLabel: string; isActive: boolean }>>(DEFAULT_BOOTH_CONFIGS);
  const [operatorAuthByBooth, setOperatorAuthByBooth] = useState<Record<number, boolean>>({ 1: false, 2: false, 3: false });
  const [boothOperatorPasscodes, setBoothOperatorPasscodes] = useState<Record<number, string>>(DEFAULT_BOOTH_OPERATOR_PASSCODES);
  const [isPOSAuthenticated, setIsPOSAuthenticated] = useState(false);
  const [isManagerAuthenticated, setIsManagerAuthenticated] = useState(false);

  // Dynamic system settings (adjustable via Manager)
  const [simulationEnabled, setSimulationEnabled] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(3000);
  const [lowStockAlertThreshold, setLowStockAlertThreshold] = useState(20);
  const [stationPasscodes, setStationPasscodes] = useState<{ pos: string; mgr: string }>({
    pos: '666666',
    mgr: '999999'
  });

  // Dynamic lists adjustable by POS and Manager
  const [servicesList, setServicesList] = useState(SERVICES);
  const [serviceBoothRules, setServiceBoothRules] = useState<Record<string, number>>(() =>
    buildDefaultServiceBoothRules([1, 2, 3])
  );
  const [addonsList, setAddonsList] = useState(ADDONS);
  const [promotionsList, setPromotionsList] = useState([
    { code: 'WASSUP100', value: 100000, type: 'fixed' as const, description: 'Voucher giảm giá 100k' },
    { code: 'VIP30', value: 0.3, type: 'percent' as const, description: 'Voucher giảm 30% tổng bill' }
  ]);

  // Customer Loyalty & Inventory core states
  const [members, setMembers] = useState<LoyaltyMember[]>(INITIAL_MEMBERS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [posSubTab, setPosSubTab] = useState<'billing' | 'loyalty' | 'pricing' | 'handover' | 'inventory' | 'expenses' | 'attendance'>('billing');
  const [oprSubTab, setOprSubTab] = useState<'monitor' | 'handover'>('monitor');
  const [mgrSubTab, setMgrSubTab] = useState<'analytics' | 'inventory' | 'loyalty' | 'settings' | 'pricing' | 'expenses' | 'attendance' | 'hr'>('analytics');
  const [analyticsPage, setAnalyticsPage] = useState<'overview' | 'alerts' | 'deep'>('overview');
  const [analysisRange, setAnalysisRange] = useState<'day' | 'week' | 'month'>('month');

  const activeBoothIds = useMemo(
    () => boothConfigs.filter(booth => booth.isActive).map(booth => booth.id).sort((a, b) => a - b),
    [boothConfigs]
  );
  const firstActiveBoothId = useMemo(() => activeBoothIds[0] || 1, [activeBoothIds]);
  const isOprTab = activeTab.startsWith('opr-');
  const currentOprBooth = useMemo(() => {
    if (!isOprTab) return firstActiveBoothId;
    const parsed = Number(activeTab.replace('opr-', ''));
    return Number.isFinite(parsed) && activeBoothIds.includes(parsed) ? parsed : firstActiveBoothId;
  }, [isOprTab, firstActiveBoothId, activeTab, activeBoothIds]);
  const isCurrentOprAuthenticated = operatorAuthByBooth[currentOprBooth];

  const createEmptyChecklist = (): Job['checklist'] => ({
    surface: false,
    crevices: false,
    wheelWellRim: false,
    interior: false,
    floorMat: false,
    glass: false,
    tirePlasticDressing: false,
    engineBay: false,
    airFilter: false,
    frontRearBrakes: false
  });

  // Employee Database States
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: 'emp-1',
      name: 'Nguyễn Văn Hùng',
      phone: '0912345678',
      email: 'hung.nv@wassup.vn',
      role: 'Kỹ thuật viên Booth 01',
      level: 'Cấp 3 - Thợ chính chuyên sâu',
      status: 'Đang làm việc',
      boothId: 1,
      skills: ['Rửa xe tự động', 'Hút bụi & Vệ sinh khe kẽ', 'Wax bóng & dưỡng ghế da'],
      notes: 'Thợ cứng lành nghề trực chính Booth 01, chịu khó và năng nổ.',
      hireDate: '12/01/2025',
      avatarSeed: 1
    },
    {
      id: 'emp-2',
      name: 'Lê Hoàng Long',
      phone: '0987654321',
      email: 'long.lh@wassup.vn',
      role: 'Kỹ thuật viên Booth 02',
      level: 'Cấp 3 - Thợ chính chuyên sâu',
      status: 'Đang làm việc',
      boothId: 2,
      skills: ['Rửa xe tự động', 'Hút bụi & Vệ sinh khe kẽ', 'Dọn nội thất chuyên sâu'],
      notes: 'Giao tiếp tốt với khách, chuyên dọn nội thất chi tiết nâng cao.',
      hireDate: '20/03/2025',
      avatarSeed: 2
    },
    {
      id: 'emp-3',
      name: 'Phạm Minh Đức',
      phone: '0901234567',
      email: 'duc.pm@wassup.vn',
      role: 'Kỹ thuật viên Booth 03',
      level: 'Cấp 4 - Chuyên gia kĩ thuật',
      status: 'Đang làm việc',
      boothId: 3,
      skills: ['Rửa xe tự động', 'Rửa chi tiết khoang máy', 'Phủ bóng Ceramic bảo vệ', 'Đánh bóng kính lái'],
      notes: 'Chuyên gia Detailer chính phụ trách phủ Ceramic & Phục hồi sơn xe.',
      hireDate: '01/10/2024',
      avatarSeed: 3
    },
    {
      id: 'emp-4',
      name: 'Trần Thị Mai',
      phone: '0945678901',
      email: 'mai.tt@wassup.vn',
      role: 'Thu ngân quầy POS',
      level: 'Cấp 3 - Thợ chính chuyên sâu',
      status: 'Đang làm việc',
      boothId: null,
      skills: ['Thu ngân & Giao tiếp POS'],
      notes: 'Thao tác POS thanh toán nhanh, niềm nở chu đáo với khách hàng.',
      hireDate: '15/02/2025',
      avatarSeed: 4
    },
    {
      id: 'emp-5',
      name: 'Nguyễn Quốc Bảo',
      phone: '0934567890',
      email: 'bao.nq@wassup.vn',
      role: 'Bảo vệ điều phối',
      level: 'Cấp 2 - Thợ phụ rửa sạch',
      status: 'Đang làm việc',
      boothId: null,
      skills: ['Thu ngân & Giao tiếp POS'],
      notes: 'Dẫn dắt xe khách ra vào trạm chuyên nghiệp, nhiệt tình, lịch sự.',
      hireDate: '01/05/2025',
      avatarSeed: 5
    },
    {
      id: 'emp-6',
      name: 'Đặng Thùy Dương',
      phone: '0956789012',
      email: 'duong.dt@wassup.vn',
      role: 'Quản lý vận hành trạm',
      level: 'Cấp 5 - Quản trị trạm',
      status: 'Đang làm việc',
      boothId: null,
      skills: ['Thu ngân & Giao tiếp POS', 'Rửa xe tự động'],
      notes: 'Quản lý trưởng vận hành, chịu trách nhiệm KPI doanh số trạm.',
      hireDate: '01/01/2024',
      avatarSeed: 6
    }
  ]);

  // Daily Expenses & Attendance states
  const [expenses, setExpenses] = useState<DailyExpense[]>([
    { id: 'exp-1', date: new Date().toLocaleDateString('vi-VN'), category: 'Điện nước', amount: 850000, notes: 'Thanh toán tiền điện nước vận hành trạm' },
    { id: 'exp-2', date: new Date().toLocaleDateString('vi-VN'), category: 'Nước uống', amount: 150000, notes: 'Mua nước khoáng bình chờ khách' },
    { id: 'exp-3', date: new Date().toLocaleDateString('vi-VN'), category: 'Internet', amount: 250000, notes: 'Gói cáp quang wifi trạm' },
    { id: 'exp-4', date: new Date().toLocaleDateString('vi-VN'), category: 'Dịch vụ khác', amount: 300000, notes: 'Vệ sinh rác thải công nghiệp định kỳ' }
  ]);

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([
    { id: 'att-1', employeeName: 'Nguyễn Văn Hùng', role: 'Kỹ thuật viên Booth 01', date: new Date().toLocaleDateString('vi-VN'), checkInTime: '08:00 AM', checkOutTime: null, status: 'Đang làm' },
    { id: 'att-2', employeeName: 'Trần Thị Mai', role: 'Thu ngân quầy POS', date: new Date().toLocaleDateString('vi-VN'), checkInTime: '07:45 AM', checkOutTime: null, status: 'Đang làm' },
    { id: 'att-3', employeeName: 'Lê Hoàng Long', role: 'Kỹ thuật viên Booth 02', date: new Date().toLocaleDateString('vi-VN'), checkInTime: '08:15 AM', checkOutTime: null, status: 'Đang làm' },
    { id: 'att-4', employeeName: 'Phạm Minh Đức', role: 'Kỹ thuật viên Booth 03', date: new Date().toLocaleDateString('vi-VN'), checkInTime: '08:00 AM', checkOutTime: '05:30 PM', status: 'Đã về' }
  ]);
  const [kioskAppliedMember, setKioskAppliedMember] = useState<LoyaltyMember | null>(null);
  const [kioskLoyaltyInput, setKioskLoyaltyInput] = useState('');
  const [kioskLoyaltyError, setKioskLoyaltyError] = useState('');
  const [showKioskLoyaltyKeyboard, setShowKioskLoyaltyKeyboard] = useState(false);
  const [showKioskVoucherKeyboard, setShowKioskVoucherKeyboard] = useState(false);
  const [showKioskPlateKeyboard, setShowKioskPlateKeyboard] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showAssetEditor, setShowAssetEditor] = useState(false);
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null);
  const [promoBannerUrl, setPromoBannerUrl] = useState<string | null>(null);
  const [kioskBackgroundUrl, setKioskBackgroundUrl] = useState<string | null>(null);
  const [dragActiveAsset, setDragActiveAsset] = useState<'logo' | 'banner' | 'background' | null>(null);

  useEffect(() => {
    const storedLogo = localStorage.getItem('wassup-kiosk-logo');
    const storedBanner = localStorage.getItem('wassup-kiosk-banner');
    const storedBackground = localStorage.getItem('wassup-kiosk-background');
    if (storedLogo) setBrandLogoUrl(storedLogo);
    if (storedBanner) setPromoBannerUrl(storedBanner);
    if (storedBackground) setKioskBackgroundUrl(storedBackground);
  }, []);

  useEffect(() => {
    if (brandLogoUrl) localStorage.setItem('wassup-kiosk-logo', brandLogoUrl);
    else localStorage.removeItem('wassup-kiosk-logo');
  }, [brandLogoUrl]);

  useEffect(() => {
    if (promoBannerUrl) localStorage.setItem('wassup-kiosk-banner', promoBannerUrl);
    else localStorage.removeItem('wassup-kiosk-banner');
  }, [promoBannerUrl]);

  useEffect(() => {
    if (kioskBackgroundUrl) localStorage.setItem('wassup-kiosk-background', kioskBackgroundUrl);
    else localStorage.removeItem('wassup-kiosk-background');
  }, [kioskBackgroundUrl]);

  const handleAssetUpload = (asset: 'logo' | 'banner' | 'background', file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (asset === 'logo') setBrandLogoUrl(result);
      if (asset === 'banner') setPromoBannerUrl(result);
      if (asset === 'background') setKioskBackgroundUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleResetAsset = (asset: 'logo' | 'banner' | 'background') => {
    if (asset === 'logo') setBrandLogoUrl(null);
    if (asset === 'banner') setPromoBannerUrl(null);
    if (asset === 'background') setKioskBackgroundUrl(null);
  };

  const handleAssetDrop = (asset: 'logo' | 'banner' | 'background', e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragActiveAsset(null);
    const file = e.dataTransfer.files?.[0];
    if (file) handleAssetUpload(asset, file);
  };

  const renderAssetPreview = (asset: 'logo' | 'banner' | 'background') => {
    const src = asset === 'logo' ? brandLogoUrl : asset === 'banner' ? promoBannerUrl : kioskBackgroundUrl;
    const placeholder = asset === 'logo' ? 'Chưa có logo' : asset === 'banner' ? 'Chưa có banner' : 'Chưa có ảnh nền';
    const panelClass = asset === 'logo' ? 'h-24' : 'h-24';
    const imageClass = asset === 'logo' ? 'max-h-full max-w-full object-contain' : 'h-full w-full object-cover';

    return (
      <div className={`overflow-hidden rounded-xl border border-white/10 bg-black/40 ${panelClass}`}>
        {src ? (
          <div className="flex h-full w-full items-center justify-center bg-white/5 p-2">
            <img src={src} alt={`${asset} preview`} className={imageClass} />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center px-3 text-center text-[11px] text-white/40">{placeholder}</div>
        )}
      </div>
    );
  };

  // Customer Kiosk dynamic states
  const [kioskStep, setKioskStep] = useState<number>(0);
  const [kioskPlate, setKioskPlate] = useState<string>('51G-');
  const [kioskSize, setKioskSize] = useState<'4-5' | '7-9'>('4-5');
  const [kioskService, setKioskService] = useState<string>('W2');
  const [kioskAddons, setKioskAddons] = useState<string[]>([]);
  const [kioskVoucher, setKioskVoucher] = useState<string>('');
  const [kioskDiscount, setKioskDiscount] = useState<number>(0);
  const [kioskPayMethod, setKioskPayMethod] = useState<string>('');
  const [kioskActiveJobId, setKioskActiveJobId] = useState<string | null>(null);
  const [isKioskPayingAtSpot, setIsKioskPayingAtSpot] = useState<boolean>(false);
  const [kioskPaymentSuccess, setKioskPaymentSuccess] = useState<boolean>(false);

  // Cashier POS helper states
  const [posPlateFilter, setPosPlateFilter] = useState<string>('');
  const [posSelectedJobId, setPosSelectedJobId] = useState<string | null>(null);
  const [customDiscount, setCustomDiscount] = useState<number>(0);
  const [posSuccessMsg, setPosSuccessMsg] = useState<string>('');
  const [showPOSPlateKeyboard, setShowPOSPlateKeyboard] = useState(false);
  const [showPOSDiscountKeyboard, setShowPOSDiscountKeyboard] = useState(false);

  // Simple custom toast message state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Auto-simulation loop for wash progress
  useEffect(() => {
    if (!simulationEnabled) return;
    const interval = setInterval(() => {
      setJobs(prevJobs => 
        prevJobs.map(job => {
          if (job.status === 'Processing') {
            const nextProgress = Math.min(job.progress + Math.floor(Math.random() * 5) + 3, 100);
            return {
              ...job,
              progress: nextProgress,
              status: nextProgress === 100 ? 'QC' : 'Processing'
            };
          }
          return job;
        })
      );
      
      // Consume a small amount of inventory chemicals & consumables when washing is active
      setInventory(prev => prev.map(item => {
        if (item.id === 'inv-1' && Math.random() > 0.7) { // Foam
          const q = Math.max(0, item.quantity - 0.4);
          return { ...item, quantity: parseFloat(q.toFixed(1)) };
        }
        if (item.id === 'inv-2' && Math.random() > 0.8) { // Wax
          const q = Math.max(0, item.quantity - 0.1);
          return { ...item, quantity: parseFloat(q.toFixed(1)) };
        }
        if (item.id === 'inv-5' && Math.random() > 0.9) { // Tire Gel
          const q = Math.max(0, item.quantity - 0.1);
          return { ...item, quantity: parseFloat(q.toFixed(1)) };
        }
        return item;
      }));

      setChemicals(prev => ({
        ...prev,
        water: Math.max(0, prev.water - (Math.random() > 0.7 ? 1 : 0))
      }));
    }, simulationSpeed);
    return () => clearInterval(interval);
  }, [simulationEnabled, simulationSpeed]);

  // Sync chemicals state from inventory levels
  useEffect(() => {
    const foamItem = inventory.find(i => i.id === 'inv-1');
    const waxItem = inventory.find(i => i.id === 'inv-2');
    const ceramicItem = inventory.find(i => i.id === 'inv-3');
    const wheelItem = inventory.find(i => i.id === 'inv-5');

    setChemicals(prev => ({
      ...prev,
      foam: foamItem ? Math.min(100, Math.round((foamItem.quantity / 150) * 100)) : prev.foam,
      wax: waxItem ? Math.min(100, Math.round((waxItem.quantity / 60) * 100)) : prev.wax,
      ceramic: ceramicItem ? Math.min(100, Math.round((ceramicItem.quantity / 20) * 100)) : prev.ceramic,
      wheel: wheelItem ? Math.min(100, Math.round((wheelItem.quantity / 55) * 100)) : prev.wheel,
    }));
  }, [inventory]);

  // Update alarms when resources are low
  useEffect(() => {
    setAlarms(prev => ({
      ...prev,
      tankLow: chemicals.water < lowStockAlertThreshold,
    }));
  }, [chemicals.water, lowStockAlertThreshold]);

  // Compute calculated pricing for active Kiosk selection
  const currentServicePrice = servicesList.find(s => s.id === kioskService)?.[kioskSize === '4-5' ? 'price45' : 'price79'] || 0;
  const currentAddonsPrice = kioskAddons.reduce((sum, id) => {
    const item = addonsList.find(a => a.id === id);
    return sum + (item ? (kioskSize === '4-5' ? item.price45 : item.price79) : 0);
  }, 0);
  const kioskSubtotal = currentServicePrice + currentAddonsPrice;
  const kioskTotal = Math.max(0, kioskSubtotal - kioskDiscount);

  // Automatically look up membership inside Kiosk Step 4
  useEffect(() => {
    if (kioskStep === 4) {
      const found = members.find(m => m.plate.toUpperCase() === kioskPlate.trim().toUpperCase());
      if (found) {
        setKioskAppliedMember(found);
        let discount = 0;
        if (found.tier === 'Đồng') discount = 5000;
        else if (found.tier === 'Bạc') discount = 15000;
        else if (found.tier === 'Vàng') discount = 50000;
        else if (found.tier === 'Kim Cương') discount = Math.floor(kioskSubtotal * 0.1);
        setKioskDiscount(discount);
        setKioskLoyaltyError('');
      } else {
        setKioskAppliedMember(null);
        setKioskDiscount(0);
      }
    }
  }, [kioskStep, kioskPlate, members, kioskSubtotal]);

  // Localization Dictionary
  const kioskProgressSteps = [
    { label: 'Trang chủ', shortLabel: 'Home' },
    { label: 'Biển số & kích cỡ', shortLabel: 'Xe' },
    { label: 'Gói dịch vụ', shortLabel: 'Dịch vụ' },
    { label: 'Ưu đãi', shortLabel: 'Voucher' },
    { label: 'Thanh toán', shortLabel: 'Pay' },
    { label: 'Theo dõi', shortLabel: 'Track' },
    { label: 'Hoàn tất', shortLabel: 'Done' },
  ];

  const t = {
    touchToStart: lang === 'vi' ? 'Chạm để Bắt đầu' : 'Touch to Start',
    cleanInMinutes: lang === 'vi' ? 'Xe của bạn sẽ sạch bóng trong vài phút' : 'Your car will be sparkling clean in minutes',
    selectService: lang === 'vi' ? 'Chọn Gói Dịch Vụ' : 'Select Service Package',
    addons: lang === 'vi' ? 'Dịch vụ nâng cao thêm' : 'Premium Add-ons',
    continue: lang === 'vi' ? 'Tiếp tục' : 'Continue',
    back: lang === 'vi' ? 'Quay lại' : 'Back',
    total: lang === 'vi' ? 'Tổng tiền' : 'Total Amount',
    carSize: lang === 'vi' ? 'Phân khúc xe' : 'Car Classification',
    size45: lang === 'vi' ? 'Sedan/Hatchback (4-5 chỗ)' : 'Sedan/Hatchback (4-5 seats)',
    size79: lang === 'vi' ? 'SUV/Crossover/Bán tải (7-9 chỗ +30%)' : 'SUV/Pickup (7-9 seats +30%)',
    enterPlate: lang === 'vi' ? 'Nhập Biển Số Xe' : 'Enter License Plate',
    appliedVoucher: lang === 'vi' ? 'Đã áp dụng mã' : 'Voucher applied',
    payHeader: lang === 'vi' ? 'Thanh toán hoá đơn' : 'Billing & Payment',
    paySub: lang === 'vi' ? 'Vui lòng chọn phương thức thanh toán' : 'Please select your preferred payment method',
    trackWash: lang === 'vi' ? 'Theo dõi tiến trình' : 'Track Washing Progress',
    finishFeedback: lang === 'vi' ? 'Hoàn tất & Đánh giá' : 'Completed & Customer Feedback',
    ratePrompt: lang === 'vi' ? 'Bạn có hài lòng với dịch vụ hôm nay?' : 'Are you satisfied with our services today?',
    getReceipt: lang === 'vi' ? 'In Hóa Đơn VAT' : 'Print VAT Invoice',
    bookNext: lang === 'vi' ? 'Đặt lịch lần sau' : 'Book Next Wash',
    startOver: lang === 'vi' ? 'Về Trang Chủ' : 'Return Home',
    boothEmpty: lang === 'vi' ? 'Trống' : 'Standby / Empty',
  };

  // Kiosk flow controllers
  const applyKioskVoucher = () => {
    if (kioskVoucher.toUpperCase() === 'WASSUP100') {
      setKioskDiscount(100000);
    } else if (kioskVoucher.toUpperCase() === 'VIP30') {
      setKioskDiscount(Math.floor(kioskSubtotal * 0.3));
    } else {
      setKioskDiscount(0);
    }
  };

  const getAssignedBoothForService = (serviceId: string): number => {
    const configured = serviceBoothRules[serviceId];
    if (configured && activeBoothIds.includes(configured)) return configured;
    return activeBoothIds.includes(getDefaultBoothForService(serviceId))
      ? getDefaultBoothForService(serviceId)
      : firstActiveBoothId;
  };

  const handleAddBooth = () => {
    const nextId = Math.max(0, ...boothConfigs.map(booth => booth.id)) + 1;
    setBoothConfigs(prev => [...prev, {
      id: nextId,
      name: `Booth ${nextId}`,
      functionLabel: 'Booth mới mở rộng',
      isActive: true
    }]);
    setBoothOperatorPasscodes(prev => ({ ...prev, [nextId]: `88${String(nextId).padStart(4, '0')}` }));
    setOperatorAuthByBooth(prev => ({ ...prev, [nextId]: false }));
  };

  const handleRemoveBooth = (boothId: number) => {
    if (boothConfigs.length <= 1) return;
    const hasRunningJobs = jobs.some(job => (job.status === 'Processing' || job.status === 'QC') && job.boothId === boothId);
    if (hasRunningJobs) {
      showToast(`Không thể xóa Booth ${boothId}: đang có xe Processing/QC.`);
      return;
    }
    const remainingIds = boothConfigs.filter(booth => booth.id !== boothId && booth.isActive).map(booth => booth.id);
    const fallbackBooth = remainingIds[0] || boothConfigs.find(booth => booth.id !== boothId)?.id || 1;
    setBoothConfigs(prev => prev.filter(booth => booth.id !== boothId));
    setBoothOperatorPasscodes(prev => {
      const next = { ...prev };
      delete next[boothId];
      return next;
    });
    setOperatorAuthByBooth(prev => {
      const next = { ...prev };
      delete next[boothId];
      return next;
    });
    setJobs(prev => prev.map(job => ({ ...job, boothId: job.boothId === boothId ? fallbackBooth : job.boothId })));
  };

  const handleResetServiceBoothRules = () => {
    setServiceBoothRules(buildDefaultServiceBoothRules(activeBoothIds.length ? activeBoothIds : [1]));
  };

  const handleResetConfigDefaults = () => {
    const defaultActiveBooths = DEFAULT_BOOTH_CONFIGS.filter(booth => booth.isActive).map(booth => booth.id);
    setBoothConfigs(DEFAULT_BOOTH_CONFIGS);
    setBoothOperatorPasscodes(DEFAULT_BOOTH_OPERATOR_PASSCODES);
    setServiceBoothRules(buildDefaultServiceBoothRules(defaultActiveBooths));
    setStationPasscodes({ pos: '666666', mgr: '999999' });
    setOperatorAuthByBooth(Object.fromEntries(defaultActiveBooths.map(id => [id, false])));
    showToast('Đã reset cấu hình về mặc định hệ thống.');
  };

  const handleExportBoothConfigJson = () => {
    const payload = {
      schema: {
        name: 'washos.booth-config',
        version: '2.0.0',
        compatibleFrom: 1
      },
      version: 2,
      exportedAt: new Date().toISOString(),
      config: {
        boothConfigs,
        boothOperatorPasscodes,
        stationPasscodes,
        serviceBoothRules
      }
    };
    return JSON.stringify(payload, null, 2);
  };

  const handleImportBoothConfigJson = (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText) as {
        version?: number;
        schema?: { name?: string; version?: string; compatibleFrom?: number };
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

      const source = parsed.config || parsed;

      if (parsed.version && parsed.version > 2) {
        return { ok: false, message: 'File backup thuộc phiên bản mới hơn, vui lòng nâng cấp ứng dụng trước khi import.' };
      }

      if (!Array.isArray(source.boothConfigs) || !source.boothConfigs.length) {
        return { ok: false, message: 'File backup thiếu danh sách booth hợp lệ.' };
      }

      const normalizedBooths = source.boothConfigs
        .map(booth => ({
          id: Number(booth.id),
          name: (booth.name || `Booth ${booth.id}`).trim() || `Booth ${booth.id}`,
          functionLabel: (booth.functionLabel || 'Booth nhập từ backup').trim() || 'Booth nhập từ backup',
          isActive: booth.isActive !== false
        }))
        .filter(booth => Number.isFinite(booth.id) && booth.id > 0);

      if (!normalizedBooths.length) {
        return { ok: false, message: 'Không có booth hợp lệ sau khi đọc file backup.' };
      }

      if (!normalizedBooths.some(booth => booth.isActive)) {
        normalizedBooths[0].isActive = true;
      }

      const validBoothIds = normalizedBooths.map(booth => booth.id);
      const activeImportedBooths = normalizedBooths.filter(booth => booth.isActive).map(booth => booth.id);
      const fallbackBooth = activeImportedBooths[0] || validBoothIds[0];

      const importedPasscodesRaw = source.boothOperatorPasscodes || {};
      const importedPasscodes: Record<number, string> = {};
      validBoothIds.forEach(id => {
        importedPasscodes[id] = String(importedPasscodesRaw[String(id)] || `88${String(id).padStart(4, '0')}`).replace(/\D/g, '').slice(0, 6);
      });

      const importedRulesRaw = source.serviceBoothRules || {};
      const importedRules: Record<string, number> = {};
      servicesList.forEach(service => {
        const selected = Number(importedRulesRaw[service.id]);
        importedRules[service.id] = activeImportedBooths.includes(selected)
          ? selected
          : activeImportedBooths.includes(getDefaultBoothForService(service.id))
            ? getDefaultBoothForService(service.id)
            : fallbackBooth;
      });

      const cleanedStationPasscodes = {
        pos: String(source.stationPasscodes?.pos || stationPasscodes.pos).replace(/\D/g, '').slice(0, 6),
        mgr: String(source.stationPasscodes?.mgr || stationPasscodes.mgr).replace(/\D/g, '').slice(0, 6)
      };

      setBoothConfigs(normalizedBooths);
      setBoothOperatorPasscodes(importedPasscodes);
      setServiceBoothRules(importedRules);
      setStationPasscodes(cleanedStationPasscodes);
      setOperatorAuthByBooth(Object.fromEntries(validBoothIds.map(id => [id, false])));
      setJobs(prev => prev.map(job => ({
        ...job,
        boothId: job.boothId && validBoothIds.includes(job.boothId) ? job.boothId : fallbackBooth
      })));

      if (isOprTab && !validBoothIds.includes(currentOprBooth)) {
        setActiveTab(`opr-${fallbackBooth}`);
      }

      return { ok: true, message: 'Đã import cấu hình thành công.' };
    } catch {
      return { ok: false, message: 'File JSON không hợp lệ.' };
    }
  };

  const handleUpdateBoothConfig = (boothId: number, changes: Partial<{ name: string; functionLabel: string; isActive: boolean }>) => {
    setBoothConfigs(prev => {
      if (typeof changes.isActive === 'boolean' && !changes.isActive) {
        const currentlyActive = prev.filter(booth => booth.isActive).length;
        const target = prev.find(booth => booth.id === boothId);
        if (target?.isActive && currentlyActive <= 1) {
          return prev;
        }
      }

      return prev.map(booth => booth.id === boothId ? { ...booth, ...changes } : booth);
    });
  };

  const handleKioskPaymentSubmit = () => {
    const assignedBooth = getAssignedBoothForService(kioskService);
    const newJob: Job = {
      id: `job-${Date.now()}`,
      plate: kioskPlate.trim().toUpperCase() || '51A-999.99',
      size: kioskSize,
      serviceId: kioskService,
      addOnIds: kioskAddons,
      price: kioskTotal,
      status: 'Waiting',
      boothId: assignedBooth,
      progress: 0,
      checklist: createEmptyChecklist(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      rating: null,
      paymentMethod: kioskPayMethod || 'QR Pay'
    };
    setJobs(prev => [...prev, newJob]);
    setKioskActiveJobId(newJob.id);
    setKioskStep(5); // Go to progress tracker
  };

  // POS operations helpers
  const selectedPOSJob = jobs.find(j => j.id === posSelectedJobId);
  const posSubtotal = selectedPOSJob ? selectedPOSJob.price : 0;
  const posTotal = Math.max(0, posSubtotal - customDiscount);

  const handlePOSCheckout = (method: string) => {
    if (!posSelectedJobId) return;
    setJobs(prev => prev.map(j => {
      if (j.id === posSelectedJobId) {
        return { ...j, status: 'Completed', paymentMethod: method };
      }
      return j;
    }));

    // Automatically award loyalty points based on total spent (e.g. 10k VND = 1 Point)
    if (selectedPOSJob) {
      const plateToAward = selectedPOSJob.plate.toUpperCase();
      const pointsToAward = Math.floor(posTotal / POINT_ACCUMULATION_RATE);
      if (pointsToAward > 0) {
        setMembers(prev => {
          const exists = prev.some(m => m.plate.toUpperCase() === plateToAward);
          if (exists) {
            return prev.map(m => {
              if (m.plate.toUpperCase() === plateToAward) {
                const nextSpent = m.spentTotal + posTotal;
                const nextPoints = m.points + pointsToAward;
                
                // Recalculate tier based on total spending
                let nextTier: 'Đồng' | 'Bạc' | 'Vàng' | 'Kim Cương' = 'Đồng';
                if (nextSpent >= 25000000) nextTier = 'Kim Cương';
                else if (nextSpent >= 10000000) nextTier = 'Vàng';
                else if (nextSpent >= 3000000) nextTier = 'Bạc';

                return {
                  ...m,
                  points: nextPoints,
                  spentTotal: nextSpent,
                  historyCount: m.historyCount + 1,
                  tier: nextTier
                };
              }
              return m;
            });
          }
          return prev;
        });
      }
    }

    setPosSuccessMsg(`Thanh toán hoá đơn ${selectedPOSJob?.plate} thành công qua ${method}!`);
    setTimeout(() => {
      setPosSuccessMsg('');
      setPosSelectedJobId(null);
    }, 3000);
  };

  // Manager KPI values
  const todayRevenue = jobs
    .filter(j => j.status === 'Completed' || j.status === 'Paid')
    .reduce((sum, j) => sum + j.price, 0) + 18500000; // Baseline + today's washes
  const sevenDayRevenueSeries = [
    { label: 'T-6', value: Math.round(todayRevenue * 0.78) },
    { label: 'T-5', value: Math.round(todayRevenue * 0.84) },
    { label: 'T-4', value: Math.round(todayRevenue * 0.81) },
    { label: 'T-3', value: Math.round(todayRevenue * 0.89) },
    { label: 'T-2', value: Math.round(todayRevenue * 0.93) },
    { label: 'T-1', value: Math.round(todayRevenue * 0.97) },
    { label: 'Hôm nay', value: todayRevenue }
  ];
  const sevenDayRevenueMax = Math.max(...sevenDayRevenueSeries.map(item => item.value));

  const monthlyRevenueSeries = Array.from({ length: 12 }, (_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - idx));
    const monthLabel = d.toLocaleDateString('vi-VN', { month: 'short' }).replace('Thg ', 'T');
    const monthFactor = 0.58 + idx * 0.04;
    return {
      label: monthLabel,
      value: Math.round(todayRevenue * monthFactor * 26) // rough 26 operational days
    };
  });
  const monthlyRevenueMax = Math.max(...monthlyRevenueSeries.map(item => item.value));

  const dailyRevenueSeries = Array.from({ length: 14 }, (_, idx) => {
    const dayValue = Math.max(5000000, Math.round(todayRevenue * (0.72 + (idx / 13) * 0.22 + Math.sin(idx / 2.8) * 0.05)));
    return {
      label: `D-${13 - idx}`,
      value: dayValue
    };
  });
  dailyRevenueSeries[dailyRevenueSeries.length - 1] = { label: 'Hôm nay', value: todayRevenue };
  const dailyRevenueMax = Math.max(...dailyRevenueSeries.map(item => item.value));

  const weeklyRevenueSeries = Array.from({ length: 12 }, (_, idx) => {
    const weeklyValue = Math.max(45000000, Math.round(todayRevenue * (5.2 + (idx / 11) * 1.1 + Math.sin(idx / 1.7) * 0.2)));
    return {
      label: `W${idx + 1}`,
      value: weeklyValue
    };
  });
  const weeklyRevenueMax = Math.max(...weeklyRevenueSeries.map(item => item.value));

  const deepRevenueSeries = analysisRange === 'day'
    ? dailyRevenueSeries
    : analysisRange === 'week'
      ? weeklyRevenueSeries
      : monthlyRevenueSeries;
  const deepRevenueMax = analysisRange === 'day'
    ? dailyRevenueMax
    : analysisRange === 'week'
      ? weeklyRevenueMax
      : monthlyRevenueMax;

  const serviceMixJobs = jobs.filter(j => j.status !== 'Waiting');
  const totalServiceMixJobs = serviceMixJobs.length;
  const serviceMixStats = servicesList.map(service => {
    const count = serviceMixJobs.filter(job => job.serviceId === service.id).length;
    const pct = totalServiceMixJobs ? Math.round((count / totalServiceMixJobs) * 100) : 0;
    return {
      id: service.id,
      name: service.name,
      count,
      pct
    };
  });
  const addOnRate = totalServiceMixJobs
    ? Math.round((serviceMixJobs.filter(job => job.addOnIds.length > 0).length / totalServiceMixJobs) * 100)
    : 0;

  const getInventoryHealthPercent = (items: InventoryItem[]) => {
    if (!items.length) return 0;
    const total = items.reduce((sum, item) => {
      const target = Math.max(item.minThreshold, 1) * 2;
      return sum + Math.min(100, Math.round((item.quantity / target) * 100));
    }, 0);
    return Math.round(total / items.length);
  };

  const chemicalItems = inventory.filter(item => item.category === 'Hóa chất');
  const supplyItems = inventory.filter(item => item.category === 'Vật tư');
  const toolItems = inventory.filter(item => item.category === 'Công cụ');
  const lowStockCount = inventory.filter(item => item.quantity < Math.max(item.minThreshold, lowStockAlertThreshold)).length;

  const inventoryPercentDashboard = [
    {
      id: 'chem',
      label: 'Hóa chất',
      percent: getInventoryHealthPercent(chemicalItems),
      count: chemicalItems.length,
      colorClass: 'bg-orange-500'
    },
    {
      id: 'supply',
      label: 'Vật tư',
      percent: getInventoryHealthPercent(supplyItems),
      count: supplyItems.length,
      colorClass: 'bg-yellow-400'
    },
    {
      id: 'tool',
      label: 'Công cụ',
      percent: getInventoryHealthPercent(toolItems),
      count: toolItems.length,
      colorClass: 'bg-blue-400'
    },
    {
      id: 'risk',
      label: 'Tỷ lệ thiếu hụt',
      percent: inventory.length ? Math.round((lowStockCount / inventory.length) * 100) : 0,
      count: lowStockCount,
      colorClass: 'bg-red-500'
    }
  ];

  const clampPercent = (value: number) => Math.max(5, Math.min(99, Math.round(value)));
  const avgChemicalLevel = Math.round((chemicals.foam + chemicals.wax + chemicals.ceramic + chemicals.water) / 4);
  const boothMaintenance = activeBoothIds.map((boothId) => {
    const activeLoad = jobs.filter(job => (job.status === 'Processing' || job.status === 'QC') && job.boothId === boothId).length;
    const machineHealth = clampPercent(94 - activeLoad * 12 - (!hardware.pump ? 18 : 0) - (!hardware.valve ? 10 : 0) - (!hardware.foam ? 8 : 0) - (alarms.pressure ? 6 : 0));
    const chemicalHealth = clampPercent(avgChemicalLevel - activeLoad * 9 - (boothId - 1) * 4 - (alarms.tankLow ? 8 : 0));
    const overall = Math.round(machineHealth * 0.6 + chemicalHealth * 0.4);

    let status = 'Ổn định';
    let statusClass = 'bg-green-500/20 text-green-400';
    if (overall < 50) {
      status = 'Cần bảo trì gấp';
      statusClass = 'bg-red-500/20 text-red-400';
    } else if (overall < 75) {
      status = 'Cần theo dõi';
      statusClass = 'bg-amber-500/20 text-amber-300';
    }

    return {
      boothId,
      machineHealth,
      chemicalHealth,
      overall,
      status,
      statusClass
    };
  });

  const criticalInventoryItems = inventory
    .filter(item => item.quantity < Math.max(item.minThreshold, lowStockAlertThreshold))
    .sort((a, b) => (a.quantity / Math.max(a.minThreshold, 1)) - (b.quantity / Math.max(b.minThreshold, 1)));
  const boothNeedsAttention = boothMaintenance.filter(booth => booth.overall < 75);
  const queueWaitingCount = jobs.filter(job => job.status === 'Waiting').length;
  const queueQcCount = jobs.filter(job => job.status === 'QC').length;
  const busyBoothIds = Array.from(new Set(
    jobs
      .filter(job => (job.status === 'Processing' || job.status === 'QC') && !!job.boothId)
      .map(job => job.boothId as number)
  ));

  const getInventoryChemicalPercent = (keywords: string[], fallback: number) => {
    const match = inventory.find(item =>
      item.category === 'Hóa chất'
      && keywords.some(keyword => item.name.toLowerCase().includes(keyword))
    );
    if (!match) return fallback;
    const base = Math.max(match.minThreshold * 4, 1);
    return clampPercent(Math.round((match.quantity / base) * 100));
  };

  const boothTechnicalChemicals = [
    { label: 'BỂ NƯỚC RO CHÍNH (WATER TANK)', percent: chemicals.water, colorClass: 'bg-blue-400' },
    { label: 'BỌT TUYẾT HOẠT TÍNH BƯỚC 1 (ACTIVE FOAM)', percent: chemicals.foam, colorClass: 'bg-orange-400' },
    { label: 'WAX BẢO VỆ BỀ MẶT (WAX GLOSS)', percent: chemicals.wax, colorClass: 'bg-yellow-400' },
    { label: 'PHỦ CERAMIC BẢO VỆ SƠN', percent: chemicals.ceramic, colorClass: 'bg-cyan-400' },
    { label: 'DUNG DỊCH LÀM SẠCH MÂM/LỐP', percent: getInventoryChemicalPercent(['wheel cleaner', 'alloy cleaner', 'tire gel'], 72), colorClass: 'bg-lime-400' },
    { label: 'DUNG DỊCH KHỬ MÙI & DIỆT KHUẨN CABIN', percent: getInventoryChemicalPercent(['sanitizer', 'antibacterial', 'interior cleaner'], 76), colorClass: 'bg-emerald-400' },
    { label: 'DUNG DỊCH TẨY DẦU MỠ KHOANG MÁY', percent: getInventoryChemicalPercent(['degreaser', 'hood cleaner'], 69), colorClass: 'bg-rose-400' }
  ];

  useEffect(() => {
    if (isOprTab) {
      setSelectedBooth(currentOprBooth);
    }
  }, [isOprTab, currentOprBooth]);

  useEffect(() => {
    if (!activeBoothIds.length) return;

    setServiceBoothRules(prev => {
      const next: Record<string, number> = { ...prev };
      let changed = false;

      for (const service of SERVICES) {
        const selected = next[service.id];
        if (!selected || !activeBoothIds.includes(selected)) {
          next[service.id] = activeBoothIds.includes(getDefaultBoothForService(service.id))
            ? getDefaultBoothForService(service.id)
            : firstActiveBoothId;
          changed = true;
        }
      }

      return changed ? next : prev;
    });

    setOperatorAuthByBooth(prev => {
      const next: Record<number, boolean> = {};
      activeBoothIds.forEach(id => {
        next[id] = !!prev[id];
      });
      return next;
    });

    setBoothOperatorPasscodes(prev => {
      const next: Record<number, string> = {};
      activeBoothIds.forEach(id => {
        next[id] = prev[id] || `88${String(id).padStart(4, '0')}`;
      });
      return next;
    });

    if (isOprTab && !activeBoothIds.includes(currentOprBooth)) {
      setActiveTab(`opr-${firstActiveBoothId}`);
    }
  }, [activeBoothIds, firstActiveBoothId, isOprTab, currentOprBooth]);

  useEffect(() => {
    const container = mainRef.current;
    if (!container) return;

    const updateScrollState = () => {
      const distanceToBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
      setIsNearBottom(distanceToBottom < 120);
    };

    updateScrollState();
    container.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);
    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [activeTab, mgrSubTab, posSubTab, oprSubTab, analyticsPage, analysisRange]);

  const handleQuickScroll = () => {
    const container = mainRef.current;
    if (!container) return;
    container.scrollTo({ top: isNearBottom ? 0 : container.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div id="washos-root" className="w-full min-h-screen bg-[#050505] text-[#e0e0e0] font-sans flex flex-col lg:flex-row overflow-x-hidden select-none">
      
      {/* SIDE SYSTEM LAUNCHER & WORKSPACE NAVIGATION */}
      {activeTab !== 'kiosk' && (
        <nav className="w-full lg:w-[90px] bg-[#0a0a0a] border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col items-stretch lg:items-center py-3 lg:py-6 px-3 lg:px-0 gap-3 lg:gap-0 shrink-0">
          <div className="flex flex-col lg:flex-col items-stretch lg:items-center gap-2 sm:gap-4 lg:gap-8 flex-1 lg:flex-initial w-full">
            {/* Logo */}
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-[#A2C62C] to-[#b3d936] rounded-2xl flex flex-col items-center justify-center font-bold text-black text-xs shadow-[0_0_20px_rgba(162,198,44,0.35)] cursor-pointer relative overflow-hidden group" onClick={() => setKioskStep(0)}>
              {/* Image Logo Layer */}
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#050505]">
                <img 
                  src="/assets/images/logo.png" 
                  alt="WASSUP OS"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to text if image not found
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                  }}
                />
              </div>
              {/* Fallback Text Logo Layer */}
              <span className="text-[8px] lg:text-[9px] tracking-widest opacity-85 z-0">WASSUP</span>
              <span className="text-sm lg:text-base tracking-tighter z-0">OS</span>
            </div>

            <p className="hidden lg:block text-[9px] uppercase text-white/30 tracking-wider font-bold">Workspace</p>

            <div className="flex flex-row lg:flex-col gap-2 lg:gap-5 w-full lg:w-full px-0 lg:px-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
              {/* Tab 1: Kiosk */}
              <button 
                id="nav-kiosk"
                onClick={() => setActiveTab('kiosk')}
                className={`flex flex-col items-center justify-center py-2 px-3 lg:py-3 lg:px-0 rounded-xl transition-all gap-1.5 min-w-[60px] w-[60px] h-[56px] lg:w-full lg:h-auto lg:min-w-0 ${activeTab === 'kiosk' ? 'bg-[#A2C62C]/10 border border-[#A2C62C]/40 text-[#A2C62C]' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
              >
                <Car className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="text-[8px] lg:text-[9px] font-bold uppercase tracking-tight">Kiosk</span>
              </button>

              {/* Dynamic Operator Booth Workspaces */}
              {boothConfigs.filter(booth => booth.isActive).map(booth => {
                const boothTab = `opr-${booth.id}`;
                const queueCount = jobs.filter(j => j.status === 'Waiting' || (j.status === 'Processing' && j.boothId === booth.id)).length;
                return (
                  <button
                    key={booth.id}
                    id={`nav-opr-${booth.id}`}
                    onClick={() => setActiveTab(boothTab)}
                    className={`flex flex-col items-center justify-center py-2 px-3 lg:py-3 lg:px-0 rounded-xl transition-all gap-1.5 relative min-w-[60px] w-[60px] h-[56px] lg:w-full lg:h-auto lg:min-w-0 ${activeTab === boothTab ? 'bg-[#A2C62C]/10 border border-[#A2C62C]/40 text-[#A2C62C]' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
                  >
                    {queueCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-red-500 text-white rounded-full text-[9px] lg:text-[10px] flex items-center justify-center font-bold animate-pulse">
                        {queueCount}
                      </span>
                    )}
                    <Wrench className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="text-[8px] lg:text-[9px] font-bold uppercase tracking-tight">O{booth.id}</span>
                  </button>
                );
              })}

              {/* Tab 3: POS Cashier */}
              <button 
                id="nav-pos"
                onClick={() => setActiveTab('pos')}
                className={`flex flex-col items-center justify-center py-2 px-3 lg:py-3 lg:px-0 rounded-xl transition-all gap-1.5 relative min-w-[60px] w-[60px] h-[56px] lg:w-full lg:h-auto lg:min-w-0 ${activeTab === 'pos' ? 'bg-[#A2C62C]/10 border border-[#A2C62C]/40 text-[#A2C62C]' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
              >
                {jobs.filter(j => j.status === 'QC').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-green-500 text-black rounded-full text-[9px] lg:text-[10px] flex items-center justify-center font-bold">
                    {jobs.filter(j => j.status === 'QC').length}
                  </span>
                )}
                <DollarSign className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="text-[8px] lg:text-[9px] font-bold uppercase tracking-tight">POS</span>
              </button>

              {/* Tab 4: Manager */}
              <button 
                id="nav-mgr"
                onClick={() => setActiveTab('mgr')}
                className={`flex flex-col items-center justify-center py-2 px-3 lg:py-3 lg:px-0 rounded-xl transition-all gap-1.5 min-w-[60px] w-[60px] h-[56px] lg:w-full lg:h-auto lg:min-w-0 ${activeTab === 'mgr' ? 'bg-[#A2C62C]/10 border border-[#A2C62C]/40 text-[#A2C62C]' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
              >
                <Activity className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="text-[8px] lg:text-[9px] font-bold uppercase tracking-tight">MGR</span>
              </button>
            </div>
          </div>

          {/* Global Alarms Indicator and Refill/Simulation Widget */}
          <div className="flex flex-row lg:flex-col items-center justify-end lg:justify-center gap-2 lg:gap-4 w-full lg:w-full pr-1 lg:pr-0">
            {alarms.emergency && (
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-red-600 rounded-full flex items-center justify-center animate-ping">
                <ShieldAlert className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
            )}
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#00ff00] animate-pulse"></div>
            <span className="text-[8px] font-mono tracking-tighter text-white/30">ONLINE</span>
          </div>
        </nav>
      )}

      {/* CORE WORKSPACE SCREEN */}
      <main ref={mainRef} className={`flex-1 flex flex-col min-h-0 overflow-y-auto ${activeTab === 'kiosk' ? 'p-0 bg-transparent' : ''}`}>
        
        {/* TOP STATUS RIBBON */}
        {activeTab !== 'kiosk' && (
          <header className="bg-[#0b0b0b] border-b border-white/5 px-4 md:px-8 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-[#A2C62C]/20 text-[#A2C62C] text-[10px] font-mono tracking-widest font-bold uppercase">
                {activeTab.toUpperCase()} STATION
              </span>
              <div className="h-4 w-[1px] bg-white/10 hidden sm:block"></div>
              <p className="text-xs text-white/50 tracking-wider hidden sm:block">
                {activeTab === 'kiosk' && "Vận hành sảnh • Giao diện Khách hàng"}
                {isOprTab && `Khu vực kỹ thuật • Booth ${currentOprBooth} vận hành độc lập`}
                {activeTab === 'pos' && "Quầy thu ngân & Báo cáo doanh số"}
                {activeTab === 'mgr' && "Trung tâm điều hành • Thống kê hiệu suất"}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 md:gap-6 justify-between w-full sm:w-auto">
            {/* Quick Interactive Simulator Center */}
            <div className="bg-white/5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-white/5 flex items-center justify-between sm:justify-start gap-2 md:gap-3 w-full sm:w-auto">
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-mono hidden xs:inline-block">Simulate:</span>
              <button 
                onClick={() => {
                  const plates = ['51F-111.11', '59A-222.22', '30F-555.55', '72B-444.44', '43A-666.66'];
                  const randPlate = plates[Math.floor(Math.random() * plates.length)];
                  const randSvc = SERVICES[Math.floor(Math.random() * SERVICES.length)].id;
                  const assignedBooth = getAssignedBoothForService(randSvc);
                  const newJ: Job = {
                    id: `job-${Date.now()}`,
                    plate: randPlate,
                    size: Math.random() > 0.5 ? '4-5' : '7-9',
                    serviceId: randSvc,
                    addOnIds: [ADDONS[0].id],
                    price: 249000,
                    status: 'Waiting',
                    boothId: assignedBooth,
                    progress: 0,
                    checklist: createEmptyChecklist(),
                    timestamp: 'Vừa xong',
                    rating: null,
                    paymentMethod: null
                  };
                  setJobs(prev => [...prev, newJ]);
                }}
                className="bg-[#A2C62C]/15 hover:bg-[#A2C62C]/30 text-[#A2C62C] border border-[#A2C62C]/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3 h-3" /> Khách Mới
              </button>

              <button 
                onClick={() => setChemicals({ foam: 95, wax: 85, ceramic: 100, water: 98, wheel: 92 })}
                className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
              >
                <RefreshCw className="w-3 h-3" /> Nạp
              </button>
            </div>

            <div className="text-right hidden md:block">
              <span className="text-[10px] uppercase text-white/30 block tracking-wider">Hệ thống WashOS</span>
              <span className="text-xs font-mono font-bold tracking-widest text-[#F27D26]">v5.0.26_ENTERPRISE</span>
            </div>
          </div>
        </header>
      )}

        {/* WORKSPACE VIEWS */}
        <div className={activeTab === 'kiosk' ? "flex-1 w-full min-h-screen bg-[#030303] bg-cyber-grid p-0 flex flex-col justify-center items-center relative overflow-hidden transition-all duration-500" : "flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden"}>
          
          {/* Floating animated ambient background glows for vibrant futuristic look */}
          {activeTab === 'kiosk' && (
            <>
              <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-[#A2C62C]/10 to-transparent blur-[120px] pointer-events-none animate-float-slow"></div>
              <div className="absolute bottom-[-15%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tr from-[#F27D26]/8 to-transparent blur-[150px] pointer-events-none animate-float-slower"></div>
              <div className="absolute top-[30%] left-[50%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-b from-blue-500/5 to-transparent blur-[130px] pointer-events-none animate-float-slow" style={{ animationDelay: '-6s' }}></div>
            </>
          )}

          {/* ======================================================== */}
          {/* 1. CUSTOMER KIOSK WORKSPACE */}
          {/* ======================================================== */}
          {activeTab === 'kiosk' && (
            <div className="w-full min-h-screen flex flex-col justify-between p-5 sm:p-8 md:p-12 lg:p-16 relative overflow-hidden bg-black/60 backdrop-blur-md shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 z-0">
                {kioskBackgroundUrl && (
                  <motion.img
                    key={kioskBackgroundUrl}
                    src={kioskBackgroundUrl}
                    alt="Kiosk background"
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 0.4, scale: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                )}
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
              </div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#A2C62C]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 mb-6 md:mb-8 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 md:px-5 md:py-4 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.25)]">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#A2C62C] animate-pulse"></div>
                    <h2 className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-[#A2C62C]">WASSUP KIOSK SMART PORTAL</h2>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowAssetEditor((prev) => !prev)}
                      className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white/80 transition-all active:scale-95"
                    >
                      <Camera className="w-4 h-4 text-[#A2C62C]" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Media</span>
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowAdminMenu(!showAdminMenu)}
                        className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#A2C62C]/10 hover:bg-[#A2C62C]/20 border border-[#A2C62C]/20 text-[#A2C62C] transition-all active:scale-95 shadow-[0_0_20px_rgba(162,198,44,0.12)]"
                        title="Hệ thống nghiệp vụ (Staff Only)"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Staff</span>
                      </button>
                      {showAdminMenu && (
                        <>
                          <button
                            type="button"
                            aria-label="Đóng menu nghiệp vụ"
                            onClick={() => setShowAdminMenu(false)}
                            className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm"
                          />
                          <div className="absolute right-0 mt-2 w-56 bg-[#050505]/98 border border-white/25 rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.65)] p-1.5 flex flex-col gap-1 z-[120] animate-scaleIn backdrop-blur-xl">
                            <p className="text-[9px] uppercase tracking-wider text-[#A2C62C] font-extrabold px-2.5 py-1.5 border-b border-white/5">
                              BÀN NGHIỆP VỤ (STAFF)
                            </p>
                            {boothConfigs.filter(booth => booth.isActive).map(booth => (
                              <button
                                key={booth.id}
                                type="button"
                                onClick={() => { setActiveTab(`opr-${booth.id}`); setShowAdminMenu(false); }}
                                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-white hover:bg-white/10 text-left transition-all"
                              >
                                <Wrench className="w-4 h-4 text-[#A2C62C]" /> Trạm Kỹ thuật {booth.name} (OPR)
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => { setActiveTab('pos'); setShowAdminMenu(false); }}
                              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-white/80 hover:text-white hover:bg-white/5 text-left transition-all"
                            >
                              <DollarSign className="w-4 h-4 text-[#A2C62C]" /> Quầy Thu ngân (POS)
                            </button>
                            <button
                              type="button"
                              onClick={() => { setActiveTab('mgr'); setShowAdminMenu(false); }}
                              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-white/80 hover:text-white hover:bg-white/5 text-left transition-all"
                            >
                              <Activity className="w-4 h-4 text-[#A2C62C]" /> Quản lý hệ thống (MGR)
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                      <button type="button" onClick={() => setLang('vi')} className={`px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold transition-all ${lang === 'vi' ? 'bg-[#A2C62C] text-black font-bold' : 'text-white/60 hover:text-white'}`}>TIẾNG VIỆT</button>
                      <button type="button" onClick={() => setLang('en')} className={`px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold transition-all ${lang === 'en' ? 'bg-[#A2C62C] text-black' : 'text-white/60 hover:text-white'}`}>ENGLISH</button>
                    </div>
                  </div>
                </div>
              </div>

              {showAssetEditor && (
                <div className="relative z-10 mb-6 rounded-2xl border border-white/10 bg-black/70 p-4 md:p-5 shadow-[0_0_30px_rgba(0,0,0,0.3)] backdrop-blur-md">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.25em] text-[#A2C62C] font-bold">Tùy chỉnh thương hiệu</p>
                      <p className="text-xs text-white/60">Cập nhật logo, banner khuyến mãi và ảnh nền bằng file PNG hoặc JPG. Ảnh tự động căn vừa khung.</p>
                    </div>
                    <button type="button" onClick={() => setShowAssetEditor(false)} className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60 hover:text-white transition-all">Đóng</button>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-3">
                    <label
                      className={`rounded-xl border p-3 transition-all ${dragActiveAsset === 'logo' ? 'border-[#A2C62C]/60 bg-[#A2C62C]/10' : 'border-white/10 bg-white/5'}`}
                      onDragOver={(e) => { e.preventDefault(); setDragActiveAsset('logo'); }}
                      onDragLeave={() => setDragActiveAsset(null)}
                      onDrop={(e) => handleAssetDrop('logo', e)}
                    >
                      {renderAssetPreview('logo')}
                      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#A2C62C]">Logo</p>
                      <p className="mt-1 text-[11px] text-white/50">Thay ảnh logo hiển thị ở thanh điều hướng.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg,image/jpg" className="block flex-1 min-w-0 text-[11px] text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-[#A2C62C] file:px-3 file:py-1.5 file:text-black file:font-semibold" onChange={(e) => handleAssetUpload('logo', e.target.files?.[0] ?? null)} />
                        <button type="button" onClick={() => handleResetAsset('logo')} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 hover:bg-white/10">Reset</button>
                      </div>
                    </label>
                    <label
                      className={`rounded-xl border p-3 transition-all ${dragActiveAsset === 'banner' ? 'border-[#A2C62C]/60 bg-[#A2C62C]/10' : 'border-white/10 bg-white/5'}`}
                      onDragOver={(e) => { e.preventDefault(); setDragActiveAsset('banner'); }}
                      onDragLeave={() => setDragActiveAsset(null)}
                      onDrop={(e) => handleAssetDrop('banner', e)}
                    >
                      {renderAssetPreview('banner')}
                      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#A2C62C]">Banner</p>
                      <p className="mt-1 text-[11px] text-white/50">Đổi hình banner khuyến mãi trên màn hình chào.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg,image/jpg" className="block flex-1 min-w-0 text-[11px] text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-[#A2C62C] file:px-3 file:py-1.5 file:text-black file:font-semibold" onChange={(e) => handleAssetUpload('banner', e.target.files?.[0] ?? null)} />
                        <button type="button" onClick={() => handleResetAsset('banner')} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 hover:bg-white/10">Reset</button>
                      </div>
                    </label>
                    <label
                      className={`rounded-xl border p-3 transition-all ${dragActiveAsset === 'background' ? 'border-[#A2C62C]/60 bg-[#A2C62C]/10' : 'border-white/10 bg-white/5'}`}
                      onDragOver={(e) => { e.preventDefault(); setDragActiveAsset('background'); }}
                      onDragLeave={() => setDragActiveAsset(null)}
                      onDrop={(e) => handleAssetDrop('background', e)}
                    >
                      {renderAssetPreview('background')}
                      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#A2C62C]">Ảnh nền</p>
                      <p className="mt-1 text-[11px] text-white/50">Đặt hình nền cho màn hình kiosk.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg,image/jpg" className="block flex-1 min-w-0 text-[11px] text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-[#A2C62C] file:px-3 file:py-1.5 file:text-black file:font-semibold" onChange={(e) => handleAssetUpload('background', e.target.files?.[0] ?? null)} />
                        <button type="button" onClick={() => handleResetAsset('background')} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 hover:bg-white/10">Reset</button>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div className="relative z-10 mb-6 md:mb-8 mx-auto flex w-full max-w-4xl flex-col gap-3 px-0 md:px-4">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-white/45">
                  <span>Tiến trình đặt dịch vụ</span>
                  <span>{kioskProgressSteps[kioskStep]?.label}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#A2C62C] to-[#b3d936] transition-all duration-500"
                    style={{ width: `${((kioskStep + 1) / kioskProgressSteps.length) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-white/35">
                  {kioskProgressSteps.map((step, index) => (
                    <span key={step.label} className={index <= kioskStep ? 'text-[#A2C62C]' : ''}>
                      {step.shortLabel}
                    </span>
                  ))}
                </div>
              </div>

              {/* Step 0: Welcome Slide (Apple / Tesla style with spacious widescreen display) */}
              {kioskStep === 0 && (
                <div className="relative z-10 my-auto w-full max-w-7xl mx-auto py-2 md:py-6">
                  
                  {/* Optional Promo Banner */}
                  <div className="w-full max-w-3xl mb-8 mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10 hidden md:block group cursor-pointer relative">
                    <img 
                      src={promoBannerUrl || '/img/promo-banner.jpg'}
                      alt="Khuyến mãi đặc biệt" 
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-center">
                    
                    {/* Left Column: Bold Call to Action & Welcomes */}
                    <div className="md:col-span-7 text-center md:text-left flex flex-col items-center md:items-start space-y-4 md:space-y-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#A2C62C]/10 border border-[#A2C62C]/20 text-[#A2C62C] text-[10px] md:text-xs font-bold tracking-widest uppercase">
                        <Sparkles className="w-3.5 h-3.5" />
                        PREMIUM CAR SPA EXPERIENCE
                      </div>
                      
                      <div className="space-y-2 text-center md:text-left">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-none">
                          WASSUP <span className="text-[#A2C62C]">WASH</span>
                        </h1>
                        <p className="text-sm sm:text-base md:text-lg text-white/50 max-w-md">
                          {t.cleanInMinutes}
                        </p>
                      </div>

                      {/* Main Big Start Button */}
                      <div className="pt-2 w-full max-w-sm md:max-w-none">
                        <button 
                          type="button"
                          onClick={() => setKioskStep(1)}
                          className="group w-full md:w-auto min-h-[58px] bg-gradient-to-r from-[#A2C62C] to-[#b3d936] text-black text-base md:text-lg font-bold px-8 md:px-10 py-4 md:py-5 rounded-2xl shadow-[0_0_35px_rgba(162,198,44,0.35)] hover:shadow-[0_0_45px_rgba(162,198,44,0.5)] hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer"
                        >
                          {t.touchToStart}
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                        </button>
                      </div>

                      {/* Highlights row for mobile/small screen, hidden on medium screens to avoid clutter */}
                      <div className="grid grid-cols-3 gap-2.5 w-full pt-4 md:hidden">
                        <div className="bg-white/5 border border-white/5 p-2.5 rounded-xl text-center">
                          <p className="text-[#A2C62C] font-mono text-sm font-bold">10-15m</p>
                          <p className="text-[8px] text-white/40 uppercase mt-0.5">Rửa siêu nhanh</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-2.5 rounded-xl text-center">
                          <p className="text-[#A2C62C] font-mono text-sm font-bold">100%</p>
                          <p className="text-[8px] text-white/40 uppercase mt-0.5">Nước RO</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-2.5 rounded-xl text-center">
                          <p className="text-[#A2C62C] font-mono text-sm font-bold">USA</p>
                          <p className="text-[8px] text-white/40 uppercase mt-0.5">Hóa chất Mỹ</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Live Station Diagnostics & Promotion Board (Desktop / Tablet only) */}
                    <div className="hidden md:flex md:col-span-5 flex-col space-y-5">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm space-y-4 shadow-xl">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Hệ Thống Trạm Tự Động</span>
                          </div>
                          <span className="text-[10px] bg-green-500/20 text-green-400 font-mono px-2 py-0.5 rounded font-bold uppercase">SẴN SÀNG</span>
                        </div>

                        <div className="space-y-3.5">
                          <div className="flex items-start justify-between gap-4 text-xs">
                            <span className="text-white/50">Hàng đợi hiện tại:</span>
                            <span className="font-mono font-bold text-white text-right">0 xe chờ (Rửa ngay)</span>
                          </div>
                          <div className="flex items-start justify-between gap-4 text-xs">
                            <span className="text-white/50">Thời gian trung bình:</span>
                            <span className="font-mono font-bold text-white text-right">10 - 15 phút / lượt</span>
                          </div>
                          <div className="flex items-start justify-between gap-4 text-xs">
                            <span className="text-white/50">Nguồn nước rửa:</span>
                            <span className="font-mono font-bold text-[#A2C62C] text-right">100% RO Khử Khoáng</span>
                          </div>
                          <div className="flex items-start justify-between gap-4 text-xs">
                            <span className="text-white/50">Dung dịch tiêu chuẩn:</span>
                            <span className="font-mono font-bold text-[#A2C62C] text-right">Hóa chất Chemical Guys USA</span>
                          </div>
                        </div>
                      </div>

                      {/* Hot Promotion Slider Card */}
                      <div className="bg-gradient-to-r from-orange-500/10 to-[#F27D26]/10 border border-[#F27D26]/20 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 transform translate-x-6 -translate-y-2 rotate-45 bg-[#F27D26] text-black text-[8px] font-black py-1 px-6 uppercase tracking-wider">
                          HOT PROMO
                        </div>
                        <p className="text-xs font-black tracking-wider text-[#F27D26] uppercase">ƯU ĐÃI THÀNH VIÊN MỚI 🎁</p>
                        <p className="text-xs text-white/70 leading-relaxed">
                          Nhập ngay mã giảm giá <span className="font-mono bg-white/10 px-2 py-0.5 rounded font-bold text-white">WASSUP100</span> tại trang thanh toán để được giảm ngay <span className="font-bold text-[#A2C62C]">100.000đ</span> khi đăng ký thành viên mới!
                        </p>
                        <div className="flex justify-between items-center text-[10px] text-white/40 pt-1">
                          <span>Áp dụng cho mọi phân khúc xe</span>
                          <span>Hạn dùng: 31/12/2026</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Step 1: Input License Plate and Choose Size */}
              {kioskStep === 1 && (

                <div className="py-4 relative z-10">
                  <h3 className="text-xl font-semibold mb-6 text-white text-center">{t.enterPlate}</h3>
                  
                  <div className="flex flex-col items-center gap-6 max-w-md mx-auto mb-8">
                    {/* Size Selector */}
                    <div className="w-full">
                      <label className="text-xs text-white/40 uppercase tracking-widest block mb-2">{t.carSize}</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setKioskSize('4-5')}
                          className={`p-4 rounded-xl border text-left transition-all ${kioskSize === '4-5' ? 'bg-[#A2C62C]/10 border-[#A2C62C] text-[#A2C62C]' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}
                        >
                          <p className="font-bold text-sm">4-5 CHỖ</p>
                          <p className="text-[10px] opacity-65">Sedan, Hatchback, CUV cỡ nhỏ</p>
                        </button>
                        <button 
                          onClick={() => setKioskSize('7-9')}
                          className={`p-4 rounded-xl border text-left transition-all ${kioskSize === '7-9' ? 'bg-[#A2C62C]/10 border-[#A2C62C] text-[#A2C62C]' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}
                        >
                          <p className="font-bold text-sm">7-9 CHỖ / BÁN TẢI</p>
                          <p className="text-[10px] opacity-65">SUV lớn, MPV, Pickup (+30%)</p>
                        </button>
                      </div>
                    </div>

                    {/* Plate Input */}
                    <div className="w-full">
                      <label className="text-xs text-white/40 uppercase tracking-widest block mb-2">Biển số kiểm soát (License Plate)</label>
                      <input 
                        type="text" 
                        value={kioskPlate}
                        onFocus={() => setShowKioskPlateKeyboard(true)}
                        onChange={(e) => setKioskPlate(e.target.value)}
                        placeholder="Ví dụ: 51A-888.88"
                        className="w-full bg-black/60 border border-white/20 rounded-xl px-5 py-4 text-center text-3xl font-mono font-bold tracking-widest text-[#A2C62C] focus:border-[#A2C62C] focus:outline-none focus:ring-1 focus:ring-[#A2C62C] uppercase"
                      />
                    </div>

                    {/* Integrated On-Screen Keyboard */}
                    {showKioskPlateKeyboard && (
                      <div className="w-full">
                        <VirtualKeyboard 
                          value={kioskPlate} 
                          onChange={(val) => setKioskPlate(val.toUpperCase())} 
                          layoutType="plate" 
                          onClose={() => setShowKioskPlateKeyboard(false)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Keyboard Suggestion Box */}
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-8 text-center">
                    <p className="text-xs text-white/40 mb-3">Tìm thấy xe đã đăng ký lịch hoặc thành viên? Nhấp nhanh:</p>
                    <div className="flex justify-center gap-2 flex-wrap">
                      {['51A-888.88', '60B-123.45', '29C-999.99', '51G-425.96'].map(p => (
                        <button 
                          key={p} 
                          onClick={() => setKioskPlate(p)}
                          className="bg-white/10 hover:bg-white/20 text-xs font-mono px-3 py-1.5 rounded border border-white/10 transition-all"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <button onClick={() => setKioskStep(0)} className="px-6 py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-all text-xs font-bold uppercase">{t.back}</button>
                    <button onClick={() => setKioskStep(2)} className="px-8 py-3 bg-[#A2C62C] text-black rounded-xl hover:brightness-110 active:scale-95 transition-all text-xs font-bold uppercase flex items-center gap-2 font-bold">
                      {t.continue} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Choose Service */}
              {kioskStep === 2 && (
                <div className="py-2 relative z-10">
                  <h3 className="text-lg md:text-xl font-semibold mb-1 text-white text-center">{t.selectService}</h3>
                  <p className="text-[11px] md:text-xs text-white/40 text-center mb-4">Mức giá tương ứng cho xe phân khúc <span className="text-[#A2C62C] font-bold">{kioskSize === '4-5' ? '4-5 Chỗ' : '7-9 Chỗ'}</span></p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 max-h-[420px] md:max-h-none overflow-y-auto pr-1">
                    {servicesList.map(s => {
                      const finalPrice = kioskSize === '4-5' ? s.price45 : s.price79;
                      return (
                        <div 
                          key={s.id}
                          onClick={() => setKioskService(s.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left ${kioskService === s.id ? 'bg-[#A2C62C]/10 border-[#A2C62C] shadow-[0_0_12px_rgba(162,198,44,0.15)] scale-[1.01]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-0.5 gap-1">
                              <span className="font-extrabold text-xs tracking-tight text-white">{s.name}</span>
                              {s.popular && (
                                <span className="bg-[#A2C62C] text-black text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase shrink-0">Bán chạy</span>
                              )}
                            </div>
                            <p className="text-[10px] text-white/40 leading-tight mb-2 line-clamp-2" title={s.desc}>{s.desc}</p>
                          </div>
                          <div className="flex justify-between items-end border-t border-white/5 pt-1.5 mt-1">
                            <span className="text-[9px] text-[#A2C62C] font-bold">Giá gói</span>
                            <span className="font-mono text-sm font-bold text-[#A2C62C]">{finalPrice.toLocaleString()}đ</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-3.5 border-t border-white/10 gap-2">
                    <button onClick={() => setKioskStep(1)} className="px-5 py-2.5 border border-white/10 rounded-xl hover:bg-white/5 transition-all text-xs font-bold uppercase">{t.back}</button>
                    <div className="text-right">
                      <span className="text-[10px] text-white/40 block">Tạm tính:</span>
                      <span className="text-base font-mono font-bold text-white">{(kioskSize === '4-5' ? servicesList.find(s => s.id === kioskService)?.[ 'price45' ] : servicesList.find(s => s.id === kioskService)?.[ 'price79' ])?.toLocaleString()}đ</span>
                    </div>
                    <button onClick={() => setKioskStep(3)} className="px-5 py-2.5 bg-[#A2C62C] text-black rounded-xl hover:brightness-110 active:scale-95 transition-all text-xs font-bold uppercase flex items-center gap-1.5 font-bold">
                      Chọn Thêm Dịch Vụ <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Choose Addons */}
              {kioskStep === 3 && (
                <div className="py-2 relative z-10">
                  <h3 className="text-lg md:text-xl font-semibold mb-1 text-white text-center">{t.addons}</h3>
                  <p className="text-[11px] md:text-xs text-white/40 text-center mb-4">Thao tác chọn mua thêm phụ trợ dọn sâu và chăm dưỡng máy móc</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-5 max-h-[350px] overflow-y-auto pr-1">
                    {addonsList.map(a => {
                      const finalPrice = kioskSize === '4-5' ? a.price45 : a.price79;
                      const isSelected = kioskAddons.includes(a.id);
                      return (
                        <div 
                          key={a.id}
                          onClick={() => {
                            if (isSelected) {
                              setKioskAddons(prev => prev.filter(id => id !== a.id));
                            } else {
                              setKioskAddons(prev => [...prev, a.id]);
                            }
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-left ${isSelected ? 'bg-[#A2C62C]/10 border-[#A2C62C] scale-[1.01]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded flex items-center justify-center border ${isSelected ? 'bg-[#A2C62C] border-[#A2C62C] text-black' : 'border-white/25'}`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div>
                              <span className="text-[8px] uppercase font-bold tracking-widest text-[#A2C62C] block">{a.cat}</span>
                              <span className="text-xs font-semibold text-white leading-tight block">{a.name}</span>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-bold text-white/90 shrink-0 ml-2">{finalPrice.toLocaleString()}đ</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-3.5 border-t border-white/10 gap-2">
                    <button onClick={() => setKioskStep(2)} className="px-5 py-2.5 border border-white/10 rounded-xl hover:bg-white/5 transition-all text-xs font-bold uppercase">{t.back}</button>
                    <div className="text-right">
                      <span className="text-[10px] text-white/40 block">Tích lũy (Gói + Addon):</span>
                      <span className="text-base font-mono font-bold text-[#A2C62C]">{kioskSubtotal.toLocaleString()}đ</span>
                    </div>
                    <button onClick={() => setKioskStep(4)} className="px-5 py-2.5 bg-[#A2C62C] text-black rounded-xl hover:brightness-110 active:scale-95 transition-all text-xs font-bold uppercase flex items-center gap-1.5 font-bold">
                      Đến Thanh Toán <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Checkout & Payment Select */}
              {kioskStep === 4 && (
                <div className="py-2 relative z-10">
                  <h3 className="text-xl font-semibold mb-6 text-white text-center">{t.payHeader}</h3>

                  <div className="grid grid-cols-12 gap-6 mb-6">
                    {/* Invoice detail */}
                    <div className="col-span-6 bg-white/5 p-5 rounded-2xl border border-white/10">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-4">Chi tiết Hoá đơn xe {kioskPlate}</h4>
                      <div className="space-y-3 text-xs border-b border-white/5 pb-4 mb-4">
                        <div className="flex justify-between">
                          <span className="text-white/60">{servicesList.find(s => s.id === kioskService)?.name} ({kioskSize === '4-5' ? '4-5 Chỗ' : '7-9 Chỗ'})</span>
                          <span className="font-mono">{currentServicePrice.toLocaleString()}đ</span>
                        </div>
                        {kioskAddons.map(id => {
                          const a = addonsList.find(item => item.id === id);
                          if (!a) return null;
                          return (
                            <div key={id} className="flex justify-between text-white/50">
                              <span>+ {a.name}</span>
                              <span className="font-mono">{(kioskSize === '4-5' ? a.price45 : a.price79).toLocaleString()}đ</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Loyalty Member Section */}
                      {kioskAppliedMember ? (
                        <div className="bg-[#A2C62C]/10 border border-[#A2C62C]/30 p-3 rounded-xl mb-4 text-xs flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white flex items-center gap-1">
                              <Award className="w-3.5 h-3.5 text-yellow-400 font-bold" />
                              Chào {kioskAppliedMember.name}!
                            </p>
                            <p className="text-[10px] text-white/50">Hạng {kioskAppliedMember.tier} • {kioskAppliedMember.points.toLocaleString()} điểm</p>
                          </div>
                          <span className="text-[10px] text-[#A2C62C] font-bold bg-[#A2C62C]/10 px-2 py-0.5 rounded font-mono">
                            Đã giảm {kioskDiscount.toLocaleString()}đ (Perk)
                          </span>
                        </div>
                      ) : (
                        <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 mb-4 space-y-2">
                          <p className="text-[10px] uppercase text-white/40 font-bold">Tra cứu Hội viên (Loyalty Lookup)</p>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Số điện thoại hoặc biển số xe..." 
                              value={kioskLoyaltyInput}
                              onFocus={() => { setShowKioskLoyaltyKeyboard(true); setShowKioskVoucherKeyboard(false); }}
                              onChange={(e) => setKioskLoyaltyInput(e.target.value)}
                              className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white flex-1 font-mono focus:border-[#A2C62C] focus:outline-none"
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                const found = members.find(m => m.phone === kioskLoyaltyInput || m.plate.toUpperCase() === kioskLoyaltyInput.toUpperCase());
                                if (found) {
                                  setKioskAppliedMember(found);
                                  let disc = 0;
                                  if (found.tier === 'Đồng') disc = 5000;
                                  else if (found.tier === 'Bạc') disc = 15000;
                                  else if (found.tier === 'Vàng') disc = 50000;
                                  else if (found.tier === 'Kim Cương') disc = Math.floor(kioskSubtotal * 0.1);
                                  setKioskDiscount(disc);
                                  setKioskLoyaltyError('');
                                  setShowKioskLoyaltyKeyboard(false);
                                } else {
                                  setKioskLoyaltyError('Không tìm thấy hội viên khớp.');
                                  setTimeout(() => setKioskLoyaltyError(''), 3000);
                                }
                              }}
                              className="bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-1 rounded text-[11px] font-bold"
                            >
                              Kiểm tra
                            </button>
                          </div>
                          {kioskLoyaltyError && (
                            <p className="text-[9px] text-red-400 font-bold">{kioskLoyaltyError}</p>
                          )}

                          {showKioskLoyaltyKeyboard && (
                            <div className="mt-2">
                              <VirtualKeyboard
                                value={kioskLoyaltyInput}
                                onChange={setKioskLoyaltyInput}
                                layoutType="phone"
                                onClose={() => setShowKioskLoyaltyKeyboard(false)}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Voucher box */}
                      <div className="mb-4">
                        <label className="text-[10px] uppercase text-white/40 block mb-1">Mã giảm giá (Nhập: WASSUP100 hoặc VIP30)</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="MÃ GIẢM GIÁ"
                            value={kioskVoucher}
                            onFocus={() => { setShowKioskVoucherKeyboard(true); setShowKioskLoyaltyKeyboard(false); }}
                            onChange={(e) => setKioskVoucher(e.target.value)}
                            className="bg-black/40 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A2C62C] uppercase flex-1 font-mono"
                          />
                          <button onClick={() => { applyKioskVoucher(); setShowKioskVoucherKeyboard(false); }} className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all">Áp dụng</button>
                        </div>
                        {kioskDiscount > 0 && (
                          <span className="text-[10px] text-green-400 mt-1 block">✓ Đã áp dụng giảm {kioskDiscount.toLocaleString()}đ</span>
                        )}

                        {showKioskVoucherKeyboard && (
                          <div className="mt-2">
                            <VirtualKeyboard
                              value={kioskVoucher}
                              onChange={(val) => setKioskVoucher(val.toUpperCase())}
                              layoutType="text"
                              onClose={() => setShowKioskVoucherKeyboard(false)}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-end pt-2">
                        <span className="text-xs font-bold uppercase text-white/80">{t.total}:</span>
                        <span className="font-mono text-2xl font-extrabold text-[#A2C62C]">{kioskTotal.toLocaleString()}đ</span>
                      </div>
                    </div>

                    {/* Payment methods */}
                    <div className="col-span-6 flex flex-col justify-between">
                      <div>
                        <span className="text-xs text-white/40 uppercase tracking-widest block mb-3">{t.paySub}</span>
                        <div className="grid grid-cols-2 gap-2">
                          {['QR Pay', 'Apple Pay/NFC', 'Visa/Master', 'Cash (Tiền mặt)', 'Thanh toán sau', 'Membership', 'Voucher'].map(m => (
                            <button 
                              key={m}
                              onClick={() => setKioskPayMethod(m)}
                              className={`p-3 rounded-xl border text-center transition-all text-xs font-bold ${kioskPayMethod === m ? 'bg-[#A2C62C] text-black border-[#A2C62C] shadow-md shadow-[#A2C62C]/20' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Payment simulation button */}
                      <button 
                        onClick={handleKioskPaymentSubmit}
                        disabled={!kioskPayMethod}
                        className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${kioskPayMethod ? (kioskPayMethod === 'Thanh toán sau' ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:brightness-110 active:scale-95 shadow-lg shadow-orange-500/10 cursor-pointer' : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:brightness-110 active:scale-95 shadow-lg shadow-green-500/10 cursor-pointer') : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
                      >
                        {kioskPayMethod ? (kioskPayMethod === 'Thanh toán sau' ? 'Xác nhận & Đưa vào Trạm Rửa' : `Giả lập Thanh toán & Đưa vào Trạm`) : 'Chọn phương thức để tiếp tục'}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-start items-center pt-4 border-t border-white/10">
                    <button onClick={() => setKioskStep(3)} className="px-6 py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-all text-xs font-bold uppercase">{t.back}</button>
                  </div>
                </div>
              )}

              {/* Step 5: Live Washing Progress */}
              {kioskStep === 5 && (
                <div className="py-4 relative z-10 text-center">
                  <h3 className="text-xl font-semibold mb-2 text-white">{t.trackWash}</h3>
                  <p className="text-xs text-white/40 mb-6">Mã hoá đơn: #{kioskActiveJobId?.substring(4, 9)} | Xe {kioskPlate}</p>

                  {(() => {
                    const activeJob = jobs.find(j => j.plate === kioskPlate.toUpperCase()) || jobs[0];
                    if (!activeJob) {
                      return <p className="text-white/40 text-xs">Đang đồng bộ dữ liệu với hệ thống...</p>;
                    }

                    const isCompletedOrQC = activeJob.status === 'QC' || activeJob.status === 'Completed' || activeJob.progress === 100;

                    if (isCompletedOrQC) {
                      return (
                        <div className="max-w-md mx-auto bg-black/60 p-8 rounded-3xl border border-[#A2C62C]/40 shadow-[0_0_40px_rgba(162,198,44,0.15)] animate-fadeIn">
                          <div className="w-16 h-16 bg-[#A2C62C]/20 text-[#A2C62C] rounded-full flex items-center justify-center mx-auto mb-5 animate-bounce">
                            <Check className="w-8 h-8 stroke-[3]" />
                          </div>
                          
                          <h4 className="text-2xl font-black text-white mb-2">TIẾN TRÌNH HOÀN TẤT!</h4>
                          <p className="text-sm text-[#A2C62C] font-semibold mb-6 uppercase">Mời Quý khách {activeJob.plate} tới nhận & kiểm tra xe</p>
                          
                          <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-xs text-left space-y-2 mb-6 text-white/80">
                            <p>📍 Vị trí nhận xe: <strong className="text-white text-sm">Booth 0{activeJob.boothId || 1}</strong></p>
                            <p>🔧 Dịch vụ đã làm: <strong className="text-white">{servicesList.find(s => s.id === activeJob.serviceId)?.name}</strong></p>
                            <p>💳 Hình thức thanh toán: <strong className="text-white">{activeJob.paymentMethod === 'Thanh toán sau' ? 'Thanh toán sau khi rửa xong' : 'Đã trả trước'}</strong></p>
                          </div>

                          {isKioskPayingAtSpot ? (
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-3">
                              {kioskPaymentSuccess ? (
                                <>
                                  <div className="w-10 h-10 bg-green-500 text-black rounded-full flex items-center justify-center font-bold">✓</div>
                                  <p className="text-xs text-green-400 font-bold">Thanh toán Thành công! Đang chuyển tiếp...</p>
                                </>
                              ) : (
                                <>
                                  <div className="w-8 h-8 border-2 border-[#A2C62C] border-t-transparent rounded-full animate-spin"></div>
                                  <p className="text-xs text-white/60 animate-pulse">Vui lòng chạm thẻ / quét mã QR trên màn hình...</p>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <button 
                                onClick={() => {
                                  setIsKioskPayingAtSpot(true);
                                  setTimeout(() => {
                                    setKioskPaymentSuccess(true);
                                    setJobs(prev => prev.map(j => j.id === activeJob.id ? { ...j, status: 'Completed', paymentMethod: 'QR Pay (Tại chỗ)' } : j));
                                    setTimeout(() => {
                                      setIsKioskPayingAtSpot(false);
                                      setKioskPaymentSuccess(false);
                                      setKioskStep(6);
                                    }, 1500);
                                  }, 2000);
                                }}
                                className="w-full bg-[#A2C62C] text-black font-black py-4 rounded-xl text-xs uppercase hover:brightness-110 active:scale-95 transition-all tracking-wider shadow-lg shadow-[#A2C62C]/20 flex items-center justify-center gap-2"
                              >
                                <DollarSign className="w-4 h-4 text-black animate-pulse" /> THANH TOÁN TẠI CHỖ (CARD/QR)
                              </button>
                              
                              <button 
                                onClick={() => {
                                  setJobs(prev => prev.map(j => j.id === activeJob.id ? { ...j, status: 'QC', paymentMethod: 'Thanh toán tại quầy' } : j));
                                  alert("Yêu cầu thanh toán đã được đồng bộ lên Quầy thu ngân POS. Quý khách vui lòng di chuyển đến quầy để nhận biên lai!");
                                  setKioskStep(6);
                                }}
                                className="w-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold py-3.5 rounded-xl text-xs uppercase transition-all tracking-wider flex items-center justify-center gap-2"
                              >
                                <FileText className="w-4 h-4 text-white/60" /> THANH TOÁN TẠI QUẦY (POS CASHIER)
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div className="max-w-md mx-auto bg-black/60 p-6 rounded-2xl border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs font-bold uppercase text-[#A2C62C] tracking-wider">Booth {activeJob.boothId || "Chờ xếp ca"}</span>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/10">{activeJob.plate}</span>
                        </div>

                        {/* Circular Progress & Countdown Timer */}
                        {(() => {
                          const baseDuration = activeJob.serviceId === 'W0' ? 10 : activeJob.serviceId === 'W1' ? 15 : activeJob.serviceId === 'W2' ? 25 : activeJob.serviceId === 'W3' ? 35 : activeJob.serviceId === 'W4' ? 50 : activeJob.serviceId === 'W5' ? 75 : 20;
                          const addonDuration = (activeJob.addOnIds?.length || 0) * 5;
                          const totalMinutes = baseDuration + addonDuration;
                          const totalSeconds = totalMinutes * 60;
                          const remainingSeconds = Math.max(0, Math.ceil(totalSeconds * (1 - activeJob.progress / 100)));

                          const radius = 54;
                          const strokeWidth = 8;
                          const circumference = 2 * Math.PI * radius;
                          const strokeDashoffset = circumference - (activeJob.progress / 100) * circumference;

                          const mins = Math.floor(remainingSeconds / 60);
                          const secs = remainingSeconds % 60;
                          const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

                          return (
                            <div className="flex flex-col items-center justify-center my-8">
                              <div className="relative w-48 h-48 flex items-center justify-center">
                                {/* Outer Glow Radar */}
                                <motion.div
                                  className="absolute inset-0 rounded-full border-2 border-[#A2C62C]/30"
                                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <motion.div
                                  className="absolute inset-2 rounded-full border border-[#A2C62C]/50"
                                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                                  transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
                                />

                                {/* SVG Circle Progress */}
                                <svg className="absolute w-40 h-40 transform -rotate-90">
                                  <circle cx="80" cy="80" r="72" className="stroke-white/10 fill-none" strokeWidth="6" />
                                  <motion.circle
                                    cx="80"
                                    cy="80"
                                    r="72"
                                    className="fill-none stroke-[#A2C62C]"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    initial={{ strokeDasharray: "452", strokeDashoffset: "452" }}
                                    animate={{ strokeDashoffset: 452 - (activeJob.progress / 100) * 452 }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    style={{ filter: 'drop-shadow(0 0 8px rgba(162,198,44,0.5))' }}
                                  />
                                </svg>

                                {/* Countdown center display */}
                                <div className="absolute flex flex-col items-center justify-center z-10">
                                  <motion.span 
                                    className="font-mono text-3xl font-black text-white tracking-wider"
                                    key={timeString}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                  >
                                    {timeString}
                                  </motion.span>
                                  <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest mt-1">Thời gian chờ</span>
                                </div>
                                
                                {/* Water droplets effect */}
                                <motion.div 
                                  className="absolute -bottom-4 w-2 h-2 rounded-full bg-cyan-400 blur-[1px]"
                                  animate={{ y: [0, 20, 40], opacity: [0, 1, 0] }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                />
                                <motion.div 
                                  className="absolute -bottom-2 -left-4 w-1.5 h-1.5 rounded-full bg-blue-300 blur-[1px]"
                                  animate={{ y: [0, 30, 50], opacity: [0, 0.8, 0] }}
                                  transition={{ duration: 2, delay: 0.7, repeat: Infinity, ease: "linear" }}
                                />
                              </div>

                              <motion.div 
                                className="mt-6 flex items-center gap-2 bg-[#A2C62C]/10 px-4 py-2 rounded-full border border-[#A2C62C]/30"
                                animate={{ boxShadow: ["0 0 0px rgba(162,198,44,0)", "0 0 15px rgba(162,198,44,0.3)", "0 0 0px rgba(162,198,44,0)"] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <span className="w-2.5 h-2.5 rounded-full bg-[#A2C62C] animate-pulse"></span>
                                <span className="text-sm font-mono font-black text-[#A2C62C] tracking-widest">
                                  TIẾN ĐỘ: {activeJob.progress}%
                                </span>
                              </motion.div>
                            </div>
                          );
                        })()}

                        <div className="grid grid-cols-2 gap-4 mb-6 text-left text-xs">
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="text-white/40 block mb-0.5">Trạng thái hiện tại:</span>
                            <span className="font-bold text-xs text-white">
                              {activeJob.status === 'QC' ? 'Đang hoàn tất QC' : activeJob.status === 'Waiting' ? 'Đang chờ vào Booth' : 'Đang xử lý rửa áp lực'}
                            </span>
                          </div>
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="text-white/40 block mb-0.5">Gói dịch vụ đã chọn:</span>
                            <span className="font-bold text-xs text-[#A2C62C]">
                              {servicesList.find(s => s.id === activeJob.serviceId)?.name}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button 
                            onClick={() => {
                              // Force update progress to 100% to simulate quick completion
                              setJobs(prev => prev.map(j => j.id === activeJob.id ? { ...j, progress: 100, status: 'QC' } : j));
                            }}
                            className="flex-1 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold py-2.5 rounded-xl text-xs uppercase font-bold"
                          >
                            Tua nhanh tiến trình
                          </button>
                          <button 
                            onClick={() => setKioskStep(6)}
                            className="flex-1 bg-[#A2C62C] text-black font-bold py-2.5 rounded-xl text-xs uppercase hover:brightness-110 active:scale-95 transition-all font-bold"
                          >
                            Tiếp tục Đánh giá
                          </button>
                        </div>
                      </div>
                    );

                  })()}
                </div>
              )}

              {/* Step 6: Customer Rating & Feedback */}
              {kioskStep === 6 && (
                <div className="py-4 text-center max-w-md mx-auto relative z-10">
                  <div className="w-16 h-16 bg-[#A2C62C]/20 text-[#A2C62C] rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(162,198,44,0.2)]">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-1 text-white">Rửa xe Hoàn tất!</h3>
                  <p className="text-xs text-white/40 mb-6">Cảm ơn quý khách đã tin chọn WASSUP WashOS</p>

                  <div className="bg-white/5 p-10 rounded-3xl border border-white/10 mb-8 max-w-lg mx-auto shadow-2xl">
                    <p className="text-sm text-white/95 font-extrabold mb-6 tracking-wide">{t.ratePrompt}</p>
                    <div className="flex justify-center gap-4 mb-8">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} className="text-yellow-400 hover:scale-125 transition-transform p-1">
                          <Star className="w-10 h-10 fill-current drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]" />
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                      <button className="py-3 px-4 border border-white/15 rounded-xl hover:bg-white/5 text-white/80 font-bold uppercase tracking-wider transition-all">In hoá đơn ngay</button>
                      <button className="py-3 px-4 bg-white/10 hover:bg-white/15 rounded-xl text-[#A2C62C] border border-[#A2C62C]/30 hover:bg-[#A2C62C]/10 text-white font-bold uppercase tracking-wider transition-all">Đặt lịch tuần sau</button>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setKioskStep(0);
                      setKioskPlate('51G-');
                      setKioskAddons([]);
                      setKioskDiscount(0);
                    }}
                    className="w-full py-4 bg-[#A2C62C] text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 font-bold"
                  >
                    {t.startOver}
                  </button>
                </div>
              )}

              {/* Floating Badge for Promos & VIP Benefits */}
              {kioskStep === 0 && (
                <button
                  type="button"
                  onClick={() => setShowPromoModal(true)}
                  className="absolute bottom-5 left-5 md:bottom-8 md:left-8 z-50 bg-gradient-to-r from-[#7ca01f] to-[#A2C62C] hover:from-[#8cb328] hover:to-[#b6dc3f] text-black font-extrabold px-3.5 py-2 rounded-2xl text-[10px] md:text-xs uppercase flex items-center gap-2 shadow-[0_0_15px_rgba(162,198,44,0.35)] animate-bounce border border-[#A2C62C]/35 cursor-pointer"
                >
                  <Gift className="w-4 h-4 text-white shrink-0 animate-pulse" />
                  <span>ƯU ĐÃI THÀNH VIÊN & NÂNG HẠNG 🎁</span>
                </button>
              )}

              {/* VIP Promotion & Upgrade Modal Popup */}
              {showPromoModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
                  <div className="bg-gradient-to-b from-[#141414] to-black border border-white/10 rounded-3xl p-6 max-w-lg w-full relative shadow-2xl space-y-4 animate-scaleIn text-left">
                    <button 
                      type="button"
                      onClick={() => setShowPromoModal(false)}
                      className="absolute top-4 right-4 text-white/40 hover:text-white text-lg font-bold p-1 bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-all"
                    >
                      ×
                    </button>
                    
                    <div className="text-center space-y-1">
                      <Sparkles className="w-8 h-8 text-[#A2C62C] mx-auto animate-pulse" />
                      <h3 className="text-base font-black text-white uppercase tracking-wider">ƯU ĐÃI THÀNH VIÊN WASSUP</h3>
                      <p className="text-[11px] text-white/50">Tích điểm đổi quà - Thăng hạng nhận ngàn quyền lợi</p>
                    </div>

                    <div className="space-y-3 pt-1">
                      {/* Member benefits card */}
                      <div className="bg-[#A2C62C]/10 border border-[#A2C62C]/20 p-3.5 rounded-xl space-y-1.5">
                        <p className="text-xs font-extrabold text-[#A2C62C] uppercase flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5" /> Đặc Quyền Nâng Hạng Thành Viên
                        </p>
                        <div className="space-y-1 text-[11px] text-white/85">
                          <p>🥉 <strong className="text-amber-500">Hạng Đồng (Đầu tiên):</strong> Giảm ngay 5.000đ cho mỗi lần rửa.</p>
                          <p>🥈 <strong className="text-slate-300">Hạng Bạc (100+ PTS):</strong> Giảm ngay 15.000đ + Miễn phí đo áp suất lốp.</p>
                          <p>🥇 <strong className="text-yellow-400">Hạng Vàng (300+ PTS):</strong> Giảm ngay 50.000đ + Khử mùi cabin ion.</p>
                          <p>💎 <strong className="text-cyan-400">Hạng Kim Cương (600+ PTS):</strong> Giảm 10% gói chính + Cà phê pha máy miễn phí.</p>
                        </div>
                      </div>

                      {/* Code discount card */}
                      <div className="bg-[#A2C62C]/10 border border-[#A2C62C]/20 p-3.5 rounded-xl space-y-1.5">
                        <p className="text-xs font-extrabold text-[#A2C62C] uppercase flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 animate-pulse" /> Voucher Khuyến Mãi Hot Tuần Này
                        </p>
                        <div className="space-y-1 text-[11px] text-white/80 font-medium">
                          <p>🔥 Nhập mã <span className="font-mono font-black text-[#A2C62C] bg-[#A2C62C]/15 px-1 py-0.5 rounded">WASSUP100</span> giảm trực tiếp <span className="font-bold">100.000đ</span>.</p>
                          <p>🔥 Nhập mã <span className="font-mono font-black text-[#A2C62C] bg-[#A2C62C]/15 px-1 py-0.5 rounded">VIP30</span> giảm trực tiếp <span className="font-bold">30%</span> tổng bill.</p>
                          <p>🎁 Đổi ngay 100 Điểm (PTS) lấy Sáp thơm treo xe cao cấp.</p>
                        </div>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setShowPromoModal(false)}
                      className="w-full py-3 bg-[#A2C62C] hover:brightness-110 text-black font-extrabold uppercase rounded-xl text-xs tracking-wider transition-all"
                    >
                      Tuyệt vời! Tiếp tục chọn dịch vụ
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ======================================================== */}
          {/* 2. OPERATOR PANEL WORKSPACE */}
          {/* ======================================================== */}
          {isOprTab && !isCurrentOprAuthenticated && (
            <div className="py-12">
              <LoginGate 
                role="opr" 
                passcode={boothOperatorPasscodes[currentOprBooth] || '888888'}
                onLoginSuccess={() => setOperatorAuthByBooth(prev => ({ ...prev, [currentOprBooth]: true }))} 
                onCancel={() => setActiveTab('kiosk')}
              />
            </div>
          )}

          {isOprTab && isCurrentOprAuthenticated && (
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* Top OPR Sub Navigation + Back/Lock Button */}
              <div className="flex flex-col gap-3 bg-black/30 p-2 rounded-2xl border border-white/10 overflow-hidden">
                <div className="flex justify-between items-center">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <button 
                    type="button"
                    onClick={() => setOprSubTab('monitor')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 shrink-0 min-h-[42px] ${oprSubTab === 'monitor' ? 'bg-[#A2C62C] text-black font-bold shadow' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    <Sliders className="w-3.5 h-3.5" /> Bàn điều khiển Booth
                  </button>
                  <button 
                    type="button"
                    onClick={() => setOprSubTab('handover')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 shrink-0 min-h-[42px] ${oprSubTab === 'handover' ? 'bg-[#A2C62C] text-black font-bold shadow' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Giao ca (Handover)
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    setOperatorAuthByBooth(prev => ({ ...prev, [currentOprBooth]: false }));
                    setActiveTab('kiosk');
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 rounded-xl text-xs font-bold transition-all"
                >
                  ← Đăng xuất / Quay lại Kiosk
                </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Đang chờ</p>
                    <p className="mt-1 text-sm font-bold text-yellow-400">{jobs.filter(j => j.status === 'Waiting' || (j.status === 'Processing' && j.boothId === currentOprBooth)).length} xe</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Đang rửa</p>
                    <p className="mt-1 text-sm font-bold text-[#A2C62C]">{jobs.filter(j => j.status === 'Processing' && j.boothId === currentOprBooth).length} xe</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Chờ bàn giao</p>
                    <p className="mt-1 text-sm font-bold text-cyan-400">{jobs.filter(j => j.status === 'QC' && j.boothId === currentOprBooth).length} xe</p>
                  </div>
                </div>
              </div>

              {oprSubTab === 'monitor' && (
                <div className="grid grid-cols-12 gap-6 animate-fadeIn">
              
              {/* Emergency Alert Bar */}
              {alarms.emergency && (
                <div className="col-span-12 bg-red-600/20 border border-red-500/50 p-4 rounded-xl flex items-center justify-between text-red-400 animate-pulse">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    <div>
                      <p className="font-bold text-sm">⚠ CẢNH BÁO KHẨN CẤP: DỪNG TOÀN TRẠM ĐÃ ĐƯỢC KÍCH HOẠT!</p>
                      <p className="text-xs opacity-80">Liên hệ phòng quản lý kỹ thuật viên để giải phóng áp lực bơm.</p>
                    </div>
                  </div>
                  <button onClick={() => setAlarms(prev => ({ ...prev, emergency: false }))} className="bg-red-500 text-white font-bold px-4 py-2 rounded-lg text-xs hover:bg-red-600">RESET CẢNH BÁO</button>
                </div>
              )}

              {/* LEFT COLUMN: ACTIVE BOOTHS MONITOR */}
              <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">MÀN HÌNH BÀN ĐIỀU KHIỂN BOOTH CHÍNH</h3>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-[10px] text-green-400 font-mono">Bơm áp lực đang chạy</span>
                    </div>
                  </div>

                  {/* Booths list */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {activeBoothIds.map(num => {
                      const occupiedJob = jobs.find(j => j.boothId === num && j.status !== 'Completed');
                      const isSelected = selectedBooth === num;
                      const isCurrent = num === currentOprBooth;
                      return (
                        <div 
                          key={num}
                          onClick={() => {
                            if (num === currentOprBooth) setSelectedBooth(num);
                          }}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-[#A2C62C]/10 border-[#A2C62C] shadow-md shadow-[#A2C62C]/10' : occupiedJob ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-[#00ff00]/5 border-[#00ff00]/20 hover:bg-[#00ff00]/10'} ${!isCurrent ? 'opacity-60' : ''}`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-white/40">BOOTH 0{num}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${occupiedJob ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                              {!isCurrent ? 'KHÁC BOOTH' : occupiedJob ? 'BẬN' : 'SẴN SÀNG'}
                            </span>
                          </div>

                          {occupiedJob ? (
                            <div>
                              <p className="font-mono text-base font-bold text-white mb-1">{occupiedJob.plate}</p>
                              
                              {/* Enhanced Progress Bar */}
                              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden border border-white/5 mb-1.5 relative shadow-inner">
                                <div 
                                  className="bg-gradient-to-r from-[#A2C62C] to-emerald-500 h-full transition-all duration-500 relative" 
                                  style={{ width: `${occupiedJob.progress}%` }}
                                >
                                  {/* Glossy overlay effect */}
                                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                                </div>
                              </div>
                              
                              <div className="flex justify-between text-[9px] font-mono text-white/50">
                                <span className="text-[#A2C62C] font-bold">
                                   {occupiedJob.progress <= 10 ? 'Kiểm tra bề mặt' :
                                    occupiedJob.progress <= 20 ? 'Kiểm tra khe kẽ' :
                                    occupiedJob.progress <= 30 ? 'Kiểm tra hốc bánh, mâm lốp' :
                                    occupiedJob.progress <= 40 ? 'Kiểm tra nội thất' :
                                    occupiedJob.progress <= 50 ? 'Kiểm tra thảm sàn' :
                                    occupiedJob.progress <= 60 ? 'Kiểm tra kính' :
                                    occupiedJob.progress <= 70 ? 'Kiểm tra dưỡng lốp, nhựa' :
                                    occupiedJob.progress <= 80 ? 'Kiểm tra khoang máy' :
                                    occupiedJob.progress <= 90 ? 'Kiểm tra lọc gió' :
                                    'Kiểm tra phanh trước sau'}
                                </span>
                                <span>{occupiedJob.progress}%</span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold text-xs text-white/60 mb-2 italic">Máy sấy sẵn sàng</p>
                              <p className="text-[10px] text-white/30 font-mono">Đợi xe mới...</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Controls and Checklist for Selected Booth */}
                  {(() => {
                    const activeJob = jobs.find(j => j.boothId === selectedBooth && j.status === 'Processing');
                    const allChecked = activeJob ? Object.values(activeJob.checklist).every(Boolean) : false;

                    return (
                      <div className="bg-black/60 p-5 rounded-2xl border border-white/5 shadow-xl">
                        {/* Selected Booth Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 border-b border-white/5 pb-4 gap-4">
                          <div>
                            <span className="text-xs font-extrabold text-[#A2C62C] uppercase tracking-wider block mb-1">BẢNG KỸ THUẬT BOOTH 0{selectedBooth}</span>
                            <h4 className="text-sm font-bold text-white/90">Phân hệ xử lý nhanh & Tiếp nhận tự động</h4>
                            <p className="text-[10px] text-white/50 mt-1">Đăng nhập Booth {currentOprBooth} chỉ thao tác xe thuộc đúng booth này.</p>
                          </div>
                          
                          {activeJob ? (
                            <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 w-full md:w-auto justify-between">
                              <div className="flex flex-col items-start pr-2">
                                <span className="text-xs font-mono font-bold text-white">{activeJob.plate}</span>
                                <span className="text-[10px] text-[#A2C62C] font-mono mt-0.5 font-bold">Tiến trình: {activeJob.progress}%</span>
                              </div>
                              <div className="w-24 bg-white/10 h-2 rounded-full overflow-hidden border border-white/5">
                                <div className="bg-[#A2C62C] h-full transition-all duration-500" style={{ width: `${activeJob.progress}%` }}></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs bg-[#00ff00]/10 text-green-400 font-bold border border-green-500/20 px-3 py-1.5 rounded-lg">BOOTH ĐANG TRỐNG / SẴN SÀNG</span>
                          )}
                        </div>

                        {/* Top split area: Left (Checklist) | Right (Waiting cars queue) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Left Column: Quality Control (QC) Checklist */}
                          <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                            {activeJob ? (
                              <div className="space-y-4">
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-3 block">CHECKLIST KIỂM SOÁT CHẤT LƯỢNG (QC) - {activeJob.plate}</p>
                                  <div className="space-y-2">
                                    {([
                                      'surface',
                                      'crevices',
                                      'wheelWellRim',
                                      'interior',
                                      'floorMat',
                                      'glass',
                                      'tirePlasticDressing',
                                      'engineBay',
                                      'airFilter',
                                      'frontRearBrakes'
                                    ] as const).map(task => (
                                      <button
                                        type="button"
                                        key={task}
                                        onClick={() => {
                                          setJobs(prev => prev.map(j => {
                                            if (j.id === activeJob.id) {
                                              const nextChecklist = {
                                                ...j.checklist,
                                                [task]: !j.checklist[task]
                                              };
                                              // Calculate new progress dynamically based on check list count
                                              const totalTasks = 10;
                                              const checkedCount = Object.values(nextChecklist).filter(Boolean).length;
                                              const newProgress = Math.max(10, Math.floor((checkedCount / totalTasks) * 100));

                                              return {
                                                ...j,
                                                checklist: nextChecklist,
                                                progress: newProgress
                                              };
                                            }
                                            return j;
                                          }));
                                        }}
                                        className="w-full flex items-center justify-between p-2.5 bg-black/40 hover:bg-black/60 rounded-xl border border-white/5 text-left transition-all text-xs text-white/80 hover:text-white"
                                      >
                                        <span className="font-semibold capitalize">
                                          {task === 'surface' ? 'Kiểm tra bề mặt' :
                                           task === 'crevices' ? 'Kiểm tra khe kẽ' :
                                           task === 'wheelWellRim' ? 'Kiểm tra hốc bánh, mâm lốp' :
                                           task === 'interior' ? 'Kiểm tra nội thất' :
                                           task === 'floorMat' ? 'Kiểm tra thảm sàn' :
                                           task === 'glass' ? 'Kiểm tra kính' :
                                           task === 'tirePlasticDressing' ? 'Kiểm tra dưỡng lốp, nhựa' :
                                           task === 'engineBay' ? 'Kiểm tra khoang máy' :
                                           task === 'airFilter' ? 'Kiểm tra lọc gió' :
                                           'Kiểm tra phanh trước sau'}
                                        </span>
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${activeJob.checklist[task] ? 'bg-[#A2C62C] border-[#A2C62C] text-black shadow-sm' : 'border-white/20 bg-white/5'}`}>
                                          {activeJob.checklist[task] && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <button 
                                  type="button"
                                  onClick={() => {
                                    setJobs(prev => prev.map(j => j.id === activeJob.id ? { ...j, status: 'QC', progress: 100 } : j));
                                    showToast(`✓ Đã hoàn thành tiến trình rửa xe ${activeJob.plate}! Xe đã được đưa ra khu bàn giao chờ khách nhận.`);
                                  }}
                                  disabled={!allChecked}
                                  className={`w-full font-black px-4 py-3 rounded-xl text-xs uppercase flex items-center justify-center gap-2 transition-all ${allChecked ? 'bg-[#A2C62C] text-black hover:brightness-110 shadow-lg shadow-[#A2C62C]/20 cursor-pointer' : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'}`}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>{allChecked ? 'HOÀN THÀNH CA (ĐÃ XONG)' : 'QC CHƯA HOÀN TẤT'}</span>
                                </button>
                              </div>
                            ) : (
                              <div className="py-12 text-center text-white/30 flex flex-col items-center justify-center h-full min-h-[220px]">
                                <Car className="w-12 h-12 mb-3 opacity-30 animate-pulse text-[#A2C62C]" />
                                <p className="text-xs font-semibold">Buồng máy 0{selectedBooth} trống</p>
                                <p className="text-[10px] mt-1 text-white/40 max-w-[200px]">Hãy tiếp nhận một xe từ danh sách hàng chờ bên phải để bắt đầu rửa xe.</p>
                              </div>
                            )}
                          </div>

                          {/* Right Column: Waiting queue for acceptance */}
                          <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-3 block">DANH SÁCH XE ĐANG CHỜ TIẾP NHẬN</p>
                              
                              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                                {jobs.filter(j => j.status === 'Waiting' && (j.boothId === selectedBooth || (!j.boothId && selectedBooth === firstActiveBoothId))).map(job => (
                                  <div key={job.id} className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between hover:border-white/10 transition-all">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-mono font-bold text-xs text-white">{job.plate}</p>
                                        <span className="text-[9px] bg-[#A2C62C]/20 text-[#A2C62C] px-1.5 py-0.5 rounded-md font-mono font-bold">{job.size === '4-5' ? '4-5C' : '7-9C'}</span>
                                      </div>
                                      <p className="text-[10px] text-white/60 mt-0.5 truncate max-w-[130px]">{servicesList.find(s => s.id === job.serviceId)?.name}</p>
                                      <p className="text-[9px] text-[#A2C62C] font-mono mt-0.5">Phân bổ Booth 0{job.boothId || selectedBooth}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'Processing', boothId: selectedBooth, progress: 10 } : j));
                                        showToast(`Đã tiếp nhận xe ${job.plate} vào Booth 0${selectedBooth}!`);
                                      }}
                                      disabled={!!activeJob}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!!activeJob ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-[#A2C62C] text-black hover:brightness-110 active:scale-95'}`}
                                    >
                                      Tiếp nhận
                                    </button>
                                  </div>
                                ))}
                                {jobs.filter(j => j.status === 'Waiting' && (j.boothId === selectedBooth || (!j.boothId && selectedBooth === firstActiveBoothId))).length === 0 && (
                                  <div className="py-12 text-center text-white/20 flex flex-col items-center justify-center">
                                    <CheckCircle className="w-8 h-8 mb-2 text-[#A2C62C]/40" />
                                    <p className="text-xs italic font-medium">Hàng xếp trống</p>
                                    <p className="text-[10px] text-white/40 mt-1">Khách hàng chưa đăng ký tại Kiosk</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {activeJob && (
                              <div className="mt-4 p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-[10px] text-yellow-400/90 leading-relaxed">
                                ⚠️ <strong>KTV lưu ý:</strong> Vui lòng click kiểm tra đủ các mục QC và bấm <strong>HOÀN THÀNH CA (ĐÃ XONG)</strong> cho xe <strong>{activeJob.plate}</strong> để giải phóng Booth 0{selectedBooth} trước khi nhận xe tiếp theo.
                              </div>
                            )}
                          </div>

                        </div>

                      </div>
                    );
                  })()}

                </div>
              </div>


              {/* RIGHT COLUMN: TASK BOARD & HARDWARE MONITOR */}
              <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                
                {/* Active Jobs Task Board */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">DANH SÁCH XE HÔM NAY (TODAY'S JOBS)</h3>
                  
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {jobs.filter(j => j.status !== 'Completed').map(job => (
                      <div key={job.id} className="bg-black/40 p-3.5 rounded-xl border border-white/5 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold text-sm text-white">{job.plate}</span>
                            <span className="text-[10px] text-white/40">({job.size === '4-5' ? '4-5 chỗ' : '7-9 chỗ'})</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-[9px] bg-[#A2C62C]/20 text-[#A2C62C] px-2 py-0.5 rounded font-mono font-bold">
                              {servicesList.find(s => s.id === job.serviceId)?.code}
                            </span>
                            <span className="text-[9px] bg-white/10 text-white/60 px-2 py-0.5 rounded font-mono">
                              {job.status}
                            </span>
                          </div>
                        </div>

                        {/* Dispatch Button if Waiting */}
                        {job.status === 'Waiting' && (
                          <div className="flex gap-1">
                            {activeBoothIds.map(bNum => {
                              const isBoothOccupied = jobs.some(j => j.boothId === bNum && j.status !== 'Completed');
                              return (
                                <button
                                  key={bNum}
                                  onClick={() => {
                                    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'Processing', boothId: bNum, progress: 10 } : j));
                                  }}
                                  disabled={isBoothOccupied}
                                  className={`px-2 py-1.5 rounded text-[9px] font-bold transition-all ${isBoothOccupied ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-[#A2C62C] text-black hover:brightness-110 font-bold'}`}
                                >
                                  B0{bNum}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {job.status === 'Processing' && (
                          <span className="font-mono text-xs text-[#A2C62C] font-bold">{job.progress}%</span>
                        )}

                        {job.status === 'QC' && (
                          <span className="text-[9px] bg-green-500/20 text-green-400 px-2 rounded-full font-bold">Đợi thanh toán</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alarm and Resource Levels Panels */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">CẢNH BÁO HỆ THỐNG KỸ THUẬT (ALARMS)</h3>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${alarms.pressure ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/5'}`}>
                      <span>Áp lực bơm thấp</span>
                      <button onClick={() => setAlarms(a => ({ ...a, pressure: !a.pressure }))} className="text-[9px] underline font-bold">Mute</button>
                    </div>
                    <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${alarms.tankLow ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-white/5 border-white/5'}`}>
                      <span>Bể nước RO cạn</span>
                      <span className="text-[9px] font-mono font-bold text-yellow-400">{chemicals.water}%</span>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    {boothTechnicalChemicals.map(item => (
                      <div key={item.label}>
                        <div className="flex justify-between text-[10px] text-white/40 mb-1">
                          <span>{item.label}</span>
                          <span className="font-mono text-white font-bold">{item.percent}%</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div className={`${item.colorClass} h-full`} style={{ width: `${item.percent}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            {/* LOWER ROW SECTION 1: DANH SÁCH XE CHỜ BÀN GIAO & KIỂM TRA XE (MỜI KHÁCH NHẬN XE) */}
            <div className="col-span-12 bg-white/5 border border-white/10 rounded-2xl p-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse"></span>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/95">KHU VỰC BÀN GIAO - DANH SÁCH XE CHỜ KIỂM TRA & NHẬN XE 🚗</h3>
                </div>
                <span className="text-xs font-mono font-bold bg-white/10 text-white/60 px-2 py-1 rounded">
                  Tổng xe chờ nhận: {jobs.filter(j => j.status === 'QC').length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.filter(j => j.status === 'QC').map(job => (
                  <div key={job.id} className="bg-black/50 p-4 rounded-xl border border-white/10 flex flex-col justify-between space-y-3 shadow-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">{job.plate}</span>
                          <span className="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded font-mono uppercase">{job.size === '4-5' ? '4-5C' : '7-9C'}</span>
                        </div>
                        <p className="text-xs font-bold text-white/80 mt-1.5">{servicesList.find(s => s.id === job.serviceId)?.name}</p>
                      </div>
                    </div>

                    <div className="bg-white/5 p-2 rounded text-[10px] text-white/50 space-y-0.5">
                      <p>• Dịch vụ chính hoàn tất xuất sắc</p>
                      <p>• Đã kiểm tra 5 tiêu chí QC KTV</p>
                      <p>• Sẵn sàng để khách kiểm tra thực tế</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'Completed' } : j));
                          showToast(`✓ Đã nhận thanh toán tại quầy POS cho xe ${job.plate}! Giao chìa khoá cho khách.`);
                        }}
                        className="py-2 px-1 bg-[#A2C62C] hover:brightness-110 text-black font-extrabold uppercase rounded-lg transition-all cursor-pointer"
                      >
                        Thanh toán tại quầy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'Completed' } : j));
                          showToast(`✓ Đã xác nhận khách thanh toán tại chỗ thành công cho xe ${job.plate}!`);
                        }}
                        className="py-2 px-1 bg-white/10 hover:bg-white/15 text-white font-bold uppercase rounded-lg border border-white/10 transition-all cursor-pointer"
                      >
                        Thanh toán tại chỗ
                      </button>
                    </div>
                  </div>
                ))}
                {jobs.filter(j => j.status === 'QC').length === 0 && (
                  <div className="col-span-full py-8 text-center text-white/30 border border-dashed border-white/5 rounded-xl bg-black/20 flex flex-col items-center justify-center">
                    <CheckCircle className="w-8 h-8 mb-2 opacity-30 text-[#A2C62C]" />
                    <p className="text-xs font-bold">Chưa có xe nào cần bàn giao nhận xe lúc này</p>
                    <p className="text-[10px] text-white/40 mt-1">Các xe sau khi hoàn thành tiến trình rửa sẽ tự động cập nhật về đây.</p>
                  </div>
                )}
              </div>
            </div>

            {/* LOWER ROW SECTION 2: BÀN ĐIỀU KHIỂN THIẾT BỊ PHẦN CỨNG THỦ CÔNG & DỪNG KHẨN CẤP */}
            <div className="col-span-12 bg-[#141414] border border-red-500/25 rounded-2xl p-6 mt-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-2xl"></div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-red-500 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 animate-pulse" /> BÀN ĐIỀU KHIỂN PHẦN CỨNG THỦ CÔNG & HỆ THỐNG AN TOÀN TRẠM
                  </h3>
                  <p className="text-[10px] text-white/40 mt-0.5">Dành cho KTV can thiệp trực tiếp thiết bị cơ điện hoặc tắt máy khẩn cấp</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-green-500/15 text-green-400 border border-green-500/20 rounded">
                    PLC: CONNECTED
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
                {/* Switch 1: Pump */}
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white/80">Bơm áp lực chính</span>
                    <span className={`w-2 h-2 rounded-full ${hardware.pump ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHardware(p => ({ ...p, pump: !p.pump }));
                      showToast(`Hệ thống cơ khí: ${!hardware.pump ? 'MỞ BƠM ÁP LỰC CHÍNH' : 'TẮT BƠM ÁP LỰC CHÍNH'}`);
                    }}
                    className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${hardware.pump ? 'bg-green-500 text-black font-black' : 'bg-white/5 hover:bg-white/10 text-white/60 border border-white/10'}`}
                  >
                    {hardware.pump ? 'ĐANG KHỞI CHẠY' : 'ĐANG NGẮT MÁY'}
                  </button>
                </div>

                {/* Switch 2: Valve */}
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white/80">Van xả áp suất bồn RO</span>
                    <span className={`w-2 h-2 rounded-full ${hardware.valve ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHardware(p => ({ ...p, valve: !p.valve }));
                      showToast(`Hệ thống cơ khí: ${!hardware.valve ? 'MỞ VAN XẢ ÁP SUẤT' : 'ĐÓNG VAN XẢ ÁP SUẤT'}`);
                    }}
                    className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${hardware.valve ? 'bg-green-500 text-black font-black' : 'bg-white/5 hover:bg-white/10 text-white/60 border border-white/10'}`}
                  >
                    {hardware.valve ? 'ĐANG MỞ VAN' : 'VAN ĐANG ĐÓNG'}
                  </button>
                </div>

                {/* Switch 3: Foam nozzle */}
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white/80">Vòi phun bọt hoạt tính</span>
                    <span className={`w-2 h-2 rounded-full ${hardware.foam ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHardware(p => ({ ...p, foam: !p.foam }));
                      showToast(`Hệ thống cơ khí: ${!hardware.foam ? 'KÍCH HOẠT PHUN BỌT TUYẾT' : 'NGẮT PHUN BỌT TUYẾT'}`);
                    }}
                    className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${hardware.foam ? 'bg-green-500 text-black font-black' : 'bg-white/5 hover:bg-white/10 text-white/60 border border-white/10'}`}
                  >
                    {hardware.foam ? 'ĐANG PHUN BỌT' : 'NGẮT BỌT PHUN'}
                  </button>
                </div>

                {/* HUGE RED EMERGENCY STOP BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    setAlarms(prev => ({ ...prev, emergency: true }));
                    // Shut down all active hardware instantly
                    setHardware({ pump: false, valve: false, foam: false });
                    showToast(`🚨 DỪNG KHẨN CẤP TOÀN TRẠM ĐÃ ĐƯỢC KÍCH HOẠT! Tất cả bơm và vòi phun đã ngắt tức thì.`);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-black px-5 rounded-xl text-xs uppercase flex flex-col items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(239,68,68,0.45)] transition-all active:scale-95 border border-red-500/30 py-4 h-full cursor-pointer"
                >
                  <AlertTriangle className="w-6 h-6 animate-bounce text-white" />
                  <span>DỪNG KHẨN CẤP TOÀN TRẠM (E-STOP)</span>
                </button>
              </div>
            </div>

          </div>
          )}

              {oprSubTab === 'handover' && (
                <div className="animate-fadeIn">
                  <ShiftHandover role="opr" jobs={jobs} />
                </div>
              )}

            </div>
          )}

          {/* ======================================================== */}
          {/* 3. CASHIER & ACCOUNTANT PANEL WORKSPACE */}
          {/* ======================================================== */}
          {activeTab === 'pos' && !isPOSAuthenticated && (
            <div className="py-12">
              <LoginGate 
                role="pos" 
                passcode={stationPasscodes.pos}
                onLoginSuccess={() => setIsPOSAuthenticated(true)} 
                onCancel={() => setActiveTab('kiosk')}
              />
            </div>
          )}

          {activeTab === 'pos' && isPOSAuthenticated && (
            <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
              {/* POS SUB-TAB NAVIGATION */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-black/30 p-2 rounded-2xl border border-white/10 overflow-hidden">
                <div className="flex gap-2 bg-black/40 border border-white/10 p-1 rounded-xl w-full sm:w-fit overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setPosSubTab('billing')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 shrink-0 min-h-[42px] ${posSubTab === 'billing' ? 'bg-[#A2C62C] text-black shadow font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Hoá đơn & Thanh toán
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosSubTab('loyalty')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 shrink-0 min-h-[42px] ${posSubTab === 'loyalty' ? 'bg-[#A2C62C] text-black shadow font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    <Trophy className="w-3.5 h-3.5" /> Khách hàng thân thiết (Loyalty)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosSubTab('handover')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 shrink-0 min-h-[42px] ${posSubTab === 'handover' ? 'bg-[#A2C62C] text-black shadow font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Giao ca (Handover)
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    setIsPOSAuthenticated(false);
                    setActiveTab('kiosk');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 rounded-xl text-xs font-bold transition-all"
                >
                  ← Đăng xuất / Quay lại Kiosk
                </button>
              </div>

              {posSubTab === 'billing' && (
                <div className="grid grid-cols-12 gap-6">
              
                  {/* POS Billing Section */}
                  <div className="col-span-12 lg:col-span-8 bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-white/5 pb-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">QUẦY THANH TOÁN HOÁ ĐƠN (CASHIER POS)</h3>
                      
                      {/* Search / Filter bar */}
                      <div className="relative w-full sm:w-auto">
                        <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                        <input 
                          type="text" 
                          placeholder="Tìm biển số xe..." 
                          value={posPlateFilter}
                          onFocus={() => { setShowPOSPlateKeyboard(true); setShowPOSDiscountKeyboard(false); }}
                          onChange={(e) => setPosPlateFilter(e.target.value)}
                          className="w-full sm:w-auto bg-black/50 border border-white/15 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-[#A2C62C]"
                        />

                        {showPOSPlateKeyboard && (
                          <div className="absolute right-0 top-12 z-50 bg-black border border-white/10 p-2 rounded-xl shadow-2xl w-[320px]">
                            <VirtualKeyboard
                              value={posPlateFilter}
                              onChange={setPosPlateFilter}
                              layoutType="plate"
                              onClose={() => setShowPOSPlateKeyboard(false)}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {posSuccessMsg && (
                      <div className="bg-green-500/20 border border-green-500/50 text-green-400 p-4 rounded-xl text-sm font-black mb-6 animate-pulse text-center">
                        ✓ {posSuccessMsg}
                      </div>
                    )}

                    <div className="grid grid-cols-12 gap-6">
                      {/* List of outstanding tickets awaiting payment */}
                      <div className="col-span-12 md:col-span-5 bg-black/40 p-5 rounded-2xl border border-white/10">
                        <p className="text-xs font-black uppercase tracking-widest text-white/50 mb-4">Danh sách xe chờ quyết toán</p>
                        
                        <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                          {jobs.filter(j => j.status !== 'Completed' && j.plate.toLowerCase().includes(posPlateFilter.toLowerCase())).map(job => (
                            <div 
                              key={job.id}
                              onClick={() => setPosSelectedJobId(job.id)}
                              className={`p-4 rounded-xl border cursor-pointer transition-all ${posSelectedJobId === job.id ? 'bg-[#A2C62C]/15 border-[#A2C62C] shadow-lg shadow-[#A2C62C]/10 scale-[1.01]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                            >
                              <div className="flex justify-between items-center mb-2.5">
                                {/* Beautiful Plate representation */}
                                <span className="font-mono font-extrabold text-sm text-black bg-white border border-black/30 rounded-md px-2.5 py-0.5 shadow-sm inline-block tracking-wider">
                                  {job.plate}
                                </span>
                                <span className="text-sm font-extrabold text-[#A2C62C] font-mono">
                                  {job.price.toLocaleString()}đ
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs text-white/60">
                                <span>Gói: <strong className="text-white">{servicesList.find(s => s.id === job.serviceId)?.code}</strong> ({job.size === '4-5' ? '4-5 chỗ' : '7-9 chỗ'})</span>
                                <span className={`px-2 py-0.5 text-[10px] rounded-full font-black uppercase tracking-wider ${job.status === 'QC' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'}`}>
                                  {job.status === 'QC' ? 'Đã Xong (QC)' : 'Đang Rửa'}
                                </span>
                              </div>
                            </div>
                          ))}
                          {jobs.filter(j => j.status !== 'Completed' && j.plate.toLowerCase().includes(posPlateFilter.toLowerCase())).length === 0 && (
                            <div className="text-center py-12 text-white/20">
                              <Car className="w-10 h-10 mx-auto mb-2 opacity-20" />
                              <p className="text-xs italic">Không tìm thấy vé rửa xe nào khả dụng</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Calculator & Receipt billing */}
                      <div className="col-span-12 md:col-span-7 flex flex-col justify-between mt-4 md:mt-0">
                        {selectedPOSJob ? (
                          <div className="bg-black/20 p-6 rounded-2xl border border-white/10 shadow-xl">
                            <h4 className="text-sm font-black uppercase tracking-wider text-[#A2C62C] mb-4 pb-2 border-b border-white/5">Chi tiết hoá đơn thanh toán</h4>
                            
                            <div className="space-y-3 text-sm mb-6 bg-white/5 p-4 rounded-xl border border-white/5">
                              <div className="flex justify-between text-white/80 pb-2 border-b border-white/5">
                                <span className="font-semibold">Biển số xe:</span>
                                <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">{selectedPOSJob.plate}</span>
                              </div>
                              <div className="flex justify-between text-white/70">
                                <span>Gói dịch vụ chính ({servicesList.find(s => s.id === selectedPOSJob.serviceId)?.name}):</span>
                                <span className="font-mono font-bold">{(selectedPOSJob.size === '4-5' ? servicesList.find(s => s.id === selectedPOSJob.serviceId)?.price45 : servicesList.find(s => s.id === selectedPOSJob.serviceId)?.price79)?.toLocaleString()}đ</span>
                              </div>
                              {selectedPOSJob.addOnIds.map(id => {
                                const a = addonsList.find(item => item.id === id);
                                if (!a) return null;
                                return (
                                  <div key={id} className="flex justify-between text-white/50 pl-3">
                                    <span>+ {a.name}:</span>
                                    <span className="font-mono font-medium">{(selectedPOSJob.size === '4-5' ? a.price45 : a.price79).toLocaleString()}đ</span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Custom cashier discount */}
                            <div className="mb-6 pt-1 relative">
                              <label className="text-xs font-bold uppercase text-white/50 block mb-2">Chiết khấu thủ công (Cashier Discount)</label>
                              <div className="flex flex-wrap gap-2">
                                <input 
                                  type="text" 
                                  placeholder="Nhập số tiền giảm (VNĐ)..."
                                  value={customDiscount || ''}
                                  onFocus={() => { setShowPOSDiscountKeyboard(true); setShowPOSPlateKeyboard(false); }}
                                  onChange={(e) => setCustomDiscount(Number(e.target.value))}
                                  className="flex-1 bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#A2C62C] min-w-[150px]"
                                />
                                <button onClick={() => { setCustomDiscount(50000); setShowPOSDiscountKeyboard(false); }} className="bg-white/10 hover:bg-white/15 text-xs font-extrabold px-4 py-2 rounded-xl transition-all">Giảm -50k</button>
                                <button onClick={() => { setCustomDiscount(100000); setShowPOSDiscountKeyboard(false); }} className="bg-white/10 hover:bg-white/15 text-xs font-extrabold px-4 py-2 rounded-xl transition-all">Giảm -100k</button>
                              </div>

                              {showPOSDiscountKeyboard && (
                                <div className="absolute left-0 bottom-14 z-50 bg-black border border-white/10 p-2 rounded-xl shadow-2xl w-[280px]">
                                  <VirtualKeyboard
                                    value={customDiscount.toString()}
                                    onChange={(val) => setCustomDiscount(Number(val))}
                                    layoutType="phone"
                                    onClose={() => setShowPOSDiscountKeyboard(false)}
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex justify-between items-end border-t border-white/10 pt-4 mb-6">
                              <span className="text-sm font-extrabold text-white/70">TỔNG TIỀN PHẢI THU (NET TOTAL):</span>
                              <span className="font-mono text-3xl font-black text-[#A2C62C] tracking-wide drop-shadow-[0_0_15px_rgba(162,198,44,0.3)]">
                                {posTotal.toLocaleString()}đ
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <button 
                                onClick={() => handlePOSCheckout('Tiền mặt')} 
                                className="bg-[#A2C62C] hover:brightness-110 text-black font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-[#A2C62C]/10 active:scale-95 flex items-center justify-center gap-2"
                              >
                                <DollarSign className="w-4 h-4" /> THU TIỀN MẶT (CASH)
                              </button>
                              
                              <button 
                                onClick={() => handlePOSCheckout('QR Pay')} 
                                className="bg-white/10 hover:bg-white/15 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest border border-white/10 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                              >
                                <RefreshCw className="w-4 h-4 text-[#A2C62C]" /> QUÉT MÃ QR (QR PAY)
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col justify-center items-center py-16 text-center text-white/30 bg-black/10 rounded-2xl border border-white/5 border-dashed">
                            <FileText className="w-14 h-14 mb-4 opacity-20 text-[#A2C62C]" />
                            <p className="text-sm font-bold text-white/80">Chưa chọn Hoá đơn thanh toán</p>
                            <p className="text-xs mt-2 text-white/40 max-w-[280px]">Vui lòng chọn một xe đang chờ quyết toán ở danh mục bên trái để dọn hóa đơn và chiết khấu.</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

              {/* RIGHT COLUMN: POS ERP / MEMBERSHIP & ACC EXPENSES */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                
                {/* Accountant Mini P&L */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4 font-mono">BÁO CÁO TÀI CHÍNH MINI (ACCOUNTANT EXPENSES)</h3>
                  
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60">Doanh thu hôm nay:</span>
                      <span className="font-mono font-bold text-green-400">+{todayRevenue.toLocaleString()}đ</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2.5">
                      <span className="text-white/60">Khách đợi thanh toán:</span>
                      <span className="font-mono font-bold text-yellow-400">
                        {jobs.filter(j => j.status === 'QC').length} hoá đơn
                      </span>
                    </div>

                    <div className="text-[10px] text-white/30 uppercase tracking-widest block font-bold">Chi phí phát sinh ngày (Ước tính)</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-white/50">
                        <span>Hóa chất (Foam/Wax):</span>
                        <span className="font-mono">-450,000đ</span>
                      </div>
                      <div className="flex justify-between text-white/50">
                        <span>Điện lưới & nước sạch RO:</span>
                        <span className="font-mono">-850,000đ</span>
                      </div>
                      <div className="flex justify-between text-white/50">
                        <span>Nhân công kỹ thuật trạm:</span>
                        <span className="font-mono">-2,200,000đ</span>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-3 flex justify-between items-end">
                      <span className="text-xs font-bold text-white/80">Lợi nhuận gộp ngày:</span>
                      <span className="font-mono text-sm font-bold text-[#A2C62C]">{(todayRevenue - 3500000).toLocaleString()}đ</span>
                    </div>

                    <button 
                      onClick={() => {
                        // Trigger CSV mockup file download
                        const csvContent = "data:text/csv;charset=utf-8,Ngay,DoanhThu,ChiPhi,LoiNhuan\n2026-07-04," + todayRevenue + ",3500000," + (todayRevenue - 3500000);
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", "wassup_washos_daily_accounting.csv");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="w-full mt-2 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all font-bold"
                    >
                      <Download className="w-3.5 h-3.5 text-[#A2C62C]" /> Xuất Excel báo cáo (.CSV)
                    </button>
                  </div>
                </div>

                {/* Loyalty / Membership database search */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">TRA CỨU THÀNH VIÊN (LOYALTY)</h3>
                  
                  <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/40">Thành viên VIP:</span>
                      <span className="font-bold text-white">Phan Anh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Biển số:</span>
                      <span className="font-mono text-white">51A-888.88</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/40">Điểm tích lũy:</span>
                      <span className="font-mono text-[#A2C62C] font-bold">1,520 PTS</span>
                    </div>
                    
                    <div className="flex justify-between text-[11px] text-white/60">
                      <span>Lịch sử rửa xe:</span>
                      <span>12 lần</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-white/60">
                      <span>Voucher khả dụng:</span>
                      <span className="text-green-400">2 mã (GIAM50, MONKEY)</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {posSubTab === 'loyalty' && (
            <LoyaltySystem members={members} setMembers={setMembers} />
          )}

          {posSubTab === 'pricing' && (
            <PromoPricingManager
              services={servicesList}
              onUpdateServices={setServicesList}
              addons={addonsList}
              onUpdateAddons={setAddonsList}
              promotions={promotionsList}
              onUpdatePromotions={setPromotionsList}
            />
          )}

          {posSubTab === 'handover' && (
            <ShiftHandover role="pos" jobs={jobs} />
          )}

          {/* LIVE CCTV STREAM MATRIX AT THE BOTTOM OF POS */}
          <LiveCctvGrid />
        </div>
      )}

          {/* ======================================================== */}
          {/* 4. MANAGER DASHBOARD WORKSPACE */}
          {/* ======================================================== */}
          {activeTab === 'mgr' && !isManagerAuthenticated && (
            <div className="py-12">
              <LoginGate 
                role="mgr" 
                passcode={stationPasscodes.mgr}
                onLoginSuccess={() => setIsManagerAuthenticated(true)} 
                onCancel={() => setActiveTab('kiosk')}
              />
            </div>
          )}

          {activeTab === 'mgr' && isManagerAuthenticated && (
            <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
              
              {/* MGR SUB-TAB NAVIGATION */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-black/30 p-2 rounded-2xl border border-white/10 overflow-hidden">
                <div className="flex gap-2 bg-black/40 border border-white/10 p-1 rounded-xl w-full lg:w-fit overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setMgrSubTab('analytics')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 shrink-0 min-h-[42px] ${mgrSubTab === 'analytics' ? 'bg-[#A2C62C] text-black shadow font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    <Activity className="w-3.5 h-3.5" /> Thống kê & Doanh thu
                  </button>
                  <button
                    type="button"
                    onClick={() => setMgrSubTab('inventory')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 shrink-0 min-h-[42px] ${mgrSubTab === 'inventory' ? 'bg-[#A2C62C] text-black shadow font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    <Droplet className="w-3.5 h-3.5" /> Quản lý tồn kho hóa chất
                  </button>
                  <button
                    type="button"
                    onClick={() => setMgrSubTab('loyalty')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 shrink-0 min-h-[42px] ${mgrSubTab === 'loyalty' ? 'bg-[#A2C62C] text-black shadow font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    <Trophy className="w-3.5 h-3.5" /> Khách hàng thân thiết
                  </button>
                  <button
                    type="button"
                    onClick={() => setMgrSubTab('pricing')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 shrink-0 min-h-[42px] ${mgrSubTab === 'pricing' ? 'bg-[#A2C62C] text-black shadow font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    <Tag className="w-3.5 h-3.5" /> Đơn giá & Khuyến mãi
                  </button>
                  <button
                    type="button"
                    onClick={() => setMgrSubTab('hr')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 shrink-0 min-h-[42px] ${mgrSubTab === 'hr' ? 'bg-[#A2C62C] text-black shadow font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    <Users className="w-3.5 h-3.5" /> Quản trị nhân sự
                  </button>
                  <button
                    type="button"
                    onClick={() => setMgrSubTab('settings')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 shrink-0 min-h-[42px] ${mgrSubTab === 'settings' ? 'bg-[#A2C62C] text-black shadow font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    <Settings className="w-3.5 h-3.5" /> Cài đặt hệ thống
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    setIsManagerAuthenticated(false);
                    setActiveTab('kiosk');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 rounded-xl text-xs font-bold transition-all shrink-0"
                >
                  ← Đăng xuất / Quay lại Kiosk
                </button>
              </div>

              {mgrSubTab === 'analytics' && (
                <div className="print-report space-y-6 relative">
                  {/* Print Button Header */}
                  <div className="flex justify-between items-center hide-on-print">
                    <div>
                      <h3 className="text-lg font-bold text-white uppercase tracking-wider">Báo Cáo Hoạt Động (Analytics)</h3>
                      <p className="text-xs text-white/50">Cập nhật thời gian thực từ các Booth và Kiosk</p>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="bg-[#A2C62C] text-black font-bold px-4 py-2 rounded-xl text-xs uppercase flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(162,198,44,0.3)]"
                    >
                      <Download className="w-4 h-4" /> Xuất Báo Cáo (PDF/IN)
                    </button>
                  </div>

                  <div className="hide-on-print flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setAnalyticsPage('overview')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${analyticsPage === 'overview' ? 'bg-[#A2C62C] text-black' : 'bg-white/5 text-white/60 hover:text-white'}`}
                    >
                      1 phút tổng quan
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalyticsPage('alerts')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${analyticsPage === 'alerts' ? 'bg-[#A2C62C] text-black' : 'bg-white/5 text-white/60 hover:text-white'}`}
                    >
                      Cảnh báo xử lý ngay
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalyticsPage('deep')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${analyticsPage === 'deep' ? 'bg-[#A2C62C] text-black' : 'bg-white/5 text-white/60 hover:text-white'}`}
                    >
                      Phân tích sâu
                    </button>
                  </div>

                  {analyticsPage === 'overview' && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-[#A2C62C]/5 rounded-bl-full -z-10 group-hover:bg-[#A2C62C]/10 transition-all"></div>
                          <p className="text-[10px] uppercase text-white/40 tracking-wider font-bold mb-1 flex items-center justify-between">Doanh thu hôm nay <DollarSign className="w-3 h-3 text-[#A2C62C]" /></p>
                          <p className="text-2xl font-bold font-mono text-white">{todayRevenue.toLocaleString()} <span className="text-xs font-normal opacity-50">VND</span></p>
                          <span className="text-[10px] text-green-400 font-mono mt-2 flex items-center gap-1">▲ +12.5% so với hôm qua</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -z-10 group-hover:bg-blue-500/10 transition-all"></div>
                          <p className="text-[10px] uppercase text-white/40 tracking-wider font-bold mb-1 flex items-center justify-between">Tổng số lượt rửa <Car className="w-3 h-3 text-blue-400" /></p>
                          <p className="text-2xl font-bold font-mono text-white">{jobs.filter(j => j.status === 'Completed').length} <span className="text-xs font-normal opacity-50">xe</span></p>
                          <span className="text-[10px] text-green-400 font-mono mt-2 flex items-center gap-1">✓ Đạt 92% kế hoạch KPI</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full -z-10 group-hover:bg-purple-500/10 transition-all"></div>
                          <p className="text-[10px] uppercase text-white/40 tracking-wider font-bold mb-1 flex items-center justify-between">Khách chờ xử lý <Clock className="w-3 h-3 text-purple-400" /></p>
                          <p className="text-2xl font-bold font-mono text-white">{queueWaitingCount + queueQcCount} <span className="text-xs font-normal opacity-50">xe</span></p>
                          <span className="text-[10px] text-white/60 font-mono mt-2 block">Chờ vào booth: {queueWaitingCount} | Chờ bàn giao: {queueQcCount}</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full -z-10 group-hover:bg-orange-500/10 transition-all"></div>
                          <p className="text-[10px] uppercase text-white/40 tracking-wider font-bold mb-1 flex items-center justify-between">Mục tồn kho rủi ro <ShieldAlert className="w-3 h-3 text-orange-400" /></p>
                          <p className="text-2xl font-bold font-mono text-orange-400 mt-1">{lowStockCount} <span className="text-xs font-normal opacity-50 text-white">mục</span></p>
                          <span className="text-[10px] text-white/50 font-mono mt-1 block">Ngưỡng cảnh báo: &lt; {lowStockAlertThreshold}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-6">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">Nhịp doanh thu 7 ngày (quick view)</h4>
                            <span className="text-[10px] text-[#A2C62C] font-mono">Bar compact</span>
                          </div>
                          <div className="flex items-end gap-1 h-36 border-b border-white/10 pb-2">
                            {sevenDayRevenueSeries.map(day => (
                              <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-2 sm:w-3 h-28 flex items-end">
                                  <div
                                    className={`${day.label === 'Hôm nay' ? 'bg-[#A2C62C]' : 'bg-[#F27D26]/85'} w-full rounded-t-sm`}
                                    style={{ height: `${Math.max(8, (day.value / sevenDayRevenueMax) * 100)}%` }}
                                  />
                                </div>
                                <span className="text-[9px] text-white/45 font-mono">{day.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="col-span-12 lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-6">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Service Mix đầy đủ</h4>
                          <p className="text-[10px] text-white/45 mb-4">Hiển thị đủ toàn bộ gói dịch vụ đang cấu hình</p>
                          <div className="space-y-2.5">
                            {serviceMixStats.map((service, idx) => (
                              <div key={service.id}>
                                <div className="flex justify-between text-[10px] mb-1 gap-2">
                                  <span className="text-white/75 truncate">{service.name}</span>
                                  <span className="font-mono text-white">{service.pct}%</span>
                                </div>
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                  <div className={`${idx % 3 === 0 ? 'bg-[#F27D26]' : idx % 3 === 1 ? 'bg-orange-400' : 'bg-blue-400'} h-full`} style={{ width: `${Math.max(service.pct, service.count > 0 ? 3 : 0)}%` }}></div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] flex justify-between">
                            <span className="text-white/55">Tỷ lệ mua Add-on</span>
                            <span className="font-mono font-bold text-[#A2C62C]">{addOnRate}%</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {analyticsPage === 'alerts' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                        <p className="text-[10px] uppercase text-red-300 font-bold tracking-widest mb-2">Cảnh báo vận hành ngay</p>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between"><span className="text-white/70">Xe đang chờ vào booth</span><span className="font-mono text-white">{queueWaitingCount}</span></div>
                          <div className="flex justify-between"><span className="text-white/70">Xe chờ bàn giao (QC)</span><span className="font-mono text-white">{queueQcCount}</span></div>
                          <div className="flex justify-between"><span className="text-white/70">Mục tồn kho dưới ngưỡng</span><span className="font-mono text-red-300">{criticalInventoryItems.length}</span></div>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <p className="text-[10px] uppercase text-white/50 font-bold tracking-widest mb-2">Danh sách vật tư cần xử lý</p>
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                          {criticalInventoryItems.slice(0, 8).map(item => (
                            <div key={item.id} className="bg-black/30 border border-white/10 rounded-lg p-2.5 text-xs flex justify-between items-start gap-2">
                              <div>
                                <p className="text-white font-semibold leading-tight">{item.name}</p>
                                <p className="text-[10px] text-white/40">Min {item.minThreshold} {item.unit}</p>
                              </div>
                              <span className="font-mono text-red-400 whitespace-nowrap">{item.quantity} {item.unit}</span>
                            </div>
                          ))}
                          {!criticalInventoryItems.length && <p className="text-xs text-green-400">Không có mục thiếu hụt nghiêm trọng.</p>}
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <p className="text-[10px] uppercase text-white/50 font-bold tracking-widest mb-2">Booth cần theo dõi</p>
                        <div className="space-y-2">
                          {boothMaintenance.map(booth => (
                            <div key={booth.boothId} className="bg-black/30 border border-white/10 rounded-lg p-2.5">
                              <div className="flex justify-between items-center mb-1 text-xs">
                                <span className="text-white">Booth {booth.boothId}</span>
                                <span className="font-mono text-white">{booth.overall}%</span>
                              </div>
                              <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-1">
                                <div className="h-full bg-[#A2C62C]" style={{ width: `${booth.overall}%` }}></div>
                              </div>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${booth.statusClass}`}>{booth.status}</span>
                            </div>
                          ))}
                        </div>
                        {boothNeedsAttention.length > 0 && (
                          <p className="text-[10px] text-amber-300 mt-2">Ưu tiên xử lý Booth {boothNeedsAttention.map(b => b.boothId).join(', ')}.</p>
                        )}

                        <div className="mt-4 pt-3 border-t border-white/10">
                          <p className="text-[10px] uppercase text-white/50 font-bold tracking-widest mb-2">Trạng thái đăng nhập nhân sự Booth</p>
                          <div className="space-y-1.5 text-[11px]">
                            {activeBoothIds.map(boothId => (
                              <div key={boothId} className="flex items-center justify-between">
                                <span className="text-white/70">Booth {boothId}</span>
                                <span className={`font-mono font-bold ${operatorAuthByBooth[boothId] ? 'text-green-400' : 'text-white/35'}`}>
                                  {operatorAuthByBooth[boothId] ? 'Đã đăng nhập' : 'Chưa đăng nhập'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {analyticsPage === 'deep' && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setAnalysisRange('day')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${analysisRange === 'day' ? 'bg-[#A2C62C] text-black' : 'bg-white/5 text-white/60 hover:text-white'}`}>Theo ngày</button>
                        <button type="button" onClick={() => setAnalysisRange('week')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${analysisRange === 'week' ? 'bg-[#A2C62C] text-black' : 'bg-white/5 text-white/60 hover:text-white'}`}>Theo tuần</button>
                        <button type="button" onClick={() => setAnalysisRange('month')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${analysisRange === 'month' ? 'bg-[#A2C62C] text-black' : 'bg-white/5 text-white/60 hover:text-white'}`}>Theo tháng (12 tháng)</button>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <div className="flex items-end justify-between mb-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">
                            {analysisRange === 'day' ? 'Phân tích doanh thu 14 ngày' : analysisRange === 'week' ? 'Phân tích doanh thu 12 tuần' : 'Phân tích doanh thu đủ 12 tháng'}
                          </h4>
                          <span className="text-[10px] text-white/40">Bar mảnh, hiển thị đầy đủ dữ liệu</span>
                        </div>
                        <div className="flex items-end gap-1 h-52 border-b border-white/10 pb-2 overflow-x-auto">
                          {deepRevenueSeries.map((entry, idx) => (
                            <div key={`${entry.label}-${idx}`} className="min-w-[14px] flex flex-col items-center justify-end gap-1 h-full">
                              <div className="w-1.5 sm:w-2 md:w-2.5 h-[170px] flex items-end">
                                <div
                                  className={`w-full rounded-t-sm ${idx === deepRevenueSeries.length - 1 ? 'bg-[#A2C62C]' : 'bg-[#F27D26]/85'}`}
                                  style={{ height: `${Math.max(6, (entry.value / deepRevenueMax) * 100)}%` }}
                                />
                              </div>
                              {(
                                analysisRange === 'month' ||
                                idx === deepRevenueSeries.length - 1 ||
                                (analysisRange === 'week' && idx % 2 === 0) ||
                                (analysisRange === 'day' && idx % 3 === 0)
                              ) && <span className="text-[9px] text-white/45 font-mono">{entry.label}</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Service Mix chi tiết</h4>
                          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                            {serviceMixStats.map((service, idx) => (
                              <div key={service.id}>
                                <div className="flex justify-between text-[10px] mb-1 gap-2">
                                  <span className="text-white/75 truncate">{service.name}</span>
                                  <span className="font-mono text-white whitespace-nowrap">{service.pct}% ({service.count})</span>
                                </div>
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                  <div className={`${idx % 3 === 0 ? 'bg-[#F27D26]' : idx % 3 === 1 ? 'bg-orange-400' : 'bg-blue-400'} h-full`} style={{ width: `${Math.max(service.pct, service.count > 0 ? 2 : 0)}%` }}></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">Dashboard tồn kho % + bảo trì booth</h4>
                          <div className="space-y-2">
                            {inventoryPercentDashboard.map(metric => (
                              <div key={metric.id}>
                                <div className="flex justify-between text-[10px] mb-1"><span className="text-white/70">{metric.label}</span><span className="font-mono text-white">{metric.percent}%</span></div>
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className={`${metric.colorClass} h-full`} style={{ width: `${metric.percent}%` }}></div></div>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t border-white/10 space-y-2">
                            {boothMaintenance.map(booth => (
                              <div key={booth.boothId} className="flex items-center justify-between text-[11px]">
                                <span className="text-white/70">Booth {booth.boothId}</span>
                                <span className="font-mono text-white">{booth.overall}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
            </div>
          )}

          {mgrSubTab === 'inventory' && (
            <InventorySystem 
              inventory={inventory} 
              setInventory={setInventory} 
              completedJobsCount={jobs
                .filter(j => j.status === 'Completed')
                .reduce((acc: { [serviceId: string]: number }, j) => {
                  acc[j.serviceId] = (acc[j.serviceId] || 0) + 1;
                  return acc;
                }, {})}
              lowStockAlertThreshold={lowStockAlertThreshold}
            />
          )}

          {mgrSubTab === 'loyalty' && (
            <LoyaltySystem 
              members={members} 
              setMembers={setMembers} 
            />
          )}

          {mgrSubTab === 'pricing' && (
            <PromoPricingManager
              services={servicesList}
              onUpdateServices={setServicesList}
              addons={addonsList}
              onUpdateAddons={setAddonsList}
              promotions={promotionsList}
              onUpdatePromotions={setPromotionsList}
            />
          )}

          {mgrSubTab === 'hr' && (
            <HRManager
              employees={employees}
              setEmployees={setEmployees}
              showToast={showToast}
            />
          )}

          {mgrSubTab === 'settings' && (
            <SettingsPanel
              simulationEnabled={simulationEnabled}
              onToggleSimulation={setSimulationEnabled}
              simulationSpeed={simulationSpeed}
              onUpdateSimulationSpeed={setSimulationSpeed}
              lowStockAlertThreshold={lowStockAlertThreshold}
              onUpdateThreshold={setLowStockAlertThreshold}
              stationPasscodes={stationPasscodes}
              onUpdateStationPasscode={(station, value) => setStationPasscodes(prev => ({ ...prev, [station]: value }))}
              boothConfigs={boothConfigs}
              boothOperatorPasscodes={boothOperatorPasscodes}
              busyBoothIds={busyBoothIds}
              onAddBooth={handleAddBooth}
              onRemoveBooth={handleRemoveBooth}
              onUpdateBoothConfig={handleUpdateBoothConfig}
              onUpdateBoothPasscode={(boothId, passcode) => setBoothOperatorPasscodes(prev => ({ ...prev, [boothId]: passcode }))}
              services={servicesList.map(service => ({ id: service.id, name: service.name }))}
              serviceBoothRules={serviceBoothRules}
              onUpdateServiceBoothRule={(serviceId, boothId) => setServiceBoothRules(prev => ({ ...prev, [serviceId]: boothId }))}
              onResetServiceBoothRules={handleResetServiceBoothRules}
              onExportConfigJson={handleExportBoothConfigJson}
              onImportConfigJson={handleImportBoothConfigJson}
              onResetConfigDefaults={handleResetConfigDefaults}
              chemicals={chemicals}
              onRefillChemicals={(chem) => {
                setChemicals(prev => ({ ...prev, [chem]: 100 }));
                // Reset corresponding inventory alert
                setInventory(prev => prev.map(item => {
                  if (chem === 'water' && item.name.toLowerCase().includes('nước')) {
                    return { ...item, stock: item.maxStock };
                  }
                  if (chem === 'foam' && item.name.toLowerCase().includes('bọt')) {
                    return { ...item, stock: item.maxStock };
                  }
                  if (chem === 'wax' && item.name.toLowerCase().includes('wax')) {
                    return { ...item, stock: item.maxStock };
                  }
                  if (chem === 'wheel' && (
                    item.name.toLowerCase().includes('mâm')
                    || item.name.toLowerCase().includes('wheel')
                    || item.name.toLowerCase().includes('tire')
                    || item.name.toLowerCase().includes('alloy')
                    || item.name.toLowerCase().includes('lốp')
                  )) {
                    return { ...item, stock: item.maxStock };
                  }
                  return item;
                }));
              }}
              onResetAlarms={() => setAlarms({ pressure: false, tankLow: false, emergency: false })}
            />
          )}

          {/* LIVE CCTV STREAM MATRIX AT THE BOTTOM OF MGR */}
          <LiveCctvGrid />
        </div>
      )}

        {activeTab !== 'kiosk' && (
          <button
            type="button"
            onClick={handleQuickScroll}
            className="fixed bottom-5 right-5 z-40 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white/80 hover:text-white hover:bg-black/55 transition-all flex items-center justify-center shadow-[0_0_14px_rgba(0,0,0,0.35)]"
            title={isNearBottom ? 'Cuộn lên đầu trang' : 'Cuộn xuống cuối trang'}
          >
            {isNearBottom ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}

        </div>

        {/* UNIFIED ERP CONNECTED FOOTER */}
        <footer className="bg-[#070707] border-t border-white/5 px-8 py-4 flex justify-between items-center text-[10px] tracking-wider text-white/30 shrink-0">
          <p>© 2026 WASSUP SERVICE CO. • CLOUD ERP SYSTEM OPERATIONAL</p>
          <p>LOC: DISTRICT 7, HO CHI MINH CITY • DEVICE RUNTIME: OPTIMAL</p>
        </footer>

        {/* Global Floating Toast Notification System */}
        {toastMessage && (
          <div className="fixed bottom-20 right-6 z-50 max-w-sm bg-black/90 text-white p-4 rounded-2xl border border-[#A2C62C]/30 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md animate-fadeIn flex items-start gap-3.5">
            <div className="w-2.5 h-2.5 bg-[#A2C62C] rounded-full mt-1.5 animate-ping shrink-0"></div>
            <div className="flex-1">
              <p className="text-[10px] uppercase font-black tracking-widest text-[#A2C62C] mb-0.5">Thông báo hệ thống</p>
              <p className="text-xs text-white/90 font-medium leading-relaxed">{toastMessage}</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
