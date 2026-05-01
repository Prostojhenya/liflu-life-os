import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { db } from '@/firebase';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, limit
} from 'firebase/firestore';
import { Send, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  isAi: boolean;
  userId: string;
  displayName: string;
  photoURL?: string;
  createdAt: any;
  spaceId: string;
}

export const Chat: React.FC = () => {
  const { user } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.currentSpaceId) return;

    const q = query(
      collection(db, `spaces/${user.currentSpaceId}/messages`),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [user?.currentSpaceId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user?.currentSpaceId || isSending) return;

    const text = input.trim();
    setInput('');
    setIsSending(true);

    try {
      await addDoc(collection(db, `spaces/${user.currentSpaceId}/messages`), {
        text,
        isAi: false,
        userId: user.uid,
        displayName: user.displayName || 'Пользователь',
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        spaceId: user.currentSpaceId,
      });
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  if (!user) return null;

  // Group consecutive messages from same user
  const groupedMessages = messages.reduce<Array<Message & { isGroupStart: boolean; isGroupEnd: boolean }>>((acc, msg, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const isGroupStart = !prev || prev.userId !== msg.userId;
    const isGroupEnd = !next || next.userId !== msg.userId;
    acc.push({ ...msg, isGroupStart, isGroupEnd });
    return acc;
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center">
          <Users size={20} className="text-accent-purple" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white uppercase font-display">Чат</h2>
          <p className="text-[10px] text-[#8b7ca8] font-black uppercase tracking-wider font-display">
            Общий чат пространства
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-lg font-black text-white mb-2 font-display">Нет сообщений</h3>
            <p className="text-sm text-[#8b7ca8] font-display">Начните общение с участниками пространства</p>
          </div>
        )}

        {groupedMessages.map((msg) => {
          const isOwn = msg.userId === user.uid;
          const avatar = msg.photoURL
            ? msg.photoURL
            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.userId}`;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'flex items-end gap-2',
                isOwn ? 'flex-row-reverse' : 'flex-row',
                msg.isGroupEnd ? 'mb-3' : 'mb-0.5'
              )}
            >
              {/* Avatar — only on group end */}
              <div className="w-8 flex-shrink-0">
                {!isOwn && msg.isGroupEnd && (
                  <img
                    src={avatar}
                    alt={msg.displayName}
                    className="w-8 h-8 rounded-full object-cover border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              <div className={cn('flex flex-col max-w-[75%]', isOwn ? 'items-end' : 'items-start')}>
                {/* Name — only on group start for others */}
                {!isOwn && msg.isGroupStart && (
                  <span className="text-[10px] font-black text-[#8b7ca8] uppercase tracking-wider font-display mb-1 px-1">
                    {msg.displayName}
                  </span>
                )}

                <div
                  className={cn(
                    'px-4 py-2.5 text-sm font-medium leading-relaxed break-words',
                    isOwn
                      ? 'bg-accent-purple text-white shadow-[0_0_15px_rgba(139,92,246,0.25)]'
                      : 'bg-[#150a24] border border-white/10 text-white',
                    // Border radius logic for grouping
                    isOwn
                      ? cn(
                          'rounded-2xl',
                          msg.isGroupStart && 'rounded-tr-sm',
                          msg.isGroupEnd && 'rounded-br-sm',
                          msg.isGroupStart && msg.isGroupEnd && 'rounded-2xl'
                        )
                      : cn(
                          'rounded-2xl',
                          msg.isGroupStart && 'rounded-tl-sm',
                          msg.isGroupEnd && 'rounded-bl-sm',
                          msg.isGroupStart && msg.isGroupEnd && 'rounded-2xl'
                        )
                  )}
                >
                  {msg.text}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="mt-4 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Написать сообщение..."
          className="flex-1 bg-[#150a24] border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-[#8b7ca8]/50 font-display focus:outline-none focus:border-accent-purple transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="w-12 h-12 bg-accent-purple text-white rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)] active:scale-95 transition-all disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
