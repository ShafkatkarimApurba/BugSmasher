import { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, Music, Music2, Trophy, Bug, Clock, Gamepad2, Award, Flame, ShoppingBag, Crown, Globe, Star, Users, Sparkles } from 'lucide-react';
import { soundManager } from '../game/SoundManager';
import { saveManager } from '../game/SaveManager';
import { achievementSystem } from '../game/AchievementSystem';
import { Store } from './Store';
import { PremiumStore } from './PremiumStore';
import { BiomeSelector } from './BiomeSelector';
import { biomeManager } from '../game/BiomeManager';
import { premiumManager } from '../game/PremiumManager';
import { referralManager } from '../game/ReferralManager';
import { ViralShareButton, CopyReferralLink, ReferralProgress } from './ViralShare';

interface SettingsMenuProps {
  onClose: () => void;
}

export function SettingsMenu({ onClose }: SettingsMenuProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showBiomes, setShowBiomes] = useState(false);
  const [showReferral, setShowReferral] = useState(false);

  useEffect(() => {
    setSoundEnabled(saveManager.isSoundEnabled());
    setMusicEnabled(saveManager.isMusicEnabled());
  }, []);

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    saveManager.setSoundEnabled(newValue);
    if (newValue) soundManager.uiClick();
  };

  const toggleMusic = () => {
    const newValue = !musicEnabled;
    setMusicEnabled(newValue);
    saveManager.setMusicEnabled(newValue);
    if (newValue) soundManager.uiClick();
  };

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const achievements = achievementSystem.getAchievements();
  const unlockedCount = achievementSystem.getUnlockedCount();
  const totalCount = achievementSystem.getTotalCount();
  const streak = achievementSystem.getStreak();

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-6 space-y-6 border border-zinc-800 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white tracking-tight">
            {showAchievements ? 'ACHIEVEMENTS' : showReferral ? 'INVITE FRIENDS' : 'SETTINGS'}
          </h2>
          <button
            onClick={() => {
              if (showAchievements) setShowAchievements(false);
              else if (showStore) setShowStore(false);
              else if (showPremium) setShowPremium(false);
              else if (showBiomes) setShowBiomes(false);
              else if (showReferral) setShowReferral(false);
              else onClose();
            }}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        {showAchievements ? (
          // Achievements Panel
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Award className="w-6 h-6 text-yellow-500" />
                <div>
                  <p className="text-lg font-bold text-white">{unlockedCount} / {totalCount}</p>
                  <p className="text-xs text-zinc-500">UNLOCKED</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Flame className="w-6 h-6 text-orange-500" />
                <div>
                  <p className="text-lg font-bold text-white">{streak} days</p>
                  <p className="text-xs text-zinc-500">STREAK</p>
                </div>
              </div>
            </div>

            {/* Achievement List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {achievements.map(a => (
                <div 
                  key={a.id}
                  className={`flex items-center space-x-3 p-3 rounded-xl ${
                    a.unlocked ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-zinc-800/30 opacity-50'
                  }`}
                >
                  <span className="text-xl">{a.icon}</span>
                  <div className="flex-1">
                    <p className={`font-medium ${a.unlocked ? 'text-white' : 'text-zinc-500'}`}>
                      {a.title}
                    </p>
                    <p className="text-xs text-zinc-500">{a.description}</p>
                  </div>
                  {a.unlocked && <Award className="w-4 h-4 text-yellow-500" />}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Audio Settings */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Audio</h3>
              
              <button
                onClick={toggleSound}
                className="w-full flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-white" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-zinc-500" />
                  )}
                  <span className="text-white font-medium">Sound Effects</span>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors ${soundEnabled ? 'bg-green-500' : 'bg-zinc-600'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full m-0.5 transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </button>

              <button
                onClick={toggleMusic}
                className="w-full flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {musicEnabled ? (
                    <Music2 className="w-5 h-5 text-white" />
                  ) : (
                    <Music className="w-5 h-5 text-zinc-500" />
                  )}
                  <span className="text-white font-medium">Music</span>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors ${musicEnabled ? 'bg-green-500' : 'bg-zinc-600'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full m-0.5 transition-transform ${musicEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Statistics</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800/50 rounded-xl p-4 space-y-1">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <p className="text-2xl font-black text-white">
                    {saveManager.getHighScore().toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-500">HIGH SCORE</p>
                </div>
                
                <div className="bg-zinc-800/50 rounded-xl p-4 space-y-1">
                  <Bug className="w-5 h-5 text-green-500" />
                  <p className="text-2xl font-black text-white">
                    {saveManager.getTotalBugsSmashed().toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-500">BUGS SMASHED</p>
                </div>
                
                <div className="bg-zinc-800/50 rounded-xl p-4 space-y-1">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <p className="text-2xl font-black text-white">
                    {formatTime(saveManager.getTotalPlayTime())}
                  </p>
                  <p className="text-xs text-zinc-500">PLAY TIME</p>
                </div>
                
                <div className="bg-zinc-800/50 rounded-xl p-4 space-y-1">
                  <Gamepad2 className="w-5 h-5 text-purple-500" />
                  <p className="text-2xl font-black text-white">
                    {saveManager.getGamesPlayed()}
                  </p>
                  <p className="text-xs text-zinc-500">GAMES PLAYED</p>
                </div>
              </div>
            </div>

            {/* Achievements Button */}
            <button
              onClick={() => setShowAchievements(true)}
              className="w-full flex items-center justify-center space-x-2 p-4 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-xl border border-yellow-500/30 transition-colors"
            >
              <Award className="w-5 h-5 text-yellow-500" />
              <span className="text-yellow-500 font-medium">
                {unlockedCount} / {totalCount} Achievements
              </span>
            </button>

            {/* Shop Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setShowBiomes(true)}
                className="flex flex-col items-center justify-center p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl border border-white/10 transition-colors"
              >
                <Globe className="w-5 h-5 text-cyan-400" />
                <span className="text-xs text-zinc-400 mt-1">Biomes</span>
              </button>

              <button
                onClick={() => setShowStore(true)}
                className="flex flex-col items-center justify-center p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl border border-white/10 transition-colors"
              >
                <ShoppingBag className="w-5 h-5 text-purple-400" />
                <span className="text-xs text-zinc-400 mt-1">Store</span>
              </button>

              <button
                onClick={() => setShowPremium(true)}
                className="flex flex-col items-center justify-center p-3 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/30 transition-colors"
              >
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="text-xs text-amber-400 mt-1">Premium</span>
              </button>
            </div>

            {/* Referral Button */}
            <button
              onClick={() => setShowReferral(true)}
              className="w-full flex items-center justify-center space-x-2 p-4 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl border border-blue-500/30 transition-colors"
            >
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-medium">Invite Friends</span>
            </button>
          </>
        )}

        {showReferral && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Users className="w-12 h-12 text-blue-400 mx-auto" />
              <p className="text-sm text-zinc-400">Invite friends and earn rewards!</p>
            </div>
            
            <CopyReferralLink />
            
<ViralShareButton score={saveManager.getHighScore()} wave={1} kills={saveManager.getTotalBugsSmashed()} />
            
            <ReferralProgress />
          </div>
        )}

        {/* Version */}
        <p className="text-center text-xs text-zinc-600">Version 1.4.2 • BugSmasher by Shafkat</p>
      </div>

      {/* Overlays */}
      {showStore && <Store onClose={() => setShowStore(false)} />}
      {showPremium && <PremiumStore onClose={() => setShowPremium(false)} onPurchase={() => premiumManager.purchase()} />}
      {showBiomes && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-white">BIOMES</h2>
              <button onClick={() => setShowBiomes(false)}>
                <X className="w-6 h-6 text-zinc-400" />
              </button>
            </div>
            <BiomeSelector 
              currentBiomeId={biomeManager.getCurrentBiome().id} 
              onSelectBiome={(id) => { biomeManager.setCurrentBiome(id); setShowBiomes(false); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}