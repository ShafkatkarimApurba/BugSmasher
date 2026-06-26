import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameEngine } from '../game/GameEngine';
import { MousePointer2, Zap, ShieldAlert } from 'lucide-react';
import { soundManager } from '../game/SoundManager';

export function TutorialOverlay({ engineRef }: { engineRef: React.RefObject<GameEngine | null> }) {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // If tutorial was previously completed, don't show it.
    if (localStorage.getItem('bugsmasher_tutorial') === 'true') {
      setIsVisible(false);
      return;
    }

    let animationFrameId: number;
    let forcedPowerup = false;

    const checkTutorialState = () => {
      const engine = engineRef.current;
      if (engine) {
        if (step === 0) {
          // Progress when player gets their first kill
          if (engine.totalKills >= 1) {
            soundManager.uiClick();
            setStep(1);
          }
        } else if (step === 1) {
          // Force a powerup drop on the first kill after advancing to step 1
          if (engine.powerups.length === 0 && engine.totalPowerupsCollected === 0 && !forcedPowerup && engine.bugs.length > 0) {
             engine.forceNextPowerup = true;
             forcedPowerup = true;
          }

          // Progress when player collects their first powerup
          if (engine.totalPowerupsCollected >= 1) {
            soundManager.uiClick();
            setStep(2);
          }
        }
      }
      if (isVisible) {
        animationFrameId = requestAnimationFrame(checkTutorialState);
      }
    };

    if (isVisible) {
      animationFrameId = requestAnimationFrame(checkTutorialState);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [engineRef, step, isVisible]);

  if (!isVisible) return null;

  const dismiss = () => {
    soundManager.uiClick();
    localStorage.setItem('bugsmasher_tutorial', 'true');
    setIsVisible(false);
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-[90%] max-w-md">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-black/60 backdrop-blur-xl border border-white/20 p-5 rounded-2xl flex items-center space-x-4 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
          >
            <div className="w-10 h-10 min-w-10 rounded-full border border-white/20 flex items-center justify-center animate-pulse bg-white/5">
              <MousePointer2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-1">System Directive</p>
              <p className="text-white font-mono text-sm leading-snug">Tap or click hostile anomalies to eliminate them.</p>
            </div>
          </motion.div>
        )}
        
        {step === 1 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-black/60 backdrop-blur-xl border border-white/20 p-5 rounded-2xl flex items-center space-x-4 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
          >
            <div className="w-10 h-10 min-w-10 rounded-full border border-cyan-400/50 flex items-center justify-center animate-pulse bg-cyan-400/10">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-cyan-500 font-mono text-xs uppercase tracking-widest mb-1">Payload Dropped</p>
              <p className="text-white font-mono text-sm leading-snug">Collect data cores by hovering or clicking them.</p>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-black/60 backdrop-blur-xl border border-white/20 p-5 rounded-2xl flex flex-col sm:flex-row items-center sm:space-x-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] pointer-events-auto space-y-4 sm:space-y-0"
          >
            <div className="flex items-center space-x-4 flex-grow">
              <div className="w-10 h-10 min-w-10 rounded-full border border-pink-500/50 flex items-center justify-center bg-pink-500/10">
                <ShieldAlert className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="text-pink-500 font-mono text-xs uppercase tracking-widest mb-1">Armory Access</p>
                <p className="text-white font-mono text-sm leading-snug">Survive the wave to access and install upgrades.</p>
              </div>
            </div>
            <button 
              onClick={dismiss}
              className="w-full sm:w-auto px-6 py-3 bg-white text-black font-bold font-mono text-xs rounded-full uppercase tracking-widest hover:bg-zinc-200 transition-colors flex-shrink-0"
            >
              Acknowledge
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
