import React, { useState } from 'react';
import { useGameStore } from '../store';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const setUser = useGameStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const endpoint = isLogin ? '/api/login' : '/api/register';
    const payload = isLogin ? { username, password } : { username, email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      setUser(data.user);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-900/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-8 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            <span className="text-4xl font-bold">P</span>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Pollars Royale</h1>
            <p className="text-xs text-white/50 uppercase tracking-widest mt-1">High stakes, unlimited rebirths</p>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 text-sm rounded-xl font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">Username</label>
            <input 
              type="text" 
              required
              className="w-full bg-black/20 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          {!isLogin && (
            <div>
              <label className="block text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">Email</label>
              <input 
                type="email" 
                required
                className="w-full bg-black/20 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full bg-black/20 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-lg transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] mt-8"
          >
            {isLogin ? "ENTER ROYALE" : "CREATE ACCOUNT"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            className="text-[10px] uppercase font-bold tracking-widest text-white/50 hover:text-emerald-400 transition-colors"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
