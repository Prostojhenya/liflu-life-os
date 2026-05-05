import type { Task, CreateTaskRequest, AIParseResponse, CompleteTaskResponse, User } from '../types/task';

const API = "http://localhost:3000/api";

/**
 * Получить все задачи
 */
export async function getTasks(): Promise<Task[]> {
  const res = await fetch(`${API}/tasks`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch tasks: ${res.statusText}`);
  }
  
  return res.json();
}

/**
 * Создать новую задачу
 */
export async function createTask(title: string, xp?: number): Promise<Task> {
  const body: CreateTaskRequest = { title };
  if (xp !== undefined) {
    body.xp = xp;
  }

  const res = await fetch(`${API}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) {
    throw new Error(`Failed to create task: ${res.statusText}`);
  }
  
  return res.json();
}

/**
 * Завершить задачу и получить XP
 */
export async function completeTask(id: string): Promise<CompleteTaskResponse> {
  const res = await fetch(`${API}/tasks/${id}/complete`, {
    method: "POST"
  });
  
  if (!res.ok) {
    throw new Error(`Failed to complete task: ${res.statusText}`);
  }
  
  return res.json();
}

/**
 * Создать несколько задач с помощью AI парсинга
 */
export async function createTasksWithAI(text: string): Promise<AIParseResponse> {
  const res = await fetch(`${API}/ai/parse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });
  
  if (!res.ok) {
    throw new Error(`Failed to parse tasks with AI: ${res.statusText}`);
  }
  
  return res.json();
}

/**
 * Получить данные пользователя (XP и уровень)
 */
export async function getUser(): Promise<User> {
  const res = await fetch(`${API}/user`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch user: ${res.statusText}`);
  }
  
  return res.json();
}
