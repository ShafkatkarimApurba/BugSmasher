import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Database, ShieldAlert, Cpu, Volume2, VolumeX } from 'lucide-react';
import { DialogueLine } from '../data/lore';
import { soundManager } from '../game/SoundManager';

interface StoryCutsceneProps {
  lines: DialogueLine[];
  onComplete: () => void;
}

export const StoryCutscene = ({ lines, onComplete }: StoryCutsceneProps) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const voicePlayedRef = useRef(false);

  const currentLine = lines[currentLineIndex];

  // Typing animation effect (only depends on line changes, not voiceEnabled)
  useEffect(() => {
    let index = 0;
    setIsTyping(true);
    setDisplayedText('');
    voicePlayedRef.current = false;
    
    soundManager.stopSpeaking();
    
    const typingSpeed = currentLine.speed || 30;
    
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + (currentLine.text[index] || ''));
      index++;
      
      if (index >= currentLine.text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, typingSpeed);

    return () => {
      clearInterval(interval);
      soundManager.stopSpeaking();
    };
  }, [currentLineIndex]);

  // Separate voice playback effect (only triggers when text is fully revealed and voice is enabled)
  useEffect(() => {
    if (!isTyping && !voicePlayedRef.current && voiceEnabled) {
      voicePlayedRef.current = true;
      soundManager.speak({
        text: currentLine.text,
        speaker: currentLine.speaker,
        mood: currentLine.mood,
      });
    }
  }, [isTyping, voiceEnabled, currentLine.text, currentLine.speaker, currentLine.mood]);

  const handleNext = () => {
    if (isTyping) {
      setDisplayedText(currentLine.text);
      setIsTyping(false);
      return;
    }

    soundManager.uiClick();
    soundManager.stopSpeaking();
    
    if (currentLineIndex < lines.length - 1) {
      setCurrentLineIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const renderPortrait = () => {
    const moodClass = currentLine.mood === 'glitch' ? 'animate-pulse text-red-600' : 
                      currentLine.mood === 'shiver' ? 'animate-bounce' : '';
    
    switch (currentLine.portrait) {
      case 'ai_stable':
        return <Cpu className={`w-12 h-12 text-cyan-400 ${moodClass}`} />;
      case 'ai_corrupted':
        return <Cpu className={`w-12 h-12 text-red-500 ${moodClass}`} />;
      case 'terminal':
        return <Terminal className={`w-12 h-12 text-emerald-500 ${moodClass}`} />;
      case 'unknown':
        return <ShieldAlert className={`w-12 h-12 text-amber-500 ${moodClass}`} />;
      default:
        return <Database className={`w-12 h-12 text-zinc-500 ${moodClass}`} />;
    }
  };

  const getMoodStyles = () => {
    switch (currentLine.mood) {
      case 'glitch': return 'text-red-500 scanline-glitch';
      case 'shiver': return 'animate-[wiggle_0.2s_ease-in-out_infinite]';
      case 'alert': return 'text-amber-400 font-bold';
      default: return 'text-white';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 font-pixel"
    >
      {/* Scanline Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-50"></div>
      
      <motion.div 
        animate={currentLine.mood === 'glitch' ? { x: [-2, 2, -1, 1, 0] } : {}}
        transition={{ repeat: Infinity, duration: 0.1 }}
        className="w-full max-w-2xl aspect-video bg-zinc-950 border-4 border-zinc-800 rounded-lg relative overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)]"
      >
        {/* Top Header */}
        <div className={`px-4 py-2 flex justify-between items-center border-b-2 transition-colors duration-500 ${currentLine.mood === 'alert' ? 'bg-red-900/40 border-red-700' : 'bg-zinc-800 border-zinc-700'}`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${currentLine.mood === 'alert' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
            <span className={`text-[10px] uppercase tracking-widest ${currentLine.mood === 'alert' ? 'text-red-400' : 'text-zinc-400'}`}>
              {currentLine.mood === 'alert' ? 'SYSTEM_CRITICAL' : 'Aegis-7 Terminal'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (voiceEnabled) {
                  soundManager.stopSpeaking();
                  setVoiceEnabled(false);
                } else {
                  setVoiceEnabled(true);
                }
              }}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title={voiceEnabled ? 'Voice enabled' : 'Voice muted'}
            >
              {voiceEnabled 
                ? <Volume2 className="w-3 h-3 text-emerald-400" /> 
                : <VolumeX className="w-3 h-3 text-zinc-600" />
              }
            </button>
            <span className="text-[10px] text-zinc-500">CH_0{currentLineIndex + 1}</span>
          </div>
        </div>

        {/* Visuals Area */}
        <div className="flex-1 flex items-center justify-center relative bg-black/40 overflow-hidden">
           {/* Matrix-like background for glitch effect */}
           {currentLine.mood === 'glitch' && (
             <div className="absolute inset-0 grid grid-cols-20 gap-1 p-2 opacity-10">
                {Array.from({ length: 100 }).map((_, i) => (
                   <div key={i} className="text-[6px] text-red-500 overflow-hidden">{Math.random() > 0.5 ? '1' : '0'}</div>
                ))}
             </div>
           )}

           <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="grid grid-cols-10 gap-2 p-4">
                {Array.from({ length: 40 }).map((_, i) => (
                   <div key={i} className="h-4 bg-zinc-900/50 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                ))}
              </div>
           </div>
           
           <motion.div 
             key={currentLine.portrait}
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="relative z-10 p-8 border-2 border-zinc-700 bg-zinc-900/80 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.5)]"
           >
             {renderPortrait()}
           </motion.div>
        </div>

        {/* Dialogue Box (GameBoy Style) */}
        <div 
          onClick={handleNext}
          className={`h-44 border-t-4 transition-colors duration-500 p-6 relative cursor-pointer group ${currentLine.mood === 'alert' ? 'bg-red-950/20 border-red-800' : 'bg-zinc-900 border-zinc-700'}`}
        >
          <div className="mb-2 flex justify-between items-center">
            <span className={`text-[8px] uppercase tracking-tighter ${currentLine.mood === 'alert' ? 'text-red-500' : 'text-zinc-500'}`}>
              {currentLine.speaker}
            </span>
            <div className="flex space-x-1">
               <div className="w-1 h-1 bg-zinc-700 rounded-full"></div>
               <div className="w-1 h-1 bg-zinc-600 rounded-full"></div>
            </div>
          </div>
          
          <div className={`text-[11px] leading-relaxed line-clamp-3 select-none ${getMoodStyles()}`}>
            {displayedText}
            {isTyping && <span className="inline-block w-2 h-4 bg-zinc-400 ml-1 animate-pulse" />}
          </div>

          {!isTyping && (
            <motion.div 
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="absolute bottom-4 right-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-zinc-400"
            />
          )}
        </div>
      </motion.div>

      <div className="mt-8 flex flex-col items-center space-y-4 opacity-30">
         <div className="flex space-x-6">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-800 flex items-center justify-center">
               <div className="w-2 h-2 bg-zinc-700 rounded-full"></div>
            </div>
            <div className="w-8 h-8 rounded-full border-2 border-zinc-800 flex items-center justify-center">
               <div className="w-2 h-2 bg-zinc-700 rounded-full"></div>
            </div>
         </div>
         <span className="text-[7px] text-zinc-700 tracking-[0.5em] uppercase">Tactical_Comms_Interface</span>
      </div>
    </motion.div>
  );
};
