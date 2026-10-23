import React, { useState } from 'react';
import { User, KeyRound, ArrowRight, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';
import { Quiz } from '../types/quiz';
import { quizService } from '../services/quizService';
import { sound } from '../utils/audio';

interface AuthGatewayProps {
  onStudentLogin: (studentName: string, quiz: Quiz) => void;
  onTeacherLogin: () => void;
  initialQuizCode?: string;
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({
  onStudentLogin,
  onTeacherLogin,
  initialQuizCode = '',
}) => {
  const [activePortal, setActivePortal] = useState<'student' | 'teacher'>('student');

  // Student form state
  const [studentName, setStudentName] = useState('');
  const [quizCode, setQuizCode] = useState(initialQuizCode);
  const [studentError, setStudentError] = useState('');

  // Teacher credentials state
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherError, setTeacherError] = useState('');

  const VALID_TEACHER_EMAIL = 'teacher@kidscenter.com';
  const VALID_TEACHER_PASSWORD = 'kids123';

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    if (!studentName.trim()) {
      setStudentError('Please enter your name');
      return;
    }

    if (!quizCode.trim()) {
      setStudentError('Please enter the quiz access code');
      return;
    }

    const quiz = quizService.getQuizByIdOrCode(quizCode);
    if (!quiz) {
      setStudentError('Quiz code is incorrect or not found. Please verify the code.');
      sound.playIncorrect();
      return;
    }

    sound.playClick();
    onStudentLogin(studentName.trim(), quiz);
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError('');

    const cleanEmail = teacherEmail.trim().toLowerCase();
    const cleanPass = teacherPassword.trim();

    if (cleanEmail === VALID_TEACHER_EMAIL && cleanPass === VALID_TEACHER_PASSWORD) {
      sound.playClick();
      onTeacherLogin();
    } else {
      setTeacherError('Invalid teacher email or password');
      sound.playIncorrect();
    }
  };

  return (
    <div className="min-h-[82vh] flex flex-col items-center justify-center px-4 py-8">
      
      {/* Top Branding for kidscenter PRO */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 card-soft-black-shadow text-xs font-semibold text-slate-700 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Smart Mental Arithmetic Platform</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-['Outfit',sans-serif] lowercase">
          kidscenter
        </h1>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-[11px] tracking-wider uppercase">
            PRO
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium">
          Choose your entrance: Student Exam Portal or Teacher Control Center
        </p>
      </div>

      {/* Main Rounded Box with Distinct Black Shadow */}
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-[32px] p-6 sm:p-8 card-soft-black-shadow relative overflow-hidden">
        
        {/* Toggle Switch between Student and Teacher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setActivePortal('student');
              sound.playClick();
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activePortal === 'student'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4 text-indigo-600" />
            <span>Student Portal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePortal('teacher');
              sound.playClick();
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activePortal === 'teacher'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-slate-700" />
            <span>Teacher Login</span>
          </button>
        </div>

        {/* 1. STUDENT ENTRANCE (Name & Quiz Code Only) */}
        {activePortal === 'student' && (
          <form onSubmit={handleStudentSubmit} className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>Student Full Name:</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your name..."
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>Quiz Access Code:</span>
              </label>
              <input
                type="text"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                placeholder="e.g. KC-2X2"
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl px-4 py-3 text-center text-lg font-black math-font text-indigo-600 tracking-wider outline-none transition-all placeholder:text-slate-400 uppercase"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                The access code is given to you by your teacher
              </p>
            </div>

            {studentError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
                {studentError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm transition-all shadow-md shadow-slate-900/10 active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Start Quiz & Challenge Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-slate-400">
                Sample starter code: <strong className="text-indigo-600 math-font">KC-PRO1</strong>
              </span>
            </div>
          </form>
        )}

        {/* 2. TEACHER PORTAL (Email & Password) */}
        {activePortal === 'teacher' && (
          <form onSubmit={handleTeacherSubmit} className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                <span>Teacher Email:</span>
              </label>
              <input
                type="email"
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                placeholder="teacher@kidscenter.com"
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-700" />
                <span>Password:</span>
              </label>
              <input
                type="password"
                value={teacherPassword}
                onChange={(e) => setTeacherPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {teacherError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
                {teacherError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm transition-all shadow-md shadow-indigo-600/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Teacher Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick credentials hint */}
            <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-indigo-900 block">Default Teacher Credentials:</span>
              <div className="flex items-center justify-between">
                <span>Email:</span>
                <span className="font-mono font-bold text-indigo-700">teacher@kidscenter.com</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Password:</span>
                <span className="font-mono font-bold text-indigo-700">kids123</span>
              </div>
            </div>
          </form>
        )}

      </div>

    </div>
  );
};
