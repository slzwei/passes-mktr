import React from 'react';
import { Star, Award } from 'lucide-react';

const Stamp = ({ filled = false }) => {
  return (
    <div className={`w-8 h-8 rounded-full border-2 border-white/50 flex items-center justify-center transition-all duration-300 ${filled ? 'bg-white/90' : 'bg-white/20'}`}>
      {filled && <Award className="h-4 w-4 text-red-500" />}
    </div>
  );
};

export default function WalletPassSimple() {
  const stamps = Array(10).fill(false);
  stamps[0] = true;
  stamps[1] = true;
  stamps[2] = true;

  const Barcode = () => (
    <div className="flex items-center justify-center h-10 w-full px-3">
      <div className="flex h-full w-full items-end gap-[1px]">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="bg-black"
            style={{
              height: `${20 + Math.random() * 80}%`,
              width: `${Math.random() > 0.3 ? 2 : 1}px`,
            }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-red-500 to-red-600 h-full flex flex-col justify-between text-white p-3 rounded-[1.5rem] overflow-hidden relative">
      {/* Background pattern */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full transform translate-x-8 -translate-y-8"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full transform -translate-x-4 translate-y-4"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-400 flex items-center justify-center rounded-lg">
              <Star className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-bold text-sm">COFFEE REWARDS</h2>
          </div>
          <p className="font-semibold text-white/80">• • •</p>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-4">
          {stamps.map((filled, index) => (
            <Stamp key={index} filled={filled} />
          ))}
        </div>

        <div className="mb-4">
          <p className="text-xs font-medium opacity-80 uppercase tracking-wider">Next reward in</p>
          <p className="text-lg font-bold">7 stamps</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-2 text-center relative z-10">
        <Barcode />
        <p className="text-xs text-gray-500 mt-1">Member #4782</p>
      </div>
    </div>
  );
}
