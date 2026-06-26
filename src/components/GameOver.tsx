import { useState, useEffect, useCallback } from 'react';
import { Skull, RotateCcw, Home, Trophy, Target, Layers, Share2, Star, Globe, Medal } from 'lucide-react';
import { soundManager } from '../game/SoundManager';
import { leaderboard } from '../game/Leaderboard';
import { saveManager } from '../game/SaveManager';
import { dailyChallengeManager } from '../game/DailyChallenge';
import { cloudLeaderboard } from '../game/CloudLeaderboard';

interface GameOverProps {
  score: number;
  waves: number;
  kills: number;
  onRetry: () => void;
  onMainMenu: () => void;
}

export function GameOver({ score, waves, kills, onRetry, onMainMenu }: GameOverProps) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState<'local' | 'global'>('local');
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [globalRank, setGlobalRank] = useState(0);
  const [rank, setRank] = useState(0);
  const [dailyChallengeComplete, setDailyChallengeComplete] = useState(false);
  const [challengeBonus, setChallengeBonus] = useState(0);

  useEffect(() => {
    const isHigh = leaderboard.isHighScore(score);
    setIsNewHighScore(isHigh);
    setRank(leaderboard.getRank(score));
    setGlobalRank(cloudLeaderboard.submitScore(score, waves, 'Player', 'neon_core'));
    
    if (score > 0) {
      leaderboard.addEntry(score, waves, kills, 'Player');
    }

    const challenge = dailyChallengeManager.getTodayChallenge();
    const completed = dailyChallengeManager.checkCompletion(challenge, score, kills, waves, 0, 0);
    setDailyChallengeComplete(completed);
    
    if (completed && !saveManager.hasCompletedDailyChallenge()) {
      saveManager.completeDailyChallenge();
      setChallengeBonus(saveManager.getDailyChallengeBonus());
    }
  }, [score, waves, kills]);

  const handleShare = useCallback(async () => {
    const text = `🎮 I scored ${score.toLocaleString()} points and reached Wave ${waves} in BugSmasher by Shafkat!\n🐛 ${kills} bugs smashed\n#BugSmasher #HighScore`;

    // Try native share first
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch {
      // ignore and fallback to clipboard
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Last-resort fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }, [score, waves, kills]);

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
            <Skull className="w-7 h-7 text-red-500 opacity-90" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight mb-1">
              {isNewHighScore && rank === 1 ? 'NEW HIGH SCORE!' : 'SYSTEM BREACH'}
            </h2>
            <div className="h-px w-12 bg-red-500/50 mx-auto my-3" />
            <p className="text-zinc-500 text-xs font-mono tracking-widest uppercase">Defense Array Destroyed</p>
          </div>
        </div>
        
        {/* Score Display */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-2xl space-y-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Final Score</p>
          <p className={`text-4xl sm:text-5xl font-mono font-bold tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] ${isNewHighScore ? 'text-yellow-400' : 'text-white'}`}>
            {score.toString().padStart(6, '0')}
          </p>
          
          {/* Stats */}
          <div className="flex justify-center gap-6 pt-2">
            <div className="flex items-center gap-2 text-zinc-400">
              <Layers className="w-4 h-4" />
              <span className="text-sm font-mono">Wave {waves}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <Target className="w-4 h-4" />
              <span className="text-sm font-mono">{kills} kills</span>
            </div>
          </div>
        </div>

        {/* New High Score Badge */}
        {isNewHighScore && (
          <div className="flex items-center justify-center gap-2 text-yellow-400">
            <Trophy className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-widest">
              Rank #{rank} on Leaderboard!
            </span>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); onRetry(); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            aria-label="Play Again"
            className="group relative w-full py-4 bg-white text-black hover:bg-zinc-200 rounded-full font-bold text-sm uppercase tracking-widest flex items-center justify-center transition-all overflow-hidden"
          >
            <span className="relative z-10 flex items-center">
              <RotateCcw className="w-4 h-4 mr-3" />
              Reboot System
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={() => { soundManager.uiClick(); setShowLeaderboard(!showLeaderboard); }}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-300 rounded-full font-medium text-xs font-mono uppercase tracking-widest flex items-center justify-center transition-colors"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </button>
            
            <button 
              onClick={() => { soundManager.uiClick(); handleShare(); }}
              className="flex-1 py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-full font-medium text-xs font-mono uppercase tracking-widest flex items-center justify-center transition-colors"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </button>
            
            <button 
              onClick={() => { soundManager.uiClick(); onMainMenu(); }}
              className="flex-1 py-3 bg-transparent border border-white/10 hover:bg-white/5 text-zinc-400 rounded-full font-medium text-xs font-mono uppercase tracking-widest flex items-center justify-center transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Menu
            </button>
          </div>
        </div>

        {/* Leaderboard Panel */}
        {showLeaderboard && (
          <div className="bg-zinc-900/80 backdrop-blur-sm rounded-xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setLeaderboardTab('local')}
                  className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider transition-colors ${
                    leaderboardTab === 'local' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  Local
                </button>
                <button
                  onClick={() => setLeaderboardTab('global')}
                  className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1 ${
                    leaderboardTab === 'global' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  Global
                </button>
              </div>
              {leaderboardTab === 'global' && globalRank > 0 && (
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <Medal className="w-3 h-3 text-amber-400" />
                  #{globalRank}
                </div>
              )}
            </div>
            
            {leaderboardTab === 'local' ? (
              <div className="space-y-1">
                {leaderboard.getEntries().map((entry, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between p-2 rounded-lg ${entry.score === score ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-black/20'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 text-center font-mono text-sm ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-amber-600' : 'text-zinc-600'}`}>
                        #{idx + 1}
                      </span>
                      <span className="text-white text-sm font-mono">{entry.score.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span>W{entry.waves}</span>
                      <span>{leaderboard.getFormattedDate(entry.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {cloudLeaderboard.getWithLocalPlayer(score).slice(0, 10).map((entry) => (
                  <div 
                    key={entry.rank} 
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      entry.isLocal ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-black/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 text-center font-mono text-sm ${
                        entry.rank === 1 ? 'text-yellow-400' : entry.rank === 2 ? 'text-zinc-300' : entry.rank === 3 ? 'text-amber-600' : 'text-zinc-600'
                      }`}>
                        #{entry.rank}
                      </span>
                      <span className={`text-sm font-mono ${entry.isLocal ? 'text-cyan-300' : 'text-white'}`}>
                        {entry.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span>{entry.score.toLocaleString()}</span>
                      <span>W{entry.wave}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {leaderboardTab === 'global' && (
              <div className="mt-3 pt-3 border-t border-white/5 text-center">
                <p className="text-xs text-zinc-500">
                  {cloudLeaderboard.getPercentile(globalRank)} of all players
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}