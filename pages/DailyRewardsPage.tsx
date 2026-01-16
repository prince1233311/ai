import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';
import { Logo, APP_NAME, DAILY_REWARD_AMOUNT } from '../constants.tsx';

interface DailyRewardsPageProps {
  user: User;
  onClaim: () => void;
  onTaskComplete: (taskId: string, reward: number) => void;
}

const REWARD_COOLDOWN = 24 * 60 * 60 * 1000;

const DailyRewardsPage: React.FC<DailyRewardsPageProps> = ({ user, onClaim, onTaskComplete }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [canClaim, setCanClaim] = useState<boolean>(false);
  const claimButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const checkStatus = () => {
      const lastClaim = user.lastDailyClaim || 0;
      const now = Date.now();
      const diff = now - lastClaim;
      if (diff >= REWARD_COOLDOWN) {
        setCanClaim(true);
        setTimeLeft(0);
      } else {
        setCanClaim(false);
        setTimeLeft(REWARD_COOLDOWN - diff);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, [user.lastDailyClaim]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const spawnParticles = (targetElementId: string = 'navbar-credits-icon') => {
    const target = document.getElementById(targetElementId);
    if (!target) return;
    
    // Default to center if button ref is null or specific context is needed
    const btnRect = claimButtonRef.current?.getBoundingClientRect() || { left: window.innerWidth/2, top: window.innerHeight/2, width: 0, height: 0 };
    const targetRect = target.getBoundingClientRect();
    
    const startX = btnRect.left + btnRect.width / 2;
    const startY = btnRect.top + btnRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;

    for (let i = 0; i < 24; i++) {
      setTimeout(() => {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;
        particle.style.left = `${startX + offsetX}px`;
        particle.style.top = `${startY + offsetY}px`;
        particle.style.setProperty('--tw-translate-x', `${endX - (startX + offsetX)}px`);
        particle.style.setProperty('--tw-translate-y', `${endY - (startY + offsetY)}px`);
        const duration = 0.6 + Math.random() * 0.6;
        particle.style.animation = `particle-fly ${duration}s cubic-bezier(0.16, 1, 0.3, 1) forwards`;
        document.body.appendChild(particle);
        setTimeout(() => document.body.removeChild(particle), duration * 1000);
      }, i * 30);
    }
  };

  const handleClaim = () => {
    if (canClaim) {
      spawnParticles();
      setTimeout(() => onClaim(), 800);
    }
  };

  const handleTask = (taskId: string, reward: number, link: string) => {
    window.open(link, '_blank');
    // Simulated delay before task becomes claimable or claimed
    setTimeout(() => {
      spawnParticles();
      onTaskComplete(taskId, reward);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-16 bg-white fade-in">
      <div className="max-w-4xl w-full text-center">
        <div className="mb-12 relative inline-block">
          <div className="absolute inset-0 bg-emerald-500/10 blur-[60px] animate-pulse"></div>
          <div className="relative z-10 w-28 h-28 bg-white shadow-2xl shadow-emerald-50 rounded-[36px] flex items-center justify-center border border-gray-50 scale-in">
            <i className="fa-solid fa-gift text-emerald-600 text-4xl"></i>
          </div>
        </div>

        <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Community Rewards</h1>
        <p className="text-gray-500 mb-12 font-medium leading-relaxed max-w-xl mx-auto">
          Earn credits by engaging with the {APP_NAME} community. <br />
          Claim daily bonuses or complete tasks to boost your balance.
        </p>

        {/* Daily Bonus Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 text-left">
           <div className="bg-white/60 backdrop-blur-md border border-gray-100 rounded-[40px] p-10 shadow-2xl shadow-gray-100/50 relative overflow-hidden flex flex-col justify-between slide-up" style={{ animationDelay: '0.1s' }}>
              <div>
                <div className="flex items-center justify-between mb-8">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Daily Check-in</span>
                  <div className={`w-3 h-3 rounded-full ${canClaim ? 'bg-emerald-500 animate-ping' : 'bg-gray-200'}`}></div>
                </div>
                <div className="flex items-baseline mb-4">
                  <span className="text-5xl font-black text-gray-900">+{DAILY_REWARD_AMOUNT}</span>
                  <span className="text-sm font-black text-emerald-600 ml-2 uppercase">Credits</span>
                </div>
                <p className="text-gray-500 text-sm font-medium leading-relaxed mb-10">
                  Return every 24 hours to claim your free community energy tokens.
                </p>
              </div>

              {canClaim ? (
                <button 
                  ref={claimButtonRef}
                  onClick={handleClaim}
                  className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-lg transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-100 flex items-center justify-center"
                >
                  <i className="fa-solid fa-bolt mr-3"></i>
                  Claim Bonus
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Next in</span>
                    <span className="text-xl font-mono font-black text-gray-900">{formatTime(timeLeft)}</span>
                  </div>
                  <button disabled className="w-full py-5 bg-gray-100 text-gray-400 rounded-3xl font-black text-lg cursor-not-allowed">
                    Already Claimed
                  </button>
                </div>
              )}
           </div>

           {/* Roblox Community Tasks */}
           <div className="space-y-6 slide-up" style={{ animationDelay: '0.2s' }}>
              <TaskCard 
                icon="fa-user-plus" 
                title="Follow on Roblox" 
                reward={10} 
                taskId="roblox_follow"
                isCompleted={user.tasksCompleted?.includes('roblox_follow')}
                onClick={() => handleTask('roblox_follow', 10, 'https://www.roblox.com/users/9387017450/profile?friendshipSourceType=PlayerSearch')}
              />
              <TaskCard 
                icon="fa-users" 
                title="Join Roblox Group" 
                reward={15} 
                taskId="roblox_group"
                isCompleted={user.tasksCompleted?.includes('roblox_group')}
                onClick={() => handleTask('roblox_group', 15, 'https://www.roblox.com/search/communities?keyword=crocsthepen')}
              />
           </div>
        </div>

        <Link to="/dashboard" className="text-gray-400 hover:text-emerald-600 text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center">
          <i className="fa-solid fa-arrow-left mr-3"></i>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

const TaskCard: React.FC<{ icon: string, title: string, reward: number, taskId: string, isCompleted?: boolean, onClick: () => void }> = ({ icon, title, reward, taskId, isCompleted, onClick }) => (
  <div className={`p-6 rounded-[32px] border bg-white/50 backdrop-blur-sm transition-all flex items-center justify-between ${isCompleted ? 'border-emerald-100 bg-emerald-50/20' : 'border-gray-100 hover:shadow-xl hover:shadow-gray-50'}`}>
    <div className="flex items-center space-x-5">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
        <i className={`fa-solid ${icon} text-xl`}></i>
      </div>
      <div className="text-left">
        <p className="text-sm font-black text-gray-900">{title}</p>
        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">+{reward} Credits</p>
      </div>
    </div>

    {isCompleted ? (
      <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-100">
        <i className="fa-solid fa-check"></i>
      </div>
    ) : (
      <button 
        onClick={onClick}
        className="px-6 py-2.5 bg-gray-900 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg"
      >
        Complete
      </button>
    )}
  </div>
);

export default DailyRewardsPage;