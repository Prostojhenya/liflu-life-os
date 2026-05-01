import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatHeaderData {
  title: string;
  subtitle: string;
  avatar: string | null;
  onBack: (() => void) | null;
}

interface ChatHeaderContextType {
  chatHeader: ChatHeaderData | null;
  setChatHeader: (data: ChatHeaderData | null) => void;
}

const ChatHeaderContext = createContext<ChatHeaderContextType>({
  chatHeader: null,
  setChatHeader: () => {},
});

export const ChatHeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [chatHeader, setChatHeader] = useState<ChatHeaderData | null>(null);
  return (
    <ChatHeaderContext.Provider value={{ chatHeader, setChatHeader }}>
      {children}
    </ChatHeaderContext.Provider>
  );
};

export const useChatHeader = () => useContext(ChatHeaderContext);
