export interface QuestionTerm {
  value: number;
  isNegative: boolean;
}

export interface QuestionGroup {
  id: string;
  numbersCount: number; // How many numbers per question (e.g. 3 rows, 4 rows, 5 rows)
  digitsCount: number;  // How many digits per number (e.g. 1 digit, 2 digits, 3 digits)
  questionCount: number; // e.g. 10 questions
}

export interface QuizConfig {
  groups: QuestionGroup[];
  totalQuestionCount: number;
  timeMinutes: number; // 0 means unlimited
  allowScratchpad: boolean;
  title?: string; // auto-generated
}

export interface Question {
  id: string;
  terms: QuestionTerm[];
  correctAnswer: number;
  numbersCount: number;
  digitsCount: number;
  groupId?: string;
  groupLabel?: string;
}

export interface Quiz {
  id: string;
  code: string;
  config: QuizConfig;
  questions: Question[];
  createdAt: string;
}

export interface StudentAnswer {
  questionId: string;
  questionText: string;
  terms: QuestionTerm[];
  correctAnswer: number;
  studentAnswer: number | null;
  isCorrect: boolean;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  quizTitle: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpentSeconds: number;
  submittedAt: string;
  answers: StudentAnswer[];
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected?: boolean;
}
