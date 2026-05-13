/**
 * Error Screen Component
 * Displays error state with retry option
 */

import React from 'react';

interface ErrorScreenProps {
  error: string;
}

export function ErrorScreen({ error }: ErrorScreenProps) {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black p-6 text-center">
      <div className="w-20 h-20 bg-red-600 rounded-[2.5rem] flex items-center justify-center text-white mb-8">
        ⚠️
      </div>
      
      <h1 className="text-2xl font-black tracking-tight mb-4 text-white">
        Ошибка
      </h1>
      
      <p className="text-gray-400 max-w-xs mb-8 leading-relaxed">
        {error}
      </p>
      
      <button
        onClick={() => window.location.reload()}
        className="bg-white/10 border border-white/20 p-4 rounded-2xl text-white font-bold hover:bg-white/20 transition-colors"
      >
        Перезагрузить
      </button>
    </div>
  );
}
