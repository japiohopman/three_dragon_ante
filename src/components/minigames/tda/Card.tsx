
import React, { useEffect, useState, useRef } from 'react';
import { CardData, Suit, Rank } from '../../../types';
import { SPRITE_MAP, ATLAS_URL, ATLAS_URL_SMALL } from '../../../utils/constants';
import { useAnimationStore } from '../../../store/useAnimationStore';
import { getIcon } from '../../../assets/icons';

interface CardProps {
  card?: CardData;
  spriteIndex?: number;
  rank?: Rank;
  suit?: Suit;
  isFaceUp?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  glow?: 'blue' | 'red' | 'gold' | 'none';
  inverted?: boolean; // Legacy prop, now mainly used to flip back-radius
  shape?: 'standard' | 'mirrored'; // New prop for specific corner rounding
  animationType?: 'draw' | 'slam' | 'opponent-draw' | 'discard' | 'play-player' | 'play-opponent' | 'none';
  variant?: 'tda' | 'standard' | 'simple';
  disableFocus?: boolean;
  radius?: number;
  size?: 'sm' | 'lg';
}

const sizeConfig = {
  sm: {
    strengthText: 'text-3xl',
    strengthMargin: 'top-1 left-1',
    strengthMarginInv: 'bottom-5 right-1',
    footerBottom: 'bottom-8',
    footerPadding: 'pb-1',
    paddingRight: 'pr-4',
    iconSize: 'w-3 h-3',
  },
  lg: {
    strengthText: 'text-6xl',
    strengthMargin: 'top-4 left-4',
    strengthMarginInv: 'bottom-4 right-4',
    footerBottom: 'bottom-24',
    footerPadding: 'pb-6',
    paddingRight: 'pr-24',
    iconSize: 'w-5 h-5',
  }
};

