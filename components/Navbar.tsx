import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthState } from '../types';
import { Logo, APP_NAME } from '../constants.tsx';

interface NavbarProps {
  auth: AuthState;
  logout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ auth, logout }) => {
  const [pulse, setPulse] = useState(false);
  const [prevCredits, setPrevCredits] = useState(auth.user?.credits || 0);
  const location = useLocation();

  useEffect(() => {
    if (auth.user && auth.user.credits > prevCredits) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 800);
      setPrevCredits(auth.user.credits);
      return () => clearTimeout(timer);
    } else if (auth.user) {
      setPrevCredits(auth.user.credits);
    }
  }, [auth.user?.credits, prevCredits]);

  return (
    <nav className="bg-white/70 backdrop-blur-xl border-b border-gray-100 px-6 py-4 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to={auth.isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-3 group">
          <Logo className="w-9 h-9 transition-all duration-500 group-hover:rotate-[360deg]" />
          <span className="text-xl font-black tracking-tight text-gray-900 uppercase tracking-widest text-sm">{APP_NAME}</span>
        </Link>

        <div className="flex items-center space-x-8">
          {auth.isAuthenticated ? (
            <>
              <div className="hidden md:flex space-x-6">
                <Link to="/dashboard" className={`font-bold text-xs uppercase tracking-widest transition-colors ${location.pathname === '/dashboard' ? 'text-emerald-600' : 'text-gray-400 hover:text-emerald-600'}`}>Engine</Link>
                <Link to="/rewards" className={`font-bold text-xs uppercase tracking-widest transition-colors ${location.pathname === '/rewards' ? 'text-emerald-600' : 'text-gray-400 hover:text-emerald-600'}`}>Rewards</Link>
              </div>
              <div className="flex items-center space-x-5">
                <div className={`hidden sm:flex flex-col items-end ${pulse ? 'animate-credits-pulse' : ''}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Balance</span>
                  <span className="text-sm font-black text-emerald-600 flex items-center">
                    <i className="fa-solid fa-bolt mr-1.5 text-[10px]"></i>
                    {auth.user?.credits}
                  </span>
                </div>
                <div className="h-8 w-px bg-gray-100"></div>
                <Link to="/profile" className="flex items-center group">
                  <img src={auth.user?.avatar} alt="Profile" className="w-9 h-9 rounded-xl border-2 border-transparent group-hover:border-emerald-500 transition-all shadow-md" />
                </Link>
                <button onClick={logout} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><i className="fa-solid fa-power-off"></i></button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-400 hover:text-gray-900 font-black text-xs uppercase tracking-widest transition-all">Login</Link>
              <Link to="/signup" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-100">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;