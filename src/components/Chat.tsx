import React, { useState, useEffect, useRef } from 'react';
// import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { useStore, XP_VALUES } from '@/store/useStore';
import { db } from '@/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { Send, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  isAi: boolean;
  createdAt: any;
}

/* AI Tools - временно отключены
const addTaskTool: FunctionDeclaration = {
  name: "addTask",
  description: "Добавляет новую разовую задачу в список дел. Подберите категорию стата, который улучшит это действие.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Название задачи" },
      statType: { 
        type: Type.STRING, 
        enum: ["strength", "agility", "intelligence", "vitality", "sense"],
        description: "Категория стата (сила - тело, интеллект - ум, ловкость - скорость/точность, живучесть - здоровье, чутьё - интуиция/организация)" 
      }
    },
    required: ["title", "statType"]
  }
};

const addHabitTool: FunctionDeclaration = {
  name: "addHabit",
  description: "Добавляет новую ежедневную привычку пользователя. Подберите категорию стата.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Название привычки" },
      statType: { 
        type: Type.STRING, 
        enum: ["strength", "agility", "intelligence", "vitality", "sense"],
        description: "Категория стата"
      }
    },
    required: ["title", "statType"]
  }
};

const addShoppingItemTool: FunctionDeclaration = {
  name: "addShoppingItem",
  description: "Добавляет товар в список покупок.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Название товара" }
    },
    required: ["name"]
  }
};
*/

