import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Calendar, Flag, RefreshCw, Clock, Bell, Star, 
  Trash2, Plus, Minus, Check, Users, Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type?: 'task' | 'habit' | 'goal' | 'shopping' | 'event' | null;
  initialData?: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    date?: string;
    time?: string;
    repeat?: string;
    duration?: string;
    reminder?: string;
    xp?: number;
  };
  onSave: (data: any) => void;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Низкий', color: '#10b981' },
  { value: 'medium', label: 'Средний', color: '#f59e0b' },
  { value: 'high', label: 'Высокий', color: '#ef4444' },
];

const REPEAT_OPTIONS = [
  { value: 'none', label: 'Не повторять' },
  { value: 'daily', label: 'Каждый день' },
  { value: 'weekly', label: 'Каждую неделю' },
  { value: 'monthly', label: 'Каждый месяц' },
];

const DURATION_OPTIONS = [
  { value: '15', label: '15 мин' },
  { value: '30', label: '30 мин' },
  { value: '60', label: '1 час' },
  { value: '120', label: '2 часа' },
];

const REMINDER_OPTIONS = [
  { value: 'none', label: 'Не напоминать' },
  { value: '30', label: 'За 30 мин' },
  { value: '60', label: 'За 1 час' },
  { value: '1440', label: 'За 1 день' },
];

