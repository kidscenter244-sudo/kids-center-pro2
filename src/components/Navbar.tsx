import React from 'react';
import { 
  Sparkles, 
  BarChart3, 
  PlusCircle, 
  Volume2, 
  VolumeX, 
  ListChecks, 
  LogOut 
} from 'lucide-react';
import { sound } from '../utils/audio';

interface NavbarProps {
  activeTab: 'builder' | 'dashboard' | 'quizzes';
  setActiveTab: (tab: 'builder' | 'dashboard' | 'quizzes') => void;
  submissionsCount: number;
  quizzesCount: number;
  onNewQuizClick: () => void;
  onLogout: () => void;
  isTeacherLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  submissionsCount,
  quizzesCount,
  onNewQuizClick,
  onLogout,
  isTeacherLoggedIn,
}) => {
  const [isMuted, setIsMuted] = React.useState(sound.getMuted());

  const toggleSound = () => {
    const nextState = !isMuted;
    sound.setMuted(nextState);
    setIsMuted(nextState);
    if (!nextState) sound.playClick();
  };

  return (
    <div className="sticky top-4 z-50 w-full px-4 flex justify-center">
      {/* 80% Floating Navbar with Circular Border & Black Shadow */}
      <header className="w-full sm:w-[85%] md:w-[80%] max-w-5xl bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-full px-5 py-2 navbar-floating-luxury transition-all flex items-center justify-between gap-4">
        
        {/* Zone 1: Wordmark "kidscenter" with "PRO" underneath */}
        <div 
          onClick={() => {
            if (isTeacherLoggedIn) setActiveTab('builder');
          }}
          className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group"
        >
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-md group-hover:scale-105 transition-transform">
            <span>±</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-black text-slate-900 tracking-tight font-['Outfit',sans-serif] lowercase">
              kidscenter
            </span>
            <span className="text-[10px] font-black text-indigo-600 tracking-wider">
              PRO
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        {isTeacherLoggedIn ? (
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <button
              onClick={() => {
                setActiveTab('builder');
                sound.playClick();
              }}
              className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 py-1 transition-colors ${
                activeTab === 'builder'
                  ? 'text-indigo-600 font-extrabold'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Create Mental Math Quiz</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('dashboard');
                sound.playClick();
              }}
              className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 py-1 transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-indigo-600 font-extrabold'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Student Submissions</span>
              {submissionsCount > 0 && (
                <span className="math-font text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-full font-bold">
                  {submissionsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('quizzes');
                sound.playClick();
              }}
              className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 py-1 transition-colors ${
                activeTab === 'quizzes'
                  ? 'text-indigo-600 font-extrabold'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5 text-sky-600" />
              <span>Quizzes ({quizzesCount})</span>
            </button>
          </nav>
        ) : (
          <div className="hidden sm:block text-xs text-slate-400 font-medium">
            Smart math and calculation platform for students
          </div>
        )}

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-indigo-600" />}
          </button>

          {isTeacherLoggedIn ? (
            <>
              <button
                onClick={() => {
                  onNewQuizClick();
                  sound.playClick();
                }}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-full font-bold text-xs shadow-md shadow-slate-900/10 active:scale-95 transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Quiz</span>
              </button>

              <button
                onClick={onLogout}
                title="Log Out"
                className="p-2 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
              Portal
            </span>
          )}
        </div>

      </header>
    </div>
  );
};
