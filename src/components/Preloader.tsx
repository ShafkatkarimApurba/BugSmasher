import { useEffect, useState } from 'react';
import { assetManager } from '../game/AssetManager';
import { Bug } from 'lucide-react';

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [readouts, setReadouts] = useState<string[]>([]);
  
  const strings = [
    "INITIATING PROJECT NEXUS...",
    "HANDSHAKE WITH CORE... OK",
    "DECRYPTING SECTOR 7 DATA...",
    "CALIBRATING OPTIC NEURAL SENSORS...",
    "MOUNTING QUANTUM VOLUMES...",
    "SUPPRESSING EMOTIONAL SUBROUTINES...",
    "READY TO CONNECT."
  ];

  useEffect(() => {
    let mounted = true;
    
    const interval = setInterval(() => {
        if (!mounted) return;
        setReadouts(prev => {
            const nextIdx = prev.length;
            if (nextIdx < strings.length) return [...prev, strings[nextIdx]];
            return prev;
        });
    }, 400);

    assetManager.preloadAll((p) => {
      if (mounted) setProgress(p);
    }).then(() => {
      if (mounted) {
        setTimeout(() => {
          onComplete();
        }, 1500); 
      }
    });

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <div className="relative flex flex-col items-center justify-center h-full bg-black text-white font-mono">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(#111_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>
      
      <div className="z-10 flex flex-col items-center max-w-md w-full px-8">
        <Bug className="w-12 h-12 text-white mb-12 animate-bounce" />
        
        <div className="w-full space-y-1 mb-8 overflow-hidden h-32">
            {readouts.map((r, i) => (
                <div key={i} className="text-[10px] text-zinc-500 uppercase tracking-tighter opacity-70">
                    <span className="text-zinc-700 mr-2">[{new Date().toISOString().split('T')[1].split('.')[0]}]</span> {r}
                </div>
            ))}
        </div>

        <div className="w-full h-[1px] bg-zinc-800 relative mb-4">
            <div 
              className="absolute top-0 left-0 h-full bg-white shadow-[0_0_15px_#fff] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
        </div>
        
        <div className="flex justify-between w-full text-[9px] text-zinc-600 uppercase tracking-widest font-black">
          <span>Uplink Established</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
}
