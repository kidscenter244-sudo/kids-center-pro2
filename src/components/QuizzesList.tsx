import React, { useState } from 'react';
import { 
  Sparkles, 
  Share2, 
  Trash2, 
  ExternalLink, 
  Clock, 
  Hash, 
  Copy, 
  Check, 
  PlusCircle,
  Layers
} from 'lucide-react';
import { Quiz } from '../types/quiz';
import { quizService } from '../services/quizService';
import { sound } from '../utils/audio';

interface QuizzesListProps {
  quizzes: Quiz[];
  onSelectQuizToShare: (quiz: Quiz) => void;
  onTakeQuiz: (quiz: Quiz) => void;
  onGoToBuilder: () => void;
  onRefresh: () => void;
}

export const QuizzesList: React.FC<QuizzesListProps> = ({
  quizzes,
  onSelectQuizToShare,
  onTakeQuiz,
  onGoToBuilder,
  onRefresh,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (quiz: Quiz) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/?quiz=${quiz.code}`;
    navigator.clipboard.writeText(link);
    sound.playClick();
    setCopiedId(quiz.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this quiz?')) {
      quizService.deleteQuiz(id);
      onRefresh();
      sound.playClick();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10 animate-in fade-in duration-300">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Published Quizzes & Access Codes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your created mental math models, copy student links, and share QR codes
          </p>
        </div>

        <button
          onClick={onGoToBuilder}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Quiz</span>
        </button>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-[32px] p-10 text-center card-soft-black-shadow">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-indigo-500" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No Quizzes Created Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Build your first custom mental math quiz with stacked addition and subtraction, then share the student access code.
          </p>
          <button
            onClick={onGoToBuilder}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
          >
            Create Your First Quiz
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white border border-slate-200/90 rounded-[30px] p-5 card-soft-black-shadow flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold math-font text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                    Code: {quiz.code}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(quiz.createdAt).toLocaleDateString('en-US')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-1">
                  {quiz.config.title}
                </h3>

                <div className="space-y-1.5 text-xs text-slate-500 mb-5">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Questions: <strong className="text-slate-800 math-font">{quiz.questions.length}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-500" />
                    <span>
                      Time Limit:{' '}
                      <strong className="text-slate-800">
                        {quiz.config.timeMinutes === 0 ? 'Unlimited' : `${quiz.config.timeMinutes} mins`}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    {quiz.config.groups && quiz.config.groups.length > 0 ? (
                      <span>
                        Sections:{' '}
                        {quiz.config.groups
                          .map((g) => `${g.numbersCount} Rows · ${g.digitsCount} Digits (${g.questionCount} Qs)`)
                          .join(' + ')}
                      </span>
                    ) : (
                      <span>Vertical Mental Math Quiz</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyLink(quiz)}
                    title="Copy Student Link"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    {copiedId === quiz.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => onSelectQuizToShare(quiz)}
                    title="Share & QR Code"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-indigo-600 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(quiz.id)}
                    title="Delete Quiz"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => onTakeQuiz(quiz)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Student View</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
