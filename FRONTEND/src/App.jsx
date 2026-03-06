import React, { useState } from 'react';
import Login from './Components/Login';
import StartSession from './Components/StartSession';
import InterviewSession from './Components/InterviewSession';
import Signup from './Components/Signup';

function App() {
  const [view, setView] = useState('login');
  const [showToast, setShowToast] = useState(false);
  const [config, setConfig] = useState({
    role: 'Frontend Developer',
    difficulty: 'Junior (0-2 yrs)'
  });

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleStartInterview = (selectedRole, selectedDifficulty) => {
    setConfig({ role: selectedRole, difficulty: selectedDifficulty });
    setView('session');
  };

  return (
    <div className="antialiased">
      {view === 'login' && (<Login 
        onLogin={() => setView('config')} 
        onSignup={() => setView('signup')}
      />)}
      {view === 'signup' && <Signup onBack={() => setView('login')}
        onSignupSuccess={() => 
          triggerToast() &&
          setView('config')}/>}
      {view === 'config' && (
        <StartSession onBegin={handleStartInterview} />
      )}
      {view === 'session' && (
        <InterviewSession role={config.role} difficulty={config.difficulty} />
      )}
    </div>
  );
}

export default App;