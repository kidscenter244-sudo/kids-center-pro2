/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { AuthGateway } from './components/AuthGateway';
import { Navbar } from './components/Navbar';
import { QuizBuilder } from './components/QuizBuilder';
import { StudentPortal } from './components/StudentPortal';
import { TeacherDashboard } from './components/TeacherDashboard';
import { QuizzesList } from './components/QuizzesList';
import { ShareQuizModal } from './components/ShareQuizModal';
import { Quiz, QuizSubmission } from './types/quiz';
import { quizService, subscribeToSync } from './services/quizService';

const TEACHER_AUTH_KEY = 'kidscenter_pro_teacher_auth_v1';

export default function App() {
  // 1. Splash screen for 2 seconds
  const [showSplash, setShowSplash] = useState(true);

  // 2. Auth & Navigation state (Persisted in localStorage)
  const [isTeacherLoggedIn, setIsTeacherLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(TEACHER_AUTH_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [activeTeacherTab, setActiveTeacherTab] = useState<'builder' | 'dashboard' | 'quizzes'>('builder');
  const [dashboardQuizFilter, setDashboardQuizFilter] = useState<string>('all');

  // Student exam state
  const [studentSession, setStudentSession] = useState<{
    studentName: string;
    quiz: Quiz;
  } | null>(null);

  // Data
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [shareModalQuiz, setShareModalQuiz] = useState<Quiz | null>(null);
  const [initialUrlQuizCode, setInitialUrlQuizCode] = useState<string>('');

  const reloadData = useCallback(() => {
    setQuizzes(quizService.getQuizzes());
    setSubmissions(quizService.getSubmissions());
  }, []);

  useEffect(() => {
    reloadData();

    // Initial Supabase sync attempt
    quizService.syncWithSupabase().catch(() => {});

    // Check URL parameter e.g. ?quiz=KC-2X2
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('quiz');
      if (code) {
        setInitialUrlQuizCode(code.toUpperCase());
      }
    } catch {
      // Ignored
    }

    const unsubscribe = subscribeToSync(() => {
      reloadData();
    });

    return () => {
      unsubscribe();
    };
  }, [reloadData]);

  // Student enters exam
  const handleStudentLogin = (name: string, quiz: Quiz) => {
    setStudentSession({
      studentName: name,
      quiz,
    });
  };

  // Teacher logs in with credentials
  const handleTeacherLogin = () => {
    try {
      localStorage.setItem(TEACHER_AUTH_KEY, 'true');
    } catch {
      // Ignored
    }
    setIsTeacherLoggedIn(true);
    setActiveTeacherTab('builder');
  };

  // Teacher logs out
  const handleTeacherLogout = () => {
    try {
      localStorage.removeItem(TEACHER_AUTH_KEY);
    } catch {
      // Ignored
    }
    setIsTeacherLoggedIn(false);
    setStudentSession(null);
  };

  // View specific quiz submissions
  const handleViewQuizSubmissions = (quizId: string) => {
    setDashboardQuizFilter(quizId);
    setActiveTeacherTab('dashboard');
  };

  // Teacher creates quiz
  const handleQuizCreated = (newQuiz: Quiz) => {
    reloadData();
    setShareModalQuiz(newQuiz);
  };

  // Teacher previews quiz as student
  const handleTeacherTestQuiz = (quiz: Quiz) => {
    setStudentSession({
      studentName: 'Teacher Preview',
      quiz,
    });
  };

  // Render 2-second splash screen first
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Active student exam mode
  if (studentSession) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-['Plus_Jakarta_Sans',sans-serif] pb-12">
        <div className="pt-4 px-4 flex justify-between items-center max-w-2xl mx-auto">
          <div className="flex flex-col leading-none">
            <span className="text-sm font-black font-['Outfit',sans-serif] text-slate-900 lowercase">
              kidscenter
            </span>
            <span className="text-[9px] font-extrabold text-indigo-600 tracking-wider">
              PRO
            </span>
          </div>
          <button
            onClick={() => setStudentSession(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-full card-soft-black-shadow cursor-pointer"
          >
            Exit Quiz
          </button>
        </div>

        <StudentPortal
          initialQuiz={studentSession.quiz}
          studentPresetName={studentSession.studentName}
          onExit={() => {
            setStudentSession(null);
            reloadData();
          }}
          onSubmissionSuccess={() => {
            reloadData();
          }}
        />
      </div>
    );
  }

  // If teacher is NOT logged in, show AuthGateway
  if (!isTeacherLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-['Plus_Jakarta_Sans',sans-serif]">
        <AuthGateway
          onStudentLogin={handleStudentLogin}
          onTeacherLogin={handleTeacherLogin}
          initialQuizCode={initialUrlQuizCode}
        />
      </div>
    );
  }

  // Teacher Portal Interface
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col">
      {/* 80% Floating Navbar with Circular Border & Black Shadow */}
      <Navbar
        activeTab={activeTeacherTab}
        setActiveTab={setActiveTeacherTab}
        submissionsCount={submissions.length}
        quizzesCount={quizzes.length}
        onNewQuizClick={() => setActiveTeacherTab('builder')}
        onLogout={handleTeacherLogout}
        isTeacherLoggedIn={isTeacherLoggedIn}
      />

      {/* Teacher Main Views */}
      <main className="flex-1 pb-16">
        {activeTeacherTab === 'builder' && (
          <QuizBuilder
            onQuizCreated={handleQuizCreated}
            onGoToDashboard={() => setActiveTeacherTab('dashboard')}
          />
        )}

        {activeTeacherTab === 'dashboard' && (
          <TeacherDashboard
            submissions={submissions}
            quizzes={quizzes}
            selectedQuizFilter={dashboardQuizFilter}
            onSelectQuizFilter={setDashboardQuizFilter}
            onRefresh={reloadData}
            onGoToBuilder={() => setActiveTeacherTab('builder')}
          />
        )}

        {activeTeacherTab === 'quizzes' && (
          <QuizzesList
            quizzes={quizzes}
            submissions={submissions}
            onViewQuizSubmissions={handleViewQuizSubmissions}
            onSelectQuizToShare={(quiz) => setShareModalQuiz(quiz)}
            onTakeQuiz={handleTeacherTestQuiz}
            onGoToBuilder={() => setActiveTeacherTab('builder')}
            onRefresh={reloadData}
          />
        )}
      </main>

      {/* Share & QR Code Modal */}
      <ShareQuizModal
        quiz={shareModalQuiz}
        isOpen={!!shareModalQuiz}
        onClose={() => setShareModalQuiz(null)}
        onStartExam={handleTeacherTestQuiz}
      />

      {/* Light delicate footer */}
      <footer className="border-t border-slate-200/80 bg-white/60 py-4 text-center text-xs text-slate-400">
        <div className="w-[80%] max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-['Outfit',sans-serif] font-black text-slate-700">kidscenter</span>
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.2 rounded-full">PRO</span>
          </div>
          <span>Multi-Section Mental Math, Multiplication & Division System</span>
        </div>
      </footer>
    </div>
  );
}
