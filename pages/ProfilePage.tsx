
import React, { useRef, useState } from 'react';
import { User } from '../types';
import { APP_NAME } from '../constants.tsx';

interface ProfilePageProps {
  user: User;
  logout: () => void;
  onRefill: () => void;
  onUpdateUser: (updatedUser: Partial<User>) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, logout, onUpdateUser }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.username);
  const [editPassword, setEditPassword] = useState(user.password || '');
  const [showPassword, setShowPassword] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        updatePersistentUser({ avatar: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const updatePersistentUser = (updates: Partial<User>) => {
    // Update master list
    const users: User[] = JSON.parse(localStorage.getItem('croc_registered_users') || '[]');
    const updatedUsers = users.map(u => u.id === user.id ? { ...u, ...updates } : u);
    localStorage.setItem('croc_registered_users', JSON.stringify(updatedUsers));
    
    // Update current user
    onUpdateUser(updates);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePersistentUser({
      username: editName,
      password: editPassword
    });
    setIsEditing(false);
  };

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-16 slide-up relative">
      <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-2xl shadow-gray-200">
        <div className="h-56 bg-gradient-to-br from-emerald-500 to-green-400 relative">
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           <div className="absolute -bottom-20 left-12 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="relative">
                <img src={user.avatar} alt="Profile" className="w-40 h-40 rounded-[34px] border-4 border-gray-50 object-cover bg-white shadow-xl" />
                <div className="absolute inset-0 bg-black/40 rounded-[34px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border-4 border-transparent">
                  <i className="fa-solid fa-camera text-white text-2xl"></i>
                </div>
                <div className="absolute bottom-2 right-2 w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center border-4 border-white text-white shadow-lg z-10">
                   <i className="fa-solid fa-pencil text-xs"></i>
                </div>
              </div>
           </div>
           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
        </div>

        <div className="pt-24 pb-12 px-12">
           <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-8">
              <div className="animate-slideUp">
                <h2 className="text-5xl font-black text-gray-900 tracking-tight mb-2">{user.username}</h2>
                <p className="text-gray-400 font-semibold text-lg flex items-center">
                  <i className="fa-solid fa-at mr-2 opacity-50"></i>
                  {user.email}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                   <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl text-[10px] font-black uppercase tracking-widest">Community Member</span>
                   <span className="px-4 py-1.5 bg-gray-50 text-gray-500 border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest">ID: {user.id.toUpperCase()}</span>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white border border-gray-900 rounded-2xl transition-all font-black text-sm flex items-center justify-center shadow-xl shadow-gray-200"
                >
                  <i className="fa-solid fa-user-pen mr-3"></i>
                  Edit Settings
                </button>
                <button 
                  onClick={logout}
                  className="px-8 py-4 bg-white hover:bg-red-50 text-red-500 border border-red-100 rounded-2xl transition-all font-black text-sm flex items-center justify-center shadow-lg shadow-red-50"
                >
                  <i className="fa-solid fa-power-off mr-3"></i>
                  Sign Out
                </button>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="p-10 bg-white border border-gray-100 rounded-[40px] shadow-xl shadow-gray-50 relative group transition-all hover:shadow-2xl hover:shadow-emerald-50">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-gray-900 flex items-center">
                    <i className="fa-solid fa-bolt mr-4 text-emerald-600"></i>
                    Available Energy
                  </h3>
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-coins text-emerald-600"></i>
                  </div>
                </div>
                
                <div className="text-7xl font-black text-gray-900 mb-4 flex items-baseline">
                  {user.credits}
                  <span className="text-xs font-black text-gray-400 ml-4 uppercase tracking-[0.4em]">CR Balance</span>
                </div>
                
                <p className="text-gray-500 font-medium leading-relaxed">
                  Credits fuel your AI generations. You can earn more by completing community tasks in the Rewards section.
                </p>

                <div className="mt-8 pt-8 border-t border-gray-50">
                   <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-gray-400">
                      <span>Daily Claim Limit</span>
                      <span className="text-emerald-600">Verified</span>
                   </div>
                </div>
              </div>

              <div className="p-10 bg-gray-50 border border-gray-100 rounded-[40px]">
                 <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center">
                   <i className="fa-solid fa-shield-halved mr-4 text-emerald-600"></i>
                   Account Security
                 </h3>
                 
                 <div className="space-y-4">
                    <PerkRow icon="fa-fingerprint" text="Secure Session: Enabled" active />
                    <PerkRow icon="fa-key" text="Password Protected" active />
                    <PerkRow icon="fa-eye" text="Profile Visibility: Public" active />
                    <PerkRow icon="fa-envelope-circle-check" text="Email Verified" active />
                    <PerkRow icon="fa-lock" text="Two-Factor Auth" active={false} />
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Settings Modal (Display Name & Password) */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md fade-in px-4">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl scale-in border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-gear"></i>
                 </div>
                 <h2 className="text-2xl font-black text-gray-900 tracking-tight">Account Settings</h2>
              </div>
              <button onClick={() => setIsEditing(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                <i className="fa-solid fa-xmark text-gray-400"></i>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Display Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm"
                  placeholder="Your Name"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">New Password</label>
                <div className="relative">
                   <input 
                    type={showPassword ? "text" : "password"}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-emerald-600 transition-colors"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="pt-4 flex space-x-4">
                 <button 
                   type="button" 
                   onClick={() => setIsEditing(false)} 
                   className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit" 
                   className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 transition-all transform hover:scale-105 active:scale-95"
                 >
                   Apply Changes
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const PerkRow: React.FC<{ icon: string, text: string, active: boolean }> = ({ icon, text, active }) => (
  <div className={`flex items-center space-x-4 p-5 rounded-3xl transition-all ${active ? 'bg-white border border-gray-100 shadow-sm hover:shadow-md' : 'bg-transparent opacity-40'}`}>
     <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-emerald-50 text-emerald-600 shadow-inner' : 'bg-gray-100 text-gray-300'}`}>
       <i className={`fa-solid ${icon} text-sm`}></i>
     </div>
     <span className={`text-sm font-black tracking-tight ${active ? 'text-gray-900' : 'text-gray-400'}`}>{text}</span>
     {!active && <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 ml-auto bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">Locked</span>}
  </div>
);

export default ProfilePage;