const Card: React.FC<CardProps> = ({
  card,
  spriteIndex: propSpriteIndex,
  rank,
  suit,
  isFaceUp = true,
  onClick,
  disabled,
  className = "",
  glow = 'none',
  inverted = false,
  shape = 'standard',
  animationType = 'none',
  variant = 'tda',
  disableFocus = false,
  radius = 25,
  size = 'sm'
}) => {
  const [animationClass, setAnimationClass] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const finalSpriteIndex = card ? card.spriteIndex : (propSpriteIndex ?? SPRITE_MAP.CardBack);
  const cardName = card ? card.name : '';
  const cardStr = card ? card.strength : 0;
  const config = sizeConfig[size];

  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [gleam, setGleam] = useState({ x: 50, y: 50, opacity: 0 });

  const [delayedFaceUp, setDelayedFaceUp] = useState(isFaceUp);

  const currentAtlas = size === 'sm' ? ATLAS_URL_SMALL : ATLAS_URL;

  useEffect(() => {
    const timer = setTimeout(() => {
        setDelayedFaceUp(isFaceUp);
    }, 300);
    return () => clearTimeout(timer);
  }, [isFaceUp]);

  useEffect(() => {
    switch (animationType) {
      case 'draw': setAnimationClass('animate-draw-hand'); break;
      case 'opponent-draw': setAnimationClass('animate-draw-opponent'); break;
      case 'slam': setAnimationClass('animate-slam'); break;
      case 'discard': setAnimationClass('animate-discard-in'); break;
      case 'play-player': setAnimationClass('animate-play-player'); break;
      case 'play-opponent': setAnimationClass('animate-play-opponent'); break;
      default: setAnimationClass('');
    }
  }, [animationType, card?.id]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !isFaceUp) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    setRotate({ x: rotateX, y: rotateY });
    setGleam({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 0.6 });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setGleam(prev => ({ ...prev, opacity: 0 }));
    if (card && variant === 'tda') {
        useAnimationStore.getState().setHoveredCard(null);
    }
  };

  const handleMouseEnter = () => {
    if (disabled || !isFaceUp) return;
    if (card && variant === 'tda') {
        useAnimationStore.getState().setHoveredCard(card.id);
    }
  };

  const getBackgroundPosition = (index: number) => {
    const col = index % 5;
    const row = Math.floor(index / 5);
    return `${col * 25}% ${row * 25}%`;
  };

  const getBorderColor = () => {
    if (variant === 'standard') {
        const isRedSuit = suit === 'hearts' || suit === 'diamonds';
        return isRedSuit ? 'border-amber-200' : 'border-amber-700';
    }
    const idx = card ? card.spriteIndex : propSpriteIndex;
    if (typeof idx === 'number') {
        if (idx === 0 || idx === 11) return 'border-red-600';
        if (idx === 1 || idx === 10) return 'border-blue-500';
        if (idx === 2) return 'border-emerald-600';
        if (idx === 3) return 'border-stone-900';
        if (idx === 4) return 'border-cyan-300';
        if (idx === 5 || idx === 9) return 'border-yellow-500';
        if (idx === 6) return 'border-slate-400';
        if (idx === 7 || idx === 8) return 'border-orange-600';
        if (idx >= 15 && idx <= 19) return 'border-stone-500';
        if (idx === 12) return 'border-purple-600';
    }
    if (variant === 'simple') return 'border-stone-500';
    if (!card) return 'border-stone-400';
    if (card.type === 'mortal') return 'border-stone-500';
    switch (card.color) {
      case 'red': return 'border-red-600';
      case 'blue': return 'border-blue-500';
      case 'green': return 'border-emerald-600';
      case 'black': return 'border-stone-900';
      case 'white': return 'border-cyan-300';
      case 'gold': return 'border-yellow-500';
      case 'silver': return 'border-slate-400';
      case 'bronze': return 'border-orange-700';
      case 'copper': return 'border-orange-500';
      case 'brass': return 'border-yellow-700';
      default: return card.type === 'good' ? 'border-blue-400' : 'border-red-600';
    }
  };

  const glowStyles = {
    none: '',
    blue: 'ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]',
    red: 'ring-2 ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]',
    gold: 'ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]',
  };

  const getRadiusStyle = (targetShape: 'standard' | 'mirrored') => {
    const r = `${radius}px`;
    return targetShape === 'mirrored'
        ? { borderTopLeftRadius: r, borderBottomRightRadius: r, borderTopRightRadius: 0, borderBottomLeftRadius: 0 }
        : { borderTopRightRadius: r, borderBottomLeftRadius: r, borderTopLeftRadius: 0, borderBottomRightRadius: 0 };
  };

  const getOppositeShape = (s: 'standard' | 'mirrored') => s === 'standard' ? 'mirrored' : 'standard';

  // Fix: Explicitly cast 'shape' to its union type to resolve type assignment errors on lines 175, 176, 177
  const containerRadiusStyle = getRadiusStyle(shape as 'standard' | 'mirrored');
  const frontRadiusStyle = getRadiusStyle(shape as 'standard' | 'mirrored');
  const backRadiusStyle = getRadiusStyle(getOppositeShape(shape as 'standard' | 'mirrored'));

  const bgColorClass = isFaceUp
    ? (variant === 'simple' ? 'bg-stone-200' : 'bg-[#f5f2eb]')
    : 'bg-stone-900';

  const renderDescription = (text: string) => {
    const parts = text.split(/(gold)/gi);
    return (
        <span>
            {parts.map((part, i) => {
                if (part.toLowerCase() === 'gold') {
                    return (
                        <span key={i} className="inline-flex align-middle mx-0.5">
                             {getIcon('ui', 'gold-coin', { className: `${config.iconSize} inline` })}
                        </span>
                    );
                }
                return part;
            })}
        </span>
    );
  };

  const isLegendary = card?.isLegendary || (card?.strength || 0) >= 13;

  return (
    <div
      ref={cardRef}
      className={`
        relative group perspective-1000 cursor-pointer transition-all duration-300
        ${size === 'lg'
            ? 'w-64 h-[26.88rem] sm:w-80 sm:h-[33.6rem]'
            : 'w-24 h-32 sm:w-28 sm:h-[11.76rem]'}
        ${disabled ? 'opacity-70 cursor-not-allowed' : ''}
        ${animationClass}
        ${className}
      `}
      style={{
          animationFillMode: 'forwards',
          ...containerRadiusStyle
      }}
      onClick={() => !disabled && onClick?.()}
      onContextMenu={(e) => {
          e.preventDefault();
          if (isFaceUp && variant === 'tda' && !disableFocus && card) {
              useAnimationStore.getState().setFocusedCard(card.id);
          }
      }}
      onAnimationEnd={() => setAnimationClass('')}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`relative w-full h-full duration-700 preserve-3d transition-all ${isFaceUp ? '' : 'rotate-y-180'}`}
        style={{
            transform: isFaceUp
              ? `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`
              : 'rotateY(180deg)'
        }}
      >

        {/* FRONT */}
        <div
          className={`
            absolute w-full h-full backface-hidden border overflow-hidden
            ${getBorderColor()} ${glowStyles[glow]} ${bgColorClass}
          `}
          style={{
             ...frontRadiusStyle,
             backgroundImage: `url("${currentAtlas}")`,
             backgroundSize: '500% 500%',
             backgroundPosition: getBackgroundPosition(finalSpriteIndex),
             backgroundRepeat: 'no-repeat',
             boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
          }}
        >
          {/* Holographic Gleam Overlay */}
          <div
            className={`absolute inset-0 pointer-events-none z-20 mix-blend-soft-light transition-opacity duration-200 ${isLegendary ? 'animate-pulse' : ''}`}
            style={{
                background: `radial-gradient(circle at ${gleam.x}% ${gleam.y}%, rgba(255,255,255,0.8) 0%, transparent 60%)`,
                opacity: isLegendary ? Math.max(0.3, gleam.opacity) : gleam.opacity
            }}
          />

          {variant === 'standard' && isFaceUp && rank && suit && (
             <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none">
                <div className="flex justify-between items-start">
                    <span className={`text-xl font-gothic ${suit==='hearts'||suit==='diamonds' ? 'text-amber-600' : 'text-stone-800'}`}>{rank}</span>
                    <span className={`text-xs font-bold ${suit==='hearts'||suit==='diamonds' ? 'text-amber-600' : 'text-stone-800'} opacity-60 uppercase tracking-tighter`}>{suit}</span>
                </div>
                <div className="flex justify-between items-end transform rotate-180">
                    <span className={`text-xl font-gothic ${suit==='hearts'||suit==='diamonds' ? 'text-amber-600' : 'text-stone-800'}`}>{rank}</span>
                    <span className={`text-xs font-bold ${suit==='hearts'||suit==='diamonds' ? 'text-amber-600' : 'text-stone-800'} opacity-60 uppercase tracking-tighter`}>{suit}</span>
                </div>
             </div>
          )}

          {variant === 'tda' && card && (
            <>
              <div className={`absolute ${config.strengthMargin} p-1 z-10`}>
                 <span
                    className={`font-gothic ${config.strengthText} text-[#f5f2eb] leading-none`}
                    style={{ textShadow: '3px 4px 5px #000000' }}
                 >
                    {cardStr}
                 </span>
              </div>
              <div className={`absolute ${config.strengthMarginInv} p-1 z-10 transform rotate-180`}>
                 <span
                    className={`font-gothic ${config.strengthText} text-[#f5f2eb] leading-none opacity-80`}
                    style={{ textShadow: '3px 4px 5px #000000' }}
                 >
                    {cardStr}
                 </span>
              </div>
              <div className={`absolute ${config.footerBottom} w-full pl-3 ${config.paddingRight} text-left flex flex-col items-start z-10`}>
                 <div className={`flex items-center justify-start gap-1 w-full border-b border-black/30 ${config.footerPadding} mb-0.5`}>
                     <span className={`font-bold text-black uppercase tracking-widest truncate ${size === 'lg' ? 'text-xs' : 'text-[8px]'}`}>
                        {cardName}
                     </span>
                     <div className="flex items-center gap-0.5 opacity-90">
                        {card.type === 'good' && getIcon('ui', 'shield', { size: size==='lg'?10:8, className: 'text-black' })}
                        {card.type === 'evil' && getIcon('ui', 'skull', { size: size==='lg'?10:8, className: 'text-black' })}
                        {card.type === 'mortal' && getIcon('ui', 'user', { size: size==='lg'?10:8, className: 'text-black' })}
                     </div>
                 </div>
                 <p className={`leading-tight text-black font-serif font-semibold w-full ${size === 'lg' ? 'text-[9px]' : 'text-[6px] sm:text-[7px]'}`}>
                    {renderDescription(card.description)}
                 </p>
              </div>
            </>
          )}
        </div>

        {/* BACK */}
        <div
          className={`
            absolute w-full h-full backface-hidden bg-stone-900 border border-stone-700 rotate-y-180 shadow-xl overflow-hidden
          `}
          style={{
             ...backRadiusStyle,
             backgroundImage: `url("${currentAtlas}")`,
             backgroundSize: '500% 500%',
             backgroundPosition: getBackgroundPosition(SPRITE_MAP.CardBack),
             backgroundRepeat: 'no-repeat'
          }}
        >
        </div>
      </div>
    </div>
  );
};

export default Card;
