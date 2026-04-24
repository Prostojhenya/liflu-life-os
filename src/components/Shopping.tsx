import React, { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useStore } from '@/store/useStore';
import { Plus, ShoppingBag, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface Item {
  id: string;
  name: string;
  completed: boolean;
}

export const Shopping: React.FC = () => {
  const { user } = useStore();
  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    if (!user?.currentSpaceId) return;
    const q = query(collection(db, `spaces/${user.currentSpaceId}/shopping`), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item)));
    });
  }, [user?.currentSpaceId]);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim() || !user?.currentSpaceId) return;
    await addDoc(collection(db, `spaces/${user.currentSpaceId}/shopping`), {
      name: newItem,
      completed: false,
      spaceId: user.currentSpaceId,
      createdAt: serverTimestamp(),
    });
    setNewItem('');
  };

  const toggleItem = async (item: Item) => {
    if (!user?.currentSpaceId) return;
    await updateDoc(doc(db, `spaces/${user.currentSpaceId}/shopping`, item.id), { completed: !item.completed });
  };

  const deleteItem = async (id: string) => {
    if (!user?.currentSpaceId) return;
    await deleteDoc(doc(db, `spaces/${user.currentSpaceId}/shopping`, id));
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-black italic tracking-tighter uppercase glow-purple font-display">Твой Инвентарь</h2>
        <p className="text-[#8b7ca8] text-[10px] font-black uppercase tracking-[0.2em] font-display">Управляй ресурсами и предметами в реальном времени</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            className={cn(
              "bento-card flex items-center justify-between shadow-xl gaming-border transition-all",
              item.completed ? "opacity-60 border-[#ff00d4]" : "border-white/5"
            )}
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={() => toggleItem(item)}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2",
                  item.completed 
                    ? "bg-accent-magenta border-accent-magenta text-white shadow-[0_0_10px_#ff00d4]" 
                    : "bg-[#0b0416] border-white/10 text-accent-orange hover:border-accent-orange/50"
                )}
              >
                {item.completed ? <Check size={20} strokeWidth={3} /> : <ShoppingBag size={20} />}
              </button>
              <div>
                <h4 className={cn("font-black text-white uppercase italic tracking-tight font-display", item.completed && "line-through opacity-40")}>
                  {item.name}
                </h4>
                <p className="text-[9px] font-black text-[#8b7ca8] uppercase tracking-widest font-display">
                  {item.completed ? 'ПРИОБРЕТЕНО' : 'В СПИСКЕ'}
                </p>
              </div>
            </div>
            <button onClick={() => deleteItem(item.id)} className="text-[#8b7ca8] hover:text-accent-red transition-colors p-2">
              <Trash2 size={18} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
