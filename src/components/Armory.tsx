import { useState, useEffect, useRef } from 'react';
import { X, Gem, Palette, Star, Crown, KeyRound, Sparkles, Bug, Shield, Wrench, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from '../game/SoundManager';
import {
  CORE_THEMES,
  PURCHASABLE_SKINS,
  SUPPORTER_KEY,
  PREMIUM_KEY,
  ULTIMATE_KEY,
  getActiveCoreTheme,
  setActiveCoreTheme,
  getUnlockedCoreThemes,
  isCoreThemeUnlocked,
  isSupporter,
  getSupporterTier,
  unlockSupporterPack,
  isSkinUnlocked,
  setActiveSkin,
  getUnlockedSkins,
  getActiveSkin,
  devUnlockAll,
  isDevUnlocked,
  type CoreTheme,
  type CoreThemeId,
  type SupporterTier,
} from '../game/CosmeticsManager';

interface ArmoryProps {
  onClose: () => void;
}

export function Armory({ onClose }: ArmoryProps) {
  const [activeTab, setActiveTab] = useState<'vault' | 'supporter'>('vault');
  const originalSkinRef = useRef<string | null>(getActiveSkin());
  const [activeSkinId, setActiveSkinId] = useState<string | null>(getActiveSkin());
  const [testDriveSkinId, setTestDriveSkinId] = useState<string | null>(null);
  const [activeThemeId, setActiveThemeId] = useState<CoreThemeId | null>(getActiveCoreTheme());
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(getUnlockedSkins());
  const [unlockedThemes, setUnlockedThemes] = useState<CoreThemeId[]>(getUnlockedCoreThemes());
  const [keyInput, setKeyInput] = useState('');
  const [keyResult, setKeyResult] = useState<{ success: boolean; tier?: string } | null>(null);
  const [showDevTools, setShowDevTools] = useState(false);
  const [hoveredSkinId, setHoveredSkinId] = useState<string | null>(null);
  const [hoveredThemeId, setHoveredThemeId] = useState<string | null>(null);

  const supporterStatus = isSupporter();
  const supporterTier = getSupporterTier();
  const devUnlocked = isDevUnlocked();

  // Dev toggle: Ctrl+Shift+D to show dev tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDevTools(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Restore original skin when Armory closes
  useEffect(() => {
    return () => {
      // Only restore if the skin was changed during this session
      const current = getActiveSkin();
      if (current !== originalSkinRef.current) {
        setActiveSkin(originalSkinRef.current);
      }
    };
  }, []);

  const handleSelectSkin = (skinId: string) => {
    setTestDriveSkinId(null); // Stop test drive if active
    setActiveSkinId(skinId);
    setActiveSkin(skinId);
    soundManager.armoryEquip();
  };

  const handleTestDrive = (skinId: string) => {
    setTestDriveSkinId(skinId);
    setActiveSkin(skinId);
    soundManager.armoryEquip();
  };

  const handleStopTestDrive = () => {
    setTestDriveSkinId(null);
    // Revert to the currently selected (permanent) skin
    setActiveSkin(activeSkinId);
    soundManager.uiClick();
  };

  const handleSelectTheme = (themeId: CoreThemeId | null) => {
    setActiveThemeId(themeId);
    setActiveCoreTheme(themeId);
    soundManager.armoryEquip();
  };

  const handleRedeemKey = () => {
    const result = unlockSupporterPack(keyInput.trim());
    if (result) {
      setKeyResult({ success: true, tier: result });
      setKeyInput('');
      setUnlockedSkins(getUnlockedSkins());
      setUnlockedThemes(getUnlockedCoreThemes());
      soundManager.armoryUnlockTier();
    } else {
      setKeyResult({ success: false });
      soundManager.uiError();
    }
  };

  const handleDevUnlock = () => {
    devUnlockAll();
    setUnlockedSkins(getUnlockedSkins());
    setUnlockedThemes(getUnlockedCoreThemes());
    setActiveSkinId(getActiveSkin());
    setActiveThemeId(getActiveCoreTheme());
    soundManager.powerup('overdrive');
  };

  const allSkins = [
    // Challenge reward skins (always shown, may be locked)
    { id: 'skin_cyber_red', name: 'Crimson Protocol', desc: 'Aggressive red cursor ring with heat-pulse animation.', tier: null as SupporterTier },
    { id: 'skin_gold_empire', name: 'Golden Empire', desc: 'Luxurious gold cursor with particle trail.', tier: null as SupporterTier },
    { id: 'skin_void_black', name: 'Void Walker', desc: 'Dark cursor with white core and distortion effect.', tier: null as SupporterTier },
    { id: 'skin_neon_pulse', name: 'Neon Pulse', desc: 'Cyan/pink dual-tone cursor with pulse ring.', tier: null as SupporterTier },
    { id: 'skin_quantum_shift', name: 'Quantum Shift', desc: 'Phase-shifting cursor flickering between colors.', tier: null as SupporterTier },
    { id: 'skin_overseer', name: 'Overseer', desc: 'Red/black boss-themed cursor with glitch effect.', tier: null as SupporterTier },
    { id: 'skin_rainbow', name: 'Chromatic Surge', desc: 'Full-spectrum cursor cycling through colors.', tier: null as SupporterTier },
    // Purchasable skins
    ...PURCHASABLE_SKINS.map(s => ({ id: s.id, name: s.name, desc: s.description, tier: s.tier })),
  ];

  const tierLabel: Record<string, string> = {
    basic: 'Supporter',
    premium: 'Premium',
    ultimate: 'Ultimate',
  };

  const tierBadgeColor: Record<string, string> = {
    basic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    premium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    ultimate: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };

  return (
    <div className="absolute inset-0 bg-black/95 z-[60] backdrop-blur-2xl flex flex-col p-6 sm:p-10 font-sans text-white overflow-hidden">
      <div className="max-w-6xl w-full mx-auto flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase flex items-center space-x-3">
              <Gem className="text-purple-500 w-8 h-8" />
              <span>Armory</span>
            </h2>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-1">
              {supporterStatus
                ? `Supporter Access // Tier: ${tierLabel[supporterTier || 'basic']?.toUpperCase()}`
                : 'Unauthorized // Restricted Section'}
            </p>
          </div>
          <button 
            onClick={() => { soundManager.uiClick(); onClose(); }}
            className="p-3 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 border-b border-white/10 pb-4">
          <TabButton
            active={activeTab === 'vault'}
            onClick={() => { soundManager.armoryTabSwitch(); setActiveTab('vault'); }}
            icon={<Palette className="w-4 h-4" />}
            label="Vault"
          />
          <TabButton
            active={activeTab === 'supporter'}
            onClick={() => { soundManager.armoryTabSwitch(); setActiveTab('supporter'); }}
            icon={<Star className="w-4 h-4" />}
            label="Supporter"
          />
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto pr-4 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'vault' && (
              <motion.div
                key="vault"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                {/* Core Themes Section */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black uppercase tracking-tighter flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-cyan-400" />
                      <span>Core Themes</span>
                    </h3>
                    {activeThemeId && (
                      <button
                        onClick={() => handleSelectTheme(null)}
                        onMouseEnter={() => soundManager.uiHover()}
                        className="text-[10px] font-mono text-zinc-500 hover:text-white uppercase tracking-wider transition-colors"
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(CORE_THEMES).map(([id, theme]) => {
                      const unlocked = isCoreThemeUnlocked(id as CoreThemeId) || devUnlocked;
                      const active = activeThemeId === id;
                      return (
                        <button
                          key={id}
                          onClick={() => {
                            if (unlocked) handleSelectTheme(id as CoreThemeId);
                            else soundManager.uiError();
                          }}
                          onMouseEnter={() => { soundManager.uiHover(); setHoveredThemeId(id); }}
                          onMouseLeave={() => setHoveredThemeId(null)}
                          disabled={!unlocked}
                          className={`relative p-6 rounded-2xl border text-left transition-all ${
                            active
                              ? 'border-white/40 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                              : unlocked
                                ? 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                                : 'border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed'
                          }`}
                        >
                          {/* Theme preview ring with orbiting particles */}
                          <div className="flex items-center space-x-4 mb-4">
                            <ThemePreviewRing themeId={id} unlocked={unlocked} active={active} />
                            <div className="flex-1">
                              <p className="font-bold text-sm">{theme.name}</p>
                              <p className="text-[10px] font-mono text-zinc-500">{theme.description}</p>
                            </div>
                          </div>
                          {/* Tier badge */}
                          {theme.tier && (
                            <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider border ${tierBadgeColor[theme.tier] || ''}`}>
                              {tierLabel[theme.tier] || theme.tier}
                            </span>
                          )}
                          {!unlocked && <LockIcon />}
                          {active && <ActiveBadge />}
                          {hoveredThemeId === id && unlocked && (
                            <ThemeTooltip themeId={id as CoreThemeId} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Cursor Skins Section */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black uppercase tracking-tighter flex items-center space-x-2">
                      <Palette className="w-5 h-5 text-purple-400" />
                      <span>Cursor Skins</span>
                    </h3>
                    <p className="text-[10px] font-mono text-zinc-600">{unlockedSkins.length}/{allSkins.length} unlocked</p>
                    {testDriveSkinId && (
                      <button
                        onClick={handleStopTestDrive}
                        onMouseEnter={() => soundManager.uiHover()}
                        className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 uppercase tracking-wider transition-colors flex items-center space-x-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Stop Test Drive</span>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {allSkins.map(skin => {
                      const unlocked = isSkinUnlocked(skin.id) || devUnlocked;
                      const active = activeSkinId === skin.id;
                      const isTestDriving = testDriveSkinId === skin.id;
                      return (
                        <div
                          key={skin.id}
                          onMouseEnter={() => { soundManager.uiHover(); setHoveredSkinId(skin.id); }}
                          onMouseLeave={() => setHoveredSkinId(null)}
                          className={`relative p-4 rounded-xl border text-left transition-all ${
                            isTestDriving
                              ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
                              : active
                                ? 'border-white/40 bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                                : unlocked
                                  ? 'border-white/10 bg-white/5 hover:border-white/30'
                                  : 'border-white/5 bg-white/[0.02] opacity-40'
                          }`}
                        >
                          <button
                            onClick={() => {
                              if (unlocked) handleSelectSkin(skin.id);
                              else soundManager.uiError();
                            }}
                            disabled={!unlocked}
                            className="w-full text-left"
                          >
                            <SkinPreviewRing skinId={skin.id} unlocked={unlocked} active={active} />
                            <p className="font-bold text-[11px] leading-tight">{skin.name}</p>
                            <p className="text-[9px] font-mono text-zinc-500 mt-1 leading-tight line-clamp-2">{skin.desc}</p>
                            {skin.tier && (
                              <span className={`inline-block mt-2 text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider border ${tierBadgeColor[skin.tier] || ''}`}>
                                {tierLabel[skin.tier]}
                              </span>
                            )}
                            {!unlocked && <LockIcon small />}
                            {active && !isTestDriving && <ActiveBadge small />}
                            {isTestDriving && <LiveBadge />}
                          </button>
                          {/* Test Drive button */}
                          {unlocked && !isTestDriving && hoveredSkinId === skin.id && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleTestDrive(skin.id); }}
                              onMouseEnter={() => soundManager.uiHover()}
                              className="w-full mt-2 py-1.5 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-[9px] font-black uppercase tracking-widest transition-all"
                            >
                              ▶ Test Drive
                            </button>
                          )}
                          {hoveredSkinId === skin.id && unlocked && (
                            <SkinTooltip skinId={skin.id} skinName={skin.name} skinDesc={skin.desc} tier={skin.tier} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'supporter' && (
              <motion.div
                key="supporter"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto space-y-8"
              >
                {/* Supporter Status */}
                <div className={`p-8 rounded-3xl border ${supporterStatus ? 'border-purple-500/30 bg-purple-500/5' : 'border-white/10 bg-white/5'}`}>
                  <div className="flex items-center space-x-4 mb-6">
                    <Crown className={`w-10 h-10 ${supporterStatus ? 'text-purple-400' : 'text-zinc-600'}`} />
                    <div>
                      <h3 className="text-2xl font-black tracking-tighter">
                        {supporterStatus ? 'Supporter Access Granted' : 'Supporter Pack'}
                      </h3>
                      <p className="text-sm text-zinc-500 font-mono mt-1">
                        {supporterStatus
                          ? `Tier: ${tierLabel[supporterTier || 'basic']?.toUpperCase()} — Thank you for your support!`
                          : 'Unlock exclusive cosmetics and support development.'}
                      </p>
                    </div>
                  </div>

                  {supporterStatus && (
                    <div className="flex flex-wrap gap-3 mb-6">
                      <div className="px-4 py-2 bg-purple-500/10 rounded-xl border border-purple-500/20 flex items-center space-x-2">
                        <Crown className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">Verified</span>
                      </div>
                      <div className="px-4 py-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">{unlockedSkins.length} Cosmetics</span>
                      </div>
                    </div>
                  )}

                  {/* Tier cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {[
                      { key: 'basic', name: 'Supporter', icon: '★', color: 'purple', price: 'Key Code', items: '2 skins + 1 theme' },
                      { key: 'premium', name: 'Premium', icon: '★★', color: 'orange', price: 'Key Code', items: '4 skins + 2 themes' },
                      { key: 'ultimate', name: 'Ultimate', icon: '★★★', color: 'cyan', price: 'Key Code', items: '6 skins + 3 themes + Chromatic Surge' },
                    ].map(tier => {
                      const isUnlocked = supporterStatus && (
                        (tier.key === 'basic') ||
                        (tier.key === 'premium' && (supporterTier === 'premium' || supporterTier === 'ultimate')) ||
                        (tier.key === 'ultimate' && supporterTier === 'ultimate')
                      );
                      return (
                        <div key={tier.key} className={`p-6 rounded-2xl border ${
                          isUnlocked
                            ? `border-${tier.color}-500/30 bg-${tier.color}-500/5`
                            : 'border-white/5 bg-white/[0.02]'
                        }`}>
                          <p className={`text-2xl font-black mb-2 ${tier.key === 'basic' ? 'text-purple-400' : tier.key === 'premium' ? 'text-orange-400' : 'text-cyan-400'}`}>
                            {tier.icon}
                          </p>
                          <p className="font-bold text-sm mb-1">{tier.name}</p>
                          <p className="text-[10px] font-mono text-zinc-500 mb-3">{tier.items}</p>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                            isUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-600'
                          }`}>
                            {isUnlocked ? 'Unlocked' : 'Locked'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Key Entry */}
                  {!supporterStatus && (
                    <div className="space-y-4">
                      <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Redeem Supporter Key</p>
                      <div className="flex space-x-3">
                        <input
                          type="text"
                          value={keyInput}
                          onChange={(e) => setKeyInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRedeemKey(); }}
                          placeholder="Enter key code..."
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 transition-colors uppercase tracking-widest"
                        />
                        <button
                          onClick={handleRedeemKey}
                          disabled={!keyInput.trim()}
                          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center space-x-2"
                        >
                          <KeyRound className="w-4 h-4" />
                          <span>Redeem</span>
                        </button>
                      </div>
                      <p className="text-[10px] font-mono text-zinc-600">
                        Available keys: NEXUS_SUPPORTER, NEXUS_PREMIUM, NEXUS_ULTIMATE
                      </p>
                      {keyResult && (
                        <div className={`px-4 py-3 rounded-xl text-xs font-mono ${
                          keyResult.success
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {keyResult.success
                            ? `✓ ${keyResult.tier!.charAt(0).toUpperCase() + keyResult.tier!.slice(1)} pack unlocked! All cosmetics granted.`
                            : '✗ Invalid key code. Check and try again.'}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Dev Tools (hidden, Ctrl+Shift+D) */}
                {showDevTools && (
                  <div className="p-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/5">
                    <p className="text-xs font-mono text-yellow-400 uppercase tracking-widest font-black mb-4">Dev Tools</p>
                    <button
                      onClick={handleDevUnlock}
                      className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                    >
                      Unlock All Cosmetics
                    </button>
                    <p className="text-[10px] font-mono text-zinc-500 mt-3">
                      Dev unlock is {devUnlocked ? 'ACTIVE' : 'inactive'}. Press Ctrl+Shift+D to toggle this panel.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ===== SKIN COLORS FOR PREVIEW PARTICLES =====

interface SkinParticleColors {
  primary: string;
  secondary: string;
  accent: string;
}

const SKIN_PARTICLE_COLORS: Record<string, SkinParticleColors> = {
  // Challenge reward skins
  skin_cyber_red: { primary: '#dc2626', secondary: '#ef4444', accent: '#fca5a5' },
  skin_gold_empire: { primary: '#f59e0b', secondary: '#fbbf24', accent: '#fde68a' },
  skin_void_black: { primary: '#ffffff', secondary: '#9ca3af', accent: '#6b7280' },
  skin_neon_pulse: { primary: '#22d3ee', secondary: '#ec4899', accent: '#67e8f9' },
  skin_quantum_shift: { primary: '#a855f7', secondary: '#06b6d4', accent: '#c084fc' },
  skin_overseer: { primary: '#ef4444', secondary: '#dc2626', accent: '#f87171' },
  skin_rainbow: { primary: '#ef4444', secondary: '#22c55e', accent: '#22d3ee' },
  // Purchasable skins
  skin_plasma_arc: { primary: '#8b5cf6', secondary: '#a78bfa', accent: '#c4b5fd' },
  skin_shadow_ops: { primary: '#6b7280', secondary: '#9ca3af', accent: '#4b5563' },
  skin_solar_flare: { primary: '#f97316', secondary: '#fbbf24', accent: '#fdba74' },
  skin_void_echo: { primary: '#7c3aed', secondary: '#c084fc', accent: '#6d28d9' },
  skin_quantum_core: { primary: '#06b6d4', secondary: '#ec4899', accent: '#22d3ee' },
  skin_overseer_elite: { primary: '#dc2626', secondary: '#7f1d1d', accent: '#ef4444' },
};

// ===== THEME BACKGROUND PATTERN COMPONENT =====

const PATTERN_SVGS: Record<string, (colors: CoreTheme['colors']) => React.ReactNode> = {
  lattice: (colors) => (
    <svg viewBox="0 0 52 52" className="absolute inset-0 w-full h-full" style={{ opacity: 0.15 }}>
      <defs>
        <pattern id="lattice-pattern" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M0 8 L8 0 L16 8 L8 16 Z" fill="none" stroke={colors.secondary} strokeWidth="0.6" />
          <circle cx="8" cy="8" r="1" fill={colors.accent} opacity="0.5" />
        </pattern>
      </defs>
      <rect width="52" height="52" fill="url(#lattice-pattern)" />
    </svg>
  ),
  sine: (colors) => (
    <svg viewBox="0 0 52 52" className="absolute inset-0 w-full h-full" style={{ opacity: 0.12 }}>
      <defs>
        <pattern id="sine-pattern" x="0" y="0" width="18" height="14" patternUnits="userSpaceOnUse">
          <path d="M0 7 Q4.5 0 9 7 Q13.5 14 18 7" fill="none" stroke={colors.primary} strokeWidth="0.5" />
          <circle cx="9" cy="7" r="0.8" fill={colors.accent} opacity="0.4" />
        </pattern>
      </defs>
      <rect width="52" height="52" fill="url(#sine-pattern)" />
    </svg>
  ),
  hex: (colors) => (
    <svg viewBox="0 0 52 52" className="absolute inset-0 w-full h-full" style={{ opacity: 0.12 }}>
      <defs>
        <pattern id="hex-pattern" x="0" y="0" width="18" height="15.6" patternUnits="userSpaceOnUse">
          <path d="M9 0 L18 4.5 L18 13.5 L9 18 L0 13.5 L0 4.5 Z" fill="none" stroke={colors.secondary} strokeWidth="0.5" />
          <circle cx="9" cy="9" r="0.8" fill={colors.accent} opacity="0.4" />
        </pattern>
      </defs>
      <rect width="52" height="52" fill="url(#hex-pattern)" />
    </svg>
  ),
  tech: (colors) => (
    <svg viewBox="0 0 52 52" className="absolute inset-0 w-full h-full" style={{ opacity: 0.12 }}>
      <defs>
        <pattern id="tech-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="20" height="20" fill="none" stroke={colors.primary} strokeWidth="0.4" />
          <line x1="0" y1="10" x2="20" y2="10" stroke={colors.secondary} strokeWidth="0.3" opacity="0.6" />
          <circle cx="10" cy="10" r="1.2" fill="none" stroke={colors.accent} strokeWidth="0.5" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="52" height="52" fill="url(#tech-pattern)" />
    </svg>
  ),
};

export function ThemePattern({ pattern, colors }: { pattern: string; colors: CoreTheme['colors'] }) {
  const renderFn = PATTERN_SVGS[pattern];
  if (!renderFn) return null;
  return <>{renderFn(colors)}</>;
}

// ===== THEME PREVIEW RING COMPONENT =====

export function ThemePreviewRing({ themeId, unlocked, active }: { themeId: string; unlocked: boolean; active: boolean }) {
  const theme = CORE_THEMES[themeId as CoreThemeId];
  if (!theme) return null;
  const colors = theme.colors;
  const particleColors = [colors.primary, colors.secondary, colors.accent, colors.primary, colors.glow];

  return (
    <div className="relative w-[52px] h-[52px] mb-3 flex items-center justify-center mx-auto">
      {/* Background pattern behind the ring */}
      {unlocked && (
        <ThemePattern pattern={theme.pattern} colors={colors} />
      )}

      {/* Main preview ring with theme colors */}
      <div
        className={`theme-preview-ring ${!unlocked ? 'opacity-30' : ''} ${active ? 'ring-2 ring-white/40' : ''}`}
        style={{
          borderColor: active ? '#fff' : colors.primary,
          boxShadow: active ? `0 0 20px ${colors.glow}` : `0 0 12px ${colors.glow}`,
          '--theme-primary': colors.primary,
          '--theme-glow': colors.glow,
        } as React.CSSProperties}
      />

      {/* Orbiting particle dots */}
      {unlocked && particleColors.map((color, i) => (
        <div
          key={i}
          className="theme-preview-particle"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}`,
          }}
        />
      ))}
    </div>
  );
}

// ===== SKIN PREVIEW RING COMPONENT =====

function SkinPreviewRing({ skinId, unlocked, active }: { skinId: string; unlocked: boolean; active: boolean }) {
  const colors = SKIN_PARTICLE_COLORS[skinId] || { primary: '#fff', secondary: '#fff', accent: '#fff' };
  const particleColors = [colors.primary, colors.secondary, colors.accent];

  return (
    <div className="relative w-[52px] h-[52px] mb-3 flex items-center justify-center mx-auto">
      {/* Main preview ring applying the skin's CSS class */}
      <div
        className={`skin-preview-ring custom-cursor-ring cursor-skin-${skinId} ${!unlocked ? 'opacity-30' : ''} ${active ? 'ring-2 ring-white/40' : ''}`}
        style={{
          borderColor: active ? '#fff' : undefined,
        }}
      />

      {/* Orbiting particle dots */}
      {unlocked && particleColors.map((color, i) => (
        <div
          key={i}
          className="skin-preview-particle"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}`,
          }}
        />
      ))}
    </div>
  );
}

// ===== THEME TOOLTIP COMPONENT =====

function ThemeTooltip({ themeId }: { themeId: CoreThemeId }) {
  const theme = CORE_THEMES[themeId];
  if (!theme) return null;
  const colors = theme.colors;
  const particleColors = [colors.primary, colors.secondary, colors.accent, colors.primary, colors.glow, colors.secondary];

  return (
    <div className="skin-tooltip bottom-full left-1/2 -translate-x-1/2 mb-4">
      <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl min-w-[200px] flex flex-col items-center">
        {/* Enlarged preview ring with theme colors */}
        <div className="relative w-[100px] h-[100px] flex items-center justify-center mb-4">
          <div
            className="theme-tooltip-ring"
            style={{
              borderColor: colors.primary,
              boxShadow: `0 0 25px ${colors.glow}`,
              '--theme-primary': colors.primary,
              '--theme-glow': colors.glow,
            } as React.CSSProperties}
          />
          {particleColors.map((color, i) => (
            <div
              key={i}
              className="theme-tooltip-particle"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 8px ${color}`,
              }}
            />
          ))}
        </div>

        {/* Theme info */}
        <p className="font-bold text-sm text-white text-center">{theme.name}</p>
        <p className="text-[10px] font-mono text-zinc-400 mt-1.5 text-center leading-relaxed max-w-[180px]">{theme.description}</p>
        {theme.tier && (
          <span className={`mt-2.5 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider border ${tierBadgeColorMap(theme.tier)}`}>
            {tierLabelMap(theme.tier)}
          </span>
        )}
      </div>
      {/* Arrow pointing down */}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-black/90 border-r border-b border-white/10 rotate-45" />
    </div>
  );
}

// ===== SKIN TOOLTIP COMPONENT =====

function SkinTooltip({ skinId, skinName, skinDesc, tier }: { skinId: string; skinName: string; skinDesc: string; tier: SupporterTier }) {
  const colors = SKIN_PARTICLE_COLORS[skinId] || { primary: '#fff', secondary: '#fff', accent: '#fff' };
  const particleColors = [colors.primary, colors.secondary, colors.accent, colors.primary, colors.accent];
  const unlocked = true; // Tooltip always shows full preview

  return (
    <div className="skin-tooltip bottom-full left-1/2 -translate-x-1/2 mb-4">
      <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl min-w-[200px] flex flex-col items-center">
        {/* Enlarged preview ring */}
        <div className="relative w-[100px] h-[100px] flex items-center justify-center mb-4">
          <div
            className={`skin-tooltip-ring custom-cursor-ring cursor-skin-${skinId}`}
          />
          {particleColors.map((color, i) => (
            <div
              key={i}
              className="skin-tooltip-particle"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 8px ${color}`,
              }}
            />
          ))}
        </div>

        {/* Skin info */}
        <p className="font-bold text-sm text-white text-center">{skinName}</p>
        <p className="text-[10px] font-mono text-zinc-400 mt-1.5 text-center leading-relaxed max-w-[180px]">{skinDesc}</p>
        {tier && (
          <span className={`mt-2.5 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider border ${tierBadgeColorMap(tier)}`}>
            {tierLabelMap(tier)}
          </span>
        )}
      </div>
      {/* Arrow pointing down */}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-black/90 border-r border-b border-white/10 rotate-45" />
    </div>
  );
}

function tierLabelMap(tier: SupporterTier): string {
  const map: Record<string, string> = { basic: 'Supporter', premium: 'Premium', ultimate: 'Ultimate' };
  return map[tier || ''] || '';
}

function tierBadgeColorMap(tier: SupporterTier): string {
  const map: Record<string, string> = {
    basic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    premium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    ultimate: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };
  return map[tier || ''] || '';
}

// ===== SUB-COMPONENTS =====

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => soundManager.uiHover()}
      className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-all ${
        active
          ? 'bg-white/10 text-white border border-white/10'
          : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
      }`}
    >
      {icon}
      <span className="font-mono text-xs uppercase tracking-widest font-bold">{label}</span>
    </button>
  );
}

function LockIcon({ small }: { small?: boolean }) {
  return (
    <div className={`absolute inset-0 flex items-center justify-center bg-black/40 rounded-[inherit] ${
      small ? '' : ''
    }`}>
      <svg className={small ? 'w-5 h-5 text-zinc-500' : 'w-8 h-8 text-zinc-500'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    </div>
  );
}

function LiveBadge() {
  return (
    <div className="absolute top-2 right-2 flex items-center space-x-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full px-2 py-0.5">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
    </div>
  );
}

function ActiveBadge({ small }: { small?: boolean }) {
  return (
    <div className={`absolute top-2 right-2 ${small ? 'w-3 h-3' : 'w-4 h-4'} bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] flex items-center justify-center`}>
      <svg className={small ? 'w-2 h-2' : 'w-2.5 h-2.5'} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}
