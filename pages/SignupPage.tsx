import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { Logo, APP_NAME, STARTING_CREDITS } from '../constants.tsx';

interface SignupPageProps {
  onSignup: (user: User) => void;
}

const PRESET_SEEDS = ['Felix', 'Aneka', 'Zack', 'Midnight', 'Emerald', 'Croc'];

const SignupPage: React.FC<SignupPageProps> = ({ onSignup }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Avatar State
  const [avatar, setAvatar] = useState(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.floor(Math.random() * 1000)}`);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError("Image size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      try {
        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          username,
          email,
          avatar: avatar, // Use selected avatar
          credits: STARTING_CREDITS,
          lastDailyClaim: 0,
          tasksCompleted: []
        };

        const existingUsers: User[] = JSON.parse(localStorage.getItem('croc_registered_users') || '[]');
        if (existingUsers.some(u => u.email === email)) {
          setError('An account with this email already exists.');
          setLoading(false);
          return;
        }

        existingUsers.push(newUser);
        localStorage.setItem('croc_registered_users', JSON.stringify(existingUsers));

        onSignup(newUser);
        navigate('/dashboard'); // Redirect to Dashboard
      } catch (err) {
        setError('Failed to create account. Please try again.');
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 bg-white fade-in py-12">
      <div className="w-full max-w-md slide-up">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-emerald-50 rounded-3xl mb-6 shadow-xl shadow-emerald-50/50">
            <Logo className="w-16 h-16" />
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">Join {APP_NAME}</h2>
          <p className="text-gray-400 mt-2 font-medium">Create your profile</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[40px] border border-gray-100 shadow-2xl shadow-gray-200/50">
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-500 text-xs font-black uppercase tracking-widest rounded-2xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Avatar Selection Section */}
            <div className="flex flex-col items-center mb-6">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Choose Avatar</label>
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-full p-1 border-2 border-emerald-100 group-hover:border-emerald-500 transition-all">
                  <img src={avatar} alt="Avatar" className="w-full h-full rounded-full object-cover bg-gray-50" />
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <i className="fa-solid fa-camera text-white"></i>
                </div>
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center border-4 border-white text-white shadow-lg">
                  <i className="fa-solid fa-pencil text-[10px]"></i>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarUpload}
              />
              
              <div className="flex gap-2 mt-4 justify-center">
                {PRESET_SEEDS.map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => setAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`)}
                    className="w-8 h-8 rounded-full border border-gray-200 hover:scale-110 hover:border-emerald-500 transition-all overflow-hidden"
                    title={`Select ${seed}`}
                  >
                     <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Username</label>
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 text-gray-900 px-6 py-4 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                placeholder="CrocMember"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Email Address</label>
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
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 text-gray-900 px-6 py-4 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <div className="mb-6 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Signup Bonus</span>
                <span className="text-sm font-black text-emerald-600">+{STARTING_CREDITS} CR</span>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 px-4 rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-100 disabled:opacity-50"
              >
                {loading ? <i className="fa-solid fa-circle-notch animate-spin mr-2"></i> : "Create Account"}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-gray-500 mt-10 font-medium mb-12">
          Already registered? <Link to="/login" className="text-emerald-600 hover:underline font-black">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;