import React, { useState } from 'react';
import { ShieldCheck, Lock, Check, RefreshCw } from 'lucide-react';

interface LoginGateProps {
  role: 'opr' | 'pos' | 'mgr';
  passcode?: string;
  onLoginSuccess: (role: 'opr' | 'pos' | 'mgr') => void;
  onCancel?: () => void;
}

export default function LoginGate({ role, passcode, onLoginSuccess, onCancel }: LoginGateProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const ROLE_PINS = {
    opr: passcode || '888888',
    pos: passcode || '666666',
    mgr: passcode || '999999'
  };

  const ROLE_NAMES = {
    opr: 'Kỹ Thuật Viên (Operator)',
    pos: 'Thu Ngân Quầy (Cashier POS)',
    mgr: 'Quản Lý Trạm (Manager)'
  };

  const handleKeyPress = (num: string) => {
    setError('');
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);
      
      // Auto-submit when 6 digits are reached
      if (nextPin === ROLE_PINS[role]) {
        setTimeout(() => {
          onLoginSuccess(role);
          setPin('');
        }, 300);
      } else if (nextPin.length === 6) {
        setTimeout(() => {
          setError('Mã PIN không đúng, vui lòng thử lại!');
          setPin('');
        }, 300);
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  return (
    <div className="max-w-md mx-auto bg-black/60 border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl text-center select-none animate-fadeIn">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#A2C62C]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-16 h-16 bg-[#A2C62C]/20 text-[#A2C62C] rounded-full flex items-center justify-center mx-auto mb-5 shadow-[0_0_20px_rgba(162,198,44,0.2)]">
        <Lock className="w-7 h-7" />
      </div>

      <h2 className="text-xl font-bold text-white mb-1 uppercase tracking-wider">Yêu cầu Xác thực</h2>
      <p className="text-xs text-white/50 mb-6">Bạn đang truy cập phân hệ <span className="text-[#A2C62C] font-bold font-mono">{ROLE_NAMES[role]}</span></p>

      {/* PIN Indicators */}
      <div className="flex justify-center gap-3 mb-6">
        {[0, 1, 2, 3, 4, 5].map((idx) => (
          <div 
            key={idx} 
            className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
              pin.length > idx 
                ? 'bg-[#A2C62C] border-[#A2C62C] scale-110 shadow-[0_0_10px_#A2C62C]' 
                : 'border-white/20 bg-transparent'
            }`}
          />
        ))}
      </div>

      {error ? (
        <p className="text-xs text-red-400 font-bold mb-6 animate-shake">{error}</p>
      ) : (
        <p className="text-[11px] text-white/40 mb-6">Nhập mã PIN gồm 6 chữ số để đăng nhập.</p>
      )}

      {/* Visual PIN Pad */}
      <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto mb-8">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button
            key={num}
            onClick={() => handleKeyPress(num)}
            className="h-14 rounded-xl bg-white/5 hover:bg-[#A2C62C]/15 border border-white/5 hover:border-[#A2C62C]/30 text-white font-mono font-bold text-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleClear}
          className="h-14 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 text-red-400 font-bold text-xs transition-all active:scale-95 flex items-center justify-center cursor-pointer"
        >
          Xóa
        </button>
        <button
          onClick={() => handleKeyPress('0')}
          className="h-14 rounded-xl bg-white/5 hover:bg-[#A2C62C]/15 border border-white/5 hover:border-[#A2C62C]/30 text-white font-mono font-bold text-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer"
        >
          0
        </button>
        <div className="h-14 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white/20" />
        </div>
      </div>



      {onCancel && (
        <button
          onClick={onCancel}
          className="text-xs text-white/40 hover:text-white underline transition-all uppercase tracking-widest font-bold"
        >
          Quay lại sảnh (Kiosk)
        </button>
      )}
    </div>
  );
}
