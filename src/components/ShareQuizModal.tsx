import React, { useState } from 'react';
import { Copy, Check, ExternalLink, QrCode, Share2, Sparkles, X } from 'lucide-react';
import { Quiz } from '../types/quiz';
import { sound } from '../utils/audio';

interface ShareQuizModalProps {
  quiz: Quiz | null;
  isOpen: boolean;
  onClose: () => void;
  onStartExam: (quiz: Quiz) => void;
}

export const ShareQuizModal: React.FC<ShareQuizModalProps> = ({
  quiz,
  isOpen,
  onClose,
  onStartExam,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen || !quiz) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const studentLink = `${origin}/?quiz=${quiz.code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(studentLink);
    sound.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = `🌟 kidscenter PRO Math Quiz:\n"${quiz.config.title}"\nStudent Access Code: ${quiz.code}\nQuestions: ${quiz.questions.length}\nDirect Quiz Link:\n${studentLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-lg overflow-hidden card-soft-black-shadow">
        
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Quiz Created Successfully in kidscenter PRO!</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <h3 className="text-xl font-black text-slate-900">{quiz.config.title}</h3>

          {/* Quiz Code Pin Highlight */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/90 p-4 rounded-2xl">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Student Access Code:</span>
              <span className="text-3xl font-black math-font text-indigo-600 tracking-wider">
                {quiz.code}
              </span>
            </div>
            <div className="text-right text-xs text-slate-500">
              <span className="block font-bold text-slate-800 math-font">{quiz.questions.length} Questions</span>
              <span>
                {quiz.config.timeMinutes === 0 ? 'Unlimited' : `${quiz.config.timeMinutes} mins`}
              </span>
            </div>
          </div>

          {/* Direct Share Link Box */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Direct Student Link:
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5">
              <input
                type="text"
                readOnly
                value={studentLink}
                className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-700 font-mono outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Action Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 py-2.5 px-4 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share to WhatsApp</span>
            </button>

            <button
              onClick={() => setShowQR(!showQR)}
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>{showQR ? 'Hide QR Code' : 'Show Mobile QR'}</span>
            </button>
          </div>

          {/* QR Code Container */}
          {showQR && (
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <svg className="w-44 h-44" viewBox="0 0 100 100" fill="none">
                  <rect width="100" height="100" fill="white" />
                  <rect x="6" y="6" width="24" height="24" fill="black" rx="3" />
                  <rect x="10" y="10" width="16" height="16" fill="white" rx="2" />
                  <rect x="14" y="14" width="8" height="8" fill="black" rx="1" />
                  <rect x="70" y="6" width="24" height="24" fill="black" rx="3" />
                  <rect x="74" y="10" width="16" height="16" fill="white" rx="2" />
                  <rect x="78" y="14" width="8" height="8" fill="black" rx="1" />
                  <rect x="6" y="70" width="24" height="24" fill="black" rx="3" />
                  <rect x="10" y="74" width="16" height="16" fill="white" rx="2" />
                  <rect x="14" y="78" width="8" height="8" fill="black" rx="1" />
                  <g fill="black">
                    <rect x="36" y="8" width="5" height="5" />
                    <rect x="46" y="8" width="5" height="5" />
                    <rect x="56" y="8" width="5" height="5" />
                    <rect x="36" y="24" width="5" height="5" />
                    <rect x="46" y="24" width="5" height="5" />
                    <rect x="8" y="38" width="5" height="5" />
                    <rect x="24" y="38" width="5" height="5" />
                    <rect x="40" y="38" width="5" height="5" />
                    <rect x="56" y="38" width="5" height="5" />
                    <rect x="72" y="38" width="5" height="5" />
                    <rect x="88" y="38" width="5" height="5" />
                    <rect x="36" y="54" width="5" height="5" />
                    <rect x="46" y="54" width="5" height="5" />
                    <rect x="64" y="54" width="5" height="5" />
                    <rect x="36" y="70" width="5" height="5" />
                    <rect x="52" y="70" width="5" height="5" />
                    <rect x="68" y="70" width="5" height="5" />
                    <rect x="84" y="70" width="5" height="5" />
                  </g>
                </svg>
              </div>
              <p className="text-[11px] text-slate-500 font-bold mt-2 text-center">
                Point student's phone camera at the screen for instant access
              </p>
            </div>
          )}

          {/* Test run CTA */}
          <button
            onClick={() => {
              onStartExam(quiz);
              onClose();
              sound.playClick();
            }}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-98 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Test Exam as Student Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
