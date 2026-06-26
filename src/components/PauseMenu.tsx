import { motion } from 'motion/react';
import { Home, Play, Settings2, Save, Download, Trophy, BookOpen } from 'lucide-react';
import { soundManager } from '../game/SoundManager';
import { SaveManager } from '../game/SaveManager';
import { useState } from 'react';
import { AccountMenu } from './AccountMenu';
import { IntelHub } from './IntelHub';

export function PauseMenu({ 
  onResume, 
  onSave,
  onLoad,
  onSettings,
  onMainMenu 
}: { 
  onResume: () => void, 
  onSave: () => void,
  onLoad: () => void,
  onSettings: () => void,
  onMainMenu: () => void 
}) {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isIntelOpen, setIsIntelOpen] = useState(false);
  const hasSave = SaveManager.hasSave();

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-4">
      {isAccountOpen && <AccountMenu onClose={() => setIsAccountOpen(false)} />}
      {isIntelOpen && <IntelHub onBack={() => setIsIntelOpen(false)} />}
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-md w-full bg-black/40 backdrop-blur-3xl border-[0.5px] border-white/10 p-8 rounded-[2rem] shadow-2xl flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-6 bg-white/5">
          <Settings2 className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-3xl font-black text-white font-display mb-2 uppercase tracking-widest">
          System Paused
        </h2>
        <p className="text-zinc-500 font-mono tracking-widest text-sm uppercase mb-10 text-center">
          Operations Suspended
        </p>

        <div className="w-full flex flex-col space-y-4">
          <button 
            onClick={() => { soundManager.uiClick(); onResume(); }}
            onMouseEnter={() => soundManager.uiHover()}
            className="w-full py-4 bg-white text-black hover:bg-zinc-200 rounded-full font-bold text-sm uppercase tracking-widest transition-all shadow-lg"
          >
            <span className="flex items-center justify-center">
              <Play className="w-4 h-4 mr-3" />
              Resume
            </span>
          </button>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => { soundManager.uiClick(); onSave(); }}
              onMouseEnter={() => soundManager.uiHover()}
              className="py-3 bg-zinc-800/80 border border-white/10 hover:bg-zinc-700/80 text-zinc-300 rounded-2xl font-mono text-xs uppercase tracking-widest transition-colors flex items-center justify-center"
            >
              <Save className="w-4 h-4 mr-2 opacity-70" />
              Save Game
            </button>
            <button 
              onClick={() => { soundManager.uiClick(); onLoad(); }}
              onMouseEnter={() => soundManager.uiHover()}
              disabled={!hasSave}
              className="py-3 bg-zinc-800/80 border border-white/10 hover:bg-zinc-700/80 text-zinc-300 rounded-2xl font-mono text-xs uppercase tracking-widest transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2 opacity-70" />
              Load Game
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => { soundManager.uiClick(); setIsAccountOpen(true); }}
              onMouseEnter={() => soundManager.uiHover()}
              className="py-3 bg-zinc-800/50 border border-white/10 hover:bg-white/5 text-zinc-400 rounded-2xl font-mono text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center"
            >
              <Trophy className="w-3.5 h-3.5 mr-2 opacity-70" />
              Rankings
            </button>
            <button 
              onClick={() => { soundManager.uiClick(); setIsIntelOpen(true); }}
              onMouseEnter={() => soundManager.uiHover()}
              className="py-3 bg-zinc-800/50 border border-white/10 hover:bg-white/5 text-zinc-400 rounded-2xl font-mono text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center"
            >
              <BookOpen className="w-3.5 h-3.5 mr-2 opacity-70" />
              System Intel
            </button>
          </div>

          <button 
            onClick={() => { soundManager.uiClick(); onSettings(); }}
            onMouseEnter={() => soundManager.uiHover()}
            className="w-full py-3 bg-zinc-800/50 border border-white/10 hover:bg-white/5 text-zinc-400 rounded-2xl font-mono text-xs uppercase tracking-widest transition-colors flex items-center justify-center"
          >
            <Settings2 className="w-4 h-4 mr-2 opacity-70" />
            Settings
          </button>
          
          <button 
            onClick={() => { soundManager.uiClick(); onMainMenu(); }}
            onMouseEnter={() => soundManager.uiHover()}
            className="w-full py-3 bg-transparent hover:text-red-400 text-zinc-500 rounded-full font-medium text-xs font-mono uppercase tracking-widest transition-colors flex items-center justify-center"
          >
            <Home className="w-4 h-4 mr-3 opacity-50" />
            Main Menu
          </button>
        </div>
      </motion.div>
    </div>
  );
}
