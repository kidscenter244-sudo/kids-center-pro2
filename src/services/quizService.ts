import { Quiz, QuizConfig, QuizSubmission } from '../types/quiz';
import { generateQuizQuestions } from '../utils/mathGenerator';
import { 
  pushQuizToSupabase, 
  fetchQuizzesFromSupabase, 
  pushSubmissionToSupabase, 
  fetchSubmissionsFromSupabase 
} from './supabaseService';

const QUIZZES_STORAGE_KEY = 'kidscenter_pro_quizzes_v4';
const SUBMISSIONS_STORAGE_KEY = 'kidscenter_pro_submissions_v4';

let channel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel('kidscenter_pro_sync_channel_v4');
  }
} catch {
  // Ignored
}

export function subscribeToSync(callback: () => void): () => void {
  if (!channel) {
    const handler = (e: StorageEvent) => {
      if (e.key === QUIZZES_STORAGE_KEY || e.key === SUBMISSIONS_STORAGE_KEY) {
        callback();
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }

  const handler = () => {
    callback();
  };
  channel.addEventListener('message', handler);
  return () => {
    channel?.removeEventListener('message', handler);
  };
}

function notifySync() {
  if (channel) {
    channel.postMessage({ type: 'DATA_UPDATED', timestamp: Date.now() });
  }
}

export function generateQuizCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const nums = '23456789';
  const l1 = letters.charAt(Math.floor(Math.random() * letters.length));
  const l2 = letters.charAt(Math.floor(Math.random() * letters.length));
  const n1 = nums.charAt(Math.floor(Math.random() * nums.length));
  const n2 = nums.charAt(Math.floor(Math.random() * nums.length));
  return `KC-${l1}${l2}${n1}${n2}`;
}

const defaultDemoQuizConfig: QuizConfig = {
  title: 'Mental Math Challenge (10 Qs 3 Rows · 2 Digits + 10 Qs 4 Rows · 2 Digits)',
  groups: [
    {
      id: 'grp_1',
      numbersCount: 3,
      digitsCount: 2,
      questionCount: 10,
    },
    {
      id: 'grp_2',
      numbersCount: 4,
      digitsCount: 2,
      questionCount: 10,
    },
  ],
  totalQuestionCount: 20,
  timeMinutes: 3,
  allowScratchpad: true,
};

function createInitialQuizzes(): Quiz[] {
  const code = 'KC-PRO1';
  const quizId = 'quiz_demo_mental_1';
  const questions = generateQuizQuestions(defaultDemoQuizConfig);
  return [
    {
      id: quizId,
      code,
      config: defaultDemoQuizConfig,
      questions,
      createdAt: new Date().toISOString(),
    },
  ];
}

export const quizService = {
  getQuizzes(): Quiz[] {
    try {
      const data = localStorage.getItem(QUIZZES_STORAGE_KEY);
      if (!data) {
        const initial = createInitialQuizzes();
        localStorage.setItem(QUIZZES_STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return createInitialQuizzes();
    }
  },

  async syncWithSupabase(): Promise<void> {
    try {
      const remoteQuizzes = await fetchQuizzesFromSupabase();
      if (remoteQuizzes && remoteQuizzes.length > 0) {
        localStorage.setItem(QUIZZES_STORAGE_KEY, JSON.stringify(remoteQuizzes));
      }

      const remoteSubs = await fetchSubmissionsFromSupabase();
      if (remoteSubs && remoteSubs.length > 0) {
        localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(remoteSubs));
      }
      notifySync();
    } catch {
      // Ignored
    }
  },

  getQuizByIdOrCode(idOrCode: string): Quiz | null {
    const quizzes = this.getQuizzes();
    const clean = idOrCode.trim().toUpperCase();
    return (
      quizzes.find(
        (q) => q.id === idOrCode || q.code.toUpperCase() === clean
      ) || null
    );
  },

  saveQuiz(config: QuizConfig): Quiz {
    const quizzes = this.getQuizzes();
    const id = `quiz_${Date.now()}`;
    const code = generateQuizCode();
    const questions = generateQuizQuestions(config);

    const newQuiz: Quiz = {
      id,
      code,
      config,
      questions,
      createdAt: new Date().toISOString(),
    };

    const updated = [newQuiz, ...quizzes];
    localStorage.setItem(QUIZZES_STORAGE_KEY, JSON.stringify(updated));
    notifySync();

    // Async push to Supabase
    pushQuizToSupabase(newQuiz).catch(() => {});

    return newQuiz;
  },

  deleteQuiz(id: string) {
    const quizzes = this.getQuizzes().filter((q) => q.id !== id);
    localStorage.setItem(QUIZZES_STORAGE_KEY, JSON.stringify(quizzes));
    notifySync();
  },

  getSubmissions(quizId?: string): QuizSubmission[] {
    try {
      const data = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
      const list: QuizSubmission[] = data ? JSON.parse(data) : [];
      if (quizId) {
        return list.filter((s) => s.quizId === quizId);
      }
      return list;
    } catch {
      return [];
    }
  },

  saveSubmission(submission: Omit<QuizSubmission, 'id' | 'submittedAt'>): QuizSubmission {
    const submissions = this.getSubmissions();
    const fullSubmission: QuizSubmission = {
      ...submission,
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      submittedAt: new Date().toISOString(),
    };

    const updated = [fullSubmission, ...submissions];
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(updated));
    notifySync();

    // Async push to Supabase
    pushSubmissionToSupabase(fullSubmission).catch(() => {});

    return fullSubmission;
  },

  clearSubmissions(quizId?: string) {
    if (quizId) {
      const remaining = this.getSubmissions().filter((s) => s.quizId !== quizId);
      localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(remaining));
    } else {
      localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify([]));
    }
    notifySync();
  },
};
