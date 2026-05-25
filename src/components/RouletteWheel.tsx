import React from 'react';
import { motion } from 'motion/react';

const ROULETTE_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

const REDS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].map(String);

function getColor(num: number | string) {
  if (num === 0) return 'bg-emerald-600';
  if (REDS.includes(String(num))) return 'bg-rose-600';
  return 'bg-slate-900';
}

export default function RouletteWheel({ phase, winningNumber, timer }: { phase: string, winningNumber: any, timer: number }) {
  
  // Calculate rotation to land on the winning number
  let targetRotation = 0;
  if (phase === 'SPINNING' || phase === 'RESULTS') {
    if (winningNumber !== null) {
      const index = ROULETTE_NUMBERS.indexOf(winningNumber);
      if (index !== -1) {
        const sliceAngle = 360 / ROULETTE_NUMBERS.length;
        targetRotation = 360 * 5 - (index * sliceAngle); // Spin 5 times and offset
      }
    }
  }

  return (
    <div className="relative w-56 h-56 md:w-64 md:h-64 xl:w-80 xl:h-80 rounded-full border-[10px] md:border-[16px] border-[#3E2723] bg-[#1a0f0a] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center p-2 xl:p-4 isolate">
      
      {/* Immobile outer bowl shadow */}
      <div className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] pointer-events-none z-10" />

      {/* The pointer at the top */}
      <div className="absolute top-0 left-1/2 -ml-2 w-4 h-6 md:h-8 bg-[#D4AF37] z-20 pointer-events-none shadow-md rounded-b-md border border-[#B8860B]"></div>
      <div className="absolute top-0 left-1/2 -ml-[2px] w-1 h-5 md:h-7 bg-white/40 z-20 pointer-events-none rounded-b-md"></div>

      <motion.div 
        className="relative w-full h-full rounded-full"
        initial={{ rotate: 0 }}
        animate={{ 
          rotate: phase === 'SPINNING' || phase === 'RESULTS' ? targetRotation : 0 
        }}
        transition={{ 
          duration: phase === 'SPINNING' ? 8 : 0, 
          ease: "circOut" 
        }}
        style={{ originX: 0.5, originY: 0.5 }}
      >
        {ROULETTE_NUMBERS.map((num, i) => {
          const rotation = (360 / ROULETTE_NUMBERS.length) * i;
          return (
            <div 
              key={num} 
              className="absolute top-0 left-1/2 -ml-[4%] w-[8%] h-1/2 origin-bottom flex flex-col items-center justify-start"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <div className="h-[20%] w-full flex items-center justify-center pt-1 md:pt-2">
                <span className="relative z-10 text-white font-bold text-[8px] md:text-[10px] xl:text-xs">
                   {num}
                </span>
              </div>
              
              {/* Pocket background (inner) */}
              <div 
                 className={`w-full h-[80%] origin-bottom border-x border-black/40 shadow-inner ${getColor(num)}`}
                 style={{
                   clipPath: 'polygon(15% 0, 85% 0, 50% 100%)',
                   transform: `scaleX(1.4)`
                 }}
              />
            </div>
          );
        })}
        
        {/* Inner wood/metal center */}
        <div className="absolute inset-0 m-auto w-[60%] h-[60%] bg-[#D4AF37] border-4 border-[#B8860B] rounded-full shadow-lg overflow-hidden flex items-center justify-center">
             <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-black/20 pointer-events-none"></div>
             
             {/* Center decorative spindle */}
             <div className="w-10 h-10 md:w-16 md:h-16 bg-[#2E1810] rounded-full flex items-center justify-center shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] overflow-hidden border-2 border-[#1a0e09]">
                <div className="w-3 h-3 md:w-4 md:h-4 bg-[#D4AF37] rounded-full shadow-[0_0_10px_rgba(0,0,0,0.8)] z-10"></div>
                
                {/* Spindle handles */}
                <div className="absolute w-1.5 h-full bg-[#B8860B] rotate-0"></div>
                <div className="absolute w-1.5 h-full bg-[#B8860B] rotate-90"></div>
                <div className="absolute w-1.5 h-full bg-[#B8860B] rotate-45"></div>
                <div className="absolute w-1.5 h-full bg-[#B8860B] -rotate-45"></div>
             </div>
        </div>
      </motion.div>
    </div>
  );
}
