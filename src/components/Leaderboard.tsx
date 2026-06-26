import { X, Trophy, Medal, Hash, Skull } from 'lucide-react';
import { useState, useEffect } from 'react';
import { FirebaseService, LeaderboardEntry } from '../lib/firebaseService';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from '../game/SoundManager';

interface LeaderboardProps {
  onClose: () => void;
}

export function Leaderboard({ onClose }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const top = await FirebaseService.getTopScores(20);
      setEntries(top);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl h-[80vh] flex flex-col rounded-2xl overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-white/10 rounded-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter text-white uppercase font-display">Global Leaderboard</h2>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Nexus Archive / Sector Rankings</p>
            </div>
          </div>
          <button 
            onClick={() => { soundManager.uiClick(); onClose(); }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-zinc-500" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full animate-spin mx-auto" />
                <p className="text-xs font-mono text-zinc-500 animate-pulse">SYNCHRONIZING WITH NEXUS...</p>
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
              <Hash className="w-12 h-12" />
              <p className="font-mono text-xs uppercase tracking-widest">No data entries found.</p>
            </div>
          ) : (
            <AnimatePresence>
              {entries.map((entry, idx) => (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    idx === 0 ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-6">
                    <div className="w-8 flex justify-center">
                      {idx < 3 ? (
                        <Medal className={`w-6 h-6 ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-zinc-300' : 'text-amber-600'}`} />
                      ) : (
                        <span className="text-xs font-mono text-zinc-600 font-bold">#{(idx + 1).toString().padStart(2, '0')}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-tight">{entry.username}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase font-black tracking-widest flex items-center gap-1">
                          <Skull className="w-3 h-3" /> Wave {entry.wave}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-black text-white font-mono tracking-tighter">
                      {entry.score.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                      {entry.updatedAt?.toMillis ? new Date(entry.updatedAt.toMillis()).toLocaleDateString() : 'JUST NOW'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
            Encryption: AES-256 / Protocol: Firebase-Leaderboard-v3
          </p>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-mono text-green-500/70 uppercase">Relay: Online</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