export const TaskDetailSheet: React.FC<Props> = ({ isOpen, onClose, type, initialData, onSave }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState(initialData?.priority || 'medium');
  const [date, setDate] = useState(initialData?.date || '');
  const [time, setTime] = useState(initialData?.time || '');
  const [repeat, setRepeat] = useState(initialData?.repeat || 'none');
  const [duration, setDuration] = useState(initialData?.duration || '30');
  const [reminder, setReminder] = useState(initialData?.reminder || 'none');
  const [xp, setXp] = useState(initialData?.xp || 20);
  const [tags, setTags] = useState<string[]>(['Спорт', 'Здоровье', 'Развитие']);
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([
    { id: '1', title: 'Разминка 10 минут', completed: true },
    { id: '2', title: 'Тяга верхнего блока 4×12', completed: true },
    { id: '3', title: 'Тяга штанги в наклоне 4×10', completed: false },
  ]);
  const [newSubtask, setNewSubtask] = useState('');

  const sheetRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Определяем заголовок в зависимости от типа
  const getTitle = () => {
    if (type === 'task') return 'Редактировать задачу';
    if (type === 'habit') return 'Редактировать привычку';
    if (type === 'goal') return 'Редактировать цель';
    if (type === 'shopping') return 'Редактировать покупку';
    if (type === 'event') return 'Редактировать событие';
    return 'Редактировать';
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
    const deltaY = clientY - startY;

    // Если потянули вниз больше чем на 150px - закрываем
    if (deltaY > 150) {
      onClose();
      isDragging.current = false;
    }
  };

  const handleDragEnd = () => {
    isDragging.current = false;
  };

  const handleSave = () => {
    onSave({
      title,
      description,
      priority,
      date,
      time,
      repeat,
      duration,
      reminder,
      xp,
      tags,
      subtasks,
    });
    onClose();
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, { id: Date.now().toString(), title: newSubtask, completed: false }]);
    setNewSubtask('');
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st));
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const priorityColor = PRIORITY_OPTIONS.find(p => p.value === priority)?.color || '#f59e0b';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed top-[8vh] left-0 right-0 bottom-0 z-50 bg-[#0a0614] rounded-t-3xl overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div 
              className="sticky top-0 bg-[#0a0614] pt-3 pb-2 z-10"
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto cursor-grab active:cursor-grabbing touch-none" />
            </div>

            {/* Header */}
            <div className="sticky top-12 bg-[#0a0614] px-5 pb-3 flex items-center justify-between border-b border-white/5 z-10">
              <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white">
                <X size={18} />
              </button>
              <h2 className="text-base font-black text-white uppercase tracking-wider font-display">
                {getTitle()}
              </h2>
              <button 
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-accent-purple text-white text-xs font-black uppercase tracking-wider font-display"
              >
                ✓ Сохранить
              </button>
            </div>

            <div className="px-5 py-4 space-y-5 pb-20">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-xs text-[#8b7ca8] font-display font-bold uppercase tracking-wider">
                  Название задачи
                </label>
                <div className="relative">
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Что нужно сделать?"
                    className="w-full bg-[#150a24] border border-white/10 rounded-2xl px-4 py-3 pr-10 text-sm text-white placeholder:text-[#8b7ca8]/50 font-display focus:outline-none focus:border-accent-purple/50 transition-all"
                  />
                  {title && (
                    <button
                      onClick={() => setTitle('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[#8b7ca8]"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs text-[#8b7ca8] font-display font-bold uppercase tracking-wider">
                  Описание (необязательно)
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Силовая тренировка: спина, плечи, бицепс. Разминка 10 минут, основная часть, заминка."
                  rows={4}
                  maxLength={500}
                  className="w-full bg-[#150a24] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-[#8b7ca8]/50 font-display focus:outline-none focus:border-accent-purple/50 transition-all resize-none"
                />
                <div className="text-right text-[10px] text-[#8b7ca8]">{description.length}/500</div>
              </div>

              {/* Details Section */}
              <div className="space-y-1">
                <label className="text-xs text-[#8b7ca8] font-display font-bold uppercase tracking-wider mb-3 block">
                  Детали
                </label>

                {/* Date & Time */}
                <button className="w-full flex items-center justify-between bg-[#150a24] border border-white/10 rounded-2xl px-4 py-3 transition-all hover:bg-white/5">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-accent-purple" />
                    <span className="text-sm text-white font-display">Дата и время</span>
                  </div>
                  <span className="text-sm text-[#8b7ca8] font-display">Завтра, 18:00</span>
                </button>

                {/* Priority */}
                <button className="w-full flex items-center justify-between bg-[#150a24] border border-white/10 rounded-2xl px-4 py-3 transition-all hover:bg-white/5">
                  <div className="flex items-center gap-3">
                    <Flag size={18} className="text-[#f59e0b]" />
                    <span className="text-sm text-white font-display">Приоритет</span>
                  </div>
                  <span className="text-sm font-bold font-display" style={{ color: priorityColor }}>
                    {PRIORITY_OPTIONS.find(p => p.value === priority)?.label}
                  </span>
                </button>

                {/* Repeat */}
                <button className="w-full flex items-center justify-between bg-[#150a24] border border-white/10 rounded-2xl px-4 py-3 transition-all hover:bg-white/5">
                  <div className="flex items-center gap-3">
                    <RefreshCw size={18} className="text-accent-purple" />
                    <span className="text-sm text-white font-display">Повтор</span>
                  </div>
                  <span className="text-sm text-[#8b7ca8] font-display">Не повторять</span>
                </button>

                {/* Duration */}
                <button className="w-full flex items-center justify-between bg-[#150a24] border border-white/10 rounded-2xl px-4 py-3 transition-all hover:bg-white/5">
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-[#10b981]" />
                    <span className="text-sm text-white font-display">Длительность</span>
                  </div>
                  <span className="text-sm text-[#8b7ca8] font-display">1 ч 30 мин</span>
                </button>

                {/* Reminder */}
                <button className="w-full flex items-center justify-between bg-[#150a24] border border-white/10 rounded-2xl px-4 py-3 transition-all hover:bg-white/5">
                  <div className="flex items-center gap-3">
                    <Bell size={18} className="text-[#f59e0b]" />
                    <span className="text-sm text-white font-display">Напоминание</span>
                  </div>
                  <span className="text-sm text-[#8b7ca8] font-display">За 30 мин</span>
                </button>

                {/* XP */}
                <div className="w-full flex items-center justify-between bg-[#150a24] border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Star size={18} className="text-accent-purple" />
                    <span className="text-sm text-white font-display">XP за выполнение</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setXp(Math.max(5, xp - 5))}
                      className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold text-accent-purple font-display min-w-[50px] text-center">
                      +{xp} XP
                    </span>
                    <button
                      onClick={() => setXp(Math.min(100, xp + 5))}
                      className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Executors */}
              <div className="space-y-3">
                <label className="text-xs text-[#8b7ca8] font-display font-bold uppercase tracking-wider">
                  Исполнители
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center -space-x-2">
                    {['Я', 'Аня', 'Игорь'].map((name, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-purple to-accent-magenta flex items-center justify-center text-white text-xs font-bold border-2 border-[#0a0614]"
                      >
                        {name[0]}
                      </div>
                    ))}
                  </div>
                  <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#8b7ca8] hover:bg-white/10 transition-colors">
                    <Plus size={16} />
                  </button>
                  <span className="text-xs text-[#8b7ca8] font-display">Добавить</span>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <label className="text-xs text-[#8b7ca8] font-display font-bold uppercase tracking-wider">
                  Метки
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-display border"
                      style={{
                        backgroundColor: i === 0 ? '#8B5CF620' : i === 1 ? '#10b98120' : '#3B82F620',
                        borderColor: i === 0 ? '#8B5CF640' : i === 1 ? '#10b98140' : '#3B82F640',
                        color: i === 0 ? '#8B5CF6' : i === 1 ? '#10b981' : '#3B82F6',
                      }}
                    >
                      <span>{tag}</span>
                      <button onClick={() => removeTag(tag)} className="hover:opacity-70">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold font-display text-[#8b7ca8] hover:bg-white/10 transition-colors">
                    + Добавить
                  </button>
                </div>
              </div>

              {/* Subtasks */}
              <div className="space-y-3">
                <label className="text-xs text-[#8b7ca8] font-display font-bold uppercase tracking-wider">
                  Подзадачи
                </label>
                <div className="space-y-2">
                  {subtasks.map(st => (
                    <div
                      key={st.id}
                      className="flex items-center gap-3 bg-[#150a24] border border-white/10 rounded-2xl px-4 py-3"
                    >
                      <button
                        onClick={() => toggleSubtask(st.id)}
                        className={cn(
                          'w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all',
                          st.completed
                            ? 'bg-accent-purple border-accent-purple'
                            : 'border-white/20'
                        )}
                      >
                        {st.completed && <Check size={12} className="text-white" strokeWidth={3} />}
                      </button>
                      <span className={cn(
                        'text-sm font-display flex-1',
                        st.completed ? 'text-[#8b7ca8] line-through' : 'text-white'
                      )}>
                        {st.title}
                      </span>
                      <button className="text-[#8b7ca8] hover:text-white">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="3" y1="6" x2="21" y2="6"/>
                          <line x1="3" y1="12" x2="21" y2="12"/>
                          <line x1="3" y1="18" x2="21" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      value={newSubtask}
                      onChange={e => setNewSubtask(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addSubtask()}
                      placeholder="Добавить подзадачу"
                      className="flex-1 bg-[#150a24] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-[#8b7ca8]/50 font-display focus:outline-none focus:border-accent-purple/50 transition-all"
                    />
                    <button
                      onClick={addSubtask}
                      className="w-12 h-12 rounded-2xl bg-accent-purple flex items-center justify-center text-white hover:bg-accent-purple/80 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Delete */}
              <button className="w-full py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold font-display flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors">
                <Trash2 size={18} />
                Удалить задачу
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
