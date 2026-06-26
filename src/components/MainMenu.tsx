import { Bug, Settings2, Trophy, User, BookOpen, ListOrdered, Zap, Calendar, Gem } from 'lucide-react';
import { soundManager } from '../game/SoundManager';
import { SaveManager } from '../game/SaveManager';
import { ProgressionManager } from '../game/ProgressionManager';
import { useState } from 'react';
import { AccountMenu } from './AccountMenu';
import { IntelHub } from './IntelHub';
import { Leaderboard } from './Leaderboard';
import { Armory } from './Armory';
import { DailyChallengeModal } from './DailyChallengeModal';
import { isTodaysChallengeCompleted, getStreakInfo } from '../game/DailyChallengeManager';
import { isSupporter } from '../game/CosmeticsManager';
import { type ChallengeModifierId } from '../game/DailyChallengeManager';
import type { GameModeId } from '../game/GameMode';
import { AchievementGallery } from './AchievementGallery';

export function MainMenu({
  onStart,
  onSettings,
  onIntel,
  friendChallenge,
}: {
  onStart: (challengeMods?: ChallengeModifierId[], mode?: GameModeId) => void;
  onSettings: () => void;
  onIntel?: () => void;
  friendChallenge?: { score: number; wave: number } | null;
}) {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isDailyChallengeOpen, setIsDailyChallengeOpen] = useState(false);
  const [isArmoryOpen, setIsArmoryOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const supporter = isSupporter();
  const highScore = SaveManager.getHighScore();
  const challengeCompleted = isTodaysChallengeCompleted();
  const streak = getStreakInfo();

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#050505] relative p-4">
      {isArmoryOpen && <Armory onClose={() => setIsArmoryOpen(false)} />}
      {isAchievementsOpen && <AchievementGallery onClose={() => setIsAchievementsOpen(false)} />}
      {isAccountOpen && <AccountMenu onClose={() => setIsAccountOpen(false)} />}
      {isLeaderboardOpen && <Leaderboard onClose={() => setIsLeaderboardOpen(false)} />}
      {isDailyChallengeOpen && (
        <DailyChallengeModal 
          onStart={() => {
            setIsDailyChallengeOpen(false);
            // Import daily challenge manager to get modifiers and pass them to game start
            import('../game/DailyChallengeManager').then(({ generateDailyChallenge }) => {
              const challenge = generateDailyChallenge();
              onStart(challenge.modifiers);
            });
          }}
          onClose={() => setIsDailyChallengeOpen(false)}
        />
      )}

      <div className="z-10 flex flex-col items-center space-y-12 sm:space-y-16 w-full max-w-lg">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center mb-6">
            <Bug className="w-12 h-12 sm:w-16 sm:h-16 text-white opacity-80" />
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white font-display uppercase">
            BUGSMASHER
          </h1>
          <div className="h-px w-24 bg-white/20 mx-auto mt-4 mb-6" />

          {highScore > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4 mx-auto w-fit">
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center space-x-3">
                <Trophy className="w-4 h-4 text-yellow-500 opacity-80" />
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest font-black">Archive Best</span>
                  <span className="text-sm font-mono text-white tracking-widest">{highScore.toString().padStart(6, '0')}</span>
                </div>
              </div>
              
              {ProgressionManager.getData().prestigeLevel > 0 && (
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2 flex items-center space-x-3">
                  <Zap className="w-4 h-4 text-cyan-400 opacity-80" />
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[10px] text-cyan-500/60 uppercase font-mono tracking-widest font-black">Prestige Rank</span>
                    <span className="text-sm font-mono text-cyan-400 tracking-widest">RANK {ProgressionManager.getData().prestigeLevel}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-sm sm:text-base md:text-lg text-zinc-500 font-medium tracking-[0.2em] font-mono">
            DEFEND THE CORE. SMASH THE SWARM.
          </p>
          {friendChallenge && (
            <p className="text-xs font-mono text-cyan-400 border border-cyan-500/30 rounded-lg px-4 py-2">
              Friend challenge: beat {friendChallenge.score} pts / wave {friendChallenge.wave}
            </p>
          )}
        </div>
        
        <div className="w-full flex flex-col items-center space-y-6 mt-12">
          <div className="flex flex-wrap gap-2 justify-center w-full">
            {(['endless', 'boss_rush'] as GameModeId[]).map((mode) => (
              <button
                key={mode}
                onClick={() => { soundManager.uiClick(); onStart(undefined, mode); }}
                className="px-4 py-2 rounded-full border border-white/10 text-[10px] font-mono uppercase text-zinc-400 hover:text-white hover:bg-white/10"
              >
                {mode.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); onStart(); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            aria-label="Start Game"
            className="group relative px-12 py-4 bg-white text-black hover:bg-zinc-200 rounded-full font-bold text-sm sm:text-base uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center space-x-3 overflow-hidden w-full sm:w-auto"
          >
            <span className="relative z-10 font-bold">Initialize Sequence</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          </button>

          {/* Armory Button */}
          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); setIsArmoryOpen(true); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            className={`group relative w-full sm:w-auto px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all overflow-hidden flex items-center justify-center space-x-2.5 ${
              supporter 
                ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20' 
                : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Gem className="w-4 h-4" />
            <span>Armory</span>
            {supporter && (
              <span className="text-[8px] bg-purple-500/20 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">Unlocked</span>
            )}
          </button>

          {/* Daily Challenge Button */}
          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); setIsDailyChallengeOpen(true); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            className={`group relative w-full sm:w-auto px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all overflow-hidden flex items-center justify-center space-x-2.5 ${
              challengeCompleted 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Daily Directive</span>
            {challengeCompleted ? (
              <span className="text-[8px] bg-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">Done</span>
            ) : streak.currentStreak >= 3 ? (
              <span className="text-[8px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">{streak.currentStreak}d</span>
            ) : null}
          </button>

          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); onSettings(); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            className="flex items-center space-x-3 text-zinc-500 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest"
          >
            <Settings2 className="w-4 h-4" />
            <span>Hardware Tuning</span>
          </button>

          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); setIsLeaderboardOpen(true); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            className="flex items-center space-x-3 text-zinc-500 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest"
          >
            <ListOrdered className="w-4 h-4" />
            <span>Nexus Rankings</span>
          </button>

          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); setIsAccountOpen(true); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            className="flex items-center space-x-3 text-zinc-500 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest"
          >
            <User className="w-4 h-4" />
            <span>Terminal Access</span>
          </button>

          <button
            onClick={() => { soundManager.uiClick(); setIsAchievementsOpen(true); }}
            className="flex items-center space-x-3 text-zinc-500 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest"
          >
            <Trophy className="w-4 h-4" />
            <span>Achievements</span>
          </button>

          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); onIntel?.(); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            className="flex items-center space-x-3 text-zinc-500 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest"
          >
            <BookOpen className="w-4 h-4" />
            <span>System Intel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
