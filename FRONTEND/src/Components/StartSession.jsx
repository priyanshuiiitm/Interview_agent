import React, { useState } from 'react';

const StartSession = ({ onBegin }) => {
  const [persona, setPersona] = useState('Frontend Developer');
  const [difficulty, setDifficulty] = useState('Junior (0-2 yrs)');

  return (
    // Background with a moving gradient
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-900 flex items-center justify-center p-4">
      {/* Glassmorphism Card */}
      <div className="w-full max-w-xl bg-white/10 backdrop-blur-2xl border border-white/20 p-10 rounded-[2rem] shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-lg rotate-12 shadow-lg shadow-cyan-500/50"></div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Fill Your Details</h2>
        </div>
        <p className="text-blue-200/70 mb-8 font-medium">Ready to sharpen your skills?</p>

        <div className="space-y-6">
          <div>
            <label className="block text-cyan-300 mb-2 text-xs uppercase font-bold tracking-widest">Select Persona</label>
            <select 
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="w-full bg-indigo-950/50 border border-white/10 rounded-2xl p-4 text-white appearance-none outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all cursor-pointer"
            >
              <option className="bg-slate-900">Frontend Developer</option>
              <option className="bg-slate-900">Backend Developer</option>
              <option className="bg-slate-900">Fullstack Engineer</option>
            </select>
          </div>

          <div>
            <label className="block text-cyan-300 mb-2 text-xs uppercase font-bold tracking-widest">Difficulty</label>
            <select 
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-indigo-950/50 border border-white/10 rounded-2xl p-4 text-white appearance-none outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all cursor-pointer"
            >
              <option className="bg-slate-900">Junior (0-2 yrs)</option>
              <option className="bg-slate-900">Mid-Level (3-5 yrs)</option>
              <option className="bg-slate-900">Senior (6+ yrs)</option>
            </select>
          </div>

          <button 
            onClick={() => onBegin(persona, difficulty)} 
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-cyan-500/30 transition-all active:scale-95 text-lg uppercase tracking-tighter"
          >
            Launch Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartSession;