import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, XP_VALUES } from '@/store/useStore';
import { X, Plus, CheckSquare, Flame, Target, ShoppingCart, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskDetailSheet } from './TaskDetailSheet';
import { useCreateItem } from '@/hooks/useCreateItem';

export type AddType = 'task' | 'habit' | 'goal' | 'shopping' | 'picker' | 'event';

interface Props {
  type: AddType | null;
  onClose: () => void;
}

const TYPES = [
  { id: 'task',     label: 'Задача',   icon: CheckSquare,  color: '#8B5CF6', emoji: '✅' },
  { id: 'habit',    label: 'Привычка', icon: Flame,        color: '#10b981', emoji: '🔥' },
  { id: 'goal',     label: 'Цель',     icon: Target,       color: '#3B82F6', emoji: '🎯' },
  { id: 'shopping', label: 'Покупка',  icon: ShoppingCart, color: '#f59e0b', emoji: '🛒' },
] as const;

type RealType = 'task' | 'habit' | 'goal' | 'shopping';

const CONFIG: Record<RealType, { title: string; placeholder: string; emoji: string; color: string; hasTypeToggle?: boolean }> = {
  task:     { title: 'Новая задача',     placeholder: 'Что нужно сделать?',       emoji: '✅', color: '#8B5CF6', hasTypeToggle: true },
  habit:    { title: 'Новая привычка',   placeholder: 'Какую привычку добавить?', emoji: '🔥', color: '#10b981' },
  goal:     { title: 'Новая цель',       placeholder: 'К чему стремишься?',       emoji: '🎯', color: '#3B82F6' },
  shopping: { title: 'Добавить покупку', placeholder: 'Что купить?',              emoji: '🛒', color: '#f59e0b' },
};

