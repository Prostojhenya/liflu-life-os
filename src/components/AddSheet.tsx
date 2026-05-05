import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useStore, XP_VALUES } from '@/store/useStore';
import { X, Plus } from 'lucide-react';

type AddType = 'task' | 'habit' | 'goal' | 'shopping';

interface Props {
  type: AddType | null;
  onClose: () => void;
}

const CONFIG: Record<AddType, { title: string; placeholder: string; emoji: string; color: string }> = {
  task:     { title: 'Новая задача',    placeholder: 'Что нужно сделать?',  emoji: '✅', color: '#8B5CF6' },
  habit:    { title: 'Новая привычка',  placeholder: 'Какую привычку добавить?', emoji: '🔥', color: '#10b981' },
  goal:     { title: 'Новая цель',      placeholder: 'К чему стремишься?',  emoji: '🎯', color: '#3B82F6' },
  shopping: { title: 'Добавить покупку', placeholder: 'Что купить?',        emoji: '🛒', color: '#f59e0b' },
};

export const AddSheet: React.FC<Props> = ({ type, onClose }) => {
  const { user, selectedDate } = useStore();
  const [value, setValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if selected date is in the past (only relevant for tasks)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(selectedDate);
  checkDate.setHours(0, 0, 0, 0);
  const isPastDate = type === 'task' && checkDate < today;

  // Reset & focus when sheet opens
  useEffect(() => {
    if (type) {
      setValue('');
      if (!isPastDate) setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [type]);

  const handleSave = async () => {
    if (!value.trim() || !user?.currentSpaceId || isSaving || !type) return;
    setIsSaving(true);
    try {
      const today = new Date();
      // For tasks use the selected date from the calendar; for others use today
      const taskDate = type === 'task' ? selectedDate : today;
      const dateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;

      if (type === 'task') {
        await addDoc(collection(db, `spaces/${user.currentSpaceId}/tasks`), {
          title: value.trim(),
          statType: 'intelligence',
          completed: false,
          xpAwarded: false,
          xpValue: XP_VALUES.TASK,
          spaceId: user.currentSpaceId,
          scheduledDate: dateStr,
          createdAt: serverTimestamp(),
        });
      } else if (type === 'habit') {
        await addDoc(collection(db, `spaces/${user.currentSpaceId}/habits`), {
          title: value.trim(),
          statType: 'vitality',
          frequency: 'daily',
          streak: 0,
          xpValue: XP_VALUES.HABIT,
          spaceId: user.currentSpaceId,
          createdAt: serverTimestamp(),
        });
      } else if (type === 'goal') {
        await addDoc(collection(db, `spaces/${user.currentSpaceId}/goals`), {
          title: value.trim(),
          progress: 0,
          target: 100,
          xpValue: XP_VALUES.GOAL,
          spaceId: user.currentSpaceId,
          createdAt: serverTimestamp(),
        });
      } else if (type === 'shopping') {
        await addDoc(collection(db, `spaces/${user.currentSpaceId}/shopping`), {
          name: value.trim(),
          completed: false,
          spaceId: user.currentSpaceId,
          createdAt: serverTimestamp(),
        });
      }

      onClose();
    } catch (err) {
      console.error('AddSheet save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  const cfg = type ? CONFIG[type] : null;

  return (
    <AnimatePresence>
      {type && cfg && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onPointerDown={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0720] border-t border-white/10 rounded-t-3xl px-5 pt-4 pb-safe"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{cfg.emoji}</span>
                <div>
                  <span className="text-sm font-black text-white uppercase tracking-wider font-display">
                    {cfg.title}
                  </span>
                  {type === 'task' && (
                    <p className="text-[10px] text-[#8b7ca8] font-display mt-0.5">
                      {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                    </p>
                  )}
                </div>
              </div>
              <button
                onPointerDown={onClose}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#8b7ca8]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Input or past-date notice */}
            {isPastDate ? (
              <div className="flex flex-col items-center py-4 pb-6 gap-2 text-center">
                <span className="text-3xl">🔒</span>
                <p className="text-sm font-black text-white font-display">Прошедшая дата</p>
                <p className="text-xs text-[#8b7ca8] font-display">
                  Нельзя добавлять задачи в прошлое.<br />Выбери сегодня или будущую дату.
                </p>
              </div>
            ) : (
              <div className="flex gap-3 pb-4">
                <input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={cfg.placeholder}
                  className="flex-1 bg-[#150a24] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-[#8b7ca8]/50 font-display focus:outline-none focus:border-white/30 transition-all"
                />
                <button
                  onPointerDown={handleSave}
                  disabled={!value.trim() || isSaving}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all disabled:opacity-40 shadow-lg"
                  style={{ backgroundColor: cfg.color }}
                >
                  {isSaving
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Plus size={20} className="text-white" strokeWidth={2.5} />
                  }
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
