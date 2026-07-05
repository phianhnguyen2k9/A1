import { LoyaltyMember, InventoryItem, ServiceUsageRate } from './types';

export const INITIAL_MEMBERS: LoyaltyMember[] = [
  {
    id: 'm-1',
    name: 'Phan Anh',
    phone: '0901234567',
    plate: '51A-888.88',
    points: 1520,
    tier: 'Vàng',
    historyCount: 12,
    spentTotal: 15200000,
    vouchers: [
      { code: 'WASSUP100', value: 100000, description: 'Voucher giảm giá 100k' },
      { code: 'GIAM50', value: 50000, description: 'Voucher giảm giá 50k' }
    ]
  },
  {
    id: 'm-2',
    name: 'Hoàng Minh',
    phone: '0987654321',
    plate: '60B-123.45',
    points: 2750,
    tier: 'Kim Cương',
    historyCount: 22,
    spentTotal: 27500000,
    vouchers: [
      { code: 'VIP30', value: 300000, description: 'Voucher giảm 30% tổng bill' }
    ]
  },
  {
    id: 'm-3',
    name: 'Khánh Linh',
    phone: '0912345678',
    plate: '29C-999.99',
    points: 450,
    tier: 'Bạc',
    historyCount: 4,
    spentTotal: 4500000,
    vouchers: []
  },
  {
    id: 'm-4',
    name: 'Quốc Bảo',
    phone: '0933445566',
    plate: '51G-425.96',
    points: 120,
    tier: 'Đồng',
    historyCount: 1,
    spentTotal: 1200000,
    vouchers: []
  }
];

const buildInventorySeed = (
  category: InventoryItem['category'],
  names: string[],
  unit: string,
  startQty: number,
  stepQty: number,
  minBase: number
): InventoryItem[] => names.map((name, index) => ({
  id: `inv-${category.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`,
  name,
  category,
  quantity: startQty + index * stepQty,
  unit,
  minThreshold: minBase + (index % 4),
  lastUpdated: '05/07/2026',
  history: [
    {
      id: `h-${category}-${index + 1}`,
      type: index % 2 === 0 ? 'IN' : 'OUT',
      qty: 10 + index * 2,
      reason: 'Cập nhật kho mẫu',
      timestamp: '04/07/2026'
    }
  ]
}));

export const INITIAL_INVENTORY: InventoryItem[] = [
  ...buildInventorySeed('Hóa chất', [
    'Bọt tuyết mịn WASSUP Active Foam',
    'Dung dịch Wax bóng WASSUP Wax Gloss',
    'Phủ bóng ceramic Graphene Coat',
    'Dung dịch dưỡng lốp Tire Gel',
    'Dung dịch khử mùi Cabin Sanitizer',
    'Dung dịch tẩy dầu mỡ Engine Degreaser',
    'Dung dịch vệ sinh kính Glass Cleaner',
    'Dung dịch làm mềm thảm Carpet Shampoo',
    'Dung dịch tẩy vết bẩn Alloy Cleaner',
    'Dung dịch phủ bảo vệ Trim Protectant',
    'Dung dịch làm sáng nhựa Plastic Restorer',
    'Dung dịch rửa bề mặt chrome Chrome Polish',
    'Dung dịch diệt khuẩn cabin Antibacterial Mist',
    'Dung dịch làm sáng lốp Tire Brightener',
    'Dung dịch làm sạch nội thất Interior Cleaner',
    'Dung dịch vệ sinh nắp máy Hood Cleaner',
    'Dung dịch tẩy dầu mỡ bánh xe Wheel Cleaner',
    'Dung dịch tăng độ bóng Paint Sealant',
    'Dung dịch làm sạch sợi vải Fabric Cleaner',
    'Dung dịch bảo dưỡng nhựa Rubber Conditioner'
  ], 'Lít', 120, 8, 20),
  ...buildInventorySeed('Vật tư', [
    'Khăn lau Microfiber siêu mịn',
    'Bộ miếng lau bề mặt đa năng',
    'Túi rác chuyên dụng cho booth',
    'Khẩu trang bảo hộ phòng chất hóa học',
    'Găng tay nitrile cao su',
    'Băng dính chống nước',
    'Hộp khăn giấy vệ sinh',
    'Bóng cản bụi cho vật phẩm',
    'Mút lau bề mặt nội thất',
    'Tấm lót chống trượt',
    'Khung treo khăn lau',
    'Bình xịt nước nhỏ giọt',
    'Giấy thấm dầu chuyên dụng',
    'Bìa nhựa bảo vệ ghế',
    'Túi đựng phụ kiện kỹ thuật',
    'Móc treo dụng cụ',
    'Màng bọc bảo vệ kính',
    'Khay đựng phụ kiện',
    'Băng keo màu đánh dấu',
    'Cặp đựng giấy vệ sinh' 
  ], 'Cái', 80, 6, 12),
  ...buildInventorySeed('Công cụ', [
    'Lõi lọc bông PP hệ thống RO 20 inch',
    'Bơm áp lực mini chuyên dụng',
    'Máy hút bụi cầm tay',
    'Bút đo độ dày sơn',
    'Kìm cắt dây điện',
    'Bộ đầu nối ống phun',
    'Máy đo áp suất lốp',
    'Bộ dụng cụ tháo lắp nắp',
    'Đèn pin kỹ thuật',
    'Bộ cờ lê đa năng',
    'Bộ vít đầu Phillips',
    'Bộ khóa mở cửa cabin',
    'Máy đo độ ẩm nội thất',
    'Máy quét bụi xe',
    'Bộ dụng cụ vệ sinh camera',
    'Mỏ hàn mini',
    'Bộ cọc đo độ bóng sơn',
    'Dụng cụ bẻ khóa nhanh',
    'Bộ đầu nối vòi nước',
    'Cây gạt nước cao áp'
  ], 'Cái', 15, 3, 4)
];

