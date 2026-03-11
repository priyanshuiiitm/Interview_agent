import React, { useState } from 'react';
import Login from './Components/Login';
import StartSession from './Components/StartSession';
import InterviewSession from './Components/InterviewSession';
import Signup from './Components/Signup';
import ReportPage from './Components/ReportPage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

function App() {
  const savedToken = localStorage.getItem('token');
  const [view, setView] = useState(savedToken ? 'config' : 'login');
  const [authToken, setAuthToken] = useState(savedToken || '');
  const [authError, setAuthError] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loadingStart, setLoadingStart] = useState(false);
  const [interviewError, setInterviewError] = useState('');
  const [activeInterviewId, setActiveInterviewId] = useState('');
  const [config, setConfig] = useState({
    role: 'Frontend Developer',
    difficulty: 'Junior (0-2 yrs)'
  });
  const [initialQuestion, setInitialQuestion] = useState('');
  const [initialHint, setInitialHint] = useState('');
  const [finalReport, setFinalReport] = useState(null);

  const parseError = async (response, fallbackMessage) => {
    try {
      const data = await response.json();
      return data.message || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  };

  const handleLogin = async ({ email, password }) => {
    setLoadingAuth(true);
    setAuthError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(await parseError(response, 'Login failed.'));
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      setAuthToken(data.token);
      setView('config');
    } catch (error) {
      setAuthError(error.message || 'Login failed.');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleSignup = async ({ name, email, password }) => {
    setLoadingAuth(true);
    setAuthError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        throw new Error(await parseError(response, 'Signup failed.'));
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      setAuthToken(data.token);
      setView('config');
    } catch (error) {
      setAuthError(error.message || 'Signup failed.');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleStartInterview = async (selectedRole, selectedDifficulty) => {
    if (!authToken) {
      setView('login');
      return;
    }

    setLoadingStart(true);
    setInterviewError('');
    setInitialQuestion('');
    setInitialHint('');
    setFinalReport(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/interviews/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ role: selectedRole, difficulty: selectedDifficulty }),
      });

      if (!response.ok) {
        throw new Error(await parseError(response, 'Could not start interview.'));
      }

      const data = await response.json();
      setActiveInterviewId(data.interviewId);
      setInitialQuestion(data.question || 'Interview started.');
      setInitialHint(data.hint || '');
      setConfig({ role: selectedRole, difficulty: selectedDifficulty });
      setView('session');
    } catch (error) {
      setInterviewError(error.message || 'Could not start interview.');
    } finally {
      setLoadingStart(false);
    }
  };

  const handleExitInterview = () => {
    setActiveInterviewId('');
    setInitialQuestion('');
    setInitialHint('');
    setInterviewError('');
    setView('config');
  };

  const handleInterviewCompleted = (report) => {
    setFinalReport(report || null);
    setView('report');
  };

  const handleBackFromReport = () => {
    setActiveInterviewId('');
    setInitialQuestion('');
    setInitialHint('');
    setInterviewError('');
    setFinalReport(null);
    setView('config');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthToken('');
    setActiveInterviewId('');
    setInitialQuestion('');
    setInitialHint('');
    setAuthError('');
    setInterviewError('');
    setFinalReport(null);
    setView('login');
  };

  const goToSignup = () => {
    setAuthError('');
    setView('signup');
  };

  const goToLogin = () => {
    setAuthError('');
    setView('login');
  };

  return (
    <div className="antialiased">
      {view === 'login' && (
        <Login
          onLogin={handleLogin}
          onSignup={goToSignup}
          loading={loadingAuth}
          error={authError}
        />
      )}
      {view === 'signup' && (
        <Signup
          onBack={goToLogin}
          onSignupSuccess={handleSignup}
          loading={loadingAuth}
          error={authError}
        />
      )}
      {view === 'config' && (
        <StartSession
          onBegin={handleStartInterview}
          onLogout={handleLogout}
          loading={loadingStart}
          error={interviewError}
        />
      )}
      {view === 'session' && (
        <InterviewSession
          role={config.role}
          difficulty={config.difficulty}
          interviewId={activeInterviewId}
          initialQuestion={initialQuestion}
          initialHint={initialHint}
          token={authToken}
          apiBaseUrl={API_BASE_URL}
          onExit={handleExitInterview}
          onInterviewCompleted={handleInterviewCompleted}
          onSessionInvalid={handleLogout}
        />
      )}
      {view === 'report' && (
        <ReportPage
          data={finalReport}
          onGoHome={handleBackFromReport}
        />
      )}
    </div>
  );
}

export default App;
