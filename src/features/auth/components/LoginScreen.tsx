/**
 * Login Screen Component
 * Displays login UI with Google sign-in
 */

import React from 'react';
import { Sparkles, LogIn } from 'lucide-react';

interface LoginScreenProps {
  onSignIn: () => Promise<void>;
  inviteInfo?: { spaceName: string; spaceId: string } | null;
}

export function LoginScreen({ onSignIn, inviteInfo }: LoginScreenProps) {
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await onSignIn();
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black p-6 text-center">
      <div className="w-20 h-20 bg-accent-blue rounded-[2.5rem] flex items-center justify-center text-white mb-8 shadow-2xl shadow-accent-blue/20">
        <Sparkles size={40} />
      </div>
      
      <h1 className="text-4xl font-black tracking-tight mb-4 text-white">
        Life OS <span className="text-accent-blue">Liflu</span>
      </h1>
      
      <p className="text-text-dim max-w-xs mb-12 leading-relaxed">
        {inviteInfo 
          ? `Вы приглашены в пространство "${inviteInfo.spaceName}". Войдите, чтобы присоединиться.`
          : 'Твой личный спутник для управления задачами, привычками и целями.'
        }
      </p>
      
      <button
        onClick={handleSignIn}
        disabled={isSigningIn}
        className="w-full max-w-xs bg-surface border border-white/5 p-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-white shadow-sm active:scale-95 transition-all hover:bg-surface-bright disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSigningIn ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <LogIn size={20} />
        )}
        {isSigningIn ? 'Вход...' : 'Войти через Google'}
      </button>
      
      <p className="mt-8 text-[10px] text-text-dim uppercase tracking-widest font-bold">
        MVP v1.0 • Готов к PWA
      </p>
    </div>
  );
}
