import React, { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useStore } from '@/store/useStore';
import { Plus, Target, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface Goal {
  id: string;
  title: string;
  progress: number;
  target: number;
  createdAt: any;
}

export const Goals: React.FC = () => {
  const { user } = useStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState(100);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.currentSpaceId) return;
    const q = query(collection(db, `spaces/${user.currentSpaceId}/goals`), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal)));
    }, (err) => {
      console.error("Goals Snapshot Error:", err);
      setError("Ошибка загрузки целей: " + err.message);
    });
    return () => unsubscribe();
  }, [user?.currentSpaceId]);

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !user?.currentSpaceId || isAdding) return;
    
    setIsAdding(true);
    setError(null);
    try {
      await addDoc(collection(db, `spaces/${user.currentSpaceId}/goals`), {
        title: newTitle.trim(),
        progress: 0,
        target: Number(newTarget) || 100,
        spaceId: user.currentSpaceId,
        createdAt: serverTimestamp(),
      });
      setNewTitle('');
      setNewTarget(100);
    } catch (err: any) {
      console.error("Add goal error:", err);
      setError("Не удалось создать цель: " + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const updateProgress = async (goal: Goal, amount: number) => {
    if (!user?.currentSpaceId) return;
    const newProgress = Math.min(goal.target, Math.max(0, goal.progress + amount));
    await updateDoc(doc(db, `spaces/${user.currentSpaceId}/goals`, goal.id), { progress: newProgress });
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-black italic tracking-tighter uppercase glow-purple font-display">Великие Достижения</h2>
        <p className="text-[#8b7ca8] text-[10px] font-black uppercase tracking-[0.2em] font-display">Твои долгосрочные цели и прогресс</p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {goals.map((goal) => (
          <motion.div
            key={goal.id}
            layout
            className="bento-card flex flex-col gap-4 shadow-xl gaming-border bg-[#150a24]"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent-purple/20 rounded-full flex items-center justify-center text-accent-purple shadow-lg">
                  <Target size={20} />
                </div>
                <div>
                  <h4 className="font-black text-white uppercase italic tracking-tight font-display">{goal.title}</h4>
                  <p className="text-[10px] font-black text-accent-magenta uppercase tracking-widest glow-magenta font-display">
                    Прогресс: {Math.round((goal.progress / goal.target) * 100)}%
                  </p>
                </div>
              </div>
              <button 
                onClick={async () => {
                   if (!user?.currentSpaceId) return;
                   await deleteDoc(doc(db, `spaces/${user.currentSpaceId}/goals`, goal.id));
                }}
                className="text-[#8b7ca8] hover:text-accent-red transition-colors p-2"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="status-bar-bg h-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(goal.progress / goal.target) * 100}%` }}
                  className="status-bar-fill bg-gradient-to-r from-accent-purple to-accent-magenta shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                />
              </div>
              <div className="flex justify-between gap-3">
                <button 
                  onClick={() => updateProgress(goal, -10)}
                  className="flex-1 bg-[#1c0f2f] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform border border-white/5 text-[#8b7ca8] font-display"
                >
                  Уменьшить
                </button>
                <button 
                  onClick={() => updateProgress(goal, 10)}
                  className="flex-1 bg-accent-magenta/20 text-accent-magenta py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform border border-accent-magenta/30 font-display shadow-[inset_0_0_10px_rgba(255,0,212,0.1)]"
                >
                  Увеличить
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
