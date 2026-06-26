import { useEffect, useState, useCallback } from 'react';
import {
  getTodaysChallenge,
  getStreakInfo,
  generateDailyChallenge,
  CHALLENGE_MODIFIERS,
  type DailyChallenge,
  type ChallengeModifierId,
} from '../game/DailyChallengeManager';
import { soundManager } from '../game/SoundManager';
import {
  Zap,
  Flame,
  Snowflake,
  Shield,
  Crosshair,
  Moon,
  Heart,
  Skull,
  Ban,
  Package,
  Gift,
  Trophy,
  X,
  Play,
  Clock,
  ChevronRight,
} from 'lucide-react';

interface DailyChallengeModalProps {
  onStart: () => void;
  onClose: () => void;
}

const MODIFIER_ICONS: Record<ChallengeModifierId, React.ReactNode> = {
  fast_bugs: <Zap className="w-4 h-4" />,
  tank_wave: <Shield className="w-4 h-4" />,
  glass_cannon: <Crosshair className="w-4 h-4" />,
  darkness: <Moon className="w-4 h-4" />,
  speed_demon: <Flame className="w-4 h-4" />,
  scrap_hunger: <Package className="w-4 h-4" />,
  healer_horde: <Heart className="w-4 h-4" />,
  boss_rush: <Skull className="w-4 h-4" />,
  no_shield: <Ban className="w-4 h-4" />,
  frostbite: <Snowflake className="w-4 h-4" />,
};

function getCountdown(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const diff = tomorrow.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function DailyChallengeModal({ onStart, onClose }: DailyChallengeModalProps) {
  const challenge = getTodaysChallenge();
  const streak = getStreakInfo();
  const [timeLeft, setTimeLeft] = useState(getCountdown());
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getCountdown());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = useCallback(() => {
    soundManager.init();
    soundManager.uiClick();
    setStarting(true);
    // Small delay for audio + visual feedback
    setTimeout(() => onStart(), 300);
  }, [onStart]);

  const handleClose = useCallback(() => {
    soundManager.init();
    soundManager.uiClick();
    onClose();
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white font-display tracking-tight">
                Daily Directive
              </h2>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Streak Display */}
          {streak.currentStreak > 0 && (
            <div className="flex items-center justify-between bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border border-yellow-500/10 rounded-xl px-4 py-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  {streak.currentStreak >= 3 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-bold text-yellow-400">
                    {streak.currentStreak}-day streak
                  </span>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    Best: {streak.highestStreak} days
                  </p>
                </div>
              </div>
              {streak.currentStreak >= 3 && (
                <span className="text-[10px] text-yellow-500/60 font-mono uppercase tracking-widest border border-yellow-500/20 rounded-lg px-2 py-1">
                  Streak Active
                </span>
              )}
            </div>
          )}

          {/* Win Condition */}
          <div>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-2 flex items-center">
              <Trophy className="w-3 h-3 mr-1.5" />
              Primary Objective
            </p>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <p className="text-sm font-bold text-white">{challenge.winCondition.label}</p>
            </div>
          </div>

          {/* Modifiers */}
          <div>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-2 flex items-center">
              <Flame className="w-3 h-3 mr-1.5" />
              System Modifiers
            </p>
            <div className="space-y-2">
              {challenge.modifiers.map((modId) => {
                const mod = CHALLENGE_MODIFIERS[modId];
                return (
                  <div
                    key={modId}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-start space-x-3 group hover:bg-white/[0.07] transition-colors"
                  >
                    <div className="mt-0.5 w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center text-red-400 shrink-0 border border-red-500/10">
                      {MODIFIER_ICONS[modId]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white">{mod.name}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{mod.description}</p>
                      <p className="text-[10px] text-zinc-600 font-mono mt-1 italic">
                        {mod.flavor}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rewards */}
          <div>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-2 flex items-center">
              <Gift className="w-3 h-3 mr-1.5" />
              Mission Rewards
            </p>
            <div className="grid grid-cols-2 gap-2">
              {challenge.rewards.map((reward, i) => (
                <div
                  key={`${reward.id}_${i}`}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 flex items-center space-x-2.5"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                      reward.type === 'cursor_skin'
                        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {reward.type === 'cursor_skin' ? (
                      <Crosshair className="w-3.5 h-3.5" />
                    ) : (
                      <Gift className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{reward.name}</p>
                    {reward.description && (
                      <p className="text-[9px] text-zinc-500 font-mono truncate">
                        {reward.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {challenge.streakReward && (
              <div className="mt-2 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border border-yellow-500/10 rounded-xl px-3 py-2 flex items-center space-x-2.5">
                <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />
                <p className="text-[10px] text-yellow-400 font-mono">
                  Streak bonus (3+ days): <span className="font-bold">{challenge.streakReward.name}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-zinc-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono tracking-wider">{timeLeft}</span>
          </div>

          <button
            onClick={handleStart}
            disabled={challenge.completed || starting}
            className={`group relative px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center space-x-2.5 transition-all overflow-hidden ${
              challenge.completed
                ? 'bg-white/10 text-zinc-500 cursor-not-allowed'
                : starting
                  ? 'bg-cyan-500/50 text-white cursor-wait'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black hover:scale-105 active:scale-95'
            }`}
          >
            <span className="relative z-10 flex items-center">
              {starting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  INITIALIZING
                </>
              ) : challenge.completed ? (
                <>
                  <Trophy className="w-3.5 h-3.5 mr-2" />
                  COMPLETED
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-2" />
                  DEPLOY
                </>
              )}
            </span>
            {!challenge.completed && !starting && (
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
