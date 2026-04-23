import React, { useState } from 'react';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useStore, XP_VALUES } from '@/store/useStore';
import { Sparkles, Mic, CheckSquare, Gift, ShoppingBag, Target, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const TASK_TYPES = [
  { id: 'task', label: 'Задача', icon: CheckSquare, color: '#8B5CF6', stat: 'intelligence' },
  { id: 'habit', label: 'Привычка', icon: Gift, color: '#10b981', stat: 'vitality' },
  { id: 'shopping', label: 'Покупка', icon: ShoppingBag, color: '#f59e0b', stat: 'sense' },
  { id: 'goal', label: 'Цель', icon: Target, color: '#3B82F6', stat: 'strength' },
];

export const CreateHub: React.FC = () => {
  const { user, setActiveTab } = useStore();
  const [input, setInput] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!input.trim() || !selectedType || !user?.currentSpaceId || isCreating) return;

    setIsCreating(true);
    try {
      const taskType = TASK_TYPES.find(t => t.id === selectedType);
      const today = new Date();
      const scheduledDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const path = `spaces/${user.currentSpaceId}/tasks`;
      await addDoc(collection(db, path), {
        title: input,
        statType: taskType?.stat || 'intelligence',
        completed: false,
        xpAwarded: false,
        xpValue: XP_VALUES.TASK,
        spaceId: user.currentSpaceId,
        scheduledDate: scheduledDateStr,
        createdAt: serverTimestamp(),
      });

      setInput('');
      setSelectedType(null);
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-32 px-6 pt-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black text-white uppercase mb-1 font-display glow-purple">
          Create Hub
        </h1>
        <p className="text-[10px] text-[#8b7ca8] font-black uppercase tracking-[0.2em] font-display">
          Создание (AI)
        </p>
      </div>

      {/* Main Question */}
      <div className="mb-4">
        <h2 className="text-xl font-black text-white mb-1 font-display">
          Что создаём?
        </h2>
        <p className="text-xs text-[#8b7ca8] font-display">
          Опиши или используй AI
        </p>
      </div>

      {/* AI Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-20 h-20 rounded-full bg-accent-purple/20 border-2 border-accent-purple flex items-center justify-center">
          <Sparkles size={32} className="text-accent-purple" />
        </div>
      </div>

      {/* Input Area */}
      <div className="mb-4 relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Напиши, что нужно сделать..."
          className="w-full bg-[#150a24] border border-white/10 rounded-2xl p-4 pr-12 focus:outline-none focus:border-accent-purple transition-all text-sm text-white placeholder:text-[#8b7ca8]/50 font-display resize-none"
          rows={3}
        />
        <button className="absolute right-3 bottom-3 text-[#8b7ca8] hover:text-accent-purple transition-colors">
          <Mic size={20} />
        </button>
      </div>

      {/* Examples */}
      <div className="mb-4">
        <p className="text-[10px] text-[#8b7ca8] font-black uppercase tracking-wider mb-2 font-display">
          Примеры:
        </p>
        <div className="space-y-1.5">
          {[
            'Тренировка завтра в 18:00',
            'Купить продукты на неделю',
            'Подготовить презентацию'
          ].map((example, i) => (
            <button
              key={i}
              onClick={() => setInput(example)}
              className="block w-full text-left px-3 py-2 text-xs text-accent-purple font-display hover:bg-accent-purple/10 rounded-xl transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Type Selection */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {TASK_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          return (
            <motion.button
              key={type.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedType(type.id)}
              className={`p-4 rounded-2xl border-2 transition-all ${
                isSelected
                  ? 'border-opacity-100 shadow-lg'
                  : 'border-white/10 hover:border-white/20'
              }`}
              style={{
                backgroundColor: isSelected ? `${type.color}20` : '#150a24',
                borderColor: isSelected ? type.color : undefined,
              }}
            >
              <Icon 
                size={24} 
                style={{ color: type.color }}
                className="mb-2"
              />
              <p 
                className="text-xs font-black uppercase font-display"
                style={{ color: isSelected ? type.color : '#8b7ca8' }}
              >
                {type.label}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Create Button */}
      <button
        onClick={handleCreate}
        disabled={!input.trim() || !selectedType || isCreating}
        className="w-full bg-accent-purple text-white py-4 rounded-2xl font-black uppercase tracking-wider font-display flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(139,92,246,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isCreating ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Создать
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </div>
  );
};
