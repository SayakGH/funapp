import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { socket } from '../socket';

export default function Dashboard() {
  const user = useGameStore((state) => state.user);
  const setUser = useGameStore((state) => state.setUser);
  const [joinCode, setJoinCode] = useState("");
  const [leaderboard, setLeaderboard] = useState<{username: string, pollars: number, rebirths: number}[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [refilling, setRefilling] = useState(false);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => setLeaderboard(data.leaderboard))
      .catch(console.error);
  }, [showLeaderboard]);

  if (!user) return null;

  const handleCreateRoom = () => {
    socket.connect();
    socket.emit("join_room", { username: user.username, create: true });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;
    socket.connect();
    socket.emit("join_room", { username: user.username, roomId: joinCode.toUpperCase() });
  };

  const handleRefill = async () => {
    setRefilling(true);
    try {
      const res = await fetch('/api/refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      } else {
        alert(data.error);
      }
    } catch(err) {
      console.error(err);
    }
    setRefilling(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 font-sans text-slate-100 overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-900/20 rounded-full blur-[120px]"></div>
      </div>

      <header className="py-4 w-full flex flex-col md:flex-row md:h-20 items-center justify-between px-4 md:px-8 bg-white/5 backdrop-blur-xl border-b border-white/10 z-10 shrink-0 gap-4 md:gap-0">
        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <span className="text-xl md:text-2xl font-bold">P</span>
            </div>
            <h1 className="text-lg md:text-xl font-black tracking-tighter uppercase sm:block">Pollars Royale</h1>
          </div>
          <div className="h-8 w-px bg-white/20 hidden md:block"></div>
          <div className="flex flex-col text-right md:text-left">
            <span className="text-[10px] text-white/50 uppercase tracking-widest">Player</span>
            <span className="text-emerald-400 font-bold text-sm md:text-base">{user.username}</span>
          </div>
        </div>

        <div className="flex items-center gap-6 md:gap-8 w-full md:w-auto justify-between md:justify-end">
          <div className="flex flex-col items-start md:items-end w-1/2 md:w-auto">
            <span className="text-[10px] text-white/50 uppercase tracking-widest md:block">Balance</span>
            <div className="flex items-center gap-1 md:gap-2">
              <span className="text-lg md:text-2xl font-black text-white">{user.pollars.toLocaleString()}</span>
              <span className="text-[10px] md:text-xs text-emerald-400 font-bold hidden sm:inline">POLLARS</span>
              <span className="text-[10px] text-emerald-400 font-bold sm:hidden">P</span>
            </div>
          </div>
          <div className="flex flex-col items-end w-1/2 md:w-auto">
            <span className="text-[10px] text-white/50 uppercase tracking-widest md:block">Rebirths</span>
            <div className="flex items-center gap-2">
              <span className="text-lg md:text-2xl font-black text-rose-400">{user.rebirths}</span>
              <span className="px-2 py-0.5 bg-rose-500/20 rounded text-[10px] font-bold border border-rose-500/30 hidden sm:block">LIFETIME</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 z-10 w-full max-w-5xl mx-auto flex flex-col gap-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-slate-900/40 rounded-3xl border border-white/5 backdrop-blur-md p-8 relative shadow-2xl flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-black uppercase mb-1">Play Game</h2>
              <p className="text-sm text-white/50">Start a new private room or join a party.</p>
            </div>
            
            <button 
              onClick={handleCreateRoom}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-lg transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)]"
            >
              CREATE PRIVATE ROOM
            </button>
            
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10"></span>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-white/50">
                <span className="bg-slate-900 px-4">OR JOIN PARTY</span>
              </div>
            </div>

            <form onSubmit={handleJoinRoom} className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text" 
                placeholder="PARTY CODE"
                className="flex-1 bg-black/20 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors uppercase font-mono tracking-widest min-w-0"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                maxLength={6}
              />
              <button 
                type="submit"
                className="bg-white/10 hover:bg-white/20 text-white font-black px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
                disabled={!joinCode}
              >
                JOIN
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-slate-900/40 rounded-3xl border border-white/5 backdrop-blur-md p-8 relative shadow-2xl flex flex-col gap-4">
               <div>
                  <h2 className="text-xl font-black uppercase mb-1">Rebirth Facility</h2>
                  <p className="text-xs text-white/50 leading-relaxed">
                    If you drop below 1,000 Pollars, initiate a rebirth to receive a fresh 10,000 Pollars. Each rebirth permanently increments your lifetime rebirth counter.
                  </p>
               </div>
               <button 
                  onClick={handleRefill}
                  disabled={user.pollars >= 1000 || refilling}
                  className="w-full py-4 border border-rose-500/30 rounded-xl text-rose-500 text-sm font-black transition-all bg-rose-500/5 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed uppercase mt-2"
                >
                  {refilling ? "INITIATING..." : "INITIATE REBIRTH (+10K, +1 LIFE)"}
                </button>
            </div>

            <div className="bg-slate-900/40 rounded-3xl border border-white/5 backdrop-blur-md p-8 relative shadow-2xl flex flex-col min-h-[300px]">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-black uppercase">Leaderboard</h2>
                  <button 
                    onClick={() => setShowLeaderboard(!showLeaderboard)}
                    className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    {showLeaderboard ? "HIDE" : "SHOW"}
                  </button>
               </div>
               
               {showLeaderboard ? (
                 <div className="space-y-3">
                   {leaderboard.map((u, i) => (
                     <div key={i} className={`flex justify-between items-center bg-black/20 p-3 rounded-xl border ${i === 0 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-white/5'}`}>
                       <div className="flex items-center gap-3">
                         <span className={`font-mono font-bold text-sm ${i === 0 ? 'text-yellow-500' : 'text-white/30'}`}>
                           #{i + 1}
                         </span>
                         <span className="font-bold text-sm">{u.username}</span>
                       </div>
                       <div className="text-right">
                         <div className="text-emerald-400 font-black text-sm">{u.pollars.toLocaleString()} P</div>
                         <div className="text-[10px] text-rose-400 font-bold tracking-widest">L {u.rebirths}</div>
                       </div>
                     </div>
                   ))}
                   {leaderboard.length === 0 && <div className="text-sm text-white/50 text-center py-8 font-bold">No players found.</div>}
                 </div>
               ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                     <span className="text-4xl mb-4 text-emerald-500">🏆</span>
                     <p className="text-xs font-bold uppercase tracking-widest text-white/50">Leaderboard hidden</p>
                  </div>
               )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
