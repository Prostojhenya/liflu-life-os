export interface Task {
  id: string;
  title: string;
  completed: boolean;
  xp: number;
}

export interface CreateTaskRequest {
  title: string;
  xp?: number;
}

export interface AIParseResponse {
  tasks: Array<{ title: string }>;
}

export interface User {
  xp: number;
  level: number;
}

export interface CompleteTaskResponse {
  task: Task;
  user: User;
  xpGained: number;
  leveledUp: boolean;
}
