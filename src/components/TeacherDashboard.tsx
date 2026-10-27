import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Trophy, 
  Search, 
  Download, 
  Copy, 
  Check, 
  Trash2, 
  Eye, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  Percent, 
  X,
  Database,
  Filter,
  BookOpen
} from 'lucide-react';
import { Quiz, QuizSubmission } from '../types/quiz';
import { quizService } from '../services/quizService';
import { SUPABASE_SQL_SCHEMA } from '../services/supabaseService';
import { sound } from '../utils/audio';

interface TeacherDashboardProps {
  submissions: QuizSubmission[];
  quizzes?: Quiz[];
  selectedQuizFilter?: string;
  onSelectQuizFilter?: (quizId: string) => void;
  onRefresh: () => void;
  onGoToBuilder: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  submissions,
  quizzes = [],
  selectedQuizFilter = 'all',
  onSelectQuizFilter,
  onRefresh,
  onGoToBuilder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [internalFilter, setInternalFilter] = useState<string>(selectedQuizFilter);
  const [inspectSubmission, setInspectSubmission] = useState<QuizSubmission | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (selectedQuizFilter !== undefined) {
      setInternalFilter(selectedQuizFilter);
    }
  }, [selectedQuizFilter]);

  const handleFilterChange = (quizId: string) => {
    setInternalFilter(quizId);
    onSelectQuizFilter?.(quizId);
    sound.playClick();
  };

  // Combine quizzes from props and quizzes referenced in submissions
  const allAvailableQuizzes = useMemo(() => {
    const map = new Map<string, { id: string; title: string; code: string }>();
    quizzes.forEach((q) => {
      map.set(q.id, { id: q.id, title: q.config.title || `Quiz ${q.code}`, code: q.code });
    });
    submissions.forEach((s) => {
      if (!map.has(s.quizId)) {
        map.set(s.quizId, { id: s.quizId, title: s.quizTitle, code: '' });
      }
    });
    return Array.from(map.values());
  }, [quizzes, submissions]);

  const currentSelectedQuiz = useMemo(() => {
    if (internalFilter === 'all') return null;
    return allAvailableQuizzes.find((q) => q.id === internalFilter) || null;
  }, [allAvailableQuizzes, internalFilter]);

  // Submissions filtered by chosen quiz and search query
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchName = sub.studentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchQuiz = internalFilter === 'all' || sub.quizId === internalFilter;
      return matchName && matchQuiz;
    });
  }, [submissions, searchTerm, internalFilter]);

  // Specific submissions count per quiz
  const submissionsCountByQuiz = useMemo(() => {
    const counts: Record<string, number> = {};
    submissions.forEach((s) => {
      counts[s.quizId] = (counts[s.quizId] || 0) + 1;
    });
    return counts;
  }, [submissions]);

  // KPIs computed for the currently filtered view
  const currentTotal = filteredSubmissions.length;
  const currentAverageAccuracy = useMemo(() => {
    if (currentTotal === 0) return 0;
    const sum = filteredSubmissions.reduce((acc, curr) => acc + curr.percentage, 0);
    return Math.round(sum / currentTotal);
  }, [filteredSubmissions, currentTotal]);

  const topStudent = useMemo(() => {
    if (currentTotal === 0) return null;
    return [...filteredSubmissions].sort(
      (a, b) => b.score - a.score || a.timeSpentSeconds - b.timeSpentSeconds
    )[0];
  }, [filteredSubmissions, currentTotal]);

  const fastestStudent = useMemo(() => {
    if (currentTotal === 0) return null;
    return [...filteredSubmissions].sort((a, b) => a.timeSpentSeconds - b.timeSpentSeconds)[0];
  }, [filteredSubmissions, currentTotal]);

  const handleExportCSV = () => {
    if (filteredSubmissions.length === 0) return;
    sound.playClick();

    const headers = [
      'Student Name',
      'Quiz Title',
      'Score',
      'Total Questions',
      'Percentage',
      'Time in Seconds',
      'Submitted At',
    ];
    const rows = filteredSubmissions.map((s) => [
      `"${s.studentName.replace(/"/g, '""')}"`,
      `"${s.quizTitle.replace(/"/g, '""')}"`,
      s.score,
      s.totalQuestions,
      `${s.percentage}%`,
      s.timeSpentSeconds,
      new Date(s.submittedAt).toLocaleString('en-US'),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kidscenter_quiz_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyReport = () => {
    if (filteredSubmissions.length === 0) return;
    sound.playClick();

    const scopeTitle = currentSelectedQuiz 
      ? `Quiz "${currentSelectedQuiz.title}"` 
      : `All Quizzes Combined`;

    let text = `📊 kidscenter PRO - Mental Math Quiz Results Report\n`;
    text += `Target: ${scopeTitle}\n`;
    text += `Total Students: ${filteredSubmissions.length}\n`;
    text += `Average Score: ${currentAverageAccuracy}%\n\n`;
    text += `🏆 Student Leaderboard:\n`;

    filteredSubmissions.forEach((s, idx) => {
      text += `${idx + 1}. ${s.studentName} - Score: ${s.score}/${s.totalQuestions} (${s.percentage}%) - in ${Math.floor(s.timeSpentSeconds / 60)}m ${s.timeSpentSeconds % 60}s\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    sound.playClick();
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Delete all submissions for the selected quiz (or all quizzes) and permanently sync with Supabase
  const handleClearSubmissions = async () => {
    const isSpecific = internalFilter !== 'all' && currentSelectedQuiz;
    const confirmMsg = isSpecific
      ? `هل أنت متأكد من مسح جميع استجابات اختبار "${currentSelectedQuiz.title}"؟\nسيتم مسحها نهائياً من الموقع وقاعدة بيانات سوبابيس ولن تظهر مرة أخرى حتى بعد إعادة تحميل الصفحة.`
      : `هل أنت متأكد من مسح جميع استجابات الطلاب لجميع الاختبارات؟\nسيتم مسحها نهائياً من الموقع ومن قاعدة بيانات سوبابيس.`;

    if (confirm(confirmMsg)) {
      try {
        setIsDeleting(true);
        if (isSpecific) {
          await quizService.clearSubmissions(currentSelectedQuiz.id);
        } else {
          await quizService.clearSubmissions();
        }
        onRefresh();
        sound.playClick();
      } catch (err) {
        console.error('Error during deletion:', err);
        alert(err instanceof Error ? err.message : 'فشل مسح الاستجابات من قاعدة البيانات. حاول مرة أخرى.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Delete a single student's submission from both local storage and Supabase
  const handleDeleteSingleSubmission = async (sub: QuizSubmission) => {
    if (confirm(`هل أنت متأكد من مسح استجابة الطالب "${sub.studentName}"؟\nسيتم مسحها نهائياً من الموقع وسوبابيس.`)) {
      try {
        await quizService.deleteSubmission(sub.id);
        onRefresh();
        sound.playClick();
      } catch (err) {
        console.error('Error deleting single submission:', err);
        alert(err instanceof Error ? err.message : 'فشل مسح استجابة الطالب من قاعدة البيانات. حاول مرة أخرى.');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10 animate-in fade-in duration-300">
      
      {/* Supabase SQL Modal */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-xl overflow-hidden card-soft-black-shadow">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Supabase Database SQL Schema
                </h3>
              </div>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-xs text-slate-600 mb-3">
                Copy this dedicated PostgreSQL SQL script and execute it in your Supabase SQL Editor to create the tables, indexes, and Row Level Security policies:
              </p>

              <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-xs max-h-60 overflow-y-auto mb-4 border border-slate-800">
                <pre>{SUPABASE_SQL_SCHEMA}</pre>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'SQL Script Copied!' : 'Copy SQL Script'}</span>
                </button>

                <button
                  onClick={() => setIsSqlModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Answers Inspection Modal */}
      {inspectSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-xl overflow-hidden card-soft-black-shadow">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Student Answers: {inspectSubmission.studentName}
                </h3>
                <p className="text-xs text-slate-500">
                  {inspectSubmission.quizTitle} · Score: {inspectSubmission.score}/{inspectSubmission.totalQuestions} ({inspectSubmission.percentage}%)
                </p>
              </div>
              <button
                onClick={() => setInspectSubmission(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-[420px] overflow-y-auto space-y-2">
              {inspectSubmission.answers.map((ans, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border flex items-center justify-between ${
                    ans.isCorrect
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50/70 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                    <span className="text-sm font-black math-font">{ans.questionText} =</span>
                    <span className="text-xs font-bold math-font">
                      Student: {ans.studentAnswer !== null ? ans.studentAnswer : 'blank'}
                    </span>
                  </div>

                  {ans.isCorrect ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Correct</span>
                    </span>
                  ) : (
                    <div className="text-right text-xs">
                      <span className="flex items-center gap-1 text-rose-600 font-bold justify-end">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Incorrect</span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Correct: <strong className="text-indigo-600 math-font">{ans.correctAnswer}</strong>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setInspectSubmission(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Student Submissions & Results
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentSelectedQuiz
              ? `Displaying specific submissions for: "${currentSelectedQuiz.title}"`
              : 'Displaying submissions across all quizzes'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors card-soft-black-shadow cursor-pointer"
            title="View Supabase SQL schema"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Supabase SQL</span>
          </button>

          <button
            onClick={() => {
              onRefresh();
              sound.playClick();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors card-soft-black-shadow cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleCopyReport}
            disabled={filteredSubmissions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors card-soft-black-shadow cursor-pointer"
          >
            {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
            <span>{copiedReport ? 'Report Copied' : 'Copy Report'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredSubmissions.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* QUIZ SELECTOR BAR (Tabs per Quiz) */}
      <div className="bg-white border border-slate-200/90 rounded-[28px] p-3 mb-6 card-soft-black-shadow">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Select Quiz to View Submissions (تصفية حسب الاختبار):</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Total Submissions: {submissions.length}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          {/* Option: All Quizzes */}
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 ${
              internalFilter === 'all'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>All Quizzes (جميع الاستجابات)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              internalFilter === 'all' ? 'bg-white/20 text-white' : 'bg-white text-slate-800'
            }`}>
              {submissions.length}
            </span>
          </button>

          {/* Option per individual Quiz */}
          {allAvailableQuizzes.map((q) => {
            const count = submissionsCountByQuiz[q.id] || 0;
            const isSelected = internalFilter === q.id;
            return (
              <button
                key={q.id}
                onClick={() => handleFilterChange(q.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {q.code && (
                  <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-mono uppercase ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    {q.code}
                  </span>
                )}
                <span className="max-w-[180px] truncate">{q.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-white text-indigo-700 font-black' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Filter Info Banner with Clear Button */}
      {currentSelectedQuiz && (
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-[24px] p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-900">
                  Active Quiz: {currentSelectedQuiz.title}
                </span>
                {currentSelectedQuiz.code && (
                  <span className="px-2 py-0.5 rounded-md bg-white text-indigo-700 font-mono text-[10px] font-bold border border-indigo-200">
                    {currentSelectedQuiz.code}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-indigo-700/80">
                Viewing only the {currentTotal} submissions belonging specifically to this quiz.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentTotal > 0 && (
              <button
                onClick={handleClearSubmissions}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Clearing...' : 'Clear This Quiz Submissions'}</span>
              </button>
            )}

            <button
              onClick={() => handleFilterChange('all')}
              className="px-3 py-1.5 rounded-xl bg-white text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Show All Quizzes
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards (Accurate to current filter) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200/90 p-5 rounded-[28px] card-soft-black-shadow">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold text-slate-600">Total Completed</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-black math-font text-slate-900">{currentTotal}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {currentSelectedQuiz ? 'in this quiz' : 'across all quizzes'}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 p-5 rounded-[28px] card-soft-black-shadow">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold text-slate-600">Average Accuracy</span>
            <Percent className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black math-font text-emerald-600">{currentAverageAccuracy}%</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {currentSelectedQuiz ? 'quiz average' : 'overall average'}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 p-5 rounded-[28px] card-soft-black-shadow">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold text-slate-600">Top Student</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-base font-black text-slate-900 truncate">
            {topStudent ? topStudent.studentName : '—'}
          </div>
          <span className="text-[10px] text-slate-400 math-font mt-0.5 block">
            {topStudent ? `${topStudent.score}/${topStudent.totalQuestions} (${topStudent.percentage}%)` : 'No submissions'}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 p-5 rounded-[28px] card-soft-black-shadow">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold text-slate-600">Fastest Student</span>
            <Trophy className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-base font-black text-slate-900 truncate">
            {fastestStudent ? fastestStudent.studentName : '—'}
          </div>
          <span className="text-[10px] text-slate-400 math-font mt-0.5 block">
            {fastestStudent ? `in ${fastestStudent.timeSpentSeconds}s` : 'No submissions'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-[28px] p-3.5 mb-6 card-soft-black-shadow flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-900 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredSubmissions.length}</strong> of {submissions.length} results
          </span>

          {filteredSubmissions.length > 0 && (
            <button
              onClick={handleClearSubmissions}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 rounded-2xl bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer text-xs font-bold"
              title={currentSelectedQuiz ? "Clear this quiz's submissions" : "Clear all submissions"}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{currentSelectedQuiz ? 'Clear Quiz' : 'Clear All'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-[32px] p-10 text-center card-soft-black-shadow">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {currentSelectedQuiz
              ? `No Submissions Yet for "${currentSelectedQuiz.title}"`
              : 'No Student Submissions Yet'}
          </h3>
          <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
            Share the quiz link or access code with students. Results and student responses will appear here in real-time.
          </p>
          <button
            onClick={onGoToBuilder}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-2xl font-bold text-xs cursor-pointer"
          >
            Create a New Quiz
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-[32px] overflow-hidden card-soft-black-shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Quiz Title</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Time Taken</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSubmissions.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                      {sub.studentName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{sub.quizTitle}</td>
                    <td className="py-3 px-4 font-black math-font text-slate-900 text-sm">
                      {sub.score} / {sub.totalQuestions}
                    </td>
                    <td className="py-3 px-4 font-bold math-font">
                      <span className={`px-2 py-0.5 rounded-lg text-xs ${
                        sub.percentage >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {sub.percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4 math-font text-slate-600">
                      {Math.floor(sub.timeSpentSeconds / 60)}m {sub.timeSpentSeconds % 60}s
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(sub.submittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setInspectSubmission(sub);
                            sound.playClick();
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="View detailed student answers"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => handleDeleteSingleSubmission(sub)}
                          className="p-1 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete this student submission permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
