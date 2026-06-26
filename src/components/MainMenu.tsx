import { useState, useEffect } from 'react';
import { soundManager } from '../game/SoundManager';
import { SettingsMenu } from './SettingsMenu';
import { MatrixRain } from './MatrixRain';
import { CustomBugLogo } from './CustomBugLogo';
import { authManager } from '../game/database/AuthManager';
import { AccountScreen } from './AccountScreen';
import type { Profile } from '../game/database/types';

export function MainMenu({ onStart }: { onStart: () => void }) {
  const [showSettings, setShowSettings] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const updateProfile = () => setProfile(authManager.getProfile());
    updateProfile();
    const unsub = authManager.subscribe(updateProfile);
    return unsub;
  }, []);

  const handleStart = () => {
    soundManager.init();
    soundManager.uiClick();
    onStart();
  };

  const handlePlayAsGuest = () => {
    soundManager.init();
    soundManager.uiClick();
    authManager.signInAsGuest();
    onStart();
  };

  const handleSignIn = () => {
    soundManager.init();
    soundManager.uiClick();
    setShowAccount(true);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#050505] relative p-4">
      <MatrixRain />
      {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}
      {showAccount && <AccountScreen onClose={() => setShowAccount(false)} />}
      <div className="z-10 flex flex-col items-center space-y-12 sm:space-y-16 w-full max-w-lg">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center mb-6 mt-8 sm:mt-12">
             <CustomBugLogo className="w-16 h-16 sm:w-24 sm:h-24" />
           </div>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white font-display">
            BUGSMASHER
          </h1>
          <div className="h-px w-24 bg-white/20 mx-auto mt-4 mb-6" />
          <p className="text-sm sm:text-base md:text-lg text-zinc-500 font-medium tracking-[0.2em] font-mono">
            DEFEND THE CORE. SMASH THE SWARM.
          </p>
        </div>
        
        <div className="w-full flex flex-col items-center space-y-4 mt-4">
          {profile ? (
            // User is signed in - show play button with profile
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-lg font-bold">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-white font-bold">{profile.username}</p>
                  <p className="text-zinc-500 text-sm">Level {profile.level} • {profile.crystals} crystals</p>
                </div>
              </div>
              <button 
                onClick={handleStart}
                onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
                className="group relative px-12 py-4 bg-white text-black hover:bg-zinc-200 rounded-full font-bold text-sm sm:text-base uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
              >
                Start Game
              </button>
            </>
          ) : (
            // No user signed in - show options
            <div className="w-full flex flex-col space-y-4">
              <button 
                onClick={handlePlayAsGuest}
                onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
                className="group relative px-10 py-4 bg-white text-black hover:bg-zinc-200 rounded-full font-bold text-sm sm:text-base uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                Play as Guest
              </button>
              
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-zinc-800" />
                <span className="text-zinc-600 text-xs uppercase">or</span>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleSignIn}
                  className="flex-1 py-3 px-4 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 rounded-full font-medium text-sm transition-all"
                >
                  Sign In
                </button>
                <button 
                  onClick={handleSignIn}
                  className="flex-1 py-3 px-4 bg-cyan-500 text-black hover:bg-cyan-400 rounded-full font-bold text-sm transition-all"
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Settings Button */}
        <button
          onClick={() => { soundManager.uiClick(); setShowSettings(true); }}
          className="text-zinc-500 hover:text-white text-sm transition-colors"
        >
          Settings
        </button>
        
        {/* Account / Profile Button */}
        <button
          onClick={() => { soundManager.uiClick(); setShowAccount(true); }}
          className="absolute top-4 right-4 flex items-center gap-2 text-sm transition-colors"
        >
          {profile ? (
            <>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                {profile.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-zinc-400 hover:text-white">{profile.username}</span>
            </>
          ) : (
            <span className="text-zinc-500 hover:text-white">Account</span>
          )}
        </button>
      </div>
    </div>
  );
}
