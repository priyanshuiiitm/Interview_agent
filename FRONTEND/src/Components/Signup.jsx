import React from 'react';

const Signup = ({ onBack, onSignupSuccess }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-950 to-violet-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Decorative Aurora Backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-cyan-500/10 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[150px] rounded-full"></div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
        
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tighter">Create Account</h1>
          <p className="text-cyan-400/60 text-[10px] uppercase font-bold tracking-[0.4em] mt-2">Start your journey</p>
        </div>

        {/* Signup Form */}
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onSignupSuccess(); }}>
          <div className="space-y-1">
            <label className="block text-cyan-300/60 text-[10px] uppercase font-black tracking-widest ml-1">Full Name</label>
            <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 outline-none focus:border-cyan-400 transition-all" placeholder="John Doe" required />
          </div>

          <div className="space-y-1">
            <label className="block text-cyan-300/60 text-[10px] uppercase font-black tracking-widest ml-1">Email</label>
            <input type="email" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 outline-none focus:border-cyan-400 transition-all" placeholder="name@example.com" required />
          </div>

          <div className="space-y-1">
            <label className="block text-cyan-300/60 text-[10px] uppercase font-black tracking-widest ml-1">Password</label>
            <input type="password" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 outline-none focus:border-cyan-400 transition-all" placeholder="••••••••" required />
          </div>

          <button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-cyan-500/20 transition-all active:scale-95 uppercase tracking-widest text-sm mt-2">
            Register Now
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-white/30 text-xs">Already have an account? <span onClick={onBack} className="text-cyan-400 font-bold cursor-pointer hover:underline">Sign In</span></p>
        </div>
      </div>
    </div>
  );
};

export default Signup;