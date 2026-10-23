-- ====================================================================
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

-- 6. Enable Realtime Publications (Optional for instant live sync across screens)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
  END IF;
END $$;
