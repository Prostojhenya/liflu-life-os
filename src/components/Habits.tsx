import React, { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";
import { useStore, XP_VALUES, calculateLevel, STAT_LABELS } from '@/store/useStore';
import { Plus, Flame, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface Habit {
  id: string;
  title: string;
  frequency: string;
  streak: number;
  xpValue: number;
  spaceId: string;
  lastCompleted?: any;
  statType?: 'strength' | 'agility' | 'intelligence' | 'vitality' | 'sense';
}

export const Habits: React.FC = () => {
  const { user, setUser } = useStore();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  useEffect(() => {
    if (!user?.currentSpaceId) return;
    const q = query(collection(db, `spaces/${user.currentSpaceId}/habits`), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHabits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Habit)));
    });
    return () => unsubscribe();
  }, [user?.currentSpaceId]);

  const isCompletedToday = (lastCompleted: any) => {
    if (!lastCompleted) return false;
    // Handle both Firestore Timestamp and JS Date
    const date = lastCompleted.toDate ? lastCompleted.toDate() : new Date(lastCompleted);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.trim() || !user?.currentSpaceId || isAdding) return;
    
    setIsAdding(true);
    try {
      // Auto-classify using Gemini
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Проанализируй привычку пользователя: "${newHabit}".
        Классифицируй её в одну из категорий для трекинга прогресса:
        - strength: спорт, физические упражнения, сила.
        - agility: координация, скорость, активность.
        - intelligence: обучение, навыки, дисциплина ума.
        - vitality: здоровье, сон, питание, энергия.
        - sense: организация быта, финансы, социальные привычки.
        
        Верни ТОЛЬКО английское название категории (например: vitality).`
      });
      
      const classifiedStat = response.text?.toLowerCase().trim() as any;
      const finalStat = ['strength', 'agility', 'intelligence', 'vitality', 'sense'].includes(classifiedStat) 
        ? classifiedStat 
        : 'vitality';

      await addDoc(collection(db, `spaces/${user.currentSpaceId}/habits`), {
        title: newHabit,
        statType: finalStat,
        frequency: 'daily',
        streak: 0,
        xpValue: XP_VALUES.HABIT,
        spaceId: user.currentSpaceId,
        createdAt: serverTimestamp(),
      });
      setNewHabit('');
    } catch (err) {
      console.error("Add habit error:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const completeHabit = async (habit: Habit) => {
    if (!user?.currentSpaceId || isCompletedToday(habit.lastCompleted) || isProcessing === habit.id) return;
    
    setIsProcessing(habit.id);
    const habitRef = doc(db, `spaces/${user.currentSpaceId}/habits`, habit.id);
    const userRef = doc(db, 'users', user.uid);

    try {
      await updateDoc(habitRef, { 
        streak: habit.streak + 1,
        lastCompleted: serverTimestamp()
      });

      const newXP = (user.totalXP || 0) + XP_VALUES.HABIT;
      const statToIncrement = habit.statType || 'vitality';
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
    } catch (error) {
      console.error("Error completing habit:", error);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-black italic tracking-tighter uppercase glow-purple font-display">Скиллы & Навыки</h2>
        <p className="text-[#8b7ca8] text-[10px] font-black uppercase tracking-[0.2em] font-display">Прокачивай свои показатели ежедневно</p>
      </header>

      <form onSubmit={addHabit} className="relative group">
        <input
          type="text"
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder={isAdding ? "СИНХРОНИЗАЦИЯ С СИСТЕМОЙ..." : "ИЗУЧЕНИЕ НОВОГО НАВЫКА..."}
          disabled={isAdding}
          className="w-full bg-[#150a24] border border-white/5 rounded-2xl py-4 pl-5 pr-14 focus:outline-none focus:border-accent-magenta transition-all shadow-2xl text-xs font-black uppercase tracking-widest text-white placeholder:text-[#8b7ca8]/30 font-display italic disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={isAdding}
          className="absolute right-2 top-2 bottom-2 w-10 bg-accent-magenta text-white rounded-xl flex items-center justify-center shadow-[0_0_15px_#ff00d4] active:scale-95 transition-transform disabled:opacity-50"
        >
          {isAdding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={20} />}
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4">
        {habits.map((habit) => {
          const completedToday = isCompletedToday(habit.lastCompleted);
          const isDisabled = completedToday || isProcessing === habit.id;
          
          return (
            <motion.div
              key={habit.id}
              layout
              className={cn(
                "bento-card flex items-center justify-between shadow-xl transition-all gaming-border",
                completedToday ? "opacity-60 grayscale-[0.5] border-[#ff00d4]" : "border-white/5"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg",
                  completedToday ? "bg-accent-magenta/20 text-accent-magenta" : "bg-accent-purple/20 text-accent-purple"
                )}>
                  <Flame size={20} fill={(habit.streak > 0 || completedToday) ? "currentColor" : "none"} className={completedToday ? "animate-pulse" : ""} />
                </div>
                <div>
                  <h4 className="font-black text-white uppercase italic tracking-tight font-display">{habit.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest font-display",
                      completedToday ? "text-accent-magenta glow-magenta" : "text-[#8b7ca8]"
                    )}>
                      СЕРИЯ: {habit.streak}
                    </span>
                    <div className="w-[1px] h-2 bg-white/10" />
                    <span className="text-[9px] font-black text-accent-purple uppercase tracking-widest font-display">
                      {STAT_LABELS[habit.statType || 'vitality']} +1
                    </span>
                    {completedToday && <span className="text-[8px] font-black text-accent-magenta px-1.5 py-0.5 bg-accent-magenta/10 rounded uppercase font-display">Level Up!</span>}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => completeHabit(habit)}
                disabled={isDisabled}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-all border-2",
                  completedToday 
                    ? "bg-accent-magenta text-white border-accent-magenta shadow-[0_0_10px_#ff00d4]" 
                    : "bg-[#0b0416] text-[#8b7ca8] border-white/10 hover:border-accent-magenta/50 hover:text-accent-magenta",
                  isProcessing === habit.id && "animate-pulse"
                )}
              >
                {completedToday ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
