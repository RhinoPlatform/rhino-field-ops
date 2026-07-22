import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export const LoginScreen = ({ onLogin }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) return setError('All credentials components are required.');
    setSubmitting(true);

    const result = await login(username, password);
    if (result.success) {
      if (onLogin) {
        onLogin({ username, password });
      }
    } else {
      setSubmitting(false);
      setError(result.error);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-6">
        <div className="text-center flex flex-col items-center gap-2">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-500 text-white rounded-xl shadow-lg">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-white font-black tracking-tighter text-xl mt-2">R H I N O</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">FIELD ENGINE PLATFORM</p>
        </div>
        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg flex items-center gap-2 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="font-medium leading-normal">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500"><User className="w-4 h-4" /></span>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="operator@rhino.com" className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm px-9 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Secret Password</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500"><Lock className="w-4 h-4" /></span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm px-9 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-bold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authorize Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
