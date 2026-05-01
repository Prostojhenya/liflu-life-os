import React from 'react';
import { useStore, STAT_LABELS } from '@/store/useStore';
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Settings, LogOut, TrendingUp, Calendar } from 'lucide-react';
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

  // Mock data for demo
  const tasksDone = 124;
  const streak = 6;

  // Generate activity grid (7 rows × 31 cols)
  const generateActivityGrid = () => {
    const levels = [0, 1, 1, 2, 2, 3, 4, 3, 2, 1, 2, 3, 4, 4, 3, 2, 1, 0, 1, 2, 3, 4, 4, 3, 2, 3, 4, 4, 3, 2, 1];
    const grid = [];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 31; col++) {
        const base = levels[col];
        const noise = (row + col) % 3;
        const level = Math.min(4, Math.max(0, base + (noise === 0 ? -1 : noise === 2 ? 1 : 0)));
        grid.push(level);
      }
    }
    return grid;
  };

  const activityGrid = generateActivityGrid();

  const getLevelColor = (level: number) => {
    if (level === 0) return 'rgba(255,255,255,0.05)';
    if (level === 1) return 'rgba(34,197,94,0.18)';
    if (level === 2) return 'rgba(34,197,94,0.4)';
    if (level === 3) return 'rgba(34,197,94,0.65)';
    return 'rgba(34,197,94,0.92)';
  };

  return (
    <div className="space-y-3 pb-32">
      {/* Header */}
      <div className="flex justify-between items-center px-5 pt-1.5 pb-3.5">
        <div className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.5px' }}>
          Профиль
        </div>
        <button 
          onClick={handleSignOut}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Settings size={18} />
        </button>
      </div>

      <div className="px-4 space-y-3.5">
        {/* Profile Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="relative overflow-hidden rounded-[18px] p-4 border"
          style={{
            background: 'linear-gradient(135deg, rgba(124,90,240,0.12), rgba(109,40,217,0.06))',
            borderColor: 'rgba(124,90,240,0.2)'
          }}
        >
          {/* Glow effect */}
          <div 
            className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none"
            style={{ background: 'rgba(124,90,240,0.3)', filter: 'blur(50px)' }}
          />

          <div className="relative flex items-start gap-3.5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div 
                className="w-[68px] h-[68px] rounded-full flex items-center justify-center text-[28px] border-[2.5px]"
                style={{
                  background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                  borderColor: '#7c5af0',
                  boxShadow: '0 0 20px rgba(124,90,240,0.3)'
                }}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  '🧑'
                )}
              </div>
              <div 
                className="absolute bottom-0 right-0 w-[22px] h-[22px] rounded-full flex items-center justify-center cursor-pointer border-2"
                style={{ background: '#7c5af0', borderColor: 'var(--bg)' }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-0.5" style={{ fontFamily: 'Syne, sans-serif' }}>
                <span className="text-xl font-extrabold tracking-tight">{user.displayName}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#a78bfa">
                  <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z"/>
                </svg>
              </div>
              <div className="text-xs font-medium mb-1.5" style={{ color: '#a78bfa' }}>
                Focused Builder
              </div>
              <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text3)' }}>
                <Calendar size={11} />
                <span>с нами с мая 2024</span>
              </div>
            </div>

            {/* League */}
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
              <div className="text-[10px]" style={{ color: 'var(--text3)' }}>Лига</div>
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-[22px] border-[1.5px]"
                style={{
                  background: 'linear-gradient(135deg, #312e81, #4c1d95)',
                  borderColor: 'rgba(167,139,250,0.4)',
                  boxShadow: '0 0 16px rgba(124,90,240,0.35)'
                }}
              >
                💎
              </div>
              <div className="text-xs font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#a78bfa' }}>
                Diamond I
              </div>
            </div>
          </div>
        </motion.div>

        {/* Level Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-[18px] p-4 border"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="flex justify-between items-baseline mb-3.5" style={{ fontFamily: 'Syne, sans-serif' }}>
            <div className="text-sm font-bold">
              Уровень <span style={{ color: '#a78bfa' }}>{user.level}</span>
            </div>
          </div>
          <div className="relative h-[7px] rounded-full overflow-visible mb-2.5" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
              className="h-full rounded-full relative"
              style={{
                background: 'linear-gradient(90deg, #7c5af0, #a78bfa)',
                boxShadow: '0 0 12px rgba(124,90,240,0.3)'
              }}
            >
              <div 
                className="absolute -right-[5px] top-1/2 -translate-y-1/2 w-[15px] h-[15px] rounded-full border-[3px]"
                style={{ background: '#fff', borderColor: '#7c5af0', boxShadow: '0 0 8px #7c5af0' }}
              />
            </motion.div>
          </div>
          <div className="flex justify-between">
            <div className="text-[11px] font-semibold" style={{ color: '#22c55e' }}>
              +{xpNeeded} XP до уровня {user.level + 1}
            </div>
            <div className="text-[13px] font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#a78bfa' }}>
              {user.totalXP} / {xpToNextLevel}
            </div>
          </div>
        </motion.div>

        {/* Unlocks */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-[18px] p-4 border"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="flex justify-between items-center mb-3.5" style={{ fontFamily: 'Syne, sans-serif' }}>
            <div className="text-sm font-bold">
              Разблокировано <span className="text-xs font-normal" style={{ color: 'var(--text3)' }}>• Следующее на ур.10</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: '📋', name: 'Задачи', level: 'Ур. 1', unlocked: true, bg: 'rgba(124,90,240,0.2)', border: 'rgba(124,90,240,0.3)' },
              { icon: '⚡', name: 'Привычки', level: 'Ур. 4', unlocked: true, bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.25)' },
              { icon: '📊', name: 'Аналитика', level: 'Ур. 7', unlocked: true, bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.25)' },
              { icon: '🔒', name: 'Темы', level: 'Ур. 10', unlocked: false, bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.15)' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div 
                  className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-[22px]"
                  style={{ 
                    background: item.bg, 
                    border: item.unlocked ? `1px solid ${item.border}` : `1px dashed ${item.border}`,
                    opacity: item.unlocked ? 1 : 0.5
                  }}
                >
                  {item.icon}
                </div>
                <div className="text-[10px] font-medium text-center" style={{ color: 'var(--text2)' }}>
                  {item.name}
                </div>
                <div className="text-[10px] text-center" style={{ color: 'var(--text3)' }}>
                  {item.level}
                </div>
                {!item.unlocked && (
                  <div className="text-[10px] font-semibold text-center" style={{ color: '#a78bfa' }}>
                    → след.
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="rounded-[18px] p-4 border"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="flex justify-between items-center mb-3.5" style={{ fontFamily: 'Syne, sans-serif' }}>
            <div className="text-sm font-bold">Достижения</div>
            <button className="text-xs font-medium" style={{ color: '#a78bfa' }}>Все →</button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: '🔥', name: '7 дней подряд', progress: 100, color: '#ef4444', unlocked: true },
              { icon: '💯', name: '100 задач', progress: 100, color: '#22c55e', unlocked: true },
              { icon: '⭐', name: 'Первая привычка', progress: 100, color: '#f59e0b', unlocked: true },
              { icon: '🔒', name: 'Ранний подъём', progress: 0, color: 'rgba(255,255,255,0.15)', unlocked: false, sub: '0/10 дней' },
            ].map((ach, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div 
                  className="w-[54px] h-[54px] rounded-full flex items-center justify-center text-2xl border-2"
                  style={{
                    background: ach.unlocked 
                      ? `radial-gradient(circle, ${ach.color}33, ${ach.color}0d)`
                      : 'rgba(255,255,255,0.03)',
                    borderColor: ach.unlocked ? `${ach.color}59` : 'rgba(255,255,255,0.1)',
                    borderStyle: ach.unlocked ? 'solid' : 'dashed',
                    fontSize: ach.unlocked ? '24px' : '18px',
                    color: ach.unlocked ? 'inherit' : 'var(--text3)'
                  }}
                >
                  {ach.icon}
                </div>
                <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div 
                    className="h-full rounded-full"
                    style={{ width: `${ach.progress}%`, background: ach.color }}
                  />
                </div>
                <div className="text-[10px] font-medium text-center leading-tight" style={{ color: 'var(--text2)' }}>
                  {ach.name}
                </div>
                {ach.sub && (
                  <div className="text-[10px] text-center" style={{ color: 'var(--text3)' }}>
                    {ach.sub}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[18px] p-4 border"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="text-sm font-bold mb-3.5" style={{ fontFamily: 'Syne, sans-serif' }}>
            Статистика
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: '✅', label: 'Задач выполнено', value: tasksDone, bg: 'rgba(124,90,240,0.15)' },
              { icon: '🔥', label: 'Дней стрик', value: streak, bg: 'rgba(239,68,68,0.15)' },
              { icon: '📈', label: 'Продуктивность', value: '78%', bg: 'rgba(59,130,246,0.15)' },
              { icon: 'XP', label: 'Всего XP', value: user.totalXP.toLocaleString('ru'), bg: 'rgba(245,158,11,0.15)', isXP: true },
            ].map((stat, i) => (
              <div 
                key={i}
                className="rounded-xl p-3 border flex items-center gap-2.5"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <div 
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: stat.bg }}
                >
                  {stat.isXP ? (
                    <span className="text-[11px] font-extrabold" style={{ color: '#f59e0b', fontFamily: 'Syne, sans-serif' }}>
                      XP
                    </span>
                  ) : (
                    <span className="text-base">{stat.icon}</span>
                  )}
                </div>
                <div>
                  <div className="text-lg font-extrabold tracking-tight leading-none" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.5px', fontSize: stat.isXP ? '15px' : '18px' }}>
                    {stat.value}
                  </div>
                  <div className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--text2)' }}>
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Activity */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="rounded-[18px] p-4 border"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="text-sm font-bold mb-3.5" style={{ fontFamily: 'Syne, sans-serif' }}>
            Активность <span className="text-[11px] font-normal" style={{ color: 'var(--text3)' }}>этот месяц</span>
          </div>
          <div className="flex items-start gap-2">
            {/* Days labels */}
            <div className="flex flex-col gap-1 pt-0.5">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, i) => (
                <div key={i} className="text-[9px] leading-[14px]" style={{ color: 'var(--text3)' }}>
                  {day}
                </div>
              ))}
            </div>
            {/* Grid */}
            <div className="flex-1">
              <div className="grid gap-[3.5px]" style={{ gridTemplateColumns: 'repeat(31, 1fr)', gridTemplateRows: 'repeat(7, 13px)' }}>
                {activityGrid.map((level, i) => (
                  <div
                    key={i}
                    className="rounded-sm"
                    style={{ background: getLevelColor(level) }}
                  />
                ))}
              </div>
              {/* Legend */}
              <div className="flex items-center justify-end gap-1.5 mt-1.5">
                <span className="text-[10px]" style={{ color: 'var(--text3)' }}>Меньше</span>
                <div className="flex gap-[3px]">
                  {[0, 1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className="w-3 h-3 rounded-sm"
                      style={{ background: getLevelColor(level) }}
                    />
                  ))}
                </div>
                <span className="text-[10px]" style={{ color: 'var(--text3)' }}>Больше</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Goals */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="rounded-[18px] p-4 border"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="flex justify-between items-center mb-3.5" style={{ fontFamily: 'Syne, sans-serif' }}>
            <div className="text-sm font-bold">Ближайшие цели</div>
            <button className="text-xs font-medium" style={{ color: '#a78bfa' }}>Все →</button>
          </div>
          <div className="space-y-0">
            {[
              { name: 'Достичь уровня 8', desc: `Заработай ещё ${xpNeeded} XP`, progress: xpProgress, current: user.totalXP, total: xpToNextLevel, color: '#a78bfa' },
              { name: 'Выполнить 4 задачи', desc: 'Ежедневная цель', progress: 50, current: 2, total: 4, color: '#06b6d4', remaining: '2 осталось' },
              { name: 'Стрик 7 дней', desc: 'Не прерывай цепочку', progress: 85.7, current: 6, total: 7, color: '#4ade80', remaining: '1 день' },
            ].map((goal, i) => (
              <div 
                key={i}
                className="flex items-center gap-3 py-3.5 border-b last:border-b-0 first:pt-0 last:pb-0"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              >
                {/* Ring */}
                <div className="w-[46px] h-[46px] flex-shrink-0 relative">
                  <svg viewBox="0 0 46 46" width="46" height="46" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="23" cy="23" r="19" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
                    <circle 
                      cx="23" cy="23" r="19" 
                      fill="none" 
                      stroke={goal.color} 
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="119.4"
                      strokeDashoffset={119.4 * (1 - goal.progress / 100)}
                      style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                  </svg>
                  <div 
                    className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
                    style={{ fontFamily: 'Syne, sans-serif', color: goal.color }}
                  >
                    {goal.current}/{goal.total}
                  </div>
                </div>
                {/* Info */}
                <div className="flex-1">
                  <div className="text-sm font-semibold mb-0.5">{goal.name}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{goal.desc}</div>
                </div>
                {/* Meta */}
                <div className="text-right flex-shrink-0">
                  {goal.remaining && (
                    <div className="text-[10px]" style={{ color: 'var(--text3)' }}>
                      {goal.remaining}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.button
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          onClick={handleSignOut}
          className="w-full py-3.5 rounded-2xl font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition-all active:scale-98"
          style={{
            fontFamily: 'Syne, sans-serif',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444'
          }}
        >
          <LogOut size={20} />
          Выйти из аккаунта
        </motion.button>
      </div>
    </div>
  );
};
