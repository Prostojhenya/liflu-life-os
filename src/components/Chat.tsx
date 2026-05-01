import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { db } from '@/firebase';
import {
  collection, query, orderBy, onSnapshot, addDoc,
  serverTimestamp, limit, doc, setDoc, getDoc,
  getDocs, updateDoc, where, arrayUnion
} from 'firebase/firestore';
import { Send, ArrowLeft, Plus, Users, User, Search, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Contact {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string; // for group chats
  participants: string[];
  participantProfiles?: Record<string, Contact>;
  lastMessage?: string;
  lastMessageAt?: any;
  createdAt?: any;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  createdAt: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getAvatar = (uid: string, photoURL?: string) =>
  photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`;

// ─── Main Component ───────────────────────────────────────────────────────────

export const Chat: React.FC<{ keyboardOpen?: boolean }> = ({ keyboardOpen = false }) => {
  const { user } = useStore();
  const [view, setView] = useState<'list' | 'chat' | 'new-group'>('list');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [search, setSearch] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Load contacts from all spaces the user is a member of ──────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const loadContacts = async () => {
      try {
        // Get all spaces where user is owner
        const ownerSnap = await getDocs(
          query(collection(db, 'spaces'), where('ownerId', '==', user.uid))
        );
        const spaceIds = ownerSnap.docs.map(d => d.id);

        // Also get spaces where user is a member
        const allSpacesSnap = await getDocs(collection(db, 'spaces'));
        for (const spaceDoc of allSpacesSnap.docs) {
          if (spaceIds.includes(spaceDoc.id)) continue;
          try {
            const memberDoc = await getDoc(doc(db, `spaces/${spaceDoc.id}/members`, user.uid));
            if (memberDoc.exists()) spaceIds.push(spaceDoc.id);
          } catch { /* no access */ }
        }

        // Collect unique contacts from all spaces
        const contactMap = new Map<string, Contact>();
        for (const spaceId of spaceIds) {
          try {
            const membersSnap = await getDocs(collection(db, `spaces/${spaceId}/members`));
            for (const m of membersSnap.docs) {
              const data = m.data();
              if (data.userId && data.userId !== user.uid) {
                if (!contactMap.has(data.userId)) {
                  // Try to get fresh user profile
                  try {
                    const userSnap = await getDoc(doc(db, 'users', data.userId));
                    if (userSnap.exists()) {
                      const u = userSnap.data();
                      contactMap.set(data.userId, {
                        uid: data.userId,
                        displayName: u.displayName || data.displayName || 'Пользователь',
                        email: u.email || data.email || '',
                        photoURL: u.photoURL || data.photoURL || '',
                      });
                    } else {
                      contactMap.set(data.userId, {
                        uid: data.userId,
                        displayName: data.displayName || 'Пользователь',
                        email: data.email || '',
                        photoURL: data.photoURL || '',
                      });
                    }
                  } catch {
                    contactMap.set(data.userId, {
                      uid: data.userId,
                      displayName: data.displayName || 'Пользователь',
                      email: data.email || '',
                      photoURL: '',
                    });
                  }
                }
              }
            }
          } catch { /* no access */ }
        }
        setContacts(Array.from(contactMap.values()));
      } catch (e) {
        console.error('Error loading contacts:', e);
      }
    };

    loadContacts();
  }, [user?.uid]);

  // ── Load conversations ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const convs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Conversation));
      setConversations(convs);
    }, (err) => {
      console.error('Conversations error:', err);
    });

    return () => unsub();
  }, [user?.uid]);

  // ── Load messages for active conversation ───────────────────────────────────
  useEffect(() => {
    if (!activeConv) return;

    const q = query(
      collection(db, `conversations/${activeConv.id}/messages`),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    });

    return () => unsub();
  }, [activeConv?.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Open or create direct conversation ─────────────────────────────────────
  const openDirectChat = async (contact: Contact) => {
    if (!user) return;

    // Check if direct conversation already exists
    const existing = conversations.find(
      c => c.type === 'direct' &&
        c.participants.includes(contact.uid) &&
        c.participants.includes(user.uid) &&
        c.participants.length === 2
    );

    if (existing) {
      setActiveConv(existing);
      setView('chat');
      return;
    }

    // Create new direct conversation
    const convRef = await addDoc(collection(db, 'conversations'), {
      type: 'direct',
      participants: [user.uid, contact.uid],
      participantProfiles: {
        [user.uid]: { uid: user.uid, displayName: user.displayName, email: user.email, photoURL: user.photoURL },
        [contact.uid]: contact,
      },
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    const newConv: Conversation = {
      id: convRef.id,
      type: 'direct',
      participants: [user.uid, contact.uid],
      participantProfiles: {
        [user.uid]: { uid: user.uid, displayName: user.displayName, email: user.email, photoURL: user.photoURL },
        [contact.uid]: contact,
      },
    };
    setActiveConv(newConv);
    setView('chat');
  };

  // ── Create group conversation ───────────────────────────────────────────────
  const createGroupChat = async () => {
    if (!user || !groupName.trim() || selectedContacts.length === 0) return;

    const participants = [user.uid, ...selectedContacts];
    const profiles: Record<string, Contact> = {
      [user.uid]: { uid: user.uid, displayName: user.displayName, email: user.email, photoURL: user.photoURL },
    };
    for (const uid of selectedContacts) {
      const c = contacts.find(c => c.uid === uid);
      if (c) profiles[uid] = c;
    }

    const convRef = await addDoc(collection(db, 'conversations'), {
      type: 'group',
      name: groupName.trim(),
      participants,
      participantProfiles: profiles,
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      createdBy: user.uid,
    });

    const newConv: Conversation = {
      id: convRef.id,
      type: 'group',
      name: groupName.trim(),
      participants,
      participantProfiles: profiles,
    };
    setActiveConv(newConv);
    setGroupName('');
    setSelectedContacts([]);
    setView('chat');
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConv || !user || isSending) return;

    const text = input.trim();
    setInput('');
    setIsSending(true);

    try {
      await addDoc(collection(db, `conversations/${activeConv.id}/messages`), {
        text,
        senderId: user.uid,
        senderName: user.displayName,
        senderPhoto: user.photoURL || '',
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'conversations', activeConv.id), {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  if (!user) return null;

  // ── Helpers for display ─────────────────────────────────────────────────────
  const getConvName = (conv: Conversation) => {
    if (conv.type === 'group') return conv.name || 'Группа';
    const otherUid = conv.participants.find(p => p !== user.uid);
    return conv.participantProfiles?.[otherUid!]?.displayName || 'Пользователь';
  };

  const getConvAvatar = (conv: Conversation) => {
    if (conv.type === 'group') return null;
    const otherUid = conv.participants.find(p => p !== user.uid);
    const profile = conv.participantProfiles?.[otherUid!];
    return getAvatar(otherUid!, profile?.photoURL);
  };

  const filteredContacts = contacts.filter(c =>
    c.displayName.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  // ── Group messages ──────────────────────────────────────────────────────────
  const groupedMessages = messages.reduce<Array<Message & { isGroupStart: boolean; isGroupEnd: boolean }>>((acc, msg, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    acc.push({
      ...msg,
      isGroupStart: !prev || prev.senderId !== msg.senderId,
      isGroupEnd: !next || next.senderId !== msg.senderId,
    });
    return acc;
  }, []);

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════════

  // ── New Group View ──────────────────────────────────────────────────────────
  if (view === 'new-group') {
    return (
      <div className="fixed inset-0 flex flex-col bg-[#0b0416] z-10">
        <div className="bg-[#150a24] border-b border-white/10 px-4 py-3.5 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setView('list')} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#8b7ca8]">
            <ArrowLeft size={18} />
          </button>
          <p className="text-xs font-black text-white uppercase font-display">Новая группа</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 min-h-0">

        <input
          type="text"
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          placeholder="Название группы..."
          className="bg-[#150a24] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#8b7ca8]/50 font-display focus:outline-none focus:border-accent-purple transition-all"
        />

        <p className="text-[10px] text-[#8b7ca8] font-black uppercase tracking-wider font-display">
          Выбери участников
        </p>

        <div className="space-y-2">
          {contacts.map(contact => {
            const selected = selectedContacts.includes(contact.uid);
            return (
              <button
                key={contact.uid}
                onClick={() => setSelectedContacts(prev =>
                  selected ? prev.filter(id => id !== contact.uid) : [...prev, contact.uid]
                )}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                  selected ? 'bg-accent-purple/20 border-accent-purple/50' : 'bg-[#150a24] border-white/10'
                )}
              >
                <img src={getAvatar(contact.uid, contact.photoURL)} alt="" className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-white">{contact.displayName}</p>
                  <p className="text-xs text-[#8b7ca8]">{contact.email}</p>
                </div>
                {selected && <Check size={16} className="text-accent-purple" />}
              </button>
            );
          })}
          {contacts.length === 0 && (
            <p className="text-center text-[#8b7ca8] text-sm py-8">Нет контактов. Пригласи людей в пространства.</p>
          )}
        </div>
        </div>

        <div className="px-4 py-3 flex-shrink-0">
          <button
            onClick={createGroupChat}
            disabled={!groupName.trim() || selectedContacts.length === 0}
            className="w-full py-3.5 bg-accent-purple text-white rounded-xl font-black text-sm uppercase font-display disabled:opacity-40 active:scale-95 transition-all"
          >
            Создать группу ({selectedContacts.length})
          </button>
        </div>
      </div>
    );
  }

  // ── Chat View ───────────────────────────────────────────────────────────────
  if (view === 'chat' && activeConv) {
    // For direct chat show other person's name, for group show members list
    const otherUid = activeConv.type === 'direct'
      ? activeConv.participants.find(p => p !== user.uid)
      : null;
    const otherProfile = otherUid ? activeConv.participantProfiles?.[otherUid] : null;
    const convAvatar = otherUid ? getAvatar(otherUid, otherProfile?.photoURL) : null;
    const convTitle = otherProfile?.displayName || (
      activeConv.type === 'group'
        ? Object.values(activeConv.participantProfiles || {})
            .filter(p => p.uid !== user.uid)
            .map(p => p.displayName)
            .join(', ')
        : 'Чат'
    );

    return (
      <div className="fixed inset-x-0 top-0 flex flex-col bg-[#0b0416] z-10" style={{ bottom: keyboardOpen ? 0 : 'var(--nav-height, 64px)' }}>
        {/* Chat header — fixed at top */}
        <div className="bg-[#150a24] border-b border-white/10 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => { setView('list'); setActiveConv(null); setMessages([]); }}
            className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#8b7ca8] flex-shrink-0">
            <ArrowLeft size={18} />
          </button>
          {convAvatar
            ? <img src={convAvatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
            : <div className="w-9 h-9 rounded-full bg-accent-purple/20 flex items-center justify-center flex-shrink-0"><Users size={16} className="text-accent-purple" /></div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white uppercase font-display truncate">{convTitle}</p>
            <p className="text-[9px] text-[#8b7ca8] font-display">
              {activeConv.type === 'group' ? `${activeConv.participants.length} участников` : 'Личный чат'}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5 custom-scrollbar min-h-0">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm text-[#8b7ca8]">Начните общение</p>
            </div>
          )}
          {groupedMessages.map(msg => {
            const isOwn = msg.senderId === user.uid;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
                className={cn('flex items-end gap-2', isOwn ? 'flex-row-reverse' : 'flex-row', msg.isGroupEnd ? 'mb-2' : 'mb-0.5')}
              >
                <div className="w-7 flex-shrink-0">
                  {!isOwn && msg.isGroupEnd && (
                    <img src={getAvatar(msg.senderId, msg.senderPhoto)} alt="" className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" />
                  )}
                </div>
                <div className={cn('flex flex-col max-w-[75%]', isOwn ? 'items-end' : 'items-start')}>
                  {!isOwn && msg.isGroupStart && activeConv.type === 'group' && (
                    <span className="text-[10px] font-black text-[#8b7ca8] uppercase tracking-wider font-display mb-1 px-1">{msg.senderName}</span>
                  )}
                  <div className={cn(
                    'px-3.5 py-2 text-sm leading-relaxed break-words rounded-2xl',
                    isOwn
                      ? 'bg-accent-purple text-white rounded-tr-sm shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                      : 'bg-[#150a24] border border-white/10 text-white rounded-tl-sm',
                    msg.isGroupStart && msg.isGroupEnd && 'rounded-2xl'
                  )}>
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="px-4 py-3 flex gap-2 flex-shrink-0 bg-[#0b0416] border-t border-white/5">
          <textarea
            ref={inputRef as any}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e as any); } }}
            placeholder="Сообщение..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
            spellCheck={false}
            className="flex-1 bg-[#150a24] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-[#8b7ca8]/50 font-display focus:outline-none focus:border-accent-purple transition-all resize-none overflow-hidden leading-5"
            style={{ maxHeight: '96px' }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = 'auto';
              t.style.height = Math.min(t.scrollHeight, 96) + 'px';
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="w-11 h-11 bg-accent-purple text-white rounded-2xl flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.3)] active:scale-95 transition-all disabled:opacity-40 self-end flex-shrink-0"
          >
            <Send size={17} />
          </button>
        </form>
      </div>
    );
  }

  // ── List View (default) ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col bg-[#0b0416] z-10">
      {/* Top bar */}
      <div className="bg-[#150a24] border-b border-white/10 px-4 py-3.5 flex items-center justify-between flex-shrink-0">
        <p className="text-xs font-black text-white uppercase font-display">Чаты</p>
        <button
          onClick={() => setView('new-group')}
          className="w-8 h-8 rounded-xl bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center text-accent-purple active:scale-95 transition-all"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="relative px-4 py-2 flex-shrink-0">
        <Search size={15} className="absolute left-7 top-1/2 -translate-y-1/2 text-[#8b7ca8]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск контактов..."
          className="w-full bg-[#150a24] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#8b7ca8]/50 font-display focus:outline-none focus:border-accent-purple transition-all"
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 px-4 pb-4 min-h-0">
        {/* Active conversations */}
        {!search && conversations.length > 0 && (
          <>
            <p className="text-[10px] text-[#8b7ca8] font-black uppercase tracking-wider font-display px-1 mb-2">Диалоги</p>
            {conversations.map(conv => {
              const name = getConvName(conv);
              const avatar = getConvAvatar(conv);
              return (
                <button
                  key={conv.id}
                  onClick={() => { setActiveConv(conv); setView('chat'); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#150a24] border border-white/10 hover:border-accent-purple/30 transition-all active:scale-98"
                >
                  {avatar
                    ? <img src={avatar} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                    : <div className="w-11 h-11 rounded-full bg-accent-purple/20 flex items-center justify-center flex-shrink-0"><Users size={18} className="text-accent-purple" /></div>
                  }
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-white truncate">{name}</p>
                    <p className="text-xs text-[#8b7ca8] truncate">{conv.lastMessage || 'Нет сообщений'}</p>
                  </div>
                </button>
              );
            })}
          </>
        )}

        {/* Contacts */}
        {filteredContacts.length > 0 && (
          <>
            <p className="text-[10px] text-[#8b7ca8] font-black uppercase tracking-wider font-display px-1 mt-3 mb-2">Контакты</p>
            {filteredContacts.map(contact => (
              <button
                key={contact.uid}
                onClick={() => openDirectChat(contact)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#150a24] border border-white/10 hover:border-accent-purple/30 transition-all active:scale-98"
              >
                <img src={getAvatar(contact.uid, contact.photoURL)} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-bold text-white truncate">{contact.displayName}</p>
                  <p className="text-xs text-[#8b7ca8] truncate">{contact.email}</p>
                </div>
              </button>
            ))}
          </>
        )}

        {contacts.length === 0 && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-lg font-black text-white mb-2 font-display">Нет контактов</h3>
            <p className="text-sm text-[#8b7ca8]">Пригласи людей в пространства — они появятся здесь как контакты</p>
          </div>
        )}
      </div>
    </div>
  );
};
