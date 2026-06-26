import { useState, useEffect } from 'react';
import { Hammer, BrainCircuit, Box, X, Zap, Cpu, Shield, Wrench, FlaskConical, Target, Binary } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProgressionManager, ProgressionData } from '../game/ProgressionManager';
import { RESOURCES, RECIPES, SKILLS, ResourceType } from '../game/ResourceTypes';
import { soundManager } from '../game/SoundManager';

interface ProgressionCenterProps {
  onClose: () => void;
}

export function ProgressionCenter({ onClose }: ProgressionCenterProps) {
  const [activeTab, setActiveTab] = useState<'crafting' | 'skills' | 'inventory'>('crafting');
  const [data, setData] = useState<ProgressionData>(ProgressionManager.getData());

  useEffect(() => {
    return ProgressionManager.subscribe(() => {
      setData(ProgressionManager.getData());
    });
  }, []);

  const handleCraft = (recipeId: string, ingredients: Partial<Record<ResourceType, number>>) => {
    if (ProgressionManager.craftItem(recipeId, ingredients)) {
      soundManager.skillUpgrade();
      setData(ProgressionManager.getData());
    } else {
      soundManager.uiError();
    }
  };

  const handleUpgradeSkill = (skillId: string) => {
    if (ProgressionManager.upgradeSkill(skillId)) {
      soundManager.skillUpgrade();
      setData(ProgressionManager.getData());
    } else {
      soundManager.uiError();
    }
  };

  return (
    <div className="absolute inset-0 bg-black/95 z-[60] backdrop-blur-2xl flex flex-col p-6 sm:p-10 font-sans text-white overflow-hidden">
      <div className="max-w-6xl w-full mx-auto flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase flex items-center space-x-3">
              <Binary className="text-blue-500 w-8 h-8" />
              <span>Technical Progression Hub</span>
            </h2>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-1">Authorized Access Only // Operative: Nexus-01</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Resource Ribbon */}
        <div className="flex flex-wrap gap-4 mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
          {Object.entries(RESOURCES).map(([id, res]) => (
            <div key={id} className="flex items-center space-x-2 px-3 py-1 bg-black/40 rounded-lg border border-white/5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: res.color }} />
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{res.name}</span>
              <span className="text-sm font-black font-mono">{data.inventory[id as ResourceType] || 0}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 border-b border-white/10 pb-4">
          <TabButton 
            active={activeTab === 'crafting'} 
            onClick={() => setActiveTab('crafting')}
            icon={<Hammer className="w-4 h-4" />}
            label="Assembly"
          />
          <TabButton 
            active={activeTab === 'skills'} 
            onClick={() => setActiveTab('skills')}
            icon={<BrainCircuit className="w-4 h-4" />}
            label="Neural Upgrades"
          />
          <TabButton 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')}
            icon={<Box className="w-4 h-4" />}
            label="Storage"
          />
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto pr-4 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'crafting' && (
              <motion.div 
                key="crafting"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {RECIPES.map(recipe => (
                   <CraftCard 
                    key={recipe.id}
                    recipe={recipe}
                    inventory={data.inventory}
                    count={data.consumables[recipe.id] || 0}
                    onCraft={() => handleCraft(recipe.id, recipe.ingredients)}
                   />
                ))}
              </motion.div>
            )}

            {activeTab === 'skills' && (
              <motion.div 
                key="skills"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {SKILLS.map(skill => (
                  <SkillCard 
                    key={skill.id}
                    skill={skill}
                    inventory={data.inventory}
                    level={data.skills[skill.id] || 0}
                    onUpgrade={() => handleUpgradeSkill(skill.id)}
                  />
                ))}
              </motion.div>
            )}

            {activeTab === 'inventory' && (
              <motion.div 
                key="inventory"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                   {Object.entries(RESOURCES).map(([id, res]) => (
                     <div key={id} className="p-6 bg-white/5 rounded-3xl border border-white/5 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center border border-white/10" style={{ boxShadow: `0 0 20px ${res.color}22` }}>
                           <div className="w-4 h-4 rounded-sm rotate-45" style={{ backgroundColor: res.color }} />
                        </div>
                        <h4 className="font-bold text-xs uppercase tracking-tighter mb-1">{res.name}</h4>
                        <p className="text-[10px] text-zinc-500 font-mono mb-3">{res.rarity.toUpperCase()}</p>
                        <p className="text-2xl font-black font-mono">{data.inventory[id as ResourceType] || 0}</p>
                     </div>
                   ))}
                </div>
                
                <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                   <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-6">Manifested Consumables</h3>
                   <div className="flex flex-wrap gap-4">
                      {Object.entries(data.consumables).map(([id, count]) => {
                        const recipe = RECIPES.find(r => r.id === id);
                        if (!recipe) return null;
                        return (
                          <div key={id} className="flex items-center space-x-4 px-6 py-4 bg-black/40 rounded-2xl border border-white/5">
                             <div className="text-blue-400"><Wrench className="w-5 h-5" /></div>
                             <div>
                                <p className="text-xs font-bold uppercase tracking-wide">{recipe.name}</p>
                                <p className="text-xl font-black font-mono">{count}</p>
                             </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
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

function CraftCard({ recipe, inventory, count, onCraft }: { recipe: any, inventory: any, count: number, onCraft: () => void }) {
  const canCraft = Object.entries(recipe.ingredients).every(([res, amount]) => (inventory[res] || 0) >= (amount as number));

  return (
    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex flex-col hover:border-white/20 transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-blue-400 group-hover:scale-110 transition-transform">
          <Wrench className="w-6 h-6" />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono text-zinc-500 uppercase mb-1">In Stock</p>
          <p className="text-lg font-black font-mono">{count}</p>
        </div>
      </div>
      
      <h3 className="text-lg font-black tracking-tight mb-2">{recipe.name}</h3>
      <p className="text-xs text-zinc-500 font-medium leading-relaxed mb-6">{recipe.description}</p>
      
      <div className="space-y-3 mb-8">
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Requirements</p>
        {Object.entries(recipe.ingredients).map(([res, amount]) => {
          const resDef = RESOURCES[res as ResourceType];
          const has = inventory[res] || 0;
          const needed = amount as number;
          return (
            <div key={res} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: resDef.color }} />
                <span className="text-[10px] font-mono text-zinc-400 uppercase">{resDef.name}</span>
              </div>
              <span className={`text-[10px] font-mono font-bold ${has >= needed ? 'text-zinc-400' : 'text-red-500'}`}>
                {has}/{needed}
              </span>
            </div>
          );
        })}
      </div>

      <button 
        onClick={onCraft}
        disabled={!canCraft}
        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
          canCraft 
            ? 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)]' 
            : 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/5'
        }`}
      >
        Initiate Assembly
      </button>
    </div>
  );
}

function SkillCard({ skill, inventory, level, onUpgrade }: { skill: any, inventory: any, level: number, onUpgrade: () => void }) {
  const cost = skill.costPerLevel(level);
  const canUpgrade = Object.entries(cost).every(([res, amount]) => (inventory[res] || 0) >= (amount as number)) && level < skill.maxLevel;

  return (
    <div className="p-8 bg-white/5 rounded-3xl border border-white/5 flex flex-col hover:border-white/20 transition-all group">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black tracking-tighter">{skill.name}</h3>
        <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] font-mono font-black text-blue-400 uppercase">
          RANK {level} / {skill.maxLevel}
        </div>
      </div>
      
      <p className="text-sm text-zinc-400 mb-8">{skill.description}</p>
      
      <div className="bg-black/40 p-6 rounded-2xl border border-white/5 mb-8">
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-4">Upgrade Path Cost</p>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(cost).map(([res, amount]) => {
            if (!amount) return null;
            const resDef = RESOURCES[res as ResourceType];
            const has = inventory[res] || 0;
            const needed = amount as number;
            return (
              <div key={res} className="flex flex-col space-y-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase">{resDef.name}</span>
                <span className={`text-xs font-mono font-black ${has >= needed ? 'text-white' : 'text-red-500'}`}>
                  {has} / {needed}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <button 
        onClick={onUpgrade}
        disabled={!canUpgrade}
        className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
          canUpgrade 
            ? 'bg-white text-black hover:bg-zinc-200 active:scale-95' 
            : 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/5'
        }`}
      >
        {level >= skill.maxLevel ? 'MAX RANK SECURED' : 'Engage Neural Link'}
      </button>
    </div>
  );
}
