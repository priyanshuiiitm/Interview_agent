import React, { useState } from 'react';

const InterviewSession = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Welcome! I'm your interviewer today. Can you start by introducing yourself ?" }
  ]);
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <h2 className="text-xl font-semibold text-blue-400">Frontend Developer Interview</h2>
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 bg-slate-800 rounded-full text-sm">Difficulty: Mid-Level</span>
          <button className="text-red-400 hover:text-red-300 font-medium">End Session</button>
        </div>
      </header>

      {/* Chat Display */}
      <main className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === 'ai' ? 'bg-slate-800 border border-slate-700' : 'bg-blue-600 shadow-lg shadow-blue-900/20'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </main>

      {/* Controls */}
      <footer className="flex flex-col items-center gap-4">
        {isRecording && (
          <div className="flex gap-1 items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            <span className="text-sm text-red-400 font-mono">REC</span>
          </div>
        )}
        <button 
          onClick={() => setIsRecording(!isRecording)}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording ? 'bg-red-500 scale-110 shadow-2xl shadow-red-500/50' : 'bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/30'
          }`}
        >
          <span className="text-2xl">{isRecording ? '⏹' : '🎤'}</span>
        </button>
        <p className="text-slate-500 text-sm">
          {isRecording ? "Listening... click to stop" : "Click the mic to speak your answer"}
        </p>
      </footer>
    </div>
  );
};

export default InterviewSession;