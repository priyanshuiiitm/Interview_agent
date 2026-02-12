import React, { useState } from 'react';
import Login from './Components/Login';
import StartSession from './Components/StartSession';
import InterviewSession from './Components/InterviewSession';

function App() {
  const [view, setView] = useState('login'); // 'login', 'config', or 'session'

  return (
    <div className="antialiased">
      {view === 'login' && <Login onLogin={() => setView('config')} />}
      {view === 'config' && <StartSession onBegin={() => setView('session')} />}
      {view === 'session' && <InterviewSession />}
    </div>
  );
}

export default App;