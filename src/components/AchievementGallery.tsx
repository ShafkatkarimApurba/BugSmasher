import { Trophy, X } from 'lucide-react';
import { ACHIEVEMENTS_DATA, AchievementManager } from '../game/AchievementManager';
import { soundManager } from '../game/SoundManager';

export function AchievementGallery({ onClose }: { onClose: () => void }) {
  const unlocked = AchievementManager.getUnlockedCount();
  const total = ACHIEVEMENTS_DATA.length;

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl z-[70] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain">
      <div className="max-w-3xl w-full bg-zinc-900/80 border border-white/10 rounded-3xl p-5 sm:p-8 relative my-4">
        <button
          onClick={() => { soundManager.uiClick(); onClose(); }}
          className="absolute top-6 right-6 p-2 rounded-full border border-white/10 hover:bg-white/10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <div>
            <h2 className="text-2xl font-black uppercase tracking-widest">Achievement Gallery</h2>
            <p className="text-xs font-mono text-zinc-500">
              {unlocked} / {total} unlocked
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ACHIEVEMENTS_DATA.map((a) => {
            const isUnlocked = AchievementManager.isUnlocked(a.id);
            return (
              <div
                key={a.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isUnlocked
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-white/5 border-white/5 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-bold text-white">{a.title}</span>
                  <span className="text-[10px] font-mono uppercase text-zinc-500">{a.icon}</span>
                </div>
                <p className="text-xs text-zinc-400 font-mono">{a.description}</p>
                {isUnlocked && (
                  <span className="inline-block mt-2 text-[9px] font-mono text-emerald-400 uppercase">
                    Unlocked
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}