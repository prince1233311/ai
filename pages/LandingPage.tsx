import React from 'react';
import { Link } from 'react-router-dom';
import { AuthState } from '../types';
import { APP_NAME, Logo } from '../constants.tsx';

interface LandingPageProps {
  auth: AuthState;
}

const LandingPage: React.FC<LandingPageProps> = ({ auth }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center bg-white relative overflow-hidden">
      {/* Soft Background Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_center,_#ecfdf5_0%,_transparent_70%)] opacity-70 pointer-events-none"></div>
      
      <div className="mb-10 slide-up">
        <Logo className="w-28 h-28 mx-auto shadow-2xl shadow-emerald-100 rounded-3xl" />
      </div>
      
      <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-gray-900 slide-up" style={{ animationDelay: '0.1s' }}>
        AI Designed for the <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500">
          CrocSthepen Community
        </span>
      </h1>
      
      <p className="text-xl text-gray-500 max-w-2xl mb-12 leading-relaxed font-medium slide-up" style={{ animationDelay: '0.2s' }}>
        Experience a premium, high-speed conversational AI interface built for 
        productivity, creativity, and community growth.
      </p>
      
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 slide-up" style={{ animationDelay: '0.3s' }}>
        <Link 
          to={auth.isAuthenticated ? "/dashboard" : "/signup"}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black text-lg transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-200"
        >
          {auth.isAuthenticated ? "Open Dashboard" : "Get Started Now"}
        </Link>
        {!auth.isAuthenticated && (
          <Link 
            to="/login"
            className="bg-white hover:bg-gray-50 text-gray-900 px-10 py-4 rounded-2xl font-black text-lg transition-all border border-gray-100 shadow-xl shadow-gray-100"
          >
            Log In
          </Link>
        )}
      </div>

      <div className="mt-28 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full px-4 slide-up" style={{ animationDelay: '0.4s' }}>
        <FeatureCard 
          icon="fa-bolt-lightning" 
          title="Ultra-Fast Engine" 
          description="Powered by the latest Flash models for instantaneous responses and low latency."
        />
        <FeatureCard 
          icon="fa-wand-magic-sparkles" 
          title="Smooth Experience" 
          description="A beautifully crafted UI with seamless transitions and a calming white aesthetic."
        />
        <FeatureCard 
          icon="fa-gem" 
          title="Community Perks" 
          description="Earn credits through daily check-ins and participate in community-driven AI evolution."
        />
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: string, title: string, description: string }> = ({ icon, title, description }) => (
  <div className="p-8 rounded-3xl bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-100 transition-all duration-500 group text-left">
    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <i className={`fa-solid ${icon} text-emerald-600 text-2xl`}></i>
    </div>
    <h3 className="text-xl font-extrabold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed font-medium">{description}</p>
  </div>
);

export default LandingPage;