export const SERVICE_USAGE_RATES: ServiceUsageRate[] = [
  { serviceId: 'W0', serviceName: 'W0 - Express', foamLiters: 1.0, waxLiters: 0.2, ceramicLiters: 0, waterLiters: 40 },
  { serviceId: 'W1', serviceName: 'W1 - Basic Clean', foamLiters: 1.5, waxLiters: 0.4, ceramicLiters: 0, waterLiters: 60 },
  { serviceId: 'W2', serviceName: 'W2 - Full Clean', foamLiters: 2.0, waxLiters: 0.8, ceramicLiters: 0, waterLiters: 80 },
  { serviceId: 'W3', serviceName: 'W3 - Super Shine', foamLiters: 2.5, waxLiters: 1.2, ceramicLiters: 0.1, waterLiters: 100 },
  { serviceId: 'W4', serviceName: 'W4 - Detail Care', foamLiters: 3.5, waxLiters: 1.8, ceramicLiters: 0.2, waterLiters: 140 },
  { serviceId: 'W5', serviceName: 'W5 - WASSUP PRIME', foamLiters: 4.5, waxLiters: 2.5, ceramicLiters: 0.5, waterLiters: 180 }
];

export const POINT_ACCUMULATION_RATE = 10000; // 10,000 VND spent = 1 Loyalty Point
export const TIER_THRESHOLDS = {
  Bronze: 0,      // Đồng
  Silver: 500,    // Bạc
  Gold: 1500,     // Vàng
  Diamond: 3000   // Kim Cương
};

export const TIER_PERKS = {
  Đồng: 'Tích luỹ 1% điểm thưởng. Giảm 5k cho mỗi hoá đơn.',
  Bạc: 'Tích luỹ 2% điểm thưởng. Miễn phí kiểm tra áp suất lốp. Voucher sinh nhật.',
  Vàng: 'Tích luỹ 3% điểm thưởng. Miễn phí khử mùi diệt khuẩn cabin. Ưu tiên thứ tự rửa.',
  'Kim Cương': 'Tích luỹ 5% điểm thưởng. Giảm trực tiếp 10% gói chính. Miễn phí cà phê sảnh chờ.'
};

export const REDEMPTION_OPTIONS = [
  { id: 'r-1', points: 200, name: 'Voucher giảm giá 50k', value: 50000, type: 'voucher' },
  { id: 'r-2', points: 350, name: 'Voucher giảm giá 100k', value: 100000, type: 'voucher' },
  { id: 'r-3', points: 600, name: 'Miễn phí Khử mùi diệt khuẩn cabin (W2 addon)', value: 499000, type: 'addon' },
  { id: 'r-4', points: 1000, name: 'Miễn phí gói rửa xe W1 - Basic Clean', value: 149000, type: 'service' },
  { id: 'r-5', points: 1800, name: 'Miễn phí gói rửa xe W2 - Full Clean', value: 299000, type: 'service' }
];