export const Chat: React.FC = () => {
  const { user } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  // AI временно отключен
  // const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  useEffect(() => {
    if (!user?.currentSpaceId) return;

    const q = query(
      collection(db, `spaces/${user.currentSpaceId}/messages`),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)).reverse();
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [user?.currentSpaceId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFunctionCall = async (call: any) => {
    /* AI функции временно отключены
    if (!user?.currentSpaceId) return { error: "No active space" };

    const { name, args } = call;
    try {
      if (name === "addTask") {
        await addDoc(collection(db, `spaces/${user.currentSpaceId}/tasks`), {
          title: args.title,
          statType: args.statType || 'intelligence',
          completed: false,
          xpAwarded: false,
          xpValue: XP_VALUES.TASK,
          spaceId: user.currentSpaceId,
          createdAt: serverTimestamp(),
        });
        return { success: true, message: `Задача "${args.title}" создана (Категория: ${args.statType}).` };
      }
      if (name === "addHabit") {
        await addDoc(collection(db, `spaces/${user.currentSpaceId}/habits`), {
          title: args.title,
          statType: args.statType || 'vitality',
          frequency: 'daily',
          streak: 0,
          xpValue: XP_VALUES.HABIT,
          spaceId: user.currentSpaceId,
          createdAt: serverTimestamp(),
        });
        return { success: true, message: `Привычка "${args.title}" создана (Категория: ${args.statType}).` };
      }
      if (name === "addShoppingItem") {
        await addDoc(collection(db, `spaces/${user.currentSpaceId}/shopping`), {
          name: args.name,
          completed: false,
          spaceId: user.currentSpaceId,
          createdAt: serverTimestamp(),
        });
        return { success: true, message: `Товар "${args.name}" добавлен в список покупок.` };
      }
    } catch (e) {
      console.error(`Error executing ${name}:`, e);
      return { error: `Ошибка при выполнении ${name}` };
    }
    return { error: "Unknown function" };
    */
    return { error: "AI temporarily disabled" };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user?.currentSpaceId) return;

    const userText = input;
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      await addDoc(collection(db, `spaces/${user.currentSpaceId}/messages`), {
        text: userText,
        isAi: false,
        userId: user.uid,
        createdAt: serverTimestamp(),
        spaceId: user.currentSpaceId
      });

      // AI временно отключен
      await addDoc(collection(db, `spaces/${user.currentSpaceId}/messages`), {
        text: "AI помощник временно отключен. Используйте разделы Задачи, Привычки и Покупки для управления.",
        isAi: true,
        createdAt: serverTimestamp(),
        spaceId: user.currentSpaceId
      });

      /* AI код закомментирован
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `Ты — интеллектуальный помощник по продуктивности и личному развитию. 
          Твоя задача — помогать пользователю по имени ${user.displayName} (Уровень ${user.level}) достигать целей и формировать полезные привычки.
          Твой тон: профессиональный, мотивирующий, лаконичный.
          При создании задач (addTask) или привычек (addHabit) анализируй текст и выбирай подходящую категорию (statType):
          - "strength" (Физ. подготовка): спорт, физическая активность.
          - "agility" (Энергия): быстрые дела, требующие ловкости или скорости.
          - "intelligence" (Интеллект): работа, учеба, развитие навыков.
          - "vitality" (Здоровье): сон, питание, ментальное здоровье.
          - "sense" (Организация): планирование, покупки, социальные дела.`,
          tools: [{ functionDeclarations: [addTaskTool, addHabitTool, addShoppingItemTool] }]
        },
        contents: [{ role: 'user', parts: [{ text: userText }] }]
      });

      let aiText = response.text || "";
      const functionCalls = response.functionCalls;

      if (functionCalls) {
        const results = [];
        for (const call of functionCalls) {
          const result = await handleFunctionCall(call);
          results.push({
            functionResponse: {
              name: call.name,
              response: { content: result }
            }
          });
        }

        const secondResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            { role: 'user', parts: [{ text: userText }] },
            response.candidates[0].content,
            { role: 'user', parts: results as any }
          ],
          config: {
             systemInstruction: `Вы получили результаты выполнения инструментов. Подтвердите пользователю, что действие выполнено успешно.`
          }
        });
        aiText = secondResponse.text || "Готово!";
      }

      if (aiText) {
        await addDoc(collection(db, `spaces/${user.currentSpaceId}/messages`), {
          text: aiText,
          isAi: true,
          createdAt: serverTimestamp(),
          spaceId: user.currentSpaceId
        });
      }
      */
    } catch (err: any) {
      console.error("Chat Error:", err);
      setError("Ошибка отправки сообщения.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <header className="mb-6 flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase glow-purple flex items-center gap-2 font-display">
              ЯДРО СИСТЕМЫ <Sparkles className="text-accent-magenta animate-pulse" size={24} />
            </h2>
            <p className="text-[#8b7ca8] text-[10px] font-black uppercase tracking-widest font-display">ИНТЕРФЕЙС ИИ ПОМОЩНИКА v3.0</p>
          </div>
          <div className="flex items-center gap-2 bg-[#150a24] px-3 py-1 rounded-full border border-white/5">
             <div className="w-1.5 h-1.5 bg-accent-magenta rounded-full animate-pulse shadow-[0_0_5px_#ff00d4]" />
             <span className="text-[8px] font-black text-accent-magenta uppercase font-display font-display">Онлайн</span>
          </div>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-accent-red/10 border border-accent-red/20 rounded-xl text-accent-red text-[10px] font-black uppercase tracking-wider font-sans">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar p-4 bg-[#150a24]/50 rounded-[2rem] border border-white/5">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: msg.isAi ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex flex-col max-w-[85%]",
              msg.isAi ? "self-start" : "self-end items-end ml-auto text-right"
            )}
          >
             <div className={cn("flex items-center gap-2 mb-1 px-1", !msg.isAi && "flex-row-reverse")}>
                {msg.isAi ? (
                   <>
                    <div className="w-1 h-1 bg-accent-purple rounded-full" />
                    <span className="text-[8px] font-black text-accent-purple uppercase tracking-widest font-display">Liflu AI</span>
                   </>
                ) : (
                   <>
                    <div className="w-1 h-1 bg-accent-magenta rounded-full" />
                    <span className="text-[8px] font-black text-accent-magenta uppercase tracking-widest font-display">Игрок</span>
                   </>
                )}
             </div>
            <div className={cn(
              "p-4 rounded-2xl text-[12px] font-bold leading-relaxed shadow-lg font-display",
              msg.isAi 
                ? "bg-[#1b0e2b] border border-accent-purple/30 text-white rounded-tl-none gaming-border" 
                : "bg-accent-magenta text-white rounded-tr-none shadow-[0_0_15px_rgba(255,0,212,0.2)]"
            )}>
              {msg.text}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex flex-col gap-1 self-start">
             <div className="flex items-center gap-2 mb-1 px-1">
                <div className="w-1.5 h-1.5 bg-accent-purple rounded-full animate-pulse" />
                <span className="text-[8px] font-black text-accent-purple uppercase tracking-widest font-sans">Processing...</span>
             </div>
            <div className="bg-[#1b0e2b] border border-accent-purple/30 p-4 rounded-2xl rounded-tl-none flex gap-1.5 min-w-[60px] justify-center gaming-border">
              <div className="w-1 h-1 bg-accent-magenta rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-accent-magenta rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1 h-1 bg-accent-magenta rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={sendMessage} className="mt-6 relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ВВЕДИТЕ КОМАНДУ..."
          className="w-full bg-[#0b0416] border border-white/10 rounded-2xl py-4 pl-5 pr-14 focus:outline-none focus:border-accent-magenta transition-all shadow-2xl text-[12px] font-black uppercase tracking-widest text-white placeholder:text-[#8b7ca8]/30 font-display italic"
        />
        <button 
          type="submit"
          disabled={isTyping}
          className="absolute right-2 top-2 bottom-2 w-10 bg-accent-magenta text-white rounded-xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 shadow-[0_0_15px_#ff00d4]"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
