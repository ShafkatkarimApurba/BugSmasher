import { Zap, Crosshair, Heart, X } from 'lucide-react';
import { motion, Variants } from 'motion/react';
import { soundManager } from '../game/SoundManager';
import { GameConfig } from '../game/GameConfig';

interface UpgradeMenuProps {
  score: number;
  onUpgrade: (type: 'health' | 'radius' | 'turret', cost: number) => void;
  onNextWave: () => void;
  onClose: () => void;
  wave: number;
  healthLevel: number;
  radiusLevel: number;
  turretLevel: number;
}

export function UpgradeMenu({ score, onUpgrade, onNextWave, onClose, wave, healthLevel, radiusLevel, turretLevel }: UpgradeMenuProps) {

  const healthCost = GameConfig.upgrades.health.baseCost + healthLevel * GameConfig.upgrades.health.costMultiplier;
  const radiusCost = GameConfig.upgrades.radius.baseCost + radiusLevel * GameConfig.upgrades.radius.costMultiplier;
  const turretCost = GameConfig.upgrades.turret.baseCost + turretLevel * GameConfig.upgrades.turret.costMultiplier;

  const handleBuy = (type: 'health' | 'radius' | 'turret', cost: number) => {
    soundManager.init();
    if (score >= cost) {
      soundManager.upgrade();
      onUpgrade(type, cost);
    } else {
      soundManager.uiError();
    }
  };

  const handleNextWave = () => {
    soundManager.init();
    soundManager.uiClick();
    onNextWave();
  };

  const handleClose = () => {
    soundManager.init();
    soundManager.uiClick();
    onClose();
  };

  const handleHover = () => {
    soundManager.init();
    soundManager.uiHover();
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut", staggerChildren: 0.1 } 
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 300, damping: 24 } 
    }
  };

  return (
    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 backdrop-blur-xl p-4 overflow-y-auto">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl w-full text-center my-auto relative"
      >
        <button
          onClick={handleClose}
          aria-label="Close upgrades and continue to next wave"
          className="absolute top-0 right-0 -mt-2 sm:-mt-4 bg-black/40 hover:bg-white/10 border border-white/15 rounded-full p-2.5 transition-colors"
        >
          <X className="w-4 h-4 text-zinc-300" />
        </button>
        <motion.div variants={itemVariants} className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white font-display mb-4 uppercase tracking-widest">
            WAVE {wave - 1} CLEARED
          </h2>
          <div className="h-px w-24 bg-white/20 mx-auto mb-4" />
          <p className="text-zinc-500 font-mono tracking-widest text-sm uppercase">Secure connection established. Accessing defensive upgrades...</p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="inline-flex items-center space-x-4 bg-black/40 backdrop-blur-md border-[0.5px] border-white/10 px-8 py-4 rounded-full mb-12 shadow-2xl">
          <span className="text-zinc-500 font-medium uppercase text-xs tracking-[0.2em]">Credits Available</span>
          <span className="text-2xl font-medium font-mono text-white tracking-widest">
            {score.toString().padStart(6, '0')}
          </span>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Health Upgrade */}
          <motion.div variants={cardVariants} className="group relative bg-black/40 backdrop-blur-md p-8 rounded-[2rem] border-[0.5px] border-white/10 hover:border-white/30 transition-all duration-300 flex flex-col items-center">
            <div className="absolute top-6 right-6 text-zinc-500 text-xs font-medium px-2 py-1 rounded font-mono border border-white/10">
              Lv {healthLevel}
            </div>
            <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:border-white/30">
              <Heart className="w-6 h-6 text-zinc-300 group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-bold text-lg font-display text-white mb-2 tracking-wide uppercase">Core Structure</h3>
            <p className="text-xs text-zinc-500 mb-8 text-center leading-relaxed flex-grow font-mono">
              Increase structural integrity by <span className="text-white font-bold">{GameConfig.upgrades.health.healAmount}</span> units.
            </p>
            <button 
              onClick={() => handleBuy('health', healthCost)}
              onMouseEnter={handleHover}
              aria-disabled={score < healthCost}
              aria-label={`Buy Core Structure upgrade for ${healthCost} credits`}
              className={`w-full py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center space-x-3 ${
                score >= healthCost 
                  ? 'bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-95' 
                  : 'bg-transparent border-[0.5px] border-white/10 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <span>{score >= healthCost ? 'Initialize' : 'Insufficient'}</span>
              <span className={`font-mono ${score >= healthCost ? 'text-zinc-500' : 'text-zinc-700'}`}>[{healthCost}]</span>
            </button>
          </motion.div>

          {/* Radius Upgrade */}
          <motion.div variants={cardVariants} className="group relative bg-black/40 backdrop-blur-md p-8 rounded-[2rem] border-[0.5px] border-white/10 hover:border-white/30 transition-all duration-300 flex flex-col items-center">
            <div className="absolute top-6 right-6 text-zinc-500 text-xs font-medium px-2 py-1 rounded font-mono border border-white/10">
              Lv {radiusLevel}
            </div>
            <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:border-white/30">
              <Crosshair className="w-6 h-6 text-zinc-300 group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-bold text-lg font-display text-white mb-2 tracking-wide uppercase">Blast Radius</h3>
            <p className="text-xs text-zinc-500 mb-8 text-center leading-relaxed flex-grow font-mono">
              Expand suppression wave coverage by <span className="text-white font-bold">{(GameConfig.upgrades.radius.radiusMultiplier - 1) * 100}%</span>.
            </p>
            <button 
              onClick={() => handleBuy('radius', radiusCost)}
              onMouseEnter={handleHover}
              aria-disabled={score < radiusCost}
              aria-label={`Buy Blast Radius upgrade for ${radiusCost} credits`}
              className={`w-full py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center space-x-3 ${
                score >= radiusCost 
                  ? 'bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-95' 
                  : 'bg-transparent border-[0.5px] border-white/10 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <span>{score >= radiusCost ? 'Initialize' : 'Insufficient'}</span>
              <span className={`font-mono ${score >= radiusCost ? 'text-zinc-500' : 'text-zinc-700'}`}>[{radiusCost}]</span>
            </button>
          </motion.div>

          {/* Turret Upgrade */}
          <motion.div variants={cardVariants} className="group relative bg-black/40 backdrop-blur-md p-8 rounded-[2rem] border-[0.5px] border-white/10 hover:border-white/30 transition-all duration-300 flex flex-col items-center">
            <div className="absolute top-6 right-6 text-zinc-500 text-xs font-medium px-2 py-1 rounded font-mono border border-white/10">
              Lv {turretLevel}
            </div>
            <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:border-white/30">
              <Zap className="w-6 h-6 text-zinc-300 group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-bold text-lg font-display text-white mb-2 tracking-wide uppercase">Auto-Sentry</h3>
            <p className="text-xs text-zinc-500 mb-8 text-center leading-relaxed flex-grow font-mono">
              Decrease automated target acquisition latency by <span className="text-white font-bold">{GameConfig.upgrades.turret.fireRateReduction}s</span>.
            </p>
            <button 
              onClick={() => handleBuy('turret', turretCost)}
              onMouseEnter={handleHover}
              aria-disabled={score < turretCost}
              aria-label={`Buy Auto-Sentry upgrade for ${turretCost} credits`}
              className={`w-full py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center space-x-3 ${
                score >= turretCost 
                  ? 'bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-95' 
                  : 'bg-transparent border-[0.5px] border-white/10 text-zinc-600 cursor-not-allowed'
              }`}
            >
             <span>{score >= turretCost ? 'Initialize' : 'Insufficient'}</span>
             <span className={`font-mono ${score >= turretCost ? 'text-zinc-500' : 'text-zinc-700'}`}>[{turretCost}]</span>
            </button>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button 
              onClick={handleClose}
              onMouseEnter={handleHover}
              aria-label={`Close upgrades and start Wave ${wave}`}
              className="group relative px-8 py-4 bg-transparent border-[0.5px] border-white/20 text-zinc-300 font-bold text-xs hover:bg-white/10 hover:text-white rounded-full hover:scale-105 active:scale-95 transition-all tracking-widest uppercase overflow-hidden"
            >
              <span className="relative z-10">Skip Upgrades</span>
            </button>
            <button 
              onClick={handleNextWave}
              onMouseEnter={handleHover}
              aria-label={`Start Wave ${wave}`}
              className="group relative px-12 py-5 bg-transparent border-[0.5px] border-white/30 text-white font-bold text-sm hover:bg-white hover:text-black rounded-full hover:scale-105 active:scale-95 transition-all tracking-widest uppercase overflow-hidden"
            >
              <span className="relative z-10">Proceed to Wave {wave}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
