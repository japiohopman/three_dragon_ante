
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimationStore } from '../store/useAnimationStore';
import { useGameStore } from '../store/useGameStore';

// Sub-component to handle the mount->animate lifecycle for each coin
const Coin: React.FC<{
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
}> = ({ startX, startY, endX, endY, delay }) => {
  const [style, setStyle] = useState<React.CSSProperties>({
    left: `${startX}px`,
    top: `${startY}px`,
    opacity: 0,
    transform: 'scale(0.5)'
  });

  useEffect(() => {
    let mounted = true;

    // Phase 1: Mount (Invisible but present)
    const t1 = setTimeout(() => {
        if (mounted) {
            setStyle({
                left: `${startX}px`,
                top: `${startY}px`,
                opacity: 1,
                transform: `translate(${endX - startX}px, ${endY - startY}px) rotate(${Math.random() * 720}deg)`,
                transition: `transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms, opacity 0.3s ease-in ${delay}ms`
            });
        }
    }, 50);

    // Phase 2: Fade out at destination
    const t2 = setTimeout(() => {
        if (mounted) {
            setStyle(prev => ({
                ...prev,
                opacity: 0,
                transition: 'opacity 0.2s ease-out'
            }));
        }
    }, 800 + delay);

    return () => {
        mounted = false;
        clearTimeout(t1);
        clearTimeout(t2);
    };
  }, [startX, startY, endX, endY, delay]);

  return (
    <div
      className="absolute w-6 h-6 rounded-full bg-yellow-400 border-2 border-yellow-600 shadow-md flex items-center justify-center z-50 pointer-events-none"
      style={style}
    >
       <div className="w-4 h-4 rounded-full border border-yellow-200/50" />
    </div>
  );
};

const FloatingText: React.FC<{ x: number; y: number; text: string; color: string }> = ({ x, y, text, color }) => {
    const colorClass = color === 'gold' ? 'text-amber-300 text-shadow-gold'
                     : color === 'red' ? 'text-red-500 text-shadow-red'
                     : 'text-white text-shadow-black';

    return (
        <div
            className={`absolute z-[80] pointer-events-none font-gothic text-5xl font-bold animate-float-up ${colorClass}`}
            style={{ left: x, top: y }}
        >
            {text}
        </div>
    );
};

