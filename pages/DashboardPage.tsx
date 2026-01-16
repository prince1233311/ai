
import React from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';
import { APP_NAME } from '../constants.tsx';

interface DashboardPageProps {
  user: User;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 bg-white fade-in">
      <div className="max-w-6xl w-full text-center">
        <div className="mb-10 slide-up">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            Welcome back, <span className="text-emerald-600">{user.username}</span>
          </h1>
          <p className="text-gray-500 font-medium">Choose your creative engine and start building.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-16 px-4">
          <DashboardCard 
            to="/chat/image"
            icon="fa-palette"
            title="Image Studio"
            description="Generate icons, logos, or edit images."
            color="emerald"
            delay="0.1s"
          />
          <DashboardCard 
            to="/chat/code"
            icon="fa-code"
            title="Code Forge"
            description="Senior engineering and algorithm design."
            color="blue"
            delay="0.2s"
          />
           <DashboardCard 
            to="/builder"
            icon="fa-layer-group"
            title="Web Architect"
            description="Generate websites with live preview."
            color="orange"
            delay="0.25s"
            isNew={true}
          />
          <DashboardCard 
            to="/video"
            icon="fa-paintbrush"
            title="Drawing Studio"
            description="Create frame-by-frame animations."
            color="red"
            delay="0.3s"
            isNew={true}
          />
          <DashboardCard 
            to="/live"
            icon="fa-sliders"
            title="Voice Studio"
            description="Real-time voice editor & changer."
            color="purple"
            delay="0.35s"
            isNew={true}
          />
        </div>

        <div className="bg-gray-50 rounded-[40px] p-10 border border-gray-100 slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center space-x-6 text-left">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl text-emerald-600 border border-emerald-50">
                <i className="fa-solid fa-coins text-3xl"></i>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Energy</p>
                <p className="text-3xl font-black text-gray-900">{user.credits} CR</p>
                <p className="text-xs text-gray-400 font-medium">Recharge by completing community tasks</p>
              </div>
            </div>
            <div className="flex">
              <Link 
                to="/rewards" 
                className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[24px] font-black text-lg transition-all shadow-xl shadow-emerald-100 flex items-center"
              >
                <i className="fa-solid fa-gift mr-3"></i>
                Earn Credits
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CardProps {
  to: string;
  icon: string;
  title: string;
  description: string;
  color: 'emerald' | 'blue' | 'purple' | 'orange' | 'red';
  delay: string;
  isNew?: boolean;
}

const DashboardCard: React.FC<CardProps> = ({ to, icon, title, description, color, delay, isNew }) => {
  const colorMap = {
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
    orange: 'text-orange-600 bg-orange-50 border-orange-100',
    red: 'text-red-600 bg-red-50 border-red-100',
  };

  return (
    <Link 
      to={to} 
      className="group bg-white border border-gray-100 p-6 rounded-[32px] hover:border-emerald-500 hover:shadow-2xl transition-all duration-500 text-left slide-up relative overflow-hidden"
      style={{ animationDelay: delay }}
    >
      {isNew && (
        <div className="absolute top-4 right-4 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest animate-pulse">
          New
        </div>
      )}
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner transition-transform group-hover:scale-110 duration-500 ${colorMap[color]}`}>
        <i className={`fa-solid ${icon} text-xl`}></i>
      </div>
      <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">{title}</h3>
      <p className="text-sm text-gray-500 font-medium leading-relaxed">{description}</p>
      <div className="mt-6 flex items-center text-emerald-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
        Start Creating <i className="fa-solid fa-arrow-right ml-2"></i>
      </div>
    </Link>
  );
};

export default DashboardPage;
