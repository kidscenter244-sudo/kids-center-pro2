import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Quiz, QuizSubmission, SupabaseConfig } from '../types/quiz';

const SUPABASE_CONFIG_STORAGE_KEY = 'kidscenter_supabase_config_v2';

export const SUPABASE_SQL_SCHEMA = `-- ====================================================================
-- kidscenter PRO — Mental Math: Addition & Subtraction Database Schema
-- Dedicated Supabase PostgreSQL Tables, Indexes & Row-Level-Security (RLS)
-- ====================================================================

-- 1. Create the Quizzes Table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    config JSONB NOT NULL,
    questions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the Student Submissions Table
CREATE TABLE IF NOT EXISTS public.submissions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    quiz_title TEXT,
    student_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    percentage INTEGER NOT NULL,
    time_spent_seconds INTEGER NOT NULL,
    answers JSONB NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_code ON public.quizzes(code);
CREATE INDEX IF NOT EXISTS idx_submissions_quiz_id ON public.submissions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_name ON public.submissions(student_name);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON public.submissions(submitted_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 5. Open Access Policies for Public Student & Teacher Portals (using Anon Key)
DROP POLICY IF EXISTS "Public select quizzes" ON public.quizzes;
CREATE POLICY "Public select quizzes" 
ON public.quizzes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert quizzes" ON public.quizzes;
CREATE POLICY "Public insert quizzes" 
ON public.quizzes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update quizzes" ON public.quizzes;
CREATE POLICY "Public update quizzes" 
ON public.quizzes FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete quizzes" ON public.quizzes;
CREATE POLICY "Public delete quizzes" 
ON public.quizzes FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public select submissions" ON public.submissions;
CREATE POLICY "Public select submissions" 
ON public.submissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert submissions" ON public.submissions;
CREATE POLICY "Public insert submissions" 
ON public.submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete submissions" ON public.submissions;
CREATE POLICY "Public delete submissions" 
ON public.submissions FOR DELETE USING (true);
`;

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignored
  }

  // Fallback to environment variables if provided
  const envUrl = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: envUrl,
    anonKey: envKey,
  };
}

export function saveStoredSupabaseConfig(config: SupabaseConfig) {
  localStorage.setItem(SUPABASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
  initClient();
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;
  return initClient();
}

function initClient(): SupabaseClient | null {
  const cfg = getStoredSupabaseConfig();
  if (cfg.url && cfg.anonKey && cfg.url.startsWith('http')) {
    try {
      supabaseInstance = createClient(cfg.url, cfg.anonKey);
      return supabaseInstance;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      supabaseInstance = null;
    }
  } else {
    supabaseInstance = null;
  }
  return supabaseInstance;
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url || !anonKey) {
      return { success: false, message: 'Please provide both the Supabase URL and Anon Key.' };
    }
    const testClient = createClient(url, anonKey);
    const { error } = await testClient.from('quizzes').select('id').limit(1);
    if (error) {
      return { success: false, message: `Connection failed: ${error.message} (Ensure you have executed the SQL schema).` };
    }
    return { success: true, message: 'Successfully connected to Supabase database! 🚀' };
  } catch (err) {
    return { success: false, message: `Connection error: ${(err as Error).message}` };
  }
}

export async function pushQuizToSupabase(quiz: Quiz): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('quizzes').upsert({
      id: quiz.id,
      code: quiz.code,
      config: quiz.config,
      questions: quiz.questions,
      created_at: quiz.createdAt,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function fetchQuizzesFromSupabase(): Promise<Quiz[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map((item) => ({
      id: item.id,
      code: item.code,
      config: item.config,
      questions: item.questions,
      createdAt: item.created_at,
    }));
  } catch {
    return null;
  }
}

export async function pushSubmissionToSupabase(sub: QuizSubmission): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('submissions').insert({
      id: sub.id,
      quiz_id: sub.quizId,
      quiz_title: sub.quizTitle,
      student_name: sub.studentName,
      score: sub.score,
      total_questions: sub.totalQuestions,
      percentage: sub.percentage,
      time_spent_seconds: sub.timeSpentSeconds,
      answers: sub.answers,
      submitted_at: sub.submittedAt,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function fetchSubmissionsFromSupabase(quizId?: string): Promise<QuizSubmission[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    let query = client.from('submissions').select('*').order('submitted_at', { ascending: false });
    if (quizId) {
      query = query.eq('quiz_id', quizId);
    }
    const { data, error } = await query;
    if (error || !data) return null;

    return data.map((item) => ({
      id: item.id,
      quizId: item.quiz_id,
      quizTitle: item.quiz_title,
      studentName: item.student_name,
      score: item.score,
      totalQuestions: item.total_questions,
      percentage: item.percentage,
      timeSpentSeconds: item.time_spent_seconds,
      submittedAt: item.submitted_at,
      answers: item.answers,
    }));
  } catch {
    return null;
  }
}
