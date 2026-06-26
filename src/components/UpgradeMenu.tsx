import { useState } from 'react';
import { Shield, Zap, Crosshair, Heart, Hammer, Info } from 'lucide-react';
import { motion, Variants, AnimatePresence } from 'motion/react';
import { soundManager } from '../game/SoundManager';
import { GameConfig } from '../game/GameConfig';

interface UpgradeMenuProps {
  score: number;
  initialLevels: { health: number; radius: number; turret: number };
  onUpgrade: (type: 'health' | 'radius' | 'turret', cost: number) => void;
  onOpenProgression: () => void;
  onNextWave: () => void;
  wave: number;
}

function UpgradeTooltip({ title, description, benefits }: { title: string, description: string, benefits: string[] }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute -top-40 left-1/2 -translate-x-1/2 w-64 p-4 bg-zinc-900 border border-white/20 rounded-2xl shadow-2xl z-50 pointer-events-none"
    >
      <div className="flex items-center space-x-2 mb-2">
        <Info className="w-4 h-4 text-blue-400" />
        <h4 className="text-[10px] font-black uppercase tracking-widest text-white">{title}</h4>
      </div>
      <p className="text-[10px] text-zinc-400 font-mono leading-relaxed mb-3">{description}</p>
      <div className="space-y-1">
        {benefits.map((b, i) => (
          <div key={i} className="flex items-center space-x-2">
            <div className="w-1 h-1 bg-emerald-400 rounded-full" />
            <span className="text-[9px] text-emerald-300 font-mono uppercase">{b}</span>
          </div>
        ))}
      </div>
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-900 border-r border-b border-white/20 rotate-45" />
    </motion.div>
  );
}

