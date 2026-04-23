import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '@/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useStore, XP_VALUES, calculateLevel, STAT_LABELS } from '@/store/useStore';
import { Plus, CheckCircle2, Circle, Trash2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  xpValue: number;
  spaceId: string;
  xpAwarded?: boolean;
  statType?: 'strength' | 'agility' | 'intelligence' | 'vitality' | 'sense';
}

export const Tasks: React.FC = () => {
  const { user, setUser } = useStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  useEffect(() => {
    if (!user?.currentSpaceId) return;

    const path = `spaces/${user.currentSpaceId}/tasks`;
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(taskData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user?.currentSpaceId]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || !user?.currentSpaceId || isAdding) return;

    setIsAdding(true);
    const path = `spaces/${user.currentSpaceId}/tasks`;
    try {
      // Auto-classify using Gemini
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Проанализируй задачу пользователя: "${newTask}".
        Классифицируй её в одну из категорий для развития личности:
        - strength: физическая активность, спорт, нагрузки.
        - agility: быстрая реакция, скорость выполнения, мелкая моторика.
        - intelligence: обучение, интеллектуальная работа, чтение, логика.
        - vitality: восстановление, здоровье, сон, питание.
        - sense: бытовые задачи, организация, планирование, социальное.
        
        Верни ТОЛЬКО английское название категории (например: intelligence).`
      });
      
      const classifiedStat = response.text?.toLowerCase().trim() as any;
      const finalStat = ['strength', 'agility', 'intelligence', 'vitality', 'sense'].includes(classifiedStat) 
        ? classifiedStat 
        : 'intelligence';

      await addDoc(collection(db, path), {
        title: newTask,
        statType: finalStat,
        completed: false,
        xpAwarded: false,
        xpValue: XP_VALUES.TASK,
        spaceId: user.currentSpaceId,
        createdAt: serverTimestamp(),
      });
      setNewTask('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleTask = async (task: Task) => {
    if (!user?.currentSpaceId) return;
    const path = `spaces/${user.currentSpaceId}/tasks/${task.id}`;
    const userRef = doc(db, 'users', user.uid);
    
    try {
      const taskRef = doc(db, path);
      const newCompletedState = !task.completed;
      
      const updateData: any = { completed: newCompletedState };
      let finalXpAwarded = task.xpAwarded;

      // Award XP only if checking as completed AND not already awarded
      if (newCompletedState && !task.xpAwarded) {
        updateData.xpAwarded = true;
        finalXpAwarded = true;
        
        const newXP = (user.totalXP || 0) + (task.xpValue || XP_VALUES.TASK);
        const statToIncrement = task.statType || 'intelligence';
        const newStats = { 
          ...user.stats, 
          [statToIncrement]: (user.stats[statToIncrement] || 0) + 1 
        };

        await updateDoc(userRef, { 
          totalXP: newXP,
          level: calculateLevel(newXP),
          stats: newStats
        });
        
        setUser({
          ...user,
          totalXP: newXP,
          level: calculateLevel(newXP),
          stats: newStats
        });
      }

      await updateDoc(taskRef, updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user?.currentSpaceId) return;
    const path = `spaces/${user.currentSpaceId}/tasks/${taskId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-black italic tracking-tighter uppercase glow-purple font-display">Текущие Квесты</h2>
        <p className="text-[#8b7ca8] text-[10px] font-black uppercase tracking-[0.2em] font-display">Выполняй задания для получения XP</p>
      </header>

      <form onSubmit={addTask} className="relative group">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder={isAdding ? "СИСТЕМА АНАЛИЗИРУЕТ..." : "НОВАЯ МИССИЯ..."}
          disabled={isAdding}
          className="w-full bg-[#150a24] border border-white/5 rounded-2xl py-4 pl-5 pr-14 focus:outline-none focus:border-accent-magenta transition-all shadow-2xl text-[12px] font-black uppercase tracking-widest text-white placeholder:text-[#8b7ca8]/30 font-display italic disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={isAdding}
          className="absolute right-2 top-2 bottom-2 w-10 bg-accent-magenta text-white rounded-xl flex items-center justify-center shadow-[0_0_15px_#ff00d4] active:scale-95 transition-transform disabled:opacity-50"
        >
          {isAdding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={20} />}
        </button>
      </form>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={cn(
                "bento-card flex items-center justify-between shadow-xl transition-all gaming-border",
                task.completed ? "opacity-40 grayscale-[0.5] border-white/5" : "border-accent-purple/20"
              )}
            >
              <div className="flex items-center gap-4 flex-1">
                <button 
                  onClick={() => toggleTask(task)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all border-2",
                    task.completed 
                      ? "bg-accent-magenta border-accent-magenta text-white shadow-[0_0_8px_#ff00d4]" 
                      : "bg-[#0b0416] border-white/10 text-[#8b7ca8] hover:border-accent-magenta/50"
                  )}
                >
                  {task.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                </button>
                <div>
                  <h4 className={cn(
                    "font-black uppercase italic tracking-tight transition-all text-sm font-display",
                    task.completed ? "text-[#8b7ca8] line-through" : "text-white"
                  )}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[8px] font-black text-accent-magenta uppercase tracking-widest font-display">
                      +{task.xpValue || XP_VALUES.TASK} XP НАГРАДА
                    </p>
                    <div className="w-[1px] h-2 bg-white/10" />
                    <p className="text-[8px] font-black text-accent-purple uppercase tracking-widest font-display">
                      {STAT_LABELS[task.statType || 'intelligence']} +1
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="text-[#8b7ca8] hover:text-accent-red transition-colors p-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {!isLoading && tasks.length === 0 && (
          <div className="text-center py-20 bg-[#150a24]/30 rounded-[2rem] border border-dashed border-white/5">
            <div className="w-16 h-16 bg-[#1b0e2b] rounded-full flex items-center justify-center mx-auto mb-4 text-[#8b7ca8] shadow-inner">
              <Calendar size={32} />
            </div>
            <p className="text-[#8b7ca8] text-[10px] font-black uppercase tracking-widest font-display">Нет активных квестов в логе</p>
          </div>
        )}
      </div>
    </div>
  );
};
