import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { Logo, APP_NAME } from '../constants.tsx';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const users: User[] = JSON.parse(localStorage.getItem('croc_registered_users') || '[]');
      const user = users.find(u => u.email === email);

      if (user) {
        onLogin(user);
        navigate('/dashboard'); // Changed from /chat to /dashboard
      } else {
        if (email === 'test@example.com' && password === 'password') {
          const dummyUser: User = {
            id: '1',
            username: 'Tester',
            email: 'test@example.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tester',
            credits: 20
          };
          onLogin(dummyUser);
          navigate('/dashboard'); // Changed from /chat to /dashboard
        } else {
          setError('Invalid credentials. Please check your email and password.');
          setLoading(false);
        }
      }
    }, 800);
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 bg-white fade-in">
      <div className="w-full max-w-md slide-up">
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-emerald-50 rounded-3xl mb-6 shadow-xl shadow-emerald-50/50">
            <Logo className="w-16 h-16" />
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">Welcome Back</h2>
          <p className="text-gray-400 mt-2 font-medium">Continue your journey with {APP_NAME}</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[40px] border border-gray-100 shadow-2xl shadow-gray-200/50">
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-500 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center">
              <i className="fa-solid fa-circle-exclamation mr-3 text-lg"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 text-gray-900 px-6 py-4 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                placeholder="name@email.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 text-gray-900 px-6 py-4 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 px-4 rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-100 disabled:opacity-50"
            >
              {loading ? <i className="fa-solid fa-circle-notch animate-spin mr-2"></i> : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 mt-10 font-medium">
          New to the community? <Link to="/signup" className="text-emerald-600 hover:underline font-black">Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;