const VFXLayer: React.FC = () => {
  const { activeCoins, floatingTexts, showTurnBanner, activePlayer, flashColor, specialEffect } = useAnimationStore();
  const [isMounted, setIsMounted] = useState(true);

  // Safety check to prevent updates after unmount
  useEffect(() => {
      return () => setIsMounted(false);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">

      {/* SCREEN FLASH OVERLAY */}
      <div
        className="absolute inset-0 z-[90] pointer-events-none transition-opacity duration-150 ease-out mix-blend-overlay"
        style={{ backgroundColor: flashColor || 'transparent', opacity: flashColor ? 1 : 0 }}
      />

      {/* --- SPECIAL CARD EFFECTS --- */}

      {/* FIRE (Red Dragon) */}
      {specialEffect === 'fire' && (
        <div className="absolute inset-0 z-[60] animate-fire-pulse bg-gradient-to-t from-red-900/40 via-transparent to-red-900/40 mix-blend-hard-light pointer-events-none"></div>
      )}

      {/* POISON (Green Dragon) */}
      {specialEffect === 'poison' && (
        <div className="absolute inset-0 z-[60] bg-green-900/30 mix-blend-color-dodge animate-pulse pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-500/20 via-transparent to-transparent opacity-50"></div>
        </div>
      )}

      {/* LIGHTNING (Blue Dragon) */}
      {specialEffect === 'lightning' && (
         <div className="absolute inset-0 z-[95] bg-blue-100/30 mix-blend-overlay animate-pulse pointer-events-none"></div>
      )}

      {/* DIVINE (Bahamut/Gold/Princess) */}
      {specialEffect === 'divine' && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none overflow-hidden">
             <div className="w-[150vw] h-[150vw] bg-[conic-gradient(from_0deg_at_50%_50%,rgba(251,191,36,0)_0deg,rgba(251,191,36,0.3)_30deg,rgba(251,191,36,0)_60deg,rgba(251,191,36,0.3)_90deg,rgba(251,191,36,0)_120deg,rgba(251,191,36,0.3)_150deg,rgba(251,191,36,0)_180deg,rgba(251,191,36,0.3)_210deg,rgba(251,191,36,0)_240deg,rgba(251,191,36,0.3)_270deg,rgba(251,191,36,0)_300deg,rgba(251,191,36,0.3)_330deg,rgba(251,191,36,0)_360deg)] animate-divine-spin opacity-50 mix-blend-screen"></div>
        </div>
      )}

      {/* NECROTIC (Dracolich/Black) */}
      {specialEffect === 'necrotic' && (
         <div className="absolute inset-0 z-[60] bg-purple-900/40 mix-blend-exclusion animate-pulse pointer-events-none"></div>
      )}

      {/* SLASH (Dragonslayer) */}
      {specialEffect === 'slash' && (
         <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 1000 600" preserveAspectRatio="none">
               <path d="M-100,700 L1100,-100" stroke="#fca5a5" strokeWidth="15" fill="none" className="animate-slash-draw" style={{ strokeDasharray: 1500, filter: 'drop-shadow(0 0 10px red)' }} />
            </svg>
         </div>
      )}

      {/* CHROMATIC (Tiamat) */}
      {specialEffect === 'chromatic' && (
         <div className="absolute inset-0 z-[85] animate-chromatic bg-gradient-to-tr from-red-500/20 via-green-500/20 to-blue-500/20 mix-blend-overlay pointer-events-none"></div>
      )}


      {/* COIN PARTICLES */}
      {activeCoins.map((coin) => (
        <Coin
          key={coin.id}
          startX={coin.startX}
          startY={coin.startY}
          endX={coin.endX}
          endY={coin.endY}
          delay={coin.delay}
        />
      ))}

      {/* FLOATING TEXTS */}
      {floatingTexts.map((ft) => (
          <FloatingText key={ft.id} x={ft.x} y={ft.y} text={ft.text} color={ft.color} />
      ))}

      {/* TURN BANNER - Editorial Style */}
      <AnimatePresence>
        {showTurnBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: activePlayer === 'player' ? -200 : 200, skewX: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0, skewX: -10 }}
            exit={{ opacity: 0, scale: 1.2, x: activePlayer === 'player' ? 200 : -200, skewX: -10 }}
            transition={{ type: 'spring', damping: 15, stiffness: 100 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-[100]"
          >
            <div className="relative">
              {/* Massive Background Text */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10 select-none">
                <h1 className="text-[25vw] font-black uppercase leading-none tracking-tighter whitespace-nowrap text-stone-100">
                  {activePlayer === 'player' ? 'YOUR TURN' : (useGameStore.getState().npcId ? useGameStore.getState().npcId.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'OPPONENT')}
                </h1>
              </div>

              {/* Main Banner Content */}
              <div className="bg-stone-900/90 border-y-4 border-amber-500/50 backdrop-blur-xl px-24 py-8 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
                {/* Animated scanline effect */}
                <motion.div
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent w-1/2 skew-x-12"
                />

                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-amber-500/70 text-xs font-mono uppercase tracking-[0.5em] mb-2">
                    {activePlayer === 'player' ? 'Initiative Gained' : 'Opponent Action'}
                  </span>
                  <h2 className="text-7xl sm:text-9xl font-black text-stone-100 uppercase leading-none tracking-tighter italic">
                    {activePlayer === 'player' ? 'Your Turn' : `${useGameStore.getState().npcId ? useGameStore.getState().npcId.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'Opponent'}'s Turn`}
                  </h2>
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-4" />
                </div>
              </div>

              {/* Micro-labels */}
              <div className="absolute -bottom-12 left-0 right-0 flex justify-between px-4">
                <span className="text-[10px] text-amber-500/50 uppercase font-mono tracking-widest">System: Turn_Transition_Active</span>
                <span className="text-[10px] text-amber-500/50 uppercase font-mono tracking-widest">Phase: {activePlayer === 'player' ? 'Player_Input' : 'AI_Reasoning'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VFXLayer;
