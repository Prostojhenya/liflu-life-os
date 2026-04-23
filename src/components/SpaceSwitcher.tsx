import React, { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useStore } from '@/store/useStore';
import { X, Plus, Users, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface Space {
  id: string;
  name: string;
  type: 'personal' | 'shared';
  ownerId: string;
  memberCount?: number;
}

interface SpaceSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpaceSwitcher: React.FC<SpaceSwitcherProps> = ({ isOpen, onClose }) => {
  const { user, setUser } = useStore();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');

  useEffect(() => {
    if (!user?.uid) return;

    // Get all spaces where user is owner
    const spacesQuery = query(
      collection(db, 'spaces'),
      where('ownerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(spacesQuery, (snapshot) => {
      const spaceData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Space));
      setSpaces(spaceData);
    }, (error) => {
      console.error('Error fetching spaces:', error);
      setSpaces([]);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const switchSpace = async (spaceId: string) => {
    if (!user) return;
    
    // Update user's current space
    setUser({
      ...user,
      currentSpaceId: spaceId
    });
    
    onClose();
  };

  const createSpace = async () => {
    if (!newSpaceName.trim() || !user?.uid || isCreating) return;

    setIsCreating(true);
    try {
      const spaceRef = await addDoc(collection(db, 'spaces'), {
        name: newSpaceName,
        type: 'personal',
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      setNewSpaceName('');
      switchSpace(spaceRef.id);
    } catch (error) {
      console.error('Error creating space:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-[#0b0416] border border-white/10 rounded-3xl p-6 z-50 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-white uppercase font-display">
                  Пространства
                </h2>
                <p className="text-[10px] text-[#8b7ca8] font-black uppercase tracking-wider font-display">
                  Выбери или создай новое
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#8b7ca8] hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Spaces List */}
            <div className="space-y-3 mb-4 max-h-[50vh] overflow-y-auto">
              {spaces.map((space) => {
                const isActive = space.id === user?.currentSpaceId;
                return (
                  <button
                    key={space.id}
                    onClick={() => switchSpace(space.id)}
                    className={cn(
                      "w-full p-4 rounded-2xl border-2 transition-all text-left",
                      isActive
                        ? "bg-accent-purple/20 border-accent-purple"
                        : "bg-[#150a24] border-white/10 hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        isActive ? "bg-accent-purple" : "bg-white/5"
                      )}>
                        {space.type === 'shared' ? (
                          <Users size={20} className={isActive ? "text-white" : "text-[#8b7ca8]"} />
                        ) : (
                          <Lock size={20} className={isActive ? "text-white" : "text-[#8b7ca8]"} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={cn(
                          "text-sm font-black uppercase font-display",
                          isActive ? "text-white" : "text-[#8b7ca8]"
                        )}>
                          {space.name}
                        </h3>
                        <p className="text-[10px] text-[#8b7ca8] font-display">
                          {space.type === 'shared' ? `${space.memberCount || 1} участников` : 'Личное'}
                        </p>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 rounded-full bg-accent-purple" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Create New Space */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="Название пространства..."
                  className="flex-1 bg-[#150a24] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#8b7ca8]/50 font-display focus:outline-none focus:border-accent-purple transition-all"
                  onKeyPress={(e) => e.key === 'Enter' && createSpace()}
                />
                <button
                  onClick={createSpace}
                  disabled={!newSpaceName.trim() || isCreating}
                  className="w-12 h-12 bg-accent-purple text-white rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isCreating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus size={20} />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
