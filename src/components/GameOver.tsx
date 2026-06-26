import { Skull, RotateCcw, Home, Trophy, Zap, Gift } from 'lucide-react';
import { soundManager } from '../game/SoundManager';
import { SaveManager } from '../game/SaveManager';
import { ProgressionManager } from '../game/ProgressionManager';
import { useEffect, useState } from 'react';
import { isTodaysChallengeCompleted, getStreakInfo } from '../game/DailyChallengeManager';
import { generateShareCardImage, downloadShareCard } from '../lib/shareCard';

export function GameOver({ score, wave, onRetry, onMainMenu }: { score: number, wave: number, onRetry: () => void, onMainMenu: () => void }) {
  const [isNewHigh, setIsNewHigh] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPrestigeAnimation, setIsPrestigeAnimation] = useState(false);
  const canPrestige = wave >= 15;
  const challengeCompleted = isTodaysChallengeCompleted();
  const streak = getStreakInfo();

  const handlePrestige = () => {
    setIsPrestigeAnimation(true);
    setTimeout(() => {
      const points = ProgressionManager.prestige(score);
      onRetry();
    }, 2000);
  };

  useEffect(() => {
    const trackHigh = async () => {
      setIsSyncing(true);
      const currentHigh = SaveManager.getHighScore();
      if (score > currentHigh) {
        await SaveManager.setHighScore(score, wave);
        setIsNewHigh(true);
      }
      setIsSyncing(false);
    };
    trackHigh();
  }, [score, wave]);

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center z-50 p-4">
      {isPrestigeAnimation && (
        <div className="absolute inset-0 z-[100] bg-cyan-950/80 backdrop-blur-2xl flex flex-col items-center justify-center animate-pulse">
          <Zap className="w-16 h-16 text-cyan-400 mb-6 animate-bounce" />
          <h2 className="text-4xl font-black cyber-text-glow text-cyan-400">NORMALIZING TIMELINE...</h2>
          <p className="font-mono text-cyan-300/40 text-xs mt-4 tracking-[0.5em]">PRESTIGE COLLISION DETECTED</p>
        </div>
      )}
      
      {isSyncing && (
        <div className="absolute top-8 right-8 flex items-center space-x-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest animate-pulse">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            <span>Syncing to Cloud...</span>
        </div>
      )}
      <div className="max-w-md w-full text-center space-y-12">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <Skull className="w-8 h-8 text-red-500 opacity-90" />
          </div>
          <div>
            <h2 className="text-4xl sm:text-5xl font-black text-white font-display tracking-tight mb-2 cyber-text-glow">DEFENSE DOWN</h2>
            <div className="h-[2px] w-12 bg-red-500 mx-auto my-4" />
            <p className="text-red-500/60 text-sm font-mono tracking-widest uppercase animate-pulse">Core Connection Severed</p>
          </div>
        </div>
        
        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          
          {isNewHigh && (
            <div className="absolute top-0 right-0 p-3 transform rotate-12 translate-x-4 -translate-y-2">
              <span className="bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded shadow-lg uppercase tracking-tighter flex items-center border border-black/10">
                <Trophy className="w-3 h-3 mr-1" /> WORLD FIRST
              </span>
            </div>
          )}
          
          <div className="relative z-10">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-4 border-b border-white/5 pb-2">Operational Summary</p>
            <div className="flex justify-between items-center mb-6">
              <div className="text-left">
                <div className="text-[10px] text-zinc-500 uppercase font-mono">Archive Score</div>
                <p className="text-4xl font-black text-white font-mono">{score.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Wave</div>
                <p className="text-4xl font-black text-white font-mono">{wave.toString().padStart(2, '0')}</p>
              </div>
            </div>

            {/* Challenge Completion Badge */}
            {challengeCompleted && (
              <div className="mt-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center space-x-3">
                <Gift className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-bold text-emerald-400">Daily Directive Complete</p>
                  <p className="text-[10px] text-emerald-500/60 font-mono">
                    Rewards granted. Streak: {streak.currentStreak}d
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col space-y-4">
          <button
            onClick={async () => {
              soundManager.init();
              soundManager.uiClick();
              try {
                const blob = await generateShareCardImage({ score, wave });
                downloadShareCard(blob);
              } catch (e) {
                console.warn('Share card failed', e);
              }
            }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            className="w-full py-3 rounded-xl border border-white/10 text-zinc-300 font-mono text-xs uppercase tracking-widest hover:bg-white/5 cursor-pointer"
          >
            Share Score Card
          </button>
          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); onRetry(); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            aria-label="Retry"
            className="group relative w-full py-4 bg-white text-black hover:bg-zinc-200 rounded-full font-bold text-sm uppercase tracking-widest flex items-center justify-center transition-all overflow-hidden"
          >
            <span className="relative z-10 flex items-center">
              <RotateCcw className="w-4 h-4 mr-3" />
              Retry
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          </button>
          
          {canPrestige && (
            <button 
              onClick={() => { soundManager.init(); soundManager.uiClick(); handlePrestige(); }}
              onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
              className="group relative w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black rounded-full font-black text-sm uppercase tracking-widest flex items-center justify-center transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                <Zap className="w-4 h-4 mr-3" />
                Initiate Prestige
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </button>
          )}
          
          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); onMainMenu(); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            aria-label="Main Menu"
            className="w-full py-4 bg-transparent border-[0.5px] border-white/20 hover:bg-white/5 text-zinc-300 rounded-full font-medium text-sm font-mono uppercase tracking-widest flex items-center justify-center transition-colors"
          >
            <Home className="w-4 h-4 mr-3 opacity-70" />
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
