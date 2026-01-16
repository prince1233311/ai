
import React from 'react';

export const APP_NAME = "CrocSthepen AI";
export const STARTING_CREDITS = 50;
export const COST_PER_MESSAGE = 1;
export const COST_PER_IMAGE = 5;
export const COST_PER_WEBSITE = 20;
export const COST_PER_VIDEO = 50;
export const DAILY_REWARD_AMOUNT = 40;

export const Logo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <div className={`flex items-center justify-center overflow-hidden rounded-xl shadow-lg bg-white ${className}`}>
    <img 
      src="logo.png" 
      alt="CrocSthepen Logo" 
      className="w-full h-full object-cover p-1"
      onError={(e) => {
        e.currentTarget.src = "https://api.dicebear.com/7.x/bottts/svg?seed=CrocSthepen&backgroundColor=ffffff";
      }}
    />
  </div>
);

export const BRAND_CONFIG = {
  primary: "emerald-600",
  dark: "gray-900",
  light: "white",
  accent: "emerald-500"
};
