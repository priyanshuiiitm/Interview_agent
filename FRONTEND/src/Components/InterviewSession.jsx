import React, { useState } from 'react';

const InterviewSession = ({ role, difficulty }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: `Hello! I'm your ${role} AI coach. Let's dive into some ${difficulty} level questions.` }
  ]);
  const [isRecording, setIsRecording] = useState(false);
  // 1. Re-added the "Thinking" state
  const [isTyping, setIsTyping] = useState(false); 

  // Simulation function to show how the dots work
  const simulateAIResponse = () => {
    setIsTyping(true); // Start the animation
    
    // After 3 seconds, add a message and stop the dots
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: "That's an interesting answer! Can you explain the difference between State and Props?" }]);
      setIsTyping(false); // End the animation
    }, 3000);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 relative overflow-hidden">
      {/* Aurora Backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full"></div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center px-8 py-6 backdrop-blur-md bg-white/5 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">{role}</h2>
          <p className="text-[10px] text-cyan-300/60 uppercase tracking-[0.3em] font-bold">{difficulty}</p>
        </div>
        <button className="px-4 py-2 rounded-full border border-red-500/50 text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white transition-all">EXIT</button>
      </header>

      {/* Chat Area */}
      <main className="relative z-10 flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[70%] p-6 rounded-[2rem] text-sm leading-relaxed shadow-xl ${
              msg.role === 'ai' 
                ? 'bg-white/10 border border-white/20 text-blue-50 rounded-tl-none' 
                : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-tr-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* 2. The Thinking Animation Bubble */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/10 border border-white/20 p-5 rounded-[2rem] rounded-tl-none flex gap-1.5 items-center shadow-xl">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-duration:0.8s]"></span>
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </main>

      {/* Footer Controls */}
      <footer className="relative z-10 p-10 flex flex-col items-center">
        <button 
          onClick={() => {
            if (isRecording) simulateAIResponse(); // Trigger simulation on stop
            setIsRecording(!isRecording);
          }}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 group ${
            isRecording ? 'bg-red-500 scale-110' : 'bg-gradient-to-tr from-cyan-400 to-blue-600'
          }`}
        >
          <span className="text-4xl relative z-10">{isRecording ? '⏹' : '🎤'}</span>
        </button>
        <p className="mt-4 text-cyan-300/40 text-[10px] uppercase font-bold tracking-[0.5em]">
          {isRecording ? "Listening..." : "Speak Answer"}
        </p>
      </footer>
    </div>
  );
};

export default InterviewSession;