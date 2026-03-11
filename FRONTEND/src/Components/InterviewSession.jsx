import React, { useEffect, useMemo, useRef, useState } from 'react';

const InterviewSession = ({
  role,
  difficulty,
  interviewId,
  initialQuestion,
  initialHint,
  token,
  apiBaseUrl,
  onExit,
  onInterviewCompleted,
  onSessionInvalid,
}) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState('');
  const [chatError, setChatError] = useState('');
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const mainRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const intro = initialHint
      ? `${initialQuestion}\nHint: ${initialHint}`
      : initialQuestion || `Interview started for ${role} (${difficulty}).`;

    setMessages([{ role: 'ai', text: intro }]);
  }, [initialQuestion, initialHint, role, difficulty]);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = mainRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const speechRecognitionApi = useMemo(
    () => window.SpeechRecognition || window.webkitSpeechRecognition,
    []
  );

  const sendAnswer = async (rawAnswer) => {
    const answer = rawAnswer.trim();
    if (!answer || isSending || interviewEnded) {
      return;
    }

    setIsSending(true);
    setChatError('');
    setMessages((prev) => [...prev, { role: 'user', text: answer }]);
    setInputText('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/interviews/${interviewId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answer }),
      });

      if (response.status === 401) {
        onSessionInvalid();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Could not send answer.');
      }

      if (data.ended) {
        setInterviewEnded(true);
        if (typeof onInterviewCompleted === 'function') {
          onInterviewCompleted(data.report || null);
        }
        const reportText = data.report
          ? [
              `Interview finished.`,
              `Score: ${data.report.overall_score ?? 'N/A'}/10`,
              `Summary: ${data.report.summary ?? 'No summary available.'}`,
              `Verdict: ${data.report.verdict ?? 'Pending'}`,
            ].join('\n')
          : data.message || 'Interview finished.';
        setMessages((prev) => [...prev, { role: 'ai', text: reportText }]);
        return;
      }

      const aiText = data.hint
        ? `${data.question || 'No question returned.'}\nHint: ${data.hint}`
        : data.question || 'No question returned.';

      setMessages((prev) => [...prev, { role: 'ai', text: aiText }]);
    } catch (error) {
      setChatError(error.message || 'Could not send answer.');
    } finally {
      setIsSending(false);
    }
  };

  const startRecording = () => {
    setRecordingError('');
    if (!speechRecognitionApi) {
      setRecordingError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new speechRecognitionApi();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      setInputText(transcript.trim());
    };

    recognition.onerror = (event) => {
      setRecordingError(`Voice input error: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const endInterviewNow = async () => {
    if (isEnding) {
      return;
    }
    if (interviewEnded) {
      onExit();
      return;
    }
    setIsEnding(true);
    setChatError('');
    try {
      const response = await fetch(`${apiBaseUrl}/api/interviews/${interviewId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401) {
        onSessionInvalid();
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Could not end interview.');
      }
      setInterviewEnded(true);
      if (typeof onInterviewCompleted === 'function') {
        onInterviewCompleted(data.report || null);
      } else {
        onExit();
      }
    } catch (error) {
      setChatError(error.message || 'Could not end interview.');
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full"></div>

      <header className="relative z-10 flex justify-between items-center px-8 py-6 backdrop-blur-md bg-white/5 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">{role}</h2>
          <p className="text-[10px] text-cyan-300/60 uppercase tracking-[0.3em] font-bold">{difficulty}</p>
        </div>
        <button
          onClick={endInterviewNow}
          disabled={isEnding}
          className="px-4 py-2 rounded-full border border-red-500/50 text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isEnding ? 'ENDING...' : interviewEnded ? 'EXIT' : 'END INTERVIEW'}
        </button>
      </header>

      <main ref={mainRef} className="relative z-10 flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
        {messages.map((msg, index) => (
          <div key={`${msg.role}-${index}`} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[80%] whitespace-pre-line p-4 rounded-3xl text-sm leading-relaxed shadow-xl ${
                msg.role === 'ai'
                  ? 'bg-white/10 border border-white/20 text-blue-50 rounded-tl-none'
                  : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-tr-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="bg-white/10 border border-white/20 p-5 rounded-[2rem] rounded-tl-none flex gap-1.5 items-center shadow-xl">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-duration:0.8s]"></span>
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 p-4 md:p-6 border-t border-white/10 bg-black/20 backdrop-blur-md">
        <div className="max-w-4xl mx-auto space-y-3">
          {chatError && <p className="text-red-300 text-xs">{chatError}</p>}
          {recordingError && <p className="text-amber-300 text-xs">{recordingError}</p>}

          <div className="flex items-center gap-3">
            <button
              onClick={handleMicClick}
              disabled={interviewEnded || isEnding}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isRecording ? 'bg-red-500 text-white' : 'bg-cyan-500 text-slate-950'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecording ? 'Stop' : 'Mic'}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  sendAnswer(inputText);
                }
              }}
              placeholder={interviewEnded ? 'Interview ended.' : 'Type your answer here...'}
              disabled={isSending || interviewEnded || isEnding}
              className="flex-1 rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-cyan-400 disabled:opacity-50"
            />

            <button
              onClick={() => sendAnswer(inputText)}
              disabled={isSending || interviewEnded || isEnding || !inputText.trim()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>

          <p className="text-[10px] text-cyan-300/50 uppercase tracking-[0.2em]">
            {interviewEnded
              ? 'Interview complete. Press EXIT to return.'
              : isEnding
              ? 'Ending interview and generating final report...'
              : isRecording
              ? 'Listening... speak and then press Stop'
              : 'You can answer with voice or typing'}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default InterviewSession;
