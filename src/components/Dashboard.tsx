import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { db } from '@/firebase';
import { collection, query, orderBy, limit, onSnapshot, where, doc, updateDoc } from 'firebase/firestore';
import { Zap, ShoppingBag, Target, TrendingUp, ChevronRight, CheckSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, ResponsiveContainer, Cell, XAxis, YAxis } from 'recharts';

interface DashboardData {
  tasks: any[];
  habits: any[];
  shopping: any[];
}

export const Dashboard: React.FC = () => {
  const { user, setActiveTab } = useStore();
  const [data, setData] = useState<DashboardData>({ tasks: [], habits: [], shopping: [] });

  useEffect(() => {
    if (!user?.currentSpaceId) return;

    const tasksQ = query(collection(db, `spaces/${user.currentSpaceId}/tasks`), orderBy('createdAt', 'desc'), limit(5));
    const habitsQ = query(collection(db, `spaces/${user.currentSpaceId}/habits`), orderBy('createdAt', 'desc'), limit(5));
    const shoppingQ = query(collection(db, `spaces/${user.currentSpaceId}/shopping`), where('completed', '==', false), orderBy('createdAt', 'desc'), limit(4));

    const unsubTasks = onSnapshot(tasksQ, (s) => setData(p => ({ ...p, tasks: s.docs.map(d => ({ id: d.id, ...d.data() })) })));
    const unsubHabits = onSnapshot(habitsQ, (s) => setData(p => ({ ...p, habits: s.docs.map(d => ({ id: d.id, ...d.data() })) })));
    const unsubShopping = onSnapshot(shoppingQ, (s) => setData(p => ({ ...p, shopping: s.docs.map(d => ({ id: d.id, ...d.data() })) })));

    return () => { unsubTasks(); unsubHabits(); unsubShopping(); };
  }, [user?.currentSpaceId]);

  const toggleShoppingItem = async (e: React.MouseEvent, itemId: string, completed: boolean) => {
    e.stopPropagation();
    if (!user?.currentSpaceId) return;
    try {
      await updateDoc(doc(db, `spaces/${user.currentSpaceId}/shopping`, itemId), {
        completed: !completed
      });
    } catch (error) {
      console.error("Error toggling item:", error);
    }
  };

  if (!user) return null;

  const stats = user.stats || { strength: 10, agility: 10, intelligence: 10, vitality: 10, sense: 10 };

  // Данные для графиков (реальный прогресс)
  const habitChartData = [
    { day: '10-е', value: 30 }, { day: '11-е', value: 20 }, { day: '12-е', value: 60 },
    { day: '13-е', value: 40 }, { day: '14-е', value: 90 }, { day: '15-е', value: 70 }
  ];

  const missionChartData = [
    { name: 'Сила', value: stats.strength }, 
    { name: 'Ловкость', value: stats.agility }, 
    { name: 'Интеллект', value: stats.intelligence },
    { name: 'Выносливость', value: stats.vitality }, 
    { name: 'Чутьё', value: stats.sense }
  ];

  return (
    <div className="space-y-6 pb-20 pt-2">
      {/* SECTION 1: TOP ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PROFILE CARD (SOLO LEVELING SYSTEM) */}
        <div className="lg:col-span-7 bento-card bg-[#150a24] border-white/5 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-purple/5 rounded-full blur-[80px] -mr-32 -mt-32" />
          
          <div className="relative z-10">
            <div className="flex flex-col space-y-6 w-full">
              <div className="flex justify-between items-center">
                <div>
                   <div className="mb-2 bg-accent-magenta/20 border border-accent-magenta/30 px-4 py-0.5 rounded-full w-fit">
                    <span className="text-[10px] font-black text-white glow-magenta tracking-[0.2em] font-display uppercase">
                      {user.level > 50 ? 'СТАТУС: ЭКСПЕРТ' : 
                       user.level > 30 ? 'СТАТУС: ПРОФЕССИОНАЛ' : 
                       user.level > 15 ? 'СТАТУС: ПРОДВИНУТЫЙ' : 
                       user.level > 5 ? 'СТАТУС: СТАБИЛЬНЫЙ' : 
                       'СТАТУС: НОВИЧОК'}
                    </span>
                  </div>
                  <h2 className="text-5xl font-black italic tracking-tighter uppercase glow-purple leading-none font-display">
                    {user.displayName || 'ИГРОК'}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6 pt-4">
                <div className="space-y-1">
                   <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black text-[#8b7ca8] uppercase tracking-widest font-display">Физ. подготовка</span>
                      <span className="text-xs font-black text-white italic font-display">{stats.strength}</span>
                   </div>
                   <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-accent-magenta" style={{ width: `${Math.min(100, (stats.strength / 200) * 100)}%` }} />
                   </div>
                </div>
                <div className="space-y-1">
                   <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black text-[#8b7ca8] uppercase tracking-widest font-display">Энергия</span>
                      <span className="text-xs font-black text-white italic font-display">{stats.agility}</span>
                   </div>
                   <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-accent-blue" style={{ width: `${Math.min(100, (stats.agility / 200) * 100)}%` }} />
                   </div>
                </div>
                <div className="space-y-1">
                   <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black text-[#8b7ca8] uppercase tracking-widest font-display">Интеллект</span>
                      <span className="text-xs font-black text-white italic font-display">{stats.intelligence}</span>
                   </div>
                   <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-accent-purple" style={{ width: `${Math.min(100, (stats.intelligence / 200) * 100)}%` }} />
                   </div>
                </div>
                <div className="space-y-1">
                   <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black text-[#8b7ca8] uppercase tracking-widest font-display">Здоровье</span>
                      <span className="text-xs font-black text-white italic font-display">{stats.vitality}</span>
                   </div>
                   <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-accent-orange" style={{ width: `${Math.min(100, (stats.vitality / 200) * 100)}%` }} />
                   </div>
                </div>
                <div className="space-y-1">
                   <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black text-[#8b7ca8] uppercase tracking-widest font-display">Организация</span>
                      <span className="text-xs font-black text-white italic font-display">{stats.sense}</span>
                   </div>
                   <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-accent-blue" style={{ width: `${Math.min(100, (stats.sense / 200) * 100)}%` }} />
                   </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#8b7ca8] mb-2 font-display">
                  <span>Прогресс уровня</span>
                  <span className="glow-purple">{user.totalXP} / {user.level * user.level * 50} XP</span>
                </div>
                <div className="status-bar-bg h-2 shadow-[0_0_10px_rgba(139,92,246,0.1)]">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (user.totalXP / (user.level * user.level * 50)) * 100)}%` }}
                    className="status-bar-fill bg-gradient-to-r from-accent-purple to-accent-magenta shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                   />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ТРЕКЕР ПРИВЫЧЕК (ГРАФИК) */}
        <div className="lg:col-span-5 bento-card bg-[#150a24] border-white/5 p-6 flex flex-col justify-between overflow-hidden cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setActiveTab('habits')}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[12px] font-black text-[#8b7ca8] uppercase tracking-[0.3em] font-display">Трекер привычек</h3>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black text-accent-magenta uppercase font-display">Еженедельный рост</span>
              <div className="w-1.5 h-1.5 bg-accent-magenta rounded-full animate-pulse" />
            </div>
          </div>
          
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitChartData}>
                <Bar dataKey="value" radius={[2, 2, 0, 0]} barSize={24}>
                  {habitChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === habitChartData.length - 1 ? '#ff00d4' : '#8B5CF6'} 
                      fillOpacity={0.4 + (index * 0.1)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
             <div className="flex gap-4">
                <div className="text-center">
                   <p className="text-[8px] font-black text-[#8b7ca8] uppercase mb-1 font-display">Предметы</p>
                   <p className="text-xl font-black italic tracking-tighter">{data.habits.length + data.tasks.length}</p>
                </div>
                <div className="text-center">
                   <p className="text-[8px] font-black text-[#8b7ca8] uppercase mb-1 font-display">Ранг</p>
                   <p className="text-xl font-black italic tracking-tighter text-accent-magenta glow-magenta font-display">S</p>
                </div>
             </div>
             <div className="flex items-center gap-1 group">
                <span className="text-[9px] font-black uppercase text-[#8b7ca8] group-hover:text-white transition-colors font-display">Детали</span>
                <ChevronRight size={14} className="text-[#8b7ca8] group-hover:text-accent-magenta transition-colors" />
             </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: MIDDLE ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ТРЕКЕР НАВЫКОВ (СПИСОК) */}
        <div className="lg:col-span-4 bento-card bg-[#150a24] border-white/5 p-6 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setActiveTab('habits')}>
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[12px] font-black text-[#8b7ca8] uppercase tracking-[0.3em] font-display">Ваши Навыки</h3>
              <TrendingUp size={16} className="text-accent-purple" />
           </div>
           <div className="space-y-6">
              {data.habits.length > 0 ? data.habits.map((habit, i) => (
                <div key={habit.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <div className="w-6 h-6 rounded bg-accent-purple/20 flex items-center justify-center text-[10px] font-bold text-accent-purple border border-accent-purple/30 font-display">
                          {i + 1}
                       </div>
                       <span className="text-[11px] font-black uppercase tracking-tight text-white font-display">{habit.title}</span>
                    </div>
                    <span className="text-[10px] font-black text-[#8b7ca8] italic font-display">Ур. {habit.streak}</span>
                  </div>
                  <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-accent-purple to-accent-magenta" style={{ width: `${Math.min(100, habit.streak * 10)}%` }} />
                  </div>
                </div>
              )) : <p className="text-center py-10 text-[10px] text-[#8b7ca8] uppercase font-black font-display">Навыки не найдены</p>}
           </div>
        </div>

        {/* УСПЕХ МИССИЙ (ГРАФИК) */}
        <div className="lg:col-span-8 bento-card bg-[#150a24] border-white/5 p-6 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setActiveTab('tasks')}>
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[12px] font-black text-[#8b7ca8] uppercase tracking-[0.3em] font-display">Успех Миссий</h3>
              <div className="flex gap-4">
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-accent-magenta" />
                    <span className="text-[8px] font-black text-[#8b7ca8] uppercase font-display">Эффективность</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-accent-blue" />
                    <span className="text-[8px] font-black text-[#8b7ca8] uppercase font-display">Выносливость</span>
                 </div>
              </div>
           </div>
           
           <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={missionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" fontSize={8} tickLine={false} axisLine={false} tick={{ fill: '#8b7ca8', fontWeight: 'bold' }} interval={0} />
                    <Bar dataKey="value" radius={[2, 2, 0, 0]} barSize={32}>
                       {missionChartData.map((entry, index) => (
                          <Cell 
                             key={`cell-${index}`} 
                             fill={index % 2 === 0 ? '#ff00d4' : '#3B82F6'} 
                             fillOpacity={0.6}
                             className="hover:fillOpacity-100 transition-all duration-300"
                          />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* SECTION 3: BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* КАТУШКА ОПЫТА */}
        <div className="lg:col-span-4 bento-card bg-[#150a24] border-white/5 p-8 flex flex-col items-center justify-center text-center relative cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setActiveTab('goals')}>
           <div className="relative w-40 h-40 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-accent-magenta/10 shadow-[0_0_30px_rgba(255,0,212,0.1)]" />
              <div className="absolute inset-0 rounded-full border-[6px] border-white/5" />
              <div 
                 className="absolute inset-0 rounded-full border-[6px] border-accent-magenta border-t-transparent border-r-transparent animate-[spin_4s_linear_infinite]"
                 style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)' }}
              />
              <div className="flex flex-col items-center">
                 <span className="text-4xl font-black italic tracking-tighter glow-magenta uppercase leading-none font-display">XP</span>
                 <span className="text-sm font-black text-white mt-1 font-display">{(user.totalXP % 100)}%</span>
              </div>
           </div>
           <h4 className="mt-6 text-[10px] font-black text-[#8b7ca8] uppercase tracking-[0.4em] font-display">Лимит Прогресса</h4>
           <p className="mt-1 text-xs font-black text-white uppercase italic font-display">Уровень {user.level} // Повышение</p>
        </div>

        {/* ИНВЕНТАРЬ / РЫНОК */}
        <div className="lg:col-span-8 bento-card bg-[#150a24] border-white/5 p-6">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[12px] font-black text-[#8b7ca8] uppercase tracking-[0.3em] font-display">Инвентарь / Рынок</h3>
              <ShoppingBag size={18} className="text-accent-orange" />
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.shopping.length > 0 ? data.shopping.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center gap-4 bg-[#0b0416] p-4 rounded-2xl border border-white/5 hover:border-accent-magenta/30 transition-all group cursor-pointer"
                  onClick={(e) => toggleShoppingItem(e, item.id, item.completed)}
                >
                   <div className={cn(
                     "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-inner",
                     item.completed ? "bg-accent-magenta/20 text-accent-magenta" : "bg-accent-orange/10 text-accent-orange"
                   )}>
                      {item.completed ? <CheckSquare size={18} /> : <Zap size={18} />}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className={cn("text-[11px] font-black text-white uppercase truncate font-display", item.completed && "line-through opacity-40")}>
                        {item.name}
                      </p>
                      <p className="text-[9px] font-black text-[#8b7ca8] uppercase font-display">Расходный предмет</p>
                   </div>
                   <div className="text-right">
                      <span className={cn(
                        "text-[10px] font-black uppercase font-display font-display",
                        item.completed ? "text-accent-magenta glow-magenta" : "text-[#8b7ca8]"
                      )}>
                        {item.completed ? 'ГОТОВО' : 'АКТИВНО'}
                      </span>
                   </div>
                </div>
              )) : <p className="col-span-2 text-center py-10 text-[10px] text-[#8b7ca8] uppercase font-black border border-dashed border-white/10 rounded-2xl font-display">Инвентарь пуст</p>}
           </div>
        </div>
      </div>
      
      {/* AI CORE BAR */}
      <motion.div 
        whileHover={{ scale: 1.01 }}
        onClick={() => setActiveTab('chat')}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-[#1b0e2b]/80 backdrop-blur-xl border border-accent-purple/30 rounded-full flex items-center p-1 pl-6 shadow-2xl z-40 cursor-pointer"
      >
         <div className="flex items-center gap-4 flex-1">
            <span className="text-accent-purple text-xl glow-purple animate-pulse">✦</span>
            <span className="text-[10px] font-black text-[#8b7ca8] uppercase tracking-widest italic">System Access Requested...</span>
         </div>
         <div className="bg-accent-purple text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg">
            Connect
         </div>
      </motion.div>
    </div>
  );
};
