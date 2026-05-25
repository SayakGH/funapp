import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { socket } from '../socket';
import { LogOut } from 'lucide-react';
import RouletteWheel from './RouletteWheel';
import RouletteTable from './RouletteTable';

export default function Room() {
  const room = useGameStore((state) => state.room);
  const setRoom = useGameStore((state) => state.setRoom);
  const user = useGameStore((state) => state.user);
  const [localBets, setLocalBets] = useState<{spot: string, amount: number}[]>([]);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [betError, setBetError] = useState("");

  useEffect(() => {
    const handleRoomState = (newRoomState: any) => {
      setRoom(newRoomState);
      if (newRoomState.phase === 'BETTING') {
         if (newRoomState.timer >= 19) {
            setLocalBets([]);
            setBetError("");
         }
      }
    };
    
    const handleBetError = (err: string) => {
       setBetError(err);
    };

    socket.on("room_state", handleRoomState);
    socket.on("bet_error", handleBetError);

    return () => {
      socket.off("room_state", handleRoomState);
      socket.off("bet_error", handleBetError);
    };
  }, [setRoom]);

  if (!room || !user) return null;

  const handleLeaveRoom = () => {
    socket.disconnect();
    setRoom(null);
  };

  const handlePlaceBet = (spot: string) => {
    if (room.phase !== 'BETTING') return;
    
    const maxBet = user.pollars - localBets.reduce((acc, b) => acc + b.amount, 0);
    const amountToBet = Math.min(betAmount, maxBet);
    
    if (amountToBet < 10) {
      setBetError("Not enough pollars to cover minimum bet (10)");
      return;
    }

    const newBets = [...localBets];
    const existingBetIndex = newBets.findIndex(b => b.spot === spot);
    if (existingBetIndex >= 0) {
       newBets[existingBetIndex].amount += amountToBet;
    } else {
       newBets.push({ spot, amount: amountToBet });
    }
    
    setLocalBets(newBets);
    socket.emit("place_bet", { bets: newBets });
  };

  const handleClearBets = () => {
    if (room.phase !== 'BETTING') return;
    setLocalBets([]);
    socket.emit("place_bet", { bets: [] });
  };

  const currentPollars = user.pollars - localBets.reduce((acc, b) => acc + b.amount, 0);

  return (
    <div className="w-full h-screen bg-slate-950 flex flex-col font-sans overflow-hidden text-slate-100">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-900/20 rounded-full blur-[120px]"></div>
      </div>

      <header className="h-20 w-full flex items-center justify-between px-8 bg-white/5 backdrop-blur-xl border-b border-white/10 z-10 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <span className="text-2xl font-bold">P</span>
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase hidden md:block">Pollars Royale</h1>
            <button 
               onClick={handleLeaveRoom}
               className="ml-4 flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-rose-400 hover:text-rose-300"
            >
              <LogOut size={14} /> Leave
            </button>
          </div>
          <div className="h-8 w-px bg-white/20"></div>
          <div className="flex flex-col">
            <span className="text-[10px] text-white/50 uppercase tracking-widest">Room Code</span>
            <span className="text-emerald-400 font-mono font-bold">#{room.roomId}</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-white/50 uppercase tracking-widest">Balance</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white">{currentPollars.toLocaleString()}</span>
              <span className="text-xs text-emerald-400 font-bold hidden sm:inline">POLLARS</span>
            </div>
          </div>
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-[10px] text-white/50 uppercase tracking-widest">Rebirths</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-rose-400">{user.rebirths}</span>
              <span className="px-2 py-0.5 bg-rose-500/20 rounded text-[10px] font-bold border border-rose-500/30">LIFETIME</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col-reverse xl:flex-row w-full p-4 md:p-6 gap-6 z-10 overflow-y-auto">
        
        <section className="flex-[1.8] bg-slate-900/40 rounded-3xl border border-white/5 backdrop-blur-md p-4 flex flex-col items-center justify-center relative shadow-2xl xl:h-full min-h-[400px]">
           <div className="absolute top-4 text-center z-20">
             {room.phase === 'BETTING' && (
                <div className="bg-black/50 px-6 py-2 rounded-full border border-white/10 backdrop-blur-sm animate-pulse">
                   <h2 className="text-sm font-bold uppercase tracking-widest text-white">Place Your Bets &bull; <span className="text-emerald-400">{room.timer}s</span></h2>
                </div>
             )}
             {room.phase === 'SPINNING' && (
                <div className="bg-rose-900/50 px-6 py-2 rounded-full border border-rose-500/30 backdrop-blur-sm">
                   <h2 className="text-sm font-bold uppercase tracking-widest text-rose-100">No More Bets &bull; Spinning</h2>
                </div>
             )}
             {room.phase === 'RESULTS' && (
                <div className="bg-emerald-900/50 px-6 py-2 rounded-full border border-emerald-500/30 backdrop-blur-sm">
                   <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-100">Winning Number: <span className="text-xl font-black text-emerald-400">{room.winningNumber}</span></h2>
                </div>
             )}
           </div>

           <div className="w-full max-w-[800px] overflow-x-auto pb-4 mt-8">
             <RouletteTable 
               onPlaceBet={handlePlaceBet} 
               localBets={localBets}
               phase={room.phase}
               allPlayersBets={room.players}
               winningNumber={room.winningNumber}
             />
           </div>
        </section>

        <aside className="flex-1 flex flex-col gap-6">
          <div className="bg-slate-900/60 rounded-3xl border border-white/5 p-6 flex flex-col items-center flex-1 relative min-h-[300px]">
            <div className="mb-4">
              <RouletteWheel phase={room.phase} winningNumber={room.winningNumber} timer={room.timer} />
            </div>
            
            <div className="w-full space-y-4 mt-auto">
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                   <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Wager Amount</label>
                   {betError && <span className="text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded font-bold">{betError}</span>}
                </div>
                 <div className="grid grid-cols-4 gap-2">
                   {[10, 50, 100, 500, 1000, 5000].map(amt => (
                     <button
                       key={amt}
                       onClick={() => setBetAmount(amt)}
                       className={`py-2 rounded-xl text-xs font-black transition-all border ${betAmount === amt ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_4px_15px_rgba(16,185,129,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}
                     >
                        {amt >= 1000 ? (amt/1000)+'K' : amt}
                     </button>
                   ))}
                   <button
                       onClick={() => setBetAmount(currentPollars)}
                       className="py-2 rounded-xl text-xs font-black transition-all border bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
                     >
                        MAX ({currentPollars})
                   </button>
                   <button
                       onClick={handleClearBets}
                       className="py-2 rounded-xl text-xs font-black transition-all border bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30"
                       disabled={room.phase !== 'BETTING' || localBets.length === 0}
                     >
                        CLEAR BETS
                   </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="h-40 bg-white/5 backdrop-blur-xl border-t border-white/10 p-4 z-10 shrink-0 hidden md:block">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40">Room Players</h3>
          <span className="text-[10px] text-emerald-400 font-bold">LIVE UPDATES</span>
        </div>
        <div className="flex gap-4 overflow-x-auto w-full pb-2">
           {Object.entries(room.players).map(([sockId, pInfo]) => {
              const totalBet = pInfo.bets?.reduce((a, b) => a + b.amount, 0) || 0;
              const result = room.results?.[sockId];
              const isMe = pInfo.username === user.username;
              return (
                <div key={sockId} className={`flex-none w-48 rounded-xl border p-3 flex flex-col ${isMe ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
                  <span className={`text-[10px] font-bold mb-1 uppercase tracking-widest ${isMe ? 'text-emerald-400' : 'text-white/30'}`}>{isMe ? 'YOU' : 'OPPONENT'}</span>
                  <span className="text-xs font-bold truncate">{pInfo.username}</span>
                  <span className="text-emerald-400 font-black text-sm mt-auto">${pInfo.pollars.toLocaleString()}</span>
                  <div className="mt-1 flex justify-between text-[10px] font-bold border-t border-white/10 pt-1">
                     <span className="text-amber-500">BET: {totalBet}</span>
                     {typeof result === 'number' && (
                        <span className={result > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {result > 0 ? `+${result}` : 'LOST'}
                        </span>
                     )}
                  </div>
                </div>
              );
            })}
        </div>
      </footer>

    </div>
  );
}
