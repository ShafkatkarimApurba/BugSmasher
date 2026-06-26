import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, X } from 'lucide-react';
import { LOGS_DATA } from '../data/lore';
import { soundManager } from '../game/SoundManager';

interface TerminalLogProps {
  unlockedLogs: string[];
}

export const TerminalLog = ({ unlockedLogs }: TerminalLogProps) => {
  const [activeLog, setActiveLog] = useState<typeof LOGS_DATA[0] | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [lastUnlocked, setLastUnlocked] = useState<string | null>(null);

  useEffect(() => {
    const latest = unlockedLogs[unlockedLogs.length - 1];
    if (latest && latest !== lastUnlocked) {
      setLastUnlocked(latest);
      const log = LOGS_DATA.find(l => l.id === latest);
      if (log) {
        setActiveLog(log);
        setShowNotification(true);
        soundManager.uiClick();
        
        // Auto-hide notification after 5 seconds
        const timer = setTimeout(() => {
          setShowNotification(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [unlockedLogs, lastUnlocked]);

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-24 right-6 z-[150] flex flex-col items-end space-y-2 font-pixel pointer-events-none">
      <AnimatePresence>
        {showNotification && !isExpanded && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            onClick={() => setIsExpanded(true)}
            className="pointer-events-auto bg-zinc-900 border-2 border-emerald-500 p-3 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer hover:bg-zinc-800 flex items-center space-x-3 group"
          >
            <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-emerald-500 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-emerald-500 uppercase tracking-widest">Data Recovered</span>
              <span className="text-[10px] text-white truncate w-32">{activeLog?.title}</span>
            </div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
          </motion.div>
        )}

        {isExpanded && activeLog && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="pointer-events-auto fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[200]"
          >
            <div className="w-full max-w-md bg-zinc-950 border-4 border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
               <div className="bg-zinc-800 p-4 border-b-2 border-zinc-700 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] text-emerald-400 uppercase tracking-tighter">Encrypted Log File</span>
                  </div>
                  <button 
                    onClick={() => {
                        setIsExpanded(false);
                        setShowNotification(false);
                    }}
                    className="p-1 hover:bg-zinc-700 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-zinc-500" />
                  </button>
               </div>
               
               <div className="p-8 space-y-6">
                  <div className="space-y-1">
                     <span className="text-[10px] text-zinc-500 uppercase">Title</span>
                     <h2 className="text-white text-sm">{activeLog.title}</h2>
                  </div>

                  <div className="h-[2px] bg-[linear-gradient(90deg,transparent,#10b981,transparent)]"></div>

                  <div className="space-y-2">
                     <span className="text-[10px] text-zinc-500 uppercase">Fragment</span>
                     <p className="text-emerald-50/80 text-[11px] leading-relaxed italic border-l-4 border-emerald-500/30 pl-4 py-2 bg-emerald-950/20">
                        "{activeLog.content}"
                     </p>
                  </div>

                  <div className="flex justify-between items-center pt-4 opacity-50">
                     <div className="flex space-x-2">
                        <div className="w-1 h-3 bg-emerald-500"></div>
                        <div className="w-1 h-3 bg-emerald-700"></div>
                     </div>
                     <span className="text-[6px] text-emerald-600">SOURCE: BIO_REACTOR_RELAY_4</span>
                  </div>
               </div>

               <div 
                 onClick={() => {
                    setIsExpanded(false);
                    setShowNotification(false);
                 }}
                 className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] py-4 text-center cursor-pointer transition-colors uppercase tracking-[0.2em]"
                >
                  Close Terminal
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
