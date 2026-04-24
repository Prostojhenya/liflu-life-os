import React from 'react';
import { useStore, STAT_LABELS } from '@/store/useStore';
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Settings, LogOut, Award, TrendingUp, Target, Zap } from 'lucide-react';
import { motion } from 'motion/react';

const STAT_COLORS = {
  strength: '#ef4444',
  agility: '#f59e0b',
  intelligence: '#8B5CF6',
  vitality: '#10b981',
  sense: '#3B82F6'
};

const STAT_ICONS = {
  strength: '💪',
  agility: '⚡',
  intelligence: '🧠',
  vitality: '❤️',
  sense: '🎯'
};

export const Profile: React.FC = () => {
  const { user, setUser } = useStore();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) return null;

  const xpToNextLevel = user.level * user.level * 50;
  const xpProgress = Math.min(100, (user.totalXP / xpToNextLevel) * 100);
  const xpNeeded = xpToNextLevel - user.totalXP;

  // Calculate total stat points
  const totalStats = Object.values(user.stats).reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-6 pb-32">
      {/* Header with Settings */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase glow-purple font-display">
          Профиль
        </h1>
        <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#8b7ca8] hover:bg-white/10 transition-colors">
          <Settings size={20} />
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-[#150a24]/50 border border-white/5 rounded-3xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-accent-purple overflow-hidden">
              <img
                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                alt="Profile"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-accent-purple rounded-full flex items-center justify-center text-white text-xs font-black border-2 border-[#0b0416]">
              {user.level}
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-white uppercase font-display mb-1">
              {user.displayName}
            </h2>
            <p className="text-xs text-[#8b7ca8] font-display mb-2">
              {user.email}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-accent-purple uppercase font-display">
                Уровень: {user.level}
              </span>
              <span className="text-[#8b7ca8]">•</span>
              <span className="text-xs font-black text-accent-magenta uppercase font-display">
                {user.totalXP} / {xpToNextLevel} XP
              </span>
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-[#8b7ca8] font-black uppercase font-display">
              До уровня {user.level + 1}
            </span>
            <span className="text-accent-purple font-black font-display">
              {xpNeeded} XP
            </span>
          </div>
          <div className="status-bar-bg h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              className="status-bar-fill bg-gradient-to-r from-accent-purple to-accent-magenta h-full"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-[#150a24]/50 border border-white/5 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-white uppercase font-display">
            Характеристики
          </h3>
          <span className="text-xs font-black text-[#8b7ca8] uppercase font-display">
            Всего: {totalStats}
          </span>
        </div>
        <div className="space-y-3">
          {Object.entries(user.stats).map(([key, value]) => {
            const statKey = key as keyof typeof STAT_LABELS;
            const maxStat = Math.max(...Object.values(user.stats));
            const percentage = maxStat > 0 ? (value / maxStat) * 100 : 0;
            
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{STAT_ICONS[statKey]}</span>
                    <span className="text-sm font-black text-white uppercase font-display">
                      {STAT_LABELS[statKey]}
                    </span>
                  </div>
                  <span className="text-sm font-black font-display" style={{ color: STAT_COLORS[statKey] }}>
                    {value}
                  </span>
                </div>
                <div className="status-bar-bg h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: STAT_COLORS[statKey] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-[#150a24]/50 border border-white/5 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-white uppercase font-display">
            Достижения
          </h3>
          <button className="text-xs font-black text-accent-purple uppercase font-display">
            Смотреть все
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: '🎯', label: 'Первые шаги', unlocked: user.totalXP >= 10 },
            { icon: '⚡', label: '100 задач', unlocked: user.totalXP >= 100 },
            { icon: '🔥', label: 'Серия 7', unlocked: false },
            { icon: '⭐', label: 'Мастер', unlocked: false },
          ].map((achievement, i) => (
            <div
              key={i}
              className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-3 transition-all ${
                achievement.unlocked
                  ? 'bg-accent-purple/20 border-accent-purple'
                  : 'bg-[#0b0416] border-white/5 opacity-40'
              }`}
            >
              <span className="text-2xl mb-1">{achievement.icon}</span>
              <span className="text-[8px] font-black text-center uppercase font-display text-[#8b7ca8]">
                {achievement.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#150a24]/50 border border-white/5 rounded-3xl p-4">
        <h3 className="text-sm font-black text-white uppercase font-display mb-3 px-2">
          Быстрые действия
        </h3>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <TrendingUp size={20} className="text-accent-blue" />
              <span className="text-sm font-black text-white uppercase font-display">
                Моя статистика
              </span>
            </div>
            <span className="text-[#8b7ca8]">→</span>
          </button>
          <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <Award size={20} className="text-accent-orange" />
              <span className="text-sm font-black text-white uppercase font-display">
                Мои награды
              </span>
            </div>
            <span className="text-[#8b7ca8]">→</span>
          </button>
          <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <Target size={20} className="text-accent-purple" />
              <span className="text-sm font-black text-white uppercase font-display">
                Мои цели
              </span>
            </div>
            <span className="text-[#8b7ca8]">→</span>
          </button>
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full bg-accent-red/10 border border-accent-red/20 text-accent-red py-4 rounded-2xl font-black uppercase tracking-wider font-display flex items-center justify-center gap-3 hover:bg-accent-red/20 transition-all"
      >
        <LogOut size={20} />
        Выйти из аккаунта
      </button>
    </div>
  );
};
