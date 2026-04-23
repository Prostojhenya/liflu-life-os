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
    <div className="min-h-screen bg-gradient-to-b from-[#0b0416] to-[#1a0b2e] p-6 pb-32">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-white uppercase mb-2 font-display glow-purple">
          Create Hub
        </h1>
        <p className="text-sm text-[#8b7ca8] font-bold font-display">
          Создание (AI)
        </p>
      </div>

      {/* Main Question */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-white mb-2 font-display">
          Что создаём?
        </h2>
        <p className="text-sm text-[#8b7ca8] font-display">
          Опиши или используй AI
        </p>
      </div>

      {/* AI Icon */}
      <div className="flex justify-center mb-8">
        <div className="w-24 h-24 rounded-full bg-accent-purple/20 border-2 border-accent-purple flex items-center justify-center">
          <Sparkles size={40} className="text-accent-purple" />
        </div>
      </div>

      {/* Input Area */}
      <div className="mb-6 relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Напиши, что нужно сделать..."
          className="w-full bg-[#150a24] border border-white/10 rounded-2xl p-5 pr-14 focus:outline-none focus:border-accent-purple transition-all text-base text-white placeholder:text-[#8b7ca8]/50 font-display resize-none"
          rows={4}
        />
        <button className="absolute right-4 bottom-4 text-[#8b7ca8] hover:text-accent-purple transition-colors">
          <Mic size={24} />
        </button>
      </div>

      {/* Examples */}
      <div className="mb-8">
        <p className="text-xs text-[#8b7ca8] font-bold uppercase tracking-wider mb-3 font-display">
          Примеры:
        </p>
        <div className="space-y-2">
          {[
            'Тренировка завтра в 18:00',
            'Купить продукты на неделю',
            'Подготовить презентацию'
          ].map((example, i) => (
            <button
              key={i}
              onClick={() => setInput(example)}
              className="block w-full text-left px-4 py-2 text-sm text-accent-purple font-display hover:bg-accent-purple/10 rounded-lg transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Type Selection */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {TASK_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          return (
            <motion.button
              key={type.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedType(type.id)}
              className={`p-6 rounded-2xl border-2 transition-all ${
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
                size={32} 
                style={{ color: type.color }}
                className="mb-3"
              />
              <p 
                className="text-sm font-black uppercase font-display"
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
        className="w-full bg-accent-purple text-white py-5 rounded-2xl font-black uppercase tracking-wider font-display flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(139,92,246,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCreating ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Создать
            <ArrowRight size={20} />
          </>
        )}
      </button>
    </div>
  );
};
