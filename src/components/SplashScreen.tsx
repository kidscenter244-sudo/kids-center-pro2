import React, { useEffect } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000); // 2 seconds

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div 
      onClick={onFinish}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white cursor-pointer select-none transition-opacity duration-700 animate-in fade-in"
    >
      <div className="flex flex-col items-center justify-center text-center p-6">
        {/* Soft rounded icon container with gentle black shadow */}
        <div className="w-24 h-24 rounded-3xl bg-white border border-slate-200/90 flex items-center justify-center card-soft-black-shadow mb-6 transform hover:scale-105 transition-transform duration-300">
          <span className="text-4xl font-black math-font bg-gradient-to-br from-indigo-600 via-sky-500 to-indigo-700 bg-clip-text text-transparent">
            ×÷
          </span>
        </div>

        {/* Brand: kidscenter with PRO underneath */}
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900 font-['Outfit',sans-serif] lowercase">
          kidscenter
        </h1>

        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="px-3.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs tracking-widest uppercase">
            PRO
          </span>
        </div>

        <p className="text-xs font-semibold text-slate-400 tracking-wide mt-4">
          Smart Mental Math & Calculation Mastery Platform
        </p>

        {/* Small delicate loading bar */}
        <div className="w-36 h-1 bg-slate-100 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full animate-pulse w-full" />
        </div>
      </div>
    </div>
  );
};
