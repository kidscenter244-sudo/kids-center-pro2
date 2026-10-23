import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  RotateCw, 
  Plus, 
  Trash2, 
  Sliders, 
  ArrowRight,
  Calculator,
  Minus
} from 'lucide-react';
import { QuestionGroup, Quiz, QuizConfig } from '../types/quiz';
import { quizService } from '../services/quizService';
import { generateSingleQuestion } from '../utils/mathGenerator';
import { sound } from '../utils/audio';

interface QuizBuilderProps {
  onQuizCreated: (quiz: Quiz) => void;
  onGoToDashboard: () => void;
}

export const QuizBuilder: React.FC<QuizBuilderProps> = ({
  onQuizCreated,
  onGoToDashboard,
}) => {
  // Question Groups (Multi-section mental math builder)
  const [groups, setGroups] = useState<QuestionGroup[]>([
    {
      id: 'grp_1',
      numbersCount: 3, // 3 numbers per question
      digitsCount: 2,  // 2 digits per number
      questionCount: 10,
    },
    {
      id: 'grp_2',
      numbersCount: 4, // 4 numbers per question
      digitsCount: 2,  // 2 digits per number
      questionCount: 10,
    },
  ]);

  // Free custom time in minutes (0 means unlimited)
  const [timeMinutes, setTimeMinutes] = useState<number>(3);
  const [previewSeed, setPreviewSeed] = useState(0);

  // Total questions count calculated from all groups
  const totalQuestions = useMemo(() => {
    return groups.reduce((acc, curr) => acc + (Number(curr.questionCount) || 0), 0);
  }, [groups]);

  // Quick Preset Handlers
  const applyPreset1Digit = () => {
    setGroups([
      {
        id: `grp_${Date.now()}_1`,
        numbersCount: 3,
        digitsCount: 1,
        questionCount: 10,
      },
      {
        id: `grp_${Date.now()}_2`,
        numbersCount: 4,
        digitsCount: 1,
        questionCount: 10,
      },
    ]);
    setTimeMinutes(3);
    sound.playClick();
  };

  const applyPreset2DigitSpeed = () => {
    setGroups([
      {
        id: `grp_${Date.now()}_1`,
        numbersCount: 3,
        digitsCount: 2,
        questionCount: 10,
      },
      {
        id: `grp_${Date.now()}_2`,
        numbersCount: 4,
        digitsCount: 2,
        questionCount: 10,
      },
    ]);
    setTimeMinutes(4);
    sound.playClick();
  };

  const applyPresetAdvanced = () => {
    setGroups([
      {
        id: `grp_${Date.now()}_1`,
        numbersCount: 5,
        digitsCount: 2,
        questionCount: 15,
      },
    ]);
    setTimeMinutes(5);
    sound.playClick();
  };

  // Add a new question group
  const handleAddGroup = () => {
    sound.playClick();
    const newGroup: QuestionGroup = {
      id: `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      numbersCount: 3,
      digitsCount: 2,
      questionCount: 10,
    };
    setGroups([...groups, newGroup]);
  };

  // Remove a group
  const handleRemoveGroup = (id: string) => {
    if (groups.length <= 1) return;
    sound.playClick();
    setGroups(groups.filter((g) => g.id !== id));
  };

  // Update a field in a group
  const handleUpdateGroup = (
    id: string,
    field: keyof QuestionGroup,
    value: number
  ) => {
    setGroups(
      groups.map((g) => {
        if (g.id === id) {
          return { ...g, [field]: value };
        }
        return g;
      })
    );
  };

  // Live sample preview from active groups
  const sampleQuestions = useMemo(() => {
    const list = [];
    for (const g of groups) {
      list.push(generateSingleQuestion(g.numbersCount, g.digitsCount));
      if (list.length >= 3) break;
    }
    while (list.length < 3 && groups.length > 0) {
      const g = groups[0];
      list.push(generateSingleQuestion(g.numbersCount, g.digitsCount));
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, previewSeed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playVictory();

    // Auto-generate clean title based on groups
    const rowsSummary = Array.from(new Set(groups.map((g) => `${g.numbersCount} Rows`))).join(' & ');
    const digitsSummary = Array.from(new Set(groups.map((g) => `${g.digitsCount}-Digit`))).join(' & ');
    const autoTitle = `Mental Math Quiz (${totalQuestions} Qs · ${rowsSummary} · ${digitsSummary}) - kidscenter PRO`;

    const config: QuizConfig = {
      title: autoTitle,
      groups,
      totalQuestionCount: totalQuestions,
      timeMinutes: Math.max(0, Number(timeMinutes) || 0),
      allowScratchpad: true,
    };

    const newQuiz = quizService.saveQuiz(config);
    onQuizCreated(newQuiz);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 animate-in fade-in duration-300">
      
      {/* Intro Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
          <Calculator className="w-3.5 h-3.5" />
          <span>Vertical Mental Math · Addition & Subtraction</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Create Mental Math Quiz
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto font-medium">
          Configure number of rows, digit lengths, and automatic single subtraction row with vertical display
        </p>
      </div>

      {/* Preset Quick Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        <button
          type="button"
          onClick={applyPreset1Digit}
          className="px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>⭐ 10 Qs (3 Rows · 1-Digit) + 10 Qs (4 Rows · 1-Digit)</span>
        </button>

        <button
          type="button"
          onClick={applyPreset2DigitSpeed}
          className="px-3 py-1.5 rounded-full text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 card-soft-black-shadow cursor-pointer"
        >
          <span>🎯 Speed Math (3 Rows & 4 Rows · 2 Digits)</span>
        </button>

        <button
          type="button"
          onClick={applyPresetAdvanced}
          className="px-3 py-1.5 rounded-full text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 card-soft-black-shadow cursor-pointer"
        >
          <span>🔥 Advanced: 15 Qs (5 Rows · 2 Digits)</span>
        </button>
      </div>

      {/* Main Central Card */}
      <div className="bg-white border border-slate-200/90 rounded-[36px] p-6 sm:p-8 card-soft-black-shadow relative">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Header of Section: Question Groups List */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-sm font-black text-slate-900 block">
                Quiz Question Sections:
              </span>
              <span className="text-[11px] text-slate-400">
                Each question features stacked rows with exactly 1 subtraction number smaller than the number above it
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddGroup}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Another Section</span>
            </button>
          </div>

          {/* Groups List */}
          <div className="space-y-4">
            {groups.map((group, idx) => (
              <div
                key={group.id}
                className="bg-slate-50 border border-slate-200 rounded-3xl p-4 sm:p-5 relative transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      Section {idx + 1}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
                      <Minus className="w-2.5 h-2.5" />
                      <span>1 Subtraction Row Included</span>
                    </span>
                  </div>

                  {groups.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(group.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
                      title="Delete this section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Numbers Count (Rows per question) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Numbers in Question (Rows):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="2"
                        max="10"
                        value={group.numbersCount}
                        onChange={(e) =>
                          handleUpdateGroup(group.id, 'numbersCount', Number(e.target.value))
                        }
                        className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-center text-sm font-black math-font text-slate-900 outline-none"
                      />
                      <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                        rows
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5 text-center">
                      (e.g. 3 numbers stacked vertically)
                    </span>
                  </div>

                  {/* Digits Count */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Digits per Number:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={group.digitsCount}
                        onChange={(e) =>
                          handleUpdateGroup(group.id, 'digitsCount', Number(e.target.value))
                        }
                        className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-center text-sm font-black math-font text-slate-900 outline-none"
                      />
                      <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                        digits
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5 text-center">
                      ({group.digitsCount === 1 ? '1 digit: 1-9' : group.digitsCount === 2 ? '2 digits: 10-99' : `${group.digitsCount} digits`})
                    </span>
                  </div>

                  {/* Question Count */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Questions Count:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={group.questionCount}
                        onChange={(e) =>
                          handleUpdateGroup(group.id, 'questionCount', Number(e.target.value))
                        }
                        className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-center text-sm font-black math-font text-indigo-600 outline-none"
                      />
                      <span className="text-xs font-semibold text-indigo-600 whitespace-nowrap">
                        questions
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5 text-center">
                      problems in this section
                    </span>
                  </div>

                </div>

                <div className="mt-2 text-left text-[11px] text-slate-500 font-semibold">
                  Preview: {group.numbersCount} stacked rows of {group.digitsCount}-digit numbers ({group.questionCount} questions)
                </div>
              </div>
            ))}
          </div>

          {/* Time & Total Questions Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">
                Total Questions in Quiz:
              </span>
              <span className="text-2xl font-black math-font text-slate-900">
                {totalQuestions} <span className="text-xs font-normal text-slate-500">questions total</span>
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Exam Time Limit (in minutes):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={timeMinutes}
                  onChange={(e) => setTimeMinutes(Number(e.target.value))}
                  placeholder="Minutes (0 = Unlimited)"
                  className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-center text-base font-black math-font text-slate-900 outline-none"
                />
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {timeMinutes > 0 ? `${timeMinutes} mins` : 'Unlimited time'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Preview: Vertical Column Format */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Live Sample Problems (Vertical Stacked Format):</span>
              </span>

              <button
                type="button"
                onClick={() => {
                  setPreviewSeed((prev) => prev + 1);
                  sound.playClick();
                }}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Regenerate Samples</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {sampleQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-between"
                >
                  <span className="text-[10px] text-slate-400 font-bold block mb-2">
                    Sample {idx + 1} ({q.numbersCount} Rows · {q.digitsCount} Digits)
                  </span>

                  {/* Vertical Column Problem */}
                  <div className="w-32 bg-slate-50/70 border border-slate-200/60 rounded-xl p-3 flex flex-col items-end math-font font-black text-xl text-slate-900">
                    {q.terms.map((term, tIdx) => (
                      <div key={tIdx} className="w-full flex justify-end items-center gap-1 leading-tight">
                        {term.isNegative ? (
                          <span className="text-rose-600 font-black text-base mr-1">-</span>
                        ) : (
                          <span className="w-2" />
                        )}
                        <span className={term.isNegative ? 'text-rose-700 font-black' : 'text-slate-900'}>
                          {term.value}
                        </span>
                      </div>
                    ))}
                    <div className="w-full border-b-2 border-slate-900 my-1.5" />
                    <div className="text-indigo-600 font-black text-lg">
                      ?
                    </div>
                  </div>

                  <span className="text-[10px] text-emerald-600 font-bold math-font block mt-2">
                    Answer: {q.correctAnswer}
                  </span>
                </div>
              ))}
            </div>
            
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              ✓ Subtraction row has <strong className="text-rose-600">-</strong> sign and is strictly smaller than the number directly above it. Positive numbers have no sign.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="submit"
              className="w-full sm:flex-1 py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm shadow-lg shadow-slate-900/15 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Create & Publish Quiz for Students 🚀</span>
            </button>

            <button
              type="button"
              onClick={onGoToDashboard}
              className="w-full sm:w-auto py-3.5 px-5 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer card-soft-black-shadow"
            >
              <span>View Submissions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
