import React, { useState } from 'react';

const Login = ({ onLogin, onSignup, loading = false, error = '' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({ email: email.trim(), password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-950 to-violet-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-600/10 blur-[150px] rounded-full"></div>

      <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-2xl rotate-12 flex items-center justify-center shadow-lg shadow-cyan-500/40 mb-4">
            <span className="text-white text-3xl font-black -rotate-12">IA</span>
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tighter">
            InterviewAgent
          </h1>
          <p className="text-cyan-400/60 text-[10px] uppercase font-bold tracking-[0.4em] mt-2">Elevate Your Career</p>
        </div>

        <h2 className="text-xl font-bold text-white mb-8 text-center">Sign in to your account</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-cyan-300/60 text-[10px] uppercase font-black tracking-widest ml-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 transition-all"
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-cyan-300/60 text-[10px] uppercase font-black tracking-widest ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 transition-all"
              placeholder="********"
              required
            />
          </div>

          {error && <p className="text-red-300 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-cyan-500/20 transition-all active:scale-95 uppercase tracking-widest text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Enter Workspace'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-white/30 text-xs">
            New here?{' '}
            <span onClick={onSignup} className="text-cyan-400 font-bold cursor-pointer hover:underline">
              Create an account
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
