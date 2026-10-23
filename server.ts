import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

interface Quiz {
  id: string;
  code: string;
  [key: string]: unknown;
}

interface Submission {
  id: string;
  quizId: string;
  [key: string]: unknown;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    // Ignore
  }
}

const QUIZZES_FILE = path.join(DATA_DIR, 'quizzes.json');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // In-memory cache synced with disk
  let quizzes: Quiz[] = readJsonFile<Quiz[]>(QUIZZES_FILE, []);
  let submissions: Submission[] = readJsonFile<Submission[]>(SUBMISSIONS_FILE, []);

  // API Routes
  app.get('/api/quizzes', (_req, res) => {
    res.json(quizzes);
  });

  app.post('/api/quizzes', (req, res) => {
    const newQuiz = req.body as Quiz;
    if (!newQuiz || !newQuiz.id) {
      res.status(400).json({ error: 'Invalid quiz payload' });
      return;
    }
    const idx = quizzes.findIndex((q) => q.id === newQuiz.id);
    if (idx >= 0) {
      quizzes[idx] = newQuiz;
    } else {
      quizzes.unshift(newQuiz);
    }
    writeJsonFile(QUIZZES_FILE, quizzes);
    res.json({ success: true, quiz: newQuiz });
  });

  app.get('/api/submissions', (req, res) => {
    const quizId = req.query.quizId as string;
    if (quizId) {
      const filtered = submissions.filter((s) => s.quizId === quizId);
      res.json(filtered);
    } else {
      res.json(submissions);
    }
  });

  app.post('/api/submissions', (req, res) => {
    const newSub = req.body as Submission;
    if (!newSub || !newSub.id) {
      res.status(400).json({ error: 'Invalid submission payload' });
      return;
    }
    submissions.unshift(newSub);
    writeJsonFile(SUBMISSIONS_FILE, submissions);
    res.json({ success: true, submission: newSub });
  });

  app.delete('/api/submissions', (req, res) => {
    const quizId = req.query.quizId as string;
    if (quizId) {
      submissions = submissions.filter((s) => s.quizId !== quizId);
    } else {
      submissions = [];
    }
    writeJsonFile(SUBMISSIONS_FILE, submissions);
    res.json({ success: true });
  });

  // Vite integration
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MathMaster Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
