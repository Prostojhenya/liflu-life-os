import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

// ===== TYPES =====

interface Task {
  id: string;
  title: string;
  completed: boolean;
  xp: number;
}

interface CreateTaskRequest {
  title: string;
  xp?: number;
}

interface User {
  xp: number;
  level: number;
}

interface CompleteTaskResponse {
  task: Task;
  user: User;
  xpGained: number;
  leveledUp: boolean;
}

// ===== IN-MEMORY STORAGE =====

let tasks: Task[] = [];
let user: User = {
  xp: 0,
  level: 1
};

// ===== CONSTANTS =====

const DEFAULT_TASK_XP = 10;

// ===== HELPERS =====

function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

function addXP(amount: number): { xpGained: number; leveledUp: boolean } {
  const oldLevel = user.level;
  user.xp += amount;
  user.level = calculateLevel(user.xp);
  
  return {
    xpGained: amount,
    leveledUp: user.level > oldLevel
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ===== TASKS API =====

  // GET /api/tasks - получить все задачи
  app.get("/api/tasks", (_req, res) => {
    res.json(tasks);
  });

  // POST /api/tasks - создать новую задачу
  app.post("/api/tasks", (req, res) => {
    const { title, xp }: CreateTaskRequest = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task: Task = {
      id: Date.now().toString(),
      title: title.trim(),
      completed: false,
      xp: xp && xp > 0 ? xp : DEFAULT_TASK_XP
    };

    tasks.push(task);
    res.status(201).json(task);
  });

  // POST /api/tasks/:id/complete - завершить задачу и получить XP
  app.post("/api/tasks/:id/complete", (req, res) => {
    const { id } = req.params;

    const task = tasks.find(t => t.id === id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.completed) {
      return res.status(400).json({ error: 'Task already completed' });
    }

    task.completed = true;
    
    // Начисляем XP пользователю
    const { xpGained, leveledUp } = addXP(task.xp);
    
    const response: CompleteTaskResponse = {
      task,
      user,
      xpGained,
      leveledUp
    };
    
    res.json(response);
  });

  // ===== USER API =====

  // GET /api/user - получить данные пользователя
  app.get("/api/user", (_req, res) => {
    res.json(user);
  });

  // ===== AI =====

  app.post("/api/ai/parse", (req, res) => {
    const { text } = req.body;

    // пока без OpenAI — просто разбивка
    const parts = text.split(" и ");

    const result = parts.map((t: string) => ({
      title: t.trim()
    }));

    res.json({ tasks: result });
  });

  // ===== DEV SERVER =====

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();