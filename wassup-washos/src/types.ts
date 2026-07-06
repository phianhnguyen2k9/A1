export interface LoyaltyMember {
  id: string;
  name: string;
  phone: string;
  plate: string;
  points: number;
  tier: 'Đồng' | 'Bạc' | 'Vàng' | 'Kim Cương';
  historyCount: number;
  spentTotal: number;
  vouchers: {
    code: string;
    value: number;
    description: string;
  }[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Hóa chất' | 'Vật tư' | 'Công cụ';
  quantity: number; // e.g., Liters or Pieces
  unit: string; // "Lít", "Cái", "Hộp"
  minThreshold: number;
  lastUpdated: string;
  history: {
    id: string;
    type: 'IN' | 'OUT';
    qty: number;
    reason: string;
    timestamp: string;
  }[];
}

export interface ServiceUsageRate {
  serviceId: string;
  serviceName: string;
  foamLiters: number;
  waxLiters: number;
  ceramicLiters: number;
  waterLiters: number;
}

export interface Job {
  id: string;
  plate: string;
  size: '4-5' | '7-9';
  serviceId: string;
  addOnIds: string[];
  price: number;
  status: 'Waiting' | 'Processing' | 'QC' | 'Paid' | 'Completed';
  boothId: number | null;
  progress: number;
  checklist: {
    surface: boolean;
    crevices: boolean;
    wheelWellRim: boolean;
    interior: boolean;
    floorMat: boolean;
    glass: boolean;
    tirePlasticDressing: boolean;
    engineBay: boolean;
    airFilter: boolean;
    frontRearBrakes: boolean;
  };
  timestamp: string;
  rating: number | null;
  paymentMethod: string | null;
}

export interface DailyExpense {
  id: string;
  date: string;
  category: 'Nước uống' | 'Điện nước' | 'Internet' | 'Dịch vụ khác';
  amount: number;
  notes: string;
}

export interface AttendanceRecord {
  id: string;
  employeeName: string;
  role: string;
  date: string;
  checkInTime: string;
  checkOutTime: string | null;
  status: 'Đang làm' | 'Đã về' | 'Nghỉ';
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string; // 'Quản lý' | 'Trưởng nhóm' | 'Kỹ thuật viên' | 'Thu ngân' | 'Bảo vệ'
  level: string; // 'Cấp 1 - Học việc' | 'Cấp 2 - Thợ phụ' | 'Cấp 3 - Thợ chính' | 'Cấp 4 - Chuyên gia'
  status: 'Đang làm việc' | 'Nghỉ phép' | 'Đã nghỉ việc';
  boothId: number | null; // Booth được phân công: 1, 2, 3 hoặc null (không trực booth)
  skills: string[];
  notes: string;
  hireDate: string;
  avatarSeed: number; // for rendering consistent colorful avatars
}

