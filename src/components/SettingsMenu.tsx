import { motion } from 'motion/react';
import { Volume2, VolumeX, Settings2, ArrowLeft, MousePointer2, Monitor, Gem, Accessibility } from 'lucide-react';
import { soundManager } from '../game/SoundManager';
import { useState } from 'react';
import {
  loadAccessibilitySettings,
  saveAccessibilitySettings,
  type AccessibilitySettings,
  type ColorblindMode,
  type DifficultyId,
} from '../game/AccessibilitySettings';

export function SettingsMenu({ onBack, onOpenArmory }: { onBack: () => void; onOpenArmory?: () => void }) {
  const [masterVol, setMasterVol] = useState(soundManager.masterVolume);
  const [sfxVol, setSfxVol] = useState(soundManager.sfxVolume);
  const [musicVol, setMusicVol] = useState(soundManager.musicVolume);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);
  const [a11y, setA11y] = useState<AccessibilitySettings>(loadAccessibilitySettings);

  const updateA11y = (patch: Partial<AccessibilitySettings>) => {
    const next = { ...a11y, ...patch };
    setA11y(next);
    saveAccessibilitySettings(next);
  };

  const handleMasterVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundManager.setMasterVolume(val);
    setMasterVol(val);
  };

  const handleSfxVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundManager.setSfxVolume(val);
    setSfxVol(val);
  };

  const handleMusicVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundManager.setMusicVolume(val);
    setMusicVol(val);
  };

  const toggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const [showPerformance, setShowPerformance] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nexus_show_perf_stats') === 'true';
    }
    return false;
  });

  const [highFidelityVFX, setHighFidelityVFX] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_high_fidelity_vfx');
      if (saved !== null) {
        return saved === 'true';
      }
      // Detect mobile device
      const isMobileDevice = (window.innerWidth < 768) || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 0) ||
        ('ontouchstart' in window);
      return !isMobileDevice; // default off on mobile, on on desktop
    }
    return true;
  });

  const [targetHz, setTargetHz] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_target_hz');
      if (saved) return parseInt(saved, 10);
    }
    return 90; // Default is now 90 Hz
  });

  const toggleVFX = () => {
    const newValue = !highFidelityVFX;
    setHighFidelityVFX(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_high_fidelity_vfx', newValue ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('nexus_vfx_settings_changed', { detail: newValue }));
    }
  };

  const togglePerformanceStats = () => {
    const newValue = !showPerformance;
    setShowPerformance(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_show_perf_stats', newValue ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('nexus_perf_stats_changed', { detail: newValue }));
    }
  };

  const handleHzChange = (hz: number) => {
    setTargetHz(hz);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_target_hz', hz.toString());
      window.dispatchEvent(new CustomEvent('nexus_target_hz_changed', { detail: hz }));
    }
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl flex flex-col items-center justify-start sm:justify-center z-[60] p-3 sm:p-4 overflow-y-auto overscroll-contain">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-zinc-900/95 border border-white/10 p-5 sm:p-8 rounded-[2rem] shadow-2xl relative my-4"
      >
        {/* Sticky back button */}
        <button 
          onClick={() => { soundManager.uiClick(); onBack(); }}
          className="sticky top-0 z-10 mb-4 flex items-center gap-2 p-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-zinc-400 hover:text-white w-fit"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-xs font-mono uppercase tracking-widest pr-2">Back</span>
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
            <Settings2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-[0.2em] font-display">System Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Audio Section */}
          <section className="space-y-8">
            <div className="flex items-center space-x-3 text-zinc-500 font-mono text-xs uppercase tracking-widest border-b border-white/5 pb-2">
              <Volume2 className="w-4 h-4" />
              <span>Audio Modules</span>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-white font-mono text-xs uppercase tracking-widest">Master Gain</label>
                  <button onClick={toggleMute} className="text-zinc-500 hover:text-white transition-colors">
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" 
                  value={isMuted ? 0 : masterVol} 
                  onChange={handleMasterVolume}
                  onMouseUp={() => { soundManager.init(); soundManager.uiClick(); }}
                  onTouchEnd={() => { soundManager.init(); soundManager.uiClick(); }}
                  className="w-full accent-white opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                />
              </div>

              <div className="space-y-3">
                <label className="text-white font-mono text-xs uppercase tracking-widest">SFX Intensity</label>
                <input 
                  type="range" min="0" max="1" step="0.01" 
                  value={sfxVol} 
                  onChange={handleSfxVolume}
                  onMouseUp={() => { soundManager.init(); soundManager.uiClick(); }}
                  onTouchEnd={() => { soundManager.init(); soundManager.uiClick(); }}
                  className="w-full accent-zinc-500 cursor-pointer"
                />
              </div>

              <div className="space-y-3">
                <label className="text-white font-mono text-xs uppercase tracking-widest">Ambient Stream</label>
                <input 
                  type="range" min="0" max="1" step="0.01" 
                  value={musicVol} 
                  onChange={handleMusicVolume}
                  onMouseUp={() => { soundManager.init(); soundManager.uiHover(); }}
                  onTouchEnd={() => { soundManager.init(); soundManager.uiHover(); }}
                  className="w-full accent-zinc-500 cursor-pointer"
                />
              </div>
            </div>
          </section>

          {/* Graphics & Controls */}
          <div className="space-y-12">
            <section className="space-y-6">
              <div className="flex items-center space-x-3 text-zinc-500 font-mono text-xs uppercase tracking-widest border-b border-white/5 pb-2">
                <Monitor className="w-4 h-4" />
                <span>Visuals</span>
              </div>
              <div 
                onClick={() => { soundManager.uiClick(); toggleVFX(); }}
                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group animate-fade-in"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="text-zinc-400 group-hover:text-white transition-colors font-mono text-xs uppercase">High Fidelity VFX</span>
                  <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Glows, heavy shadow blurs & complex particles</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${highFidelityVFX ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-700'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${highFidelityVFX ? 'left-6' : 'left-1'}`} />
                </div>
              </div>

              <div 
                onClick={() => { soundManager.uiClick(); togglePerformanceStats(); }}
                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="text-zinc-400 group-hover:text-white transition-colors font-mono text-xs uppercase">Show Performance Stats</span>
                  <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Monitor FPS & Engine diagnostics</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${showPerformance ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-700'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${showPerformance ? 'left-6' : 'left-1'}`} />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group">
                <div className="flex flex-col items-start text-left">
                  <span className="text-zinc-400 font-mono text-xs uppercase">Target Refresh Rate</span>
                  <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Configure game refresh target</span>
                </div>
                <select
                  value={targetHz}
                  onChange={(e) => { soundManager.uiClick(); handleHzChange(parseInt(e.target.value, 10)); }}
                  className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-white/30"
                >
                  <option value="60">60 Hz</option>
                  <option value="90">90 Hz</option>
                  <option value="120">120 Hz</option>
                </select>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center space-x-3 text-zinc-500 font-mono text-xs uppercase tracking-widest border-b border-white/5 pb-2">
                <MousePointer2 className="w-4 h-4" />
                <span>Input Method</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-500">Left Click / Tap</span>
                  <span className="text-white uppercase">Eliminate</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-500">Hover / Collect</span>
                  <span className="text-white uppercase">Powerups</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Accessibility */}
        <section className="mt-8 pt-8 border-t border-white/5 space-y-6">
          <div className="flex items-center space-x-3 text-zinc-500 font-mono text-xs uppercase tracking-widest border-b border-white/5 pb-2">
            <Accessibility className="w-4 h-4" />
            <span>Accessibility</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-2 font-mono text-xs text-zinc-400 uppercase">
              Difficulty
              <select
                value={a11y.difficulty}
                onChange={(e) => { soundManager.uiClick(); updateA11y({ difficulty: e.target.value as DifficultyId }); }}
                className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm normal-case"
              >
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 font-mono text-xs text-zinc-400 uppercase">
              Colorblind Assist
              <select
                value={a11y.colorblindMode}
                onChange={(e) => { soundManager.uiClick(); updateA11y({ colorblindMode: e.target.value as ColorblindMode, showEnemyShapes: e.target.value !== 'off' }); }}
                className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm normal-case"
              >
                <option value="off">Off</option>
                <option value="protanopia">Protanopia</option>
                <option value="deuteranopia">Deuteranopia</option>
                <option value="tritanopia">Tritanopia</option>
              </select>
            </label>
          </div>
          {[
            { key: 'reducedMotion' as const, label: 'Reduced Motion', hint: 'Disables screen shake' },
            { key: 'showEnemyShapes' as const, label: 'Enemy Shape Icons', hint: 'Shape markers on bugs' },
            { key: 'gamepadEnabled' as const, label: 'Gamepad Support', hint: 'Left stick aim, A / RT fire' },
          ].map((item) => (
            <div
              key={item.key}
              onClick={() => { soundManager.uiClick(); updateA11y({ [item.key]: !a11y[item.key] }); }}
              className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-zinc-400 font-mono text-xs uppercase">{item.label}</span>
                <p className="text-[9px] text-zinc-500 font-mono">{item.hint}</p>
              </div>
              <div className={`w-10 h-5 rounded-full relative ${a11y[item.key] ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${a11y[item.key] ? 'left-6' : 'left-1'}`} />
              </div>
            </div>
          ))}
        </section>

        {/* Cosmetics Shortcut */}
        <div className="mt-8 pt-8 border-t border-white/5">
          <button
            onClick={() => {
              soundManager.uiClick();
              onOpenArmory?.();
            }}
            className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group"
          >
            <div className="flex items-center space-x-3">
              <Gem className="w-5 h-5 text-purple-400" />
              <div className="text-left">
                <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">Armory</span>
                <p className="text-[10px] font-mono text-zinc-500">Cursor skins, core themes & cosmetics</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div className="mt-8 flex justify-center pb-2">
          <button 
            onClick={() => { soundManager.uiClick(); onBack(); }}
            className="px-10 py-4 bg-white text-black font-black text-xs uppercase tracking-[0.3em] rounded-full hover:bg-zinc-200 transition-all active:scale-95 w-full sm:w-auto"
          >
            Apply Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}
