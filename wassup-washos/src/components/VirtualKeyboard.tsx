import React from 'react';
import { Delete, Trash2 } from 'lucide-react';

interface VirtualKeyboardProps {
  value: string;
  onChange: (newValue: string) => void;
  layoutType?: 'plate' | 'phone' | 'text';
  onClose?: () => void;
}

export default function VirtualKeyboard({
  value,
  onChange,
  layoutType = 'text',
  onClose
}: VirtualKeyboardProps) {
  const handleKeyClick = (key: string) => {
    if (key === 'BACK') {
      onChange(value.slice(0, -1));
    } else if (key === 'CLEAR') {
      onChange('');
    } else if (key === 'SPACE') {
      onChange(value + ' ');
    } else {
      onChange(value + key);
    }
  };

  // Plate layout (optimized for Vietnamese license plates, uppercase)
  const plateKeys = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'L'],
    ['M', 'N', 'P', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z'],
    ['-', '.', 'CLEAR', 'BACK']
  ];

  // Numpad layout for phones
  const phoneKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['CLEAR', '0', 'BACK']
  ];

  // Simple text keyboard layout
  const textKeys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '-'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '.', ' ', 'BACK'],
    ['SPACE', 'CLEAR']
  ];

  const keysToRender = 
    layoutType === 'plate' 
      ? plateKeys 
      : layoutType === 'phone' 
        ? phoneKeys 
        : textKeys;

  return (
    <div className="bg-black/80 border border-[#A2C62C]/20 rounded-2xl p-4 w-full max-w-lg mx-auto shadow-[0_0_25px_rgba(162,198,44,0.1)] select-none animate-fadeIn">
      <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-white/5">
        <span className="text-[10px] font-bold tracking-widest text-[#A2C62C] uppercase">
          BÀN PHÍM ĐIỆN TỬ WASSUP ({layoutType === 'plate' ? 'BIỂN SỐ' : layoutType === 'phone' ? 'SỐ ĐIỆN THOẠI' : 'CHỮ'})
        </span>
        {onClose && (
          <button 
            type="button"
            onClick={onClose} 
            className="text-[10px] bg-[#A2C62C]/10 text-[#A2C62C] px-2 py-1 rounded hover:bg-[#A2C62C]/20 font-bold transition-all"
          >
            Ẩn phím
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {keysToRender.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1.5 w-full">
            {row.map((key, kIdx) => {
              const isSpecial = ['BACK', 'CLEAR', 'SPACE'].includes(key);
              let btnClass = "h-11 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ";
              
              if (key === 'SPACE') {
                btnClass += "flex-1 bg-white/10 hover:bg-[#A2C62C]/20 text-white border border-white/10";
              } else if (key === 'BACK') {
                btnClass += "w-14 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400";
              } else if (key === 'CLEAR') {
                btnClass += "w-14 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60";
              } else {
                // Regular keys
                btnClass += `flex-1 min-w-[32px] bg-black/50 border border-white/10 text-white hover:border-[#A2C62C] hover:text-[#A2C62C] hover:bg-[#A2C62C]/5`;
              }

              return (
                <button
                  key={kIdx}
                  type="button"
                  onClick={() => handleKeyClick(key)}
                  className={btnClass}
                >
                  {key === 'BACK' ? (
                    <Delete className="w-4 h-4" />
                  ) : key === 'CLEAR' ? (
                    <Trash2 className="w-3.5 h-3.5" />
                  ) : (
                    key
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
