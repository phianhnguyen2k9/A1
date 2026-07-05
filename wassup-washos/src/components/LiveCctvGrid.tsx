import React, { useState, useEffect } from 'react';
import { Camera, Radio, Shield, RefreshCw } from 'lucide-react';

interface CameraState {
  id: string;
  name: string;
  location: string;
  status: 'ACTIVE' | 'SYSTEM_READY' | 'ALARM' | 'MAINTENANCE';
  statusCode: string;
  info: string;
}

export default function LiveCctvGrid() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const cameras: CameraState[] = [
    {
      id: 'CAM_01',
      name: 'ENTRY KIOSK LOBBY',
      location: 'Sảnh Đón Khách',
      status: 'ACTIVE',
      statusCode: 'TRAFFIC_CHECK',
      info: 'Phát hiện phương tiện vào trạm',
    },
    {
      id: 'CAM_02',
      name: 'BOOTH 1: WASH BAY',
      location: 'Bơm Áp Lực Tự Động',
      status: 'ACTIVE',
      statusCode: 'WASH_CYCLE_ACTIVE',
      info: 'Đang phun nước RO áp lực cao',
    },
    {
      id: 'CAM_03',
      name: 'BOOTH 2: UNDER-LIFT',
      location: 'Khu Cầu Nâng Gầm',
      status: 'SYSTEM_READY',
      statusCode: 'HYDRAULIC_STABLE',
      info: 'Hệ thống nâng gầm sẵn sàng',
    },
    {
      id: 'CAM_04',
      name: 'BOOTH 3: DETAIL LOBBY',
      location: 'Phòng Phủ Ceramic',
      status: 'MAINTENANCE',
      statusCode: 'HVAC_FILTER_REPLACE',
      info: 'Đang thay bộ lọc phòng kính bụi',
    },
    {
      id: 'CAM_05',
      name: 'CHEMICAL VAULT',
      location: 'Kho Chứa Hóa Chất',
      status: 'ALARM',
      statusCode: 'WATER_TANK_LOW_12%',
      info: 'Bể cấp nước RO xuống dưới 20%',
    },
    {
      id: 'CAM_06',
      name: 'QC GATE & DELIVERY',
      location: 'Cửa Ra Bàn Giao Xe',
      status: 'ACTIVE',
      statusCode: 'DELIVERY_READY',
      info: 'Xe đã qua QC chờ khách thanh toán',
    },
  ];

  const getStatusStyle = (status: CameraState['status']) => {
    switch (status) {
      case 'ACTIVE':
        return { bg: 'bg-green-500/10 border-green-500/30 text-green-400', label: 'LIVE' };
      case 'SYSTEM_READY':
        return { bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400', label: 'READY' };
      case 'ALARM':
        return { bg: 'bg-red-500/10 border-red-500/30 text-red-400', label: 'ALERT' };
      case 'MAINTENANCE':
        return { bg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400', label: 'MAINT' };
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/70 flex items-center gap-1.5 font-sans">
              <Camera className="w-3.5 h-3.5 text-[#A2C62C]" />
              Trung tâm giám sát CCTV thời gian thực
            </h3>
            <p className="text-[10px] text-white/40 mt-0.5">Hệ thống 6 ống kính bảo mật kiểm soát kỹ thuật & sảnh</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-right">
          <span className="text-[10px] bg-white/5 border border-white/10 px-2.5 py-1 rounded font-mono text-white/60 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-[#A2C62C]" /> Feed: 1080P // 30FPS
          </span>
          <span className="font-mono text-xs font-bold text-white/50 tracking-wider">
            {time.toLocaleDateString('vi-VN')} {time.toLocaleTimeString('vi-VN', { hour12: false })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cameras.map((cam) => {
          const style = getStatusStyle(cam.status);
          return (
            <div key={cam.id} className="bg-black/40 border border-white/5 rounded-xl overflow-hidden relative flex flex-col justify-between group h-44 shadow-lg hover:border-white/15 transition-all">
              {/* Scanline / Grid Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none opacity-40 z-10"></div>
              
              {/* Scanline green bar animate */}
              {cam.status === 'ACTIVE' && (
                <div className="absolute top-0 left-0 w-full h-[1.5px] bg-green-500/20 animate-pulse pointer-events-none z-10"></div>
              )}

              {/* Cam Top Info overlay */}
              <div className="p-2.5 flex justify-between items-start relative z-20 bg-gradient-to-b from-black/80 to-transparent">
                <div>
                  <span className="font-mono text-[9px] font-extrabold text-white/80 block">{cam.id}</span>
                  <span className="text-[8px] text-white/40 font-bold uppercase truncate max-w-[100px] block">{cam.name}</span>
                </div>
                <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase font-mono ${style.bg} flex items-center gap-1`}>
                  {cam.status === 'ACTIVE' && <span className="w-1 h-1 rounded-full bg-red-500 animate-ping"></span>}
                  {style.label}
                </span>
              </div>

              {/* Simulated Camera Center Graphics */}
              <div className="flex-1 flex flex-col items-center justify-center p-2 relative z-10 text-center select-none">
                <div className="text-white/20 group-hover:text-white/40 transition-colors">
                  {cam.status === 'ACTIVE' ? (
                    <div className="relative">
                      <Shield className="w-10 h-10 animate-pulse text-white/10" />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-green-500/50">W_0{cam.id.slice(-1)}</span>
                    </div>
                  ) : cam.status === 'ALARM' ? (
                    <div className="relative">
                      <Shield className="w-10 h-10 text-red-500/20" />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-red-500/50">ERR</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <Shield className="w-10 h-10 text-white/5" />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white/20">STB</span>
                    </div>
                  )}
                </div>
                <div className="text-[8px] tracking-widest text-white/30 uppercase mt-2 font-mono truncate w-full px-2" title={cam.statusCode}>
                  {cam.statusCode}
                </div>
              </div>

              {/* Cam Bottom Info overlay */}
              <div className="p-2.5 relative z-20 bg-gradient-to-t from-black/95 to-black/30 border-t border-white/5 text-[9px] leading-tight">
                <div className="font-bold text-white/80 truncate">{cam.location}</div>
                <div className="text-white/40 truncate mt-0.5" title={cam.info}>{cam.info}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
