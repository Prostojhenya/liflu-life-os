import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LoadingScreenProps {
  isLoading: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(180deg, #050510 0%, #0a0a1a 50%, #050510 100%)',
          }}
        >
          {/* Content Container */}
          <div className="relative z-10 flex flex-col items-center justify-between h-full py-20 px-6">
            
            {/* Top Section - Logo */}
            <div className="flex-1 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative"
              >
                {/* Rotating Circle */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <svg width="280" height="280" viewBox="0 0 280 280" fill="none">
                    {/* Outer circle with gradient stroke */}
                    <circle
                      cx="140"
                      cy="140"
                      r="135"
                      stroke="url(#circleGradient)"
                      strokeWidth="2"
                      strokeDasharray="20 10"
                      opacity="0.3"
                    />
                    <defs>
                      <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7c5af0" />
                        <stop offset="50%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#7c5af0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </motion.div>

                {/* Particles */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      background: i === 0 ? '#7c5af0' : i === 1 ? '#06b6d4' : '#a78bfa',
                      top: '50%',
                      left: '50%',
                    }}
                    animate={{
                      x: [0, Math.cos((i * 120 * Math.PI) / 180) * 140, 0],
                      y: [0, Math.sin((i * 120 * Math.PI) / 180) * 140, 0],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.4,
                      ease: "easeInOut",
                    }}
                  />
                ))}

                {/* Logo Image */}
                <motion.div
                  className="relative z-10"
                  animate={{
                    filter: [
                      'drop-shadow(0 0 30px rgba(124,90,240,0.4))',
                      'drop-shadow(0 0 50px rgba(6,182,212,0.4))',
                      'drop-shadow(0 0 30px rgba(124,90,240,0.4))',
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <img
                    src="/img/Loading.png"
                    alt="Liflu Logo"
                    className="w-64 h-64 object-contain"
                  />
                </motion.div>
              </motion.div>
            </div>

            {/* Middle Section - Brand Name */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-center mb-8"
            >
              <h1 className="text-5xl font-black tracking-tight mb-3 font-display">
                <span className="text-white">Lif</span>
                <span 
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #a78bfa 0%, #06b6d4 100%)',
                  }}
                >
                  LU
                </span>
              </h1>
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="h-px w-12 bg-gradient-to-r from-transparent via-accent-purple to-transparent" />
                <p 
                  className="text-xs font-bold uppercase tracking-[0.3em]"
                  style={{ color: '#6b7280' }}
                >
                  CONTROL YOUR LIFE
                </p>
                <div className="h-px w-12 bg-gradient-to-r from-transparent via-accent-cyan to-transparent" />
              </div>
            </motion.div>

            {/* Bottom Section - Progress */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="w-full max-w-xs"
            >
              {/* Loading text */}
              <p 
                className="text-xs uppercase tracking-[0.2em] text-center mb-4 font-medium"
                style={{ color: '#6b7280' }}
              >
                LOADING...
              </p>

              {/* Progress Bar */}
              <div className="relative w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background: 'linear-gradient(90deg, #7c5af0 0%, #06b6d4 100%)',
                    boxShadow: '0 0 20px rgba(124,90,240,0.6), 0 0 40px rgba(6,182,212,0.4)',
                  }}
                />
              </div>

              {/* Progress Percentage */}
              <div className="text-right">
                <span 
                  className="text-sm font-bold"
                  style={{ color: '#6b7280' }}
                >
                  {Math.round(progress)}%
                </span>
              </div>

              {/* Tagline */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-12 text-center"
              >
                <p 
                  className="text-xs font-bold uppercase tracking-[0.25em]"
                  style={{
                    background: 'linear-gradient(90deg, #7c5af0 0%, #06b6d4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  FOCUS · PLAN · ACHIEVE
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
