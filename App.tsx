import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, AuthState } from './types';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import DailyRewardsPage from './pages/DailyRewardsPage';
import WebsiteBuilderPage from './pages/WebsiteBuilderPage';
import LivePage from './pages/LivePage';
import VideoPage from './pages/VideoPage';
import Navbar from './components/Navbar';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('croc_user');
    if (storedUser) {
      try {
        setAuth({
          user: JSON.parse(storedUser),
          isAuthenticated: true
        });
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const login = (user: User) => {
    localStorage.setItem('croc_user', JSON.stringify(user));
    setAuth({ user, isAuthenticated: true });
  };

  const logout = () => {
    localStorage.removeItem('croc_user');
    setAuth({ user: null, isAuthenticated: false });
  };

  const updateCredits = (newBalance: number, lastClaim?: number, tasks?: string[]) => {
    if (auth.user) {
      const updatedUser = { 
        ...auth.user, 
        credits: newBalance,
        lastDailyClaim: lastClaim !== undefined ? lastClaim : auth.user.lastDailyClaim,
        tasksCompleted: tasks !== undefined ? tasks : (auth.user.tasksCompleted || [])
      };
      localStorage.setItem('croc_user', JSON.stringify(updatedUser));
      setAuth({ user: updatedUser, isAuthenticated: true });
    }
  };

  if (!isLoaded) return null;

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-white">
        {window.location.hash !== '#/live' && <Navbar auth={auth} logout={logout} />}
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<LandingPage auth={auth} />} />
            <Route path="/login" element={!auth.isAuthenticated ? <LoginPage onLogin={login} /> : <Navigate to="/dashboard" />} />
            <Route path="/signup" element={!auth.isAuthenticated ? <SignupPage onSignup={login} /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={auth.isAuthenticated ? <DashboardPage user={auth.user!} /> : <Navigate to="/login" />} />
            <Route path="/chat/:mode" element={auth.isAuthenticated ? <ChatPage user={auth.user!} updateCredits={(bal) => updateCredits(bal)} /> : <Navigate to="/login" />} />
            <Route path="/builder" element={auth.isAuthenticated ? <WebsiteBuilderPage user={auth.user!} updateCredits={(bal) => updateCredits(bal)} /> : <Navigate to="/login" />} />
            <Route path="/video" element={auth.isAuthenticated ? <VideoPage user={auth.user!} updateCredits={(bal) => updateCredits(bal)} /> : <Navigate to="/login" />} />
            <Route path="/live" element={auth.isAuthenticated ? <LivePage user={auth.user!} /> : <Navigate to="/login" />} />
            <Route path="/profile" element={auth.isAuthenticated ? <ProfilePage user={auth.user!} logout={logout} onRefill={() => {}} onUpdateUser={(part) => auth.user && updateCredits(part.credits ?? auth.user.credits)} /> : <Navigate to="/login" />} />
            <Route path="/rewards" element={auth.isAuthenticated ? <DailyRewardsPage user={auth.user!} onClaim={() => updateCredits(auth.user!.credits + 40, Date.now())} onTaskComplete={(taskId, reward) => !auth.user?.tasksCompleted?.includes(taskId) && updateCredits(auth.user!.credits + reward, auth.user?.lastDailyClaim, [...(auth.user?.tasksCompleted || []), taskId])} /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;