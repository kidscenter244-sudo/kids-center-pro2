import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  ArrowRight, 
  PenTool, 
  RotateCcw, 
  Send, 
  Trophy,
  User,
  AlertCircle,
  Layers
} from 'lucide-react';
import { Question, Quiz, StudentAnswer } from '../types/quiz';
import { quizService } from '../services/quizService';
import { formatQuestionInline } from '../utils/mathGenerator';
import { sound } from '../utils/audio';
import { Scratchpad } from './Scratchpad';

interface StudentPortalProps {
  initialQuiz: Quiz | null;
  studentPresetName?: string;
  onExit?: () => void;
  onSubmissionSuccess?: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  initialQuiz,
  studentPresetName = '',
  onExit,
  onSubmissionSuccess,
}) => {
  const [activeQuiz] = useState<Quiz | null>(initialQuiz);
  const [studentName, setStudentName] = useState(studentPresetName);
  const [stage, setStage] = useState<'welcome' | 'exam' | 'results'>(
    studentPresetName && initialQuiz ? 'exam' : 'welcome'
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [inputVal, setInputVal] = useState('');
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);

  // Timing
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalSpentSeconds, setTotalSpentSeconds] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Results
  const [finalScore, setFinalScore] = useState<number>(0);
  const [detailedAnswers, setDetailedAnswers] = useState<StudentAnswer[]>([]);

  // Start exam
  const handleStartExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;

    sound.playClick();
    setStage('exam');
    setCurrentIndex(0);
    setAnswers({});
    setInputVal('');
    startTimeRef.current = Date.now();

    if (activeQuiz && activeQuiz.config.timeMinutes > 0) {
      setTimeLeft(activeQuiz.config.timeMinutes * 60);
    }
  };

  // Submit exam
  const handleSubmitExam = useCallback(() => {
    if (!activeQuiz) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const questions = activeQuiz.questions;
    let score = 0;
    const spent = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    setTotalSpentSeconds(spent);

    const records: StudentAnswer[] = questions.map((q) => {
      const studentAns = answers[q.id] ?? null;
      const isCorrect = studentAns !== null && studentAns === q.correctAnswer;
      if (isCorrect) score += 1;

      return {
        questionId: q.id,
        questionText: formatQuestionInline(q.terms),
        terms: q.terms,
        correctAnswer: q.correctAnswer,
        studentAnswer: studentAns,
        isCorrect,
      };
    });

    const percentage = Math.round((score / questions.length) * 100);
    setFinalScore(score);
    setDetailedAnswers(records);
    setStage('results');

    // Save to service & server
    quizService.saveSubmission({
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.config.title || 'Mental Math Quiz - kidscenter PRO',
      studentName: studentName.trim() || 'Anonymous Student',
      score,
      totalQuestions: questions.length,
      percentage,
      timeSpentSeconds: spent,
      answers: records,
    });

    sound.playVictory();
    confetti({
      particleCount: 120,
      spread: 75,
      origin: { y: 0.6 },
    });

    if (onSubmissionSuccess) {
      onSubmissionSuccess();
    }
  }, [activeQuiz, answers, studentName, onSubmissionSuccess]);

  // Timer tick
  useEffect(() => {
    if (stage !== 'exam' || !activeQuiz || activeQuiz.config.timeMinutes === 0) return;

    if (timeLeft === 0) {
      setTimeLeft(activeQuiz.config.timeMinutes * 60);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmitExam();
          return 0;
        }
        if (prev <= 5) {
          sound.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, activeQuiz, handleSubmitExam, timeLeft]);

  const saveCurrentAnswer = (val: number | null) => {
    if (!activeQuiz) return;
    const currentQ = activeQuiz.questions[currentIndex];
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: val,
    }));
  };

  const handleKeypadPress = (digit: string) => {
    sound.playClick();
    if (digit === 'C') {
      setInputVal('');
      saveCurrentAnswer(null);
    } else if (digit === 'BACK') {
      const next = inputVal.slice(0, -1);
      setInputVal(next);
      saveCurrentAnswer(next ? Number(next) : null);
    } else {
      const next = inputVal + digit;
      setInputVal(next);
      saveCurrentAnswer(Number(next));
    }
  };

  const currentQuestion: Question | undefined = activeQuiz?.questions[currentIndex];

  useEffect(() => {
    if (currentQuestion) {
      const stored = answers[currentQuestion.id];
      setInputVal(stored !== undefined && stored !== null ? String(stored) : '');
    }
  }, [currentIndex, currentQuestion, answers]);

  const handleNext = () => {
    if (!activeQuiz) return;
    if (currentIndex < activeQuiz.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      sound.playClick();
    } else {
      handleSubmitExam();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      sound.playClick();
    }
  };

  if (!activeQuiz) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Quiz Selected</h2>
        <p className="text-xs text-slate-500 mb-4">Please enter a valid quiz access code on the home page.</p>
        {onExit && (
          <button
            onClick={onExit}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            Back to Home
          </button>
        )}
      </div>
    );
  }

  // Stage 1: Welcome & Name
  if (stage === 'welcome') {
    return (
      <div className="max-w-md mx-auto px-4 py-12 animate-in fade-in duration-300">
        <div className="bg-white border border-slate-200/90 rounded-[32px] p-8 card-soft-black-shadow text-center">
          <div className="w-16 h-16 rounded-full bg-slate-900 text-white font-black text-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <span>±</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-1 font-['Outfit',sans-serif]">
            {activeQuiz.config.title || 'Mental Math Challenge'}
          </h2>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-6">
            <span className="font-bold text-indigo-600">kidscenter PRO</span>
            <span>·</span>
            <span className="math-font">{activeQuiz.questions.length} Questions</span>
            <span>·</span>
            <span>
              {activeQuiz.config.timeMinutes > 0 ? `${activeQuiz.config.timeMinutes} mins` : 'Unlimited time'}
            </span>
          </div>

          <form onSubmit={handleStartExam} className="space-y-4">
            <div className="text-left">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Enter Your Full Name:</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Alex Smith"
                required
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl px-4 py-3 text-base text-slate-900 text-center font-bold outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-2xl shadow-md transition-all active:scale-98 cursor-pointer"
            >
              Start Quiz Now 🚀
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Stage 3: Results
  if (stage === 'results') {
    const total = activeQuiz.questions.length;
    const percentage = Math.round((finalScore / total) * 100);
    const isPassed = percentage >= 60;

    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-in zoom-in-95 duration-200">
        <div className="bg-white border border-slate-200/90 rounded-[36px] p-6 sm:p-8 card-soft-black-shadow">
          <div className="text-center pb-6 border-b border-slate-100">
            <div className={`w-16 h-16 rounded-3xl mx-auto mb-3 flex items-center justify-center text-2xl shadow-md ${
              isPassed ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
            }`}>
              <Trophy className="w-8 h-8" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Your results were submitted to kidscenter PRO</span>
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Well done, {studentName}! 🌟
            </h2>

            <div className="flex items-center justify-center gap-3 mt-5">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-5 py-3">
                <span className="text-[10px] text-slate-400 block font-bold">Score:</span>
                <span className="text-3xl font-black math-font text-slate-900">
                  {finalScore} <span className="text-base text-slate-400">/ {total}</span>
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-5 py-3">
                <span className="text-[10px] text-slate-400 block font-bold">Accuracy:</span>
                <span className={`text-3xl font-black math-font ${
                  percentage >= 90 ? 'text-emerald-600' : percentage >= 60 ? 'text-indigo-600' : 'text-amber-600'
                }`}>
                  {percentage}%
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-5 py-3">
                <span className="text-[10px] text-slate-400 block font-bold">Time:</span>
                <span className="text-xl font-black math-font text-slate-700 mt-1 block">
                  {Math.floor(totalSpentSeconds / 60)}m {totalSpentSeconds % 60}s
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="mt-6">
            <h3 className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Question Answers Review:</span>
            </h3>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {detailedAnswers.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                    item.isCorrect
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50/60 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                    <div>
                      <div className="text-sm font-black math-font text-slate-800">
                        {item.questionText} = <strong className="text-indigo-600">{item.correctAnswer}</strong>
                      </div>
                      <span className="text-[11px] font-bold math-font text-slate-500">
                        Your answer: {item.studentAnswer !== null ? item.studentAnswer : 'blank'}
                      </span>
                    </div>
                  </div>

                  {item.isCorrect ? (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Correct</span>
                    </span>
                  ) : (
                    <div className="text-right text-xs">
                      <span className="text-rose-600 font-bold flex items-center gap-1 justify-end">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Incorrect</span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Correct: <strong className="text-indigo-600 math-font">{item.correctAnswer}</strong>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => {
                setStage('welcome');
                sound.playClick();
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Quiz</span>
            </button>

            {onExit && (
              <button
                onClick={onExit}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                Exit Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Stage 2: Active Exam
  const totalQuestions = activeQuiz.questions.length;
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6 animate-in fade-in duration-200">
      
      <Scratchpad
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
      />

      {/* Top HUD */}
      <div className="bg-white border border-slate-200/90 rounded-[28px] p-3.5 mb-4 card-soft-black-shadow flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            {studentName.charAt(0) || 'S'}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">{studentName}</span>
            <span className="text-[10px] text-slate-400">
              Question {currentIndex + 1} of {totalQuestions} ({answeredCount} answered)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsScratchpadOpen(true);
            sound.playClick();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
        >
          <PenTool className="w-3.5 h-3.5 text-indigo-600" />
          <span>Scratchpad</span>
        </button>

        {activeQuiz.config.timeMinutes > 0 && (
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold math-font text-xs border ${
            timeLeft <= 30
              ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-1.5 mb-4 overflow-hidden">
        <div
          className="bg-indigo-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div className="bg-white border border-slate-200/90 rounded-[36px] p-6 sm:p-8 card-soft-black-shadow relative">
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">
                Question <strong className="text-slate-800 math-font">#{currentIndex + 1}</strong>
              </span>
              {currentQuestion.groupLabel && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700">
                  {currentQuestion.groupLabel}
                </span>
              )}
            </div>

            <span className="text-[11px] text-slate-400 font-medium">
              Vertical Mental Math
            </span>
          </div>

          {/* Vertical Stacked Arithmetic Display */}
          <div className="my-6 flex justify-center items-center">
            <div className="bg-slate-50/80 border border-slate-200 px-10 py-6 rounded-3xl min-w-[200px] flex flex-col items-end shadow-inner">
              {currentQuestion.terms.map((term, tIdx) => (
                <div key={tIdx} className="w-full flex justify-end items-center gap-2 text-3xl sm:text-4xl font-black math-font leading-tight">
                  {term.isNegative ? (
                    <span className="text-rose-600 font-black text-3xl mr-1">-</span>
                  ) : (
                    <span className="w-4" />
                  )}
                  <span className={term.isNegative ? 'text-rose-700' : 'text-slate-900'}>
                    {term.value}
                  </span>
                </div>
              ))}
              
              {/* Divider Line */}
              <div className="w-full border-b-4 border-slate-900 my-2.5 rounded-full" />
              
              {/* Answer Box Preview under the line */}
              <div className="w-full flex justify-end items-center">
                <span className="text-3xl sm:text-4xl font-black math-font text-indigo-600 tracking-wider">
                  {inputVal ? inputVal : <span className="text-slate-300">?</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Input & Virtual Keypad */}
          <div className="max-w-xs mx-auto my-4">
            <input
              type="number"
              value={inputVal}
              onChange={(e) => {
                const val = e.target.value;
                setInputVal(val);
                saveCurrentAnswer(val ? Number(val) : null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleNext();
                }
              }}
              placeholder="Type your answer..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl py-2.5 text-center text-2xl font-black math-font text-slate-900 mb-3 outline-none"
            />

            <div className="grid grid-cols-3 gap-1.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'BACK'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeypadPress(key)}
                  className={`py-2.5 rounded-xl font-bold text-base math-font transition-all active:scale-95 cursor-pointer ${
                    key === 'C'
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : key === 'BACK'
                      ? 'bg-slate-100 text-slate-600 border border-slate-200'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {key === 'BACK' ? '⌫' : key}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitExam}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Exam 🚀</span>
              </button>
            )}
          </div>

        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-3">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Only the subtraction number has a minus sign. Calculate total and answer.</span>
      </div>

    </div>
  );
};