export const AddSheet: React.FC<Props> = ({ type, onClose }) => {
  const { user, selectedDate } = useStore();
  const [activeType, setActiveType] = useState<RealType | null>(null);
  const [value, setValue] = useState('');
  const [itemType, setItemType] = useState<'task' | 'event'>('task');
  const [eventTime, setEventTime] = useState('');
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const { createItem, isCreating: isSaving } = useCreateItem({
    spaceId: user?.currentSpaceId || '',
    userId: user?.uid || '',
    scheduledDate: selectedDate,
    onSuccess: onClose,
    onError: (error) => {
      console.error('AddSheet save error:', error);
    }
  });

  const isPicker = type === 'picker';

  // Past date check (tasks only)
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
  const checkDate = new Date(selectedDate); checkDate.setHours(0, 0, 0, 0);
  const isPastDate = (activeType === 'task' || type === 'task') && checkDate < todayMidnight;

  // Reset on open
  useEffect(() => {
    if (type) {
      setValue('');
      setItemType('task');
      setEventTime('');
      setShowDetailSheet(false);
      if (type !== 'picker') {
        setActiveType(type as RealType);
      } else {
        setActiveType(null);
      }
    }
  }, [type]);

  // Focus input when activeType is set
  useEffect(() => {
    if (activeType && !isPastDate && !showDetailSheet) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [activeType, showDetailSheet]);

  const handleSave = async (data?: any) => {
    const titleToSave = data?.title || value.trim();
    if (!titleToSave || !activeType) return;

    await createItem(itemType === 'event' ? 'event' : activeType, {
      title: titleToSave,
      description: data?.description,
      priority: data?.priority,
      xp: data?.xp,
      reminder: data?.reminder,
      eventTime: itemType === 'event' ? eventTime : null,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      if (isPicker && activeType) { setActiveType(null); setValue(''); }
      else onClose();
    }
  };

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    isDragging.current = true;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    if (sheetRef.current) {
      sheetRef.current.dataset.startY = String(clientY);
    }
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startY = Number(sheetRef.current.dataset.startY || 0);
    const deltaY = startY - clientY;

    // Если потянули вверх больше чем на 100px - открываем детальное меню
    if (deltaY > 100 && !showDetailSheet && activeType) {
      setShowDetailSheet(true);
      isDragging.current = false;
    }
  };

  const handleDragEnd = () => {
    isDragging.current = false;
  };

  const cfg = activeType ? CONFIG[activeType] : null;

  return (
    <AnimatePresence>
      {type && (
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
          {!showDetailSheet && (
            <motion.div
              ref={sheetRef}
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0720] border-t border-white/10 rounded-t-3xl px-5 pt-4 pb-safe"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div 
                className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 cursor-grab active:cursor-grabbing touch-none"
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
              />

              {/* ── PICKER MODE ── */}
              {isPicker && !activeType ? (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-sm font-black text-white uppercase tracking-wider font-display">Что добавить?</span>
                    <button onPointerDown={onClose} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#8b7ca8]">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pb-4">
                    {TYPES.map(({ id, label, icon: Icon, color, emoji }) => (
                      <button
                        key={id}
                        onPointerDown={() => setActiveType(id as RealType)}
                        className="flex flex-col items-center gap-2 py-5 rounded-2xl border border-white/10 bg-[#150a24] active:scale-95 transition-all"
                        style={{ borderColor: `${color}30` }}
                      >
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                          <Icon size={24} style={{ color }} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider font-display" style={{ color }}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : cfg ? (
                /* ── FORM MODE ── */
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {isPicker && (
                        <button
                          onPointerDown={() => { setActiveType(null); setValue(''); }}
                          className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-[#8b7ca8] mr-1"
                        >
                          <span className="text-xs">←</span>
                        </button>
                      )}
                      <span className="text-xl">{cfg.emoji}</span>
                      <div>
                        <span className="text-sm font-black text-white uppercase tracking-wider font-display">{cfg.title}</span>
                        {activeType === 'task' && (
                          <p className="text-[10px] text-[#8b7ca8] font-display mt-0.5">
                            {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <button onPointerDown={onClose} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#8b7ca8]">
                      <X size={16} />
                    </button>
                  </div>

                  {/* Past date block */}
                  {isPastDate ? (
                    <div className="flex flex-col items-center py-4 pb-6 gap-2 text-center">
                      <span className="text-3xl">🔒</span>
                      <p className="text-sm font-black text-white font-display">Прошедшая дата</p>
                      <p className="text-xs text-[#8b7ca8] font-display">
                        Нельзя добавлять задачи в прошлое.<br />Выбери сегодня или будущую дату.
                      </p>
                    </div>
                  ) : (
                    <div className="pb-4 space-y-3">
                      {/* Task / Event toggle */}
                      {cfg.hasTypeToggle && (
                        <div className="flex gap-2">
                          <button
                            onPointerDown={() => setItemType('task')}
                            className={cn(
                              'flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider font-display transition-all border',
                              itemType === 'task' ? 'bg-accent-purple/10 border-accent-purple/30 text-accent-purple' : 'bg-[#150a24] border-white/5 text-[#6b7280]'
                            )}
                          >
                            ✅ Задача
                          </button>
                          <button
                            onPointerDown={() => setItemType('event')}
                            className={cn(
                              'flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider font-display transition-all border',
                              itemType === 'event' ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#f59e0b]' : 'bg-[#150a24] border-white/5 text-[#6b7280]'
                            )}
                          >
                            📅 Событие
                          </button>
                        </div>
                      )}

                      {/* Time for events */}
                      {cfg.hasTypeToggle && itemType === 'event' && (
                        <input
                          type="time"
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          className="w-full bg-[#150a24] border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white font-display focus:outline-none focus:border-white/30 transition-all"
                        />
                      )}

                      {/* Input + save */}
                      <div className="flex gap-3">
                        <input
                          ref={inputRef}
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={itemType === 'event' ? 'Название события...' : cfg.placeholder}
                          className="flex-1 bg-[#150a24] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-[#8b7ca8]/50 font-display focus:outline-none focus:border-white/30 transition-all"
                        />
                        <button
                          onPointerDown={() => handleSave()}
                          disabled={!value.trim() || isSaving}
                          className="w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all disabled:opacity-40 shadow-lg flex-shrink-0"
                          style={{ backgroundColor: itemType === 'event' ? '#f59e0b' : cfg.color }}
                        >
                          {isSaving
                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <Plus size={20} className="text-white" strokeWidth={2.5} />
                          }
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </motion.div>
          )}
        </>
      )}

      {/* Detail Sheet */}
      <TaskDetailSheet
        isOpen={showDetailSheet}
        onClose={() => {
          setShowDetailSheet(false);
          onClose();
        }}
        type={activeType as any}
        initialData={{
          title: value,
          description: '',
          priority: 'medium',
          xp: activeType === 'task' ? XP_VALUES.TASK : activeType === 'habit' ? XP_VALUES.HABIT : XP_VALUES.GOAL,
        }}
        onSave={handleSave}
      />
    </AnimatePresence>
  );
};
