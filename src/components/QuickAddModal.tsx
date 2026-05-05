import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useStore, XP_VALUES } from '@/store/useStore';
import { X, Plus } from 'lucide-react';
import type { AddType } from './AddSheet';

interface Props {
  type: AddType | null;
  onClose: () => void;
}

interface Cfg {
  title: string;
  placeholder: string;
  emoji: string;
  color: string;
  isEvent: boolean;
}

const CONFIG: Partial<Record<AddType, Cfg>> = {
  task:     { title: 'Новая задача',     placeholder: 'Что нужно сделать?',       emoji: '✅', color: '#8B5CF6', isEvent: false },
  event:    { title: 'Новое событие',    placeholder: 'Название события...',       emoji: '📅', color: '#ec4899', isEvent: true  },
  habit:    { title: 'Новая привычка',   placeholder: 'Какую привычку добавить?', emoji: '🔥', color: '#10b981', isEvent: false },
  goal:     { title: 'Новая цель',       placeholder: 'К чему стремишься?',       emoji: '🎯', color: '#3B82F6', isEvent: false },
  shopping: { title: 'Добавить покупку', placeholder: 'Что купить?',              emoji: '🛒', color: '#f59e0b', isEvent: false },
};

export const QuickAddModal: React.FC<Props> = ({ type, onClose }) => {
  const { user, selectedDate } = useStore();
  const [value, setValue] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const cfg = type ? CONFIG[type] : null;

  // Past date check (tasks/events only)
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
  const checkDate = new Date(selectedDate); checkDate.setHours(0, 0, 0, 0);
  const isPastDate = (type === 'task' || type === 'event') && checkDate < todayMidnight;

  useEffect(() => {
    if (cfg) {
      setValue('');
      setEventTime('');
      if (!isPastDate) setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [type]);

  const handleSave = async () => {
    if (!value.trim() || !user?.currentSpaceId || isSaving || !type || !cfg) return;
    setIsSaving(true);
    try {
      const today = new Date();
      const taskDate = (type === 'task' || type === 'event') ? selectedDate : today;
      const dateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;

      if (type === 'task' || type === 'event') {
        await addDoc(collection(db, `spaces/${user.currentSpaceId}/tasks`), {
          title: value.trim(),
          type: cfg.isEvent ? 'event' : 'task',
          eventTime: cfg.isEvent ? (eventTime || null) : null,
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
      console.error('QuickAddModal save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  return (
    <AnimatePresence>
      {cfg && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-[#130926] border border-white/10 rounded-3xl p-5 shadow-2xl"
            style={{ maxWidth: 420, margin: '0 auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${cfg.color}20` }}
                >
                  {cfg.emoji}
                </div>
                <div>
                  <p className="text-sm font-black text-white uppercase tracking-wider font-display">{cfg.title}</p>
                  {(type === 'task' || type === 'event') && (
                    <p className="text-[10px] text-[#8b7ca8] font-display mt-0.5">
                      {selectedDate.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#8b7ca8] hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {isPastDate ? (
              <div className="flex flex-col items-center py-6 gap-3 text-center">
                <span className="text-4xl">🔒</span>
                <p className="text-sm font-black text-white font-display">Прошедшая дата</p>
                <p className="text-xs text-[#8b7ca8] font-display leading-relaxed">
                  Нельзя добавлять в прошлое.<br />Выбери сегодня или будущую дату.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Time field — only for events */}
                {cfg.isEvent && (
                  <input
                    type="time"
                    value={eventTime}
                    onChange={e => setEventTime(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-display focus:outline-none focus:border-white/30 transition-all"
                  />
                )}

                {/* Text input */}
                <input
                  ref={inputRef}
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={cfg.placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-[#8b7ca8]/50 font-display focus:outline-none focus:border-white/20 transition-all"
                />

                {/* Save button */}
                <button
                  onClick={handleSave}
                  disabled={!value.trim() || isSaving}
                  className="w-full py-3.5 rounded-2xl font-black uppercase tracking-wider font-display text-sm text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg"
                  style={{ backgroundColor: cfg.color }}
                >
                  {isSaving
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Plus size={18} strokeWidth={2.5} />Добавить</>
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
