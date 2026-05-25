import React from 'react';
import { PlayerInfo } from '../types';

export default function RouletteTable({ 
  onPlaceBet, 
  localBets, 
  phase, 
  allPlayersBets,
  winningNumber 
}: { 
  onPlaceBet: (spot: string) => void, 
  localBets: {spot: string, amount: number}[],
  phase: string,
  allPlayersBets: Record<string, PlayerInfo>,
  winningNumber: any
}) {

  const REDS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].map(String);

  const getSpotColor = (numStr: string) => {
    if (numStr === '0') return 'bg-emerald-700 hover:bg-emerald-600 border border-white/20';
    if (REDS.includes(numStr)) return 'bg-rose-600 hover:bg-rose-500 border border-white/20';
    return 'bg-slate-950 hover:bg-slate-800 border border-white/20'; 
  };

  const Spot = ({ spot, label, colSpan = 1, rowSpan = 1, customColor, className }: { key?: React.Key, spot: string, label?: React.ReactNode, colSpan?: number, rowSpan?: number, customColor?: string, className?: string }) => {
    
    const isWinning = phase === 'RESULTS' && (
      (winningNumber !== null && String(winningNumber) === spot) ||
      (spot === 'RED' && REDS.includes(String(winningNumber))) ||
      (spot === 'BLACK' && !REDS.includes(String(winningNumber)) && winningNumber !== 0) ||
      (spot === 'EVEN' && winningNumber !== 0 && (Number(winningNumber) % 2 === 0)) ||
      (spot === 'ODD' && winningNumber !== 0 && (Number(winningNumber) % 2 !== 0)) ||
      (spot === '1-18' && winningNumber !== 0 && Number(winningNumber) >= 1 && Number(winningNumber) <= 18) ||
      (spot === '19-36' && winningNumber !== 0 && Number(winningNumber) >= 19 && Number(winningNumber) <= 36) ||
      (spot === '1st 12' && winningNumber !== 0 && Number(winningNumber) >= 1 && Number(winningNumber) <= 12) ||
      (spot === '2nd 12' && winningNumber !== 0 && Number(winningNumber) >= 13 && Number(winningNumber) <= 24) ||
      (spot === '3rd 12' && winningNumber !== 0 && Number(winningNumber) >= 25 && Number(winningNumber) <= 36) ||
      (spot === 'COL1' && winningNumber !== 0 && Number(winningNumber) % 3 === 1) ||
      (spot === 'COL2' && winningNumber !== 0 && Number(winningNumber) % 3 === 2) ||
      (spot === 'COL3' && winningNumber !== 0 && Number(winningNumber) % 3 === 0)
    );

    // Calculate total bet on this spot
    let totalSpotBet = 0;
    Object.values(allPlayersBets).forEach(p => {
       const b = p.bets?.find(x => x.spot === spot);
       if (b) totalSpotBet += b.amount;
    });

    const localBetAmount = localBets.find(b => b.spot === spot)?.amount || 0;

    return (
      <button 
        onClick={() => onPlaceBet(spot)}
        disabled={phase !== 'BETTING'}
        style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}` }}
        className={`w-full h-full relative flex items-center justify-center font-bold text-lg md:text-xl transition-colors
          ${customColor ? customColor : getSpotColor(spot)}
          ${phase !== 'BETTING' ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}
          ${isWinning ? 'ring-4 ring-yellow-400 z-10 animate-pulse' : ''}
          ${className || ''}
        `}
      >
        <span className="text-white drop-shadow-md z-0">{label || spot}</span>
        
        {/* Bet Chips */}
        {totalSpotBet > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`
              w-8 h-8 md:w-10 md:h-10 rounded-full border-4 border-dashed border-emerald-400 flex items-center justify-center shadow-lg transform -translate-y-1
              ${localBetAmount > 0 ? 'bg-emerald-600' : 'bg-slate-600 border-white/40'}
            `}>
              <span className="text-[10px] md:text-xs text-white font-mono font-bold leading-none tracking-tighter">
                {totalSpotBet > 999 ? (totalSpotBet/1000).toFixed(1)+'k' : totalSpotBet}
              </span>
            </div>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="w-full bg-[#076324] rounded-xl border-4 border-[#D4AF37] p-2 relative shadow-inner min-w-[700px]">
      
      {/* Numbers Grid */}
      <div className="grid grid-cols-[60px_repeat(12,1fr)_60px] grid-rows-3 gap-[2px] h-[180px]">
        
        {/* Zeroes */}
        <div className="row-span-3 flex flex-col gap-[2px] w-full">
           <Spot spot="0" rowSpan={3} className="h-full flex-1 rounded-l-lg" />
        </div>

        {/* 1-36 Numbers mapping. European roulette layout columns */}
        {/* Column 1: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36 */}
        {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map(n => (
          <Spot key={n} spot={String(n)} />
        ))}
        <Spot spot="COL3" label="2 to 1" customColor="bg-black/20 hover:bg-black/30 border border-white/10 rounded-tr-lg text-xs" />
        
        {/* Column 2: 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35 */}
        {[2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].map(n => (
          <Spot key={n} spot={String(n)} />
        ))}
        <Spot spot="COL2" label="2 to 1" customColor="bg-black/20 hover:bg-black/30 border border-white/10 text-xs" />

        {/* Column 3: 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34 */}
        {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].map(n => (
          <Spot key={n} spot={String(n)} />
        ))}
        <Spot spot="COL1" label="2 to 1" customColor="bg-black/20 hover:bg-black/30 border border-white/10 rounded-br-lg text-xs" />
      </div>

      {/* Outside Bets Grid */}
      <div className="grid grid-cols-[auto_repeat(12,1fr)] gap-[2px] mt-2 mb-1">
        <div className="col-span-1 w-[60px]"></div>
        <div className="col-span-12 grid grid-cols-3 gap-[2px] h-12">
          <Spot spot="1st 12" customColor="bg-black/20 hover:bg-black/30 border border-white/10 rounded-lg text-xs" />
          <Spot spot="2nd 12" customColor="bg-black/20 hover:bg-black/30 border border-white/10 rounded-lg text-xs" />
          <Spot spot="3rd 12" customColor="bg-black/20 hover:bg-black/30 border border-white/10 rounded-lg text-xs" />
        </div>
      </div>
      
      <div className="grid grid-cols-[auto_repeat(12,1fr)] gap-[2px] h-12">
        <div className="col-span-1 w-[60px]"></div>
        <div className="col-span-12 grid grid-cols-6 gap-[2px] h-12">
          <Spot spot="1-18" label="1 to 18" customColor="bg-black/20 hover:bg-black/30 border border-white/10 rounded-lg text-[10px]" />
          <Spot spot="EVEN" customColor="bg-black/20 hover:bg-black/30 border border-white/10 rounded-lg text-[10px]" />
          <Spot spot="RED" customColor="bg-rose-900 border border-rose-500/50 hover:bg-rose-800 rounded-lg text-[10px]" />
          <Spot spot="BLACK" customColor="bg-slate-950 border border-white/20 hover:bg-slate-900 rounded-lg text-[10px]" />
          <Spot spot="ODD" customColor="bg-black/20 hover:bg-black/30 border border-white/10 rounded-lg text-[10px]" />
          <Spot spot="19-36" label="19 to 36" customColor="bg-black/20 hover:bg-black/30 border border-white/10 rounded-lg text-[10px]" />
        </div>
      </div>

    </div>
  );
}