export function UpgradeMenu({ score, initialLevels, onUpgrade, onOpenProgression, onNextWave, wave }: UpgradeMenuProps) {
  const [healthLevel, setHealthLevel] = useState(initialLevels.health);
  const [radiusLevel, setRadiusLevel] = useState(initialLevels.radius);
  const [turretLevel, setTurretLevel] = useState(initialLevels.turret);
  const [flashingStat, setFlashingStat] = useState<string | null>(null);
  const [hoveredUpgrade, setHoveredUpgrade] = useState<string | null>(null);

  const healthCost = GameConfig.upgrades.health.baseCost + healthLevel * GameConfig.upgrades.health.costMultiplier;
  const radiusCost = GameConfig.upgrades.radius.baseCost + radiusLevel * GameConfig.upgrades.radius.costMultiplier;
  const turretCost = GameConfig.upgrades.turret.baseCost + turretLevel * GameConfig.upgrades.turret.costMultiplier;

  const handleBuy = (type: 'health' | 'radius' | 'turret', cost: number) => {
    soundManager.init();
    if (score >= cost) {
      onUpgrade(type, cost);
      setFlashingStat(type);
      setTimeout(() => setFlashingStat(null), 1000);
      
      if (type === 'health') setHealthLevel(l => l + 1);
      if (type === 'radius') setRadiusLevel(l => l + 1);
      if (type === 'turret') setTurretLevel(l => l + 1);
    } else {
      soundManager.uiError();
    }
  };

  const handleNextWave = () => {
    soundManager.init();
    soundManager.uiClick();
    onNextWave();
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
         <motion.div variants={itemVariants} className="mb-8">
           <h2 className="text-2xl sm:text-3xl font-black text-white font-display mb-2 uppercase tracking-widest">
             WAVE {wave - 1} SECURED
           </h2>
           <div className="h-px w-16 bg-white/20 mx-auto mb-2" />
           <p className="text-zinc-500 font-mono tracking-widest text-[10px] uppercase">Connection established. Select upgrades...</p>
         </motion.div>
         
         <motion.div variants={itemVariants} className="inline-flex items-center space-x-3 bg-black/40 backdrop-blur-md border-[0.5px] border-white/10 px-6 py-2 rounded-full mb-8">
           <span className="text-zinc-500 font-medium uppercase text-[10px] tracking-[0.2em]">Credits</span>
           <span className="text-xl font-medium font-mono text-white tracking-widest">
             {score.toString().padStart(6, '0')}
           </span>
         </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Health Upgrade */}
          <motion.div 
            variants={cardVariants} 
            onMouseEnter={() => { handleHover(); setHoveredUpgrade('health'); }}
            onMouseLeave={() => setHoveredUpgrade(null)}
            animate={
              flashingStat === 'health' 
                ? { scale: [1, 1.08, 1], boxShadow: ["0 0 0px #fff0", "0 0 50px #fff4", "0 0 0px #fff0"] } 
                : score >= healthCost 
                  ? { 
                      boxShadow: [
                        "0 0 0px rgba(255,255,255,0)", 
                        "0 0 20px rgba(255,255,255,0.05)", 
                        "0 0 0px rgba(255,255,255,0)"
                      ],
                      transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
                    }
                  : "visible"
            }
            className={`group relative bg-black/60 backdrop-blur-md p-6 rounded-3xl border-[0.5px] transition-all duration-300 flex flex-col items-center ${
              score >= healthCost ? 'border-white/20' : 'border-white/10'
            } hover:border-white/40`}
          >
            <AnimatePresence>
              {hoveredUpgrade === 'health' && (
                <UpgradeTooltip 
                  title="Structural Integrity" 
                  description="Reinforce the core's hull and emergency repair systems. Vital for surviving high-density swarms that breach the outer perimeter."
                  benefits={["+50 Core HP", "Emergency Self-Repair", "Impact Absorption"]}
                />
              )}
            </AnimatePresence>
            {flashingStat === 'health' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 1, 0], scale: [0.8, 1.1, 1.2] }}
                className="absolute inset-0 bg-white/20 rounded-3xl z-10 pointer-events-none"
              />
            )}
            <div className="absolute top-4 right-4 text-zinc-500 text-[10px] font-medium px-1.5 py-0.5 rounded font-mono border border-white/10 group-hover:border-white/30 transition-colors">
              Lv {healthLevel}
            </div>
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 group-hover:border-white/30 relative">
              {score >= healthCost && (
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-white/5 rounded-full"
                />
              )}
              <Heart className="w-6 h-6 text-zinc-300 group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-bold text-lg font-display text-white mb-2 tracking-wide uppercase">Base Health</h3>
            <p className="text-xs text-zinc-500 mb-2 text-center leading-relaxed font-mono">
              Increase structural integrity by <span className="text-white font-bold">{GameConfig.upgrades.health.healAmount}</span> units.
            </p>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] text-emerald-400/80 font-mono mb-4 text-center">
              PREVENTS TERMINATION FROM CRITICAL BREACHES.
            </div>
            <div className="flex-grow" />
            <button 
              onClick={() => handleBuy('health', healthCost)}
              onMouseEnter={handleHover}
              aria-disabled={score < healthCost}
              aria-label={`Buy Core Structure upgrade for ${healthCost} credits`}
              className={`w-full py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center space-x-3 relative overflow-hidden ${
                score >= healthCost 
                  ? 'bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                  : 'bg-transparent border-[0.5px] border-white/10 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <span>{score >= healthCost ? 'Initialize' : 'Insufficient'}</span>
              <span className={`font-mono ${score >= healthCost ? 'text-zinc-500' : 'text-zinc-700'}`}>[{healthCost}]</span>
              {score >= healthCost && (
                 <motion.div 
                  animate={{ left: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 pointer-events-none"
                 />
              )}
            </button>
          </motion.div>

          {/* Radius Upgrade */}
          <motion.div 
            variants={cardVariants} 
            onMouseEnter={() => { handleHover(); setHoveredUpgrade('radius'); }}
            onMouseLeave={() => setHoveredUpgrade(null)}
            animate={
              flashingStat === 'radius' 
                ? { scale: [1, 1.08, 1], boxShadow: ["0 0 0px #0ff0", "0 0 50px #0ff4", "0 0 0px #0ff0"] } 
                : score >= radiusCost 
                  ? { 
                      boxShadow: [
                        "0 0 0px rgba(59,130,246,0)", 
                        "0 0 20px rgba(59,130,246,0.1)", 
                        "0 0 0px rgba(59,130,246,0)"
                      ],
                      transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
                    }
                  : "visible"
            }
            className={`group relative bg-black/60 backdrop-blur-md p-6 rounded-3xl border-[0.5px] transition-all duration-300 flex flex-col items-center ${
              score >= radiusCost ? 'border-blue-500/30' : 'border-white/10'
            } hover:border-blue-500/50`}
          >
            <AnimatePresence>
              {hoveredUpgrade === 'radius' && (
                <UpgradeTooltip 
                  title="Wave Resonance" 
                  description="Optimize the kinetic frequency of manual clicks to generate larger suppression fields. Perfect for clearing clusters of low-health enemies."
                  benefits={["+25% Effective Area", "Chain Reaction Chance", "Kinetic Dampening"]}
                />
              )}
            </AnimatePresence>
            {flashingStat === 'radius' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 1, 0], scale: [0.8, 1.1, 1.2] }}
                className="absolute inset-0 bg-blue-500/20 rounded-3xl z-10 pointer-events-none"
              />
            )}
            <div className="absolute top-4 right-4 text-zinc-500 text-[10px] font-medium px-1.5 py-0.5 rounded font-mono border border-white/10 group-hover:border-white/30 transition-colors">
              Lv {radiusLevel}
            </div>
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 group-hover:border-white/30 relative">
              {score >= radiusCost && (
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
                  className="absolute inset-0 bg-blue-500/10 rounded-full"
                />
              )}
              <Crosshair className="w-6 h-6 text-zinc-300 group-hover:text-blue-400 transition-colors" />
            </div>
            <h3 className="font-bold text-lg font-display text-white mb-2 tracking-wide uppercase">Click Radius</h3>
            <p className="text-xs text-zinc-500 mb-2 text-center leading-relaxed font-mono">
              Expand suppression wave coverage by <span className="text-white font-bold">{(GameConfig.upgrades.radius.radiusMultiplier - 1) * 100}%</span>.
            </p>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] text-blue-400/80 font-mono mb-4 text-center">
              CLEARS MULTIPLE THREATS IN A SINGLE INITIALIZATION.
            </div>
            <div className="flex-grow" />
            <button 
              onClick={() => handleBuy('radius', radiusCost)}
              onMouseEnter={handleHover}
              aria-disabled={score < radiusCost}
              aria-label={`Buy Blast Radius upgrade for ${radiusCost} credits`}
              className={`w-full py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center space-x-3 relative overflow-hidden ${
                score >= radiusCost 
                  ? 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
                  : 'bg-transparent border-[0.5px] border-white/10 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <span>{score >= radiusCost ? 'Initialize' : 'Insufficient'}</span>
              <span className={`font-mono ${score >= radiusCost ? 'text-blue-200' : 'text-zinc-700'}`}>[{radiusCost}]</span>
              {score >= radiusCost && (
                 <motion.div 
                  animate={{ left: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear", delay: 0.5 }}
                  className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 pointer-events-none"
                 />
              )}
            </button>
          </motion.div>

          {/* Turret Upgrade */}
          <motion.div 
            variants={cardVariants} 
            onMouseEnter={() => { handleHover(); setHoveredUpgrade('turret'); }}
            onMouseLeave={() => setHoveredUpgrade(null)}
            animate={
              flashingStat === 'turret' 
                ? { scale: [1, 1.08, 1], boxShadow: ["0 0 0px #f900", "0 0 50px #f904", "0 0 0px #f900"] } 
                : score >= turretCost 
                  ? { 
                      boxShadow: [
                        "0 0 0px rgba(249,115,22,0)", 
                        "0 0 20px rgba(249,115,22,0.1)", 
                        "0 0 0px rgba(249,115,22,0)"
                      ],
                      transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
                    }
                  : "visible"
            }
            className={`group relative bg-black/60 backdrop-blur-md p-6 rounded-3xl border-[0.5px] transition-all duration-300 flex flex-col items-center ${
              score >= turretCost ? 'border-orange-500/30' : 'border-white/10'
            } hover:border-orange-500/50`}
          >
            <AnimatePresence>
              {hoveredUpgrade === 'turret' && (
                <UpgradeTooltip 
                  title="Automated Acquisition" 
                  description="Upgrade the sentry's processing core to decrease the latency between shots. Essential for hands-free defense on later waves."
                  benefits={["-0.2s Reload Delay", "Target Prediction", "Enhanced Sensors"]}
                />
              )}
            </AnimatePresence>
            {flashingStat === 'turret' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 1, 0], scale: [0.8, 1.1, 1.2] }}
                className="absolute inset-0 bg-orange-500/20 rounded-3xl z-10 pointer-events-none"
              />
            )}
            <div className="absolute top-4 right-4 text-zinc-500 text-[10px] font-medium px-1.5 py-0.5 rounded font-mono border border-white/10 group-hover:border-white/30 transition-colors">
              Lv {turretLevel}
            </div>
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 group-hover:border-white/30 relative">
              {score >= turretCost && (
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
                  className="absolute inset-0 bg-orange-500/10 rounded-full"
                />
              )}
              <Zap className="w-6 h-6 text-zinc-300 group-hover:text-orange-400 transition-colors" />
            </div>
            <h3 className="font-bold text-lg font-display text-white mb-2 tracking-wide uppercase">Auto-Turret Firing Rate</h3>
            <p className="text-xs text-zinc-500 mb-2 text-center leading-relaxed font-mono">
              Decrease automated target acquisition latency by <span className="text-white font-bold">{GameConfig.upgrades.turret.fireRateReduction}s</span>.
            </p>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] text-orange-400/80 font-mono mb-4 text-center">
              INCREASES AUTOMATED DEFENSE REACTION TIMES.
            </div>
            <div className="flex-grow" />
            <button 
              onClick={() => handleBuy('turret', turretCost)}
              onMouseEnter={handleHover}
              aria-disabled={score < turretCost}
              aria-label={`Buy Auto-Sentry upgrade for ${turretCost} credits`}
              className={`w-full py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center space-x-3 relative overflow-hidden ${
                score >= turretCost 
                  ? 'bg-orange-600 text-white hover:bg-orange-500 hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.4)]' 
                  : 'bg-transparent border-[0.5px] border-white/10 text-zinc-600 cursor-not-allowed'
              }`}
            >
             <span>{score >= turretCost ? 'Initialize' : 'Insufficient'}</span>
             <span className={`font-mono ${score >= turretCost ? 'text-orange-200' : 'text-zinc-700'}`}>[{turretCost}]</span>
              {score >= turretCost && (
                 <motion.div 
                  animate={{ left: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear", delay: 1 }}
                  className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 pointer-events-none"
                 />
              )}
            </button>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button 
            onClick={onOpenProgression}
            onMouseEnter={handleHover}
            className="group relative px-12 py-5 bg-white/5 border border-white/20 text-blue-400 font-bold text-sm hover:bg-blue-600 hover:text-white rounded-full hover:scale-105 active:scale-95 transition-all tracking-widest uppercase flex items-center space-x-3"
          >
            <Hammer className="w-5 h-5" />
            <span>Technical Progression Hub</span>
          </button>

          <button 
            onClick={handleNextWave}
            onMouseEnter={handleHover}
            aria-label={`Start Wave ${wave}`}
            className="group relative px-12 py-5 bg-transparent border-[0.5px] border-white/30 text-white font-bold text-sm hover:bg-white hover:text-black rounded-full hover:scale-105 active:scale-95 transition-all tracking-widest uppercase overflow-hidden"
          >
            <span className="relative z-10">Proceed to Wave {wave}</span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
