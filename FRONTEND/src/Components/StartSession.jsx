import React from 'react';

const StartSession = ({ onBegin }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900/50 backdrop-blur-md border border-slate-800 p-10 rounded-3xl">
        <h2 className="text-3xl font-bold text-white mb-2">Start Session</h2>
        <p className="text-slate-400 mb-8">Configure your interview parameters.</p>

        <div className="space-y-6">
          {/* Persona Selection */}
          <div>
            <label className="block text-slate-400 mb-2 text-sm">Persona (Role)</label>
            <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white appearance-none outline-none focus:border-blue-500">
              <option>Frontend Developer</option>
              <option>Backend Developer</option>
              <option>Fullstack Engineer</option>
            </select>
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="block text-slate-400 mb-2 text-sm">Difficulty Level</label>
            <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white appearance-none outline-none focus:border-blue-500">
              <option>Junior (0-2 yrs)</option>
              <option>Mid-Level (3-5 yrs)</option>
              <option>Senior (6+ yrs)</option>
            </select>
          </div>

          {/* Resume Upload */}
          <div>
            <label className="block text-slate-400 mb-2 text-sm">Upload Resume (Simulated)</label>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
              <input type="file" className="text-sm text-slate-400 file:bg-white file:text-black file:border-0 file:px-4 file:py-1 file:rounded-md file:mr-4 file:cursor-pointer" />
            </div>
            <p className="text-xs text-slate-600 mt-2 italic">Resume will be parsed by AI to extract skills.</p>
          </div>

          <button onClick={onBegin} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-blue-600/30 transition-all mt-4">
            Begin Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartSession;