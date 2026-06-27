import { useState, useEffect } from 'react';
import { Trophy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AchievementPayload {
  title: string;
  description: string;
}

export function AchievementToast() {
  const [achievement, setAchievement] = useState<AchievementPayload | null>(null);

  useEffect(() => {
    const handleAchievement = (e: Event) => {
      const customEvent = e as CustomEvent<AchievementPayload>;
      setAchievement(customEvent.detail);
      setTimeout(() => setAchievement(null), 5000);
    };

    window.addEventListener('achievement_unlocked', handleAchievement);
    return () => window.removeEventListener('achievement_unlocked', handleAchievement);
  }, []);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className="fixed top-20 right-4 z-[100] bg-zinc-900/90 backdrop-blur-xl border border-yellow-500/30 p-4 rounded-xl shadow-2xl flex items-center space-x-4 max-w-sm"
        >
          <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/20">
            <Trophy className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest mb-1">Achievement Unlocked</p>
            <h4 className="text-white font-bold leading-tight">{achievement.title}</h4>
            <p className="text-zinc-400 text-xs">{achievement.description}</p>
          </div>
          <button 
            onClick={() => setAchievement(null)}
            className="text-zinc-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
