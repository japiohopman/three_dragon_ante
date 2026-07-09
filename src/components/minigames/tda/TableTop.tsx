
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getIcon } from '../../../assets/icons';
import { useGameStore } from '../../../store/useGameStore';
import Card from './Card';
import NPC from '../../NPC';
import { SPRITE_MAP, HAND_LIMIT } from '../../../utils/constants';
import { NPC_LIST } from '../../../utils/npcConstants';

const TableTop: React.FC = () => {
  const {
    playerHand,
    opponentHand,
    playerFlight,
    opponentFlight,
    playerAnte,
    opponentAnte,
    phase,
    selectAnte,
    playCard,
    activePlayer,
    lastCardPlayed,
    currentLeader,
    deck,
    discardPile,
    opponentGold,
    opponentEmotion,
    npcId,
    npcLine,
    isTalking,
    pot,
    gambitsPlayed,
    maxGambits,
    round,
    pendingInteraction
  } = useGameStore();

  const getNPCName = () => {
    return NPC_LIST.find(n => n.id === npcId)?.name || 'Opponent';
  };

  const getPhaseInstruction = () => {
    if (pendingInteraction) return "Resolve the choice to continue.";
    if (phase === 'ante-selection') return "Select a card from your hand to Ante.";
    if (phase === 'ante-reveal') return "Revealing Antes...";
    if (phase === 'player-turn') return "Your Turn: Play a card to your Flight.";
    if (phase === 'round-start' && currentLeader === 'player') return "You lead the round: Play a card.";
    if (phase === 'round-start' && currentLeader === 'opponent') return `${getNPCName()} leads the round...`;
    if (phase === 'opponent-turn') return `${getNPCName()} is thinking...`;
    if (phase === 'round-resolution') return "Resolving round...";
    if (phase === 'gambit-end') return "Gambit Complete.";
    return "";
  };

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [browsingPile, setBrowsingPile] = useState<'deck' | 'discard' | null>(null);

  const isPlayerTurn = (phase === 'player-turn' && activePlayer === 'player') ||
                       (phase === 'round-start' && currentLeader === 'player');

  const isAntePhase = phase === 'ante-selection';

  const deckBackCard = {
    id: 'deck-back',
    name: 'Deck',
    strength: 0,
    type: 'mortal' as const,
    color: 'none' as const,
    spriteIndex: SPRITE_MAP.CardBack,
    description: ''
  };

  const getFanStyle = (index: number, total: number, isPlayer: boolean) => {
    if (total === 0) return {};
    const center = (total - 1) / 2;
    const dist = index - center;

    if (isPlayer) {
        const isHovered = index === hoveredIndex;
        let rotate = dist * 5;
        let yOffset = (Math.abs(dist) * Math.abs(dist) * 2.5) - 20;
        let scale = 1;
        let zIndex = index + 1;

        // Horizontal spread - increased to ensure visibility
        const xOffset = dist * 140;

        if (isHovered) {
            return {
                x: xOffset,
                y: -140,
                rotate: 0,
                scale: 1.6,
                zIndex: 100,
                filter: 'brightness(1.1) contrast(1.1) drop-shadow(0 20.1px 40px rgba(0,0,0,0.8))',
            };
        } else if (hoveredIndex !== null) {
            const distFromHover = index - hoveredIndex;
            const absDist = Math.abs(distFromHover);
            if (absDist <= 2) {
                const shiftX = distFromHover * (absDist === 1 ? 100 : 50);
                const rOffset = distFromHover * (absDist === 1 ? 15 : 8);
                return {
                    x: xOffset + shiftX,
                    y: yOffset,
                    rotate: rotate + rOffset,
                    scale: scale * 1.05,
                    zIndex: zIndex,
                    filter: 'brightness(1.05) drop-shadow(0 10.1px 20px rgba(0,0,0,0.5))',
                };
            }
        }

        return {
            x: xOffset,
            y: yOffset,
            rotate: rotate,
            scale: scale,
            zIndex: zIndex,
            filter: 'none',
        };
    } else {
        // NPC Hand Spread
        const xOffsetNPC = dist * 35;
        const rotate = (dist * 4);

        return {
            x: xOffsetNPC,
            y: 0,
            rotate: rotate,
            rotateX: 60,
            scale: 0.9,
            zIndex: index + 1,
        };
    }
  };

  return (
    <div className="relative w-full h-full flex bg-stone-950 overflow-hidden font-serif">

      {/* 1. LEFT ASIDE: TAVERN & NPC INFO */}
      <aside className="w-96 h-full border-r border-stone-800 bg-stone-900/40 flex flex-col z-20 backdrop-blur-md shadow-2xl">
          {/* Tavern Header */}
          <div className="p-6 border-b border-stone-800 bg-stone-950/40">
              <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-[0.4em] text-amber-500/60 font-bold mb-1">The Dragon's Flagon</span>
                  <span className="text-xl text-stone-200 font-serif leading-tight">Emerald Enclave</span>
                  <div className="flex items-center gap-2 mt-2 opacity-60">
                      {getIcon('ui', 'place', { size: 10, className: "text-stone-500" })}
                      <span className="text-[10px] uppercase font-bold tracking-widest text-stone-500">Baldur's Gate</span>
                  </div>
              </div>
          </div>

          {/* NPC Detail Area */}
          <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar">
              <div className="flex flex-col items-center">
                  <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden border-4 border-amber-900/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-stone-950 group">
                      <NPC
                        npc={NPC_LIST.find(n => n.id === npcId) || NPC_LIST[0]}
                        emotion={opponentEmotion}
                        width={480}
                        height={320}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {activePlayer === 'opponent' && (
                        <div className="absolute top-3 right-3 bg-stone-900/90 rounded-full p-2 border border-amber-500/50 shadow-xl animate-pulse">
                            {getIcon('ui', 'thinking', { size: 16, className: "text-amber-500" })}
                        </div>
                      )}
                  </div>

                  <div className="mt-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                          <h3 className="text-2xl text-amber-500 font-serif tracking-tight">{getNPCName()}</h3>
                          {currentLeader === 'opponent' && getIcon('ui', 'crown', { size: 16, className: "text-amber-400" })}
                      </div>
                      <p className="text-xs text-stone-500 italic px-2 leading-relaxed">
                          "A seasoned traveler from the Underdark, known for a quick hand and a sharper tongue."
                      </p>
                  </div>
              </div>

              {/* NPC Currency Display */}
              <div className="bg-stone-950/60 rounded-xl p-4 border border-stone-800">
                  <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
                       <span className="text-[10px] text-stone-500 uppercase font-bold tracking-widest">Enemy Purse</span>
                       {getIcon('ui', 'gold-coin', { size: 14, className: "text-amber-600" })}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col">
                          <span className="text-[8px] uppercase text-stone-600 font-bold">Gold Coins</span>
                          <span className="font-gothic text-xl text-amber-100">{opponentGold} <span className="text-[10px] text-amber-500/60 uppercase ml-1">gp</span></span>
                      </div>
                      <div className="flex flex-col opacity-40">
                          <span className="text-[8px] uppercase text-stone-600 font-bold">Silver</span>
                          <span className="font-gothic text-xl text-stone-400">0 <span className="text-[10px] text-stone-500 uppercase ml-1">sp</span></span>
                      </div>
                  </div>
              </div>
          </div>

          {/* DECK (Bottom Left Corner of Aside) */}
          <div className="p-6 border-t border-stone-800 bg-stone-950/20">
              <div
                className="flex items-center gap-4 group cursor-pointer"
                onClick={() => setBrowsingPile('deck')}
              >
                  <div className="relative">
                      <div className="absolute -inset-1 bg-amber-500/0 group-hover:bg-amber-500/10 rounded-lg transition-all" />
                      <div className="transform rotate-[-3deg] transition-transform group-hover:rotate-0">
                          <Card card={deckBackCard} size="sm" isFaceUp={false} disabled shape="mirrored" className="shadow-xl" />
                      </div>
                      <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 bg-stone-900 border border-stone-700 rounded-full w-8 h-8 flex items-center justify-center shadow-lg ring-2 ring-stone-950">
                          <span className="text-[11px] font-mono font-bold text-amber-500">{deck.length}</span>
                      </div>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-stone-500">Tavern Deck</span>
                      <span className="text-xs text-stone-400 font-serif italic">Shuffle & Draw</span>
                  </div>
              </div>
          </div>
      </aside>

      {/* 2. CENTER: PERSPECTIVE TABLE AREA */}
      <main className="flex-1 relative h-full flex flex-col items-center justify-center p-8 perspective-1000">

        {/* Dynamic Atmospheric Lights */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-amber-900/5 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-900/5 to-transparent pointer-events-none" />

        {/* Tilted Game Frame */}
        <div
            className="relative w-full max-w-[120vh] aspect-[3/2] bg-[#1a1816] rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.9),0_0_0_2px_rgba(255,255,255,0.02)] border-[6px] border-stone-800 overflow-hidden flex flex-col items-center transform rotateX(15deg) transition-transform duration-700"
            style={{ transformStyle: 'preserve-3d' }}
        >
            {/* Table Surface Texture */}
            <div className="absolute inset-0 z-0 select-none">
                <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,1)]" />
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>

                {/* Central Focus Ring */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-amber-900/10 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] border-2 border-amber-900/5 rounded-full" />
            </div>

            {/* --- TABLE CONTENT --- */}
            <div className="relative z-10 w-full h-full flex flex-col items-center py-8">

                {/* OPPONENT FLIGHT */}
                <div className="w-full h-1/4 flex flex-col items-center justify-start gap-2">
                    <div className="relative w-full flex justify-center items-start h-20 pointer-events-none scale-75 origin-top opacity-80">
                        <AnimatePresence>
                            {opponentHand.map((card, i) => (
                                <motion.div
                                    key={card.id}
                                    layoutId={card.id}
                                    animate={getFanStyle(i, opponentHand.length, false)}
                                    className="absolute origin-top"
                                >
                                    <Card card={card} isFaceUp={false} disabled size="sm" />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    <div className="flex justify-center gap-3 h-24 mt-[-15px]">
                        {opponentFlight.map((card) => (
                            <motion.div key={card.id} layoutId={card.id} className="transform scale-[0.75] origin-top hover:scale-95 transition-transform">
                                <Card card={card} size="sm" glow={lastCardPlayed?.id === card.id ? 'red' : 'none'} />
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* BATTLEGROUND */}
                <div className="flex-1 w-full flex items-center justify-center gap-16">
                    <div className={`w-28 h-36 border-2 rounded-tl-[35px] rounded-br-[35px] flex items-center justify-center transition-all bg-black/30 ${opponentAnte ? 'border-amber-600/60 shadow-[0_0_30px_rgba(0,0,0,0.8)]' : 'border-stone-800/40'}`}>
                        {opponentAnte ? <motion.div key={opponentAnte.id} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 0.85 }}><Card card={opponentAnte} isFaceUp={phase !== 'ante-selection'} size="sm" /></motion.div> : <span className="text-[10px] text-stone-700 uppercase font-bold tracking-widest opacity-40">Opponent Ante</span>}
                    </div>

                    <div className="relative bg-stone-950/98 border-2 border-amber-700/40 p-5 rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center min-w-[140px] transform hover:scale-105 transition-transform group">
                        <div className="absolute -top-3 bg-stone-900 border border-amber-700/50 px-4 py-1 rounded-full shadow-lg">
                            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.3em]">Pot</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {getIcon('ui', 'gold-coin', { size: 24, className: "text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]" })}
                            <span className="font-gothic text-5xl text-amber-100 drop-shadow-xl">{pot}</span>
                        </div>
                    </div>

                    <div className={`w-28 h-36 border-2 rounded-tl-[35px] rounded-br-[35px] flex items-center justify-center transition-all bg-black/30 ${playerAnte ? 'border-amber-500/80 shadow-[0_0_30px_rgba(0,0,0,0.8)]' : 'border-stone-800/40'} ${isAntePhase ? 'ring-2 ring-amber-500/30 ring-offset-4 ring-offset-stone-900' : ''}`}>
                        {playerAnte ? <motion.div key={playerAnte.id} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 0.85 }}><Card card={playerAnte} size="sm" /></motion.div> : <span className="text-[10px] text-stone-700 uppercase font-bold tracking-widest opacity-40">Your Ante</span>}
                    </div>
                </div>

                {/* PLAYER FLIGHT */}
                <div className="w-full h-1/3 flex flex-col items-center justify-end relative">
                    <div className="flex justify-center gap-4 h-32 mb-6">
                        {playerFlight.map((card) => (
                            <motion.div key={card.id} layoutId={card.id} className="transform scale-[0.9] origin-bottom hover:scale-100 transition-transform cursor-pointer">
                                 <Card card={card} size="sm" glow={lastCardPlayed?.id === card.id ? 'gold' : 'none'} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* NPC SPEECH (Overlaid on Table) */}
            <AnimatePresence>
                {isTalking && npcLine && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 bg-stone-950/90 backdrop-blur-xl border border-amber-900/40 px-6 py-3 rounded-2xl shadow-2xl max-w-md pointer-events-none"
                  >
                    <p className="text-amber-100 font-serif italic text-sm text-center leading-relaxed">"{npcLine}"</p>
                  </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* PLAYER HAND (Spaced for maximum interaction area) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full flex justify-center items-end h-64 pointer-events-auto" onMouseLeave={() => setHoveredIndex(null)}>
            <AnimatePresence>
                {playerHand.map((card, i) => (
                    <motion.div
                        key={card.id}
                        layoutId={card.id}
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, ...getFanStyle(i, playerHand.length, true) }}
                        transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 120,
                            zIndex: { delay: 0 }
                        }}
                        className="absolute origin-bottom will-change-transform"
                        onMouseEnter={() => setHoveredIndex(i)}
                    >
                        <Card
                            card={card}
                            onClick={() => { if (isAntePhase) selectAnte(card.id); else if (isPlayerTurn) playCard(card.id); }}
                            disabled={(!isPlayerTurn && !isAntePhase)}
                            glow={(isPlayerTurn && lastCardPlayed && card.strength <= lastCardPlayed.strength) ? 'gold' : 'none'}
                            size="sm"
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
      </main>

      {/* 3. RIGHT ASIDE: GAME INFO & STAKES */}
      <aside className="w-80 h-full border-l border-stone-800 bg-stone-900/40 flex flex-col z-20 backdrop-blur-md shadow-[-10px_0_40px_rgba(0,0,0,0.5)]">
          {/* Stakes Header */}
          <div className="p-6 border-b border-stone-800 bg-stone-950/40">
              <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-[0.4em] text-stone-500 font-bold mb-2">Round Info</span>
                  <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                          <span className="text-2xl text-stone-200 font-gothic tracking-widest leading-none">Gambit {gambitsPlayed + 1}</span>
                          <span className="text-[10px] text-stone-500 uppercase mt-1 font-bold">Round {round} of Match</span>
                      </div>
                      <div className="w-12 h-12 rounded-lg border border-amber-900/30 bg-amber-950/20 flex flex-col items-center justify-center">
                          <span className="text-[8px] text-amber-600 uppercase font-bold">Goals</span>
                          <span className="text-xl text-amber-500 font-gothic">{maxGambits}</span>
                      </div>
                  </div>
              </div>
          </div>

          {/* History / Log Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
              <div className="px-6 py-4 flex items-center justify-between bg-stone-950/20 border-b border-stone-800">
                   <div className="flex items-center gap-2">
                       {getIcon('ui', 'scroll', { size: 12, className: "text-amber-700" })}
                       <span className="text-[10px] uppercase font-bold tracking-widest text-stone-500">Tavern Records</span>
                   </div>
                   <button onClick={() => setShowLog(!showLog)} className="text-[9px] uppercase tracking-widest text-amber-600 hover:text-amber-400 font-bold px-2 py-1 border border-amber-900/20 rounded-md transition-colors">
                       {showLog ? 'Hide' : 'Show'}
                   </button>
              </div>
              <div className={`flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar transition-opacity duration-300 ${showLog ? 'opacity-100' : 'opacity-0'}`}>
                  {useGameStore.getState().history.slice().reverse().map((entry, idx) => (
                      <div key={idx} className="flex gap-3 group">
                          <div className="w-1 h-auto bg-stone-800 rounded-full group-first:bg-amber-700/50" />
                          <p className="text-[11px] font-mono text-stone-400 leading-snug italic group-first:text-stone-300 group-first:not-italic">
                              {entry}
                          </p>
                      </div>
                  ))}
              </div>
          </div>

          {/* DISCARD PILE (Bottom Right Corner of Aside) */}
          <div className="p-6 border-t border-stone-800 bg-stone-950/20">
              <div
                className="flex items-center justify-end gap-4 group cursor-pointer text-right"
                onClick={() => setBrowsingPile('discard')}
              >
                  <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-stone-500">Discard Pile</span>
                      <span className="text-xs text-stone-400 font-serif italic">{discardPile.length} Burned Cards</span>
                  </div>
                  <div className="relative">
                      <div className="absolute -inset-1 bg-red-500/0 group-hover:bg-red-500/5 rounded-lg transition-all" />
                      <div className="transform rotate-[3deg] transition-transform group-hover:rotate-0">
                          {discardPile.length > 0 ? (
                              <Card card={discardPile[discardPile.length - 1]} size="sm" disabled brightness-50 shape="standard" className="shadow-xl" />
                          ) : (
                              <div className="w-20 h-28 border-2 border-dashed border-stone-800 rounded-lg flex items-center justify-center">
                                  {getIcon('ui', 'skull', { size: 16, className: "text-stone-900" })}
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      </aside>

      {/* PILE BROWSING OVERLAY */}
      <AnimatePresence>
        {browsingPile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[150] bg-stone-950/95 backdrop-blur-xl p-12 flex flex-col items-center"
          >
            <div className="w-full max-w-6xl flex flex-col h-full">
                <div className="flex justify-between items-center mb-12">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-[0.4em] text-amber-500 font-bold mb-1">Browsing Tavern Records</span>
                        <h2 className="text-4xl text-stone-100 font-serif lowercase italic">{browsingPile === 'deck' ? 'The Deep Deck' : 'The Grave of Cards'}</h2>
                        <span className="text-xs text-stone-500 mt-2">{browsingPile === 'deck' ? deck.length : discardPile.length} cards remaining</span>
                    </div>
                    <button
                        onClick={() => setBrowsingPile(null)}
                        className="bg-stone-900 border border-stone-700 text-stone-400 p-4 rounded-full hover:bg-stone-800 hover:text-white transition-all shadow-xl active:scale-90"
                    >
                        {getIcon('ui', 'close', { size: 32 })}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-9 gap-5 px-6 pt-12 pb-12">
                        {(browsingPile === 'deck' ? deck : discardPile).slice().reverse().map((card, idx) => (
                            <motion.div
                              key={`${card.id}-${idx}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.01 }}
                              className="group"
                            >
                                <Card
                                    card={card}
                                    size="sm"
                                    disabled
                                    isFaceUp={true}
                                    inverted={false}
                                    shape="standard"
                                    className="transform transition-transform group-hover:scale-110 !rotate-0"
                                />
                                <div className="mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-[8px] text-amber-500 font-bold uppercase tracking-widest leading-tight">{card.name}</p>
                                    <p className="text-[7px] text-stone-500">{card.strength}</p>
                                </div>
                            </motion.div>
                        ))}
                        {(browsingPile === 'deck' ? deck : discardPile).length === 0 && (
                            <div className="col-span-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-stone-800 rounded-3xl">
                                {getIcon('ui', 'skull', { size: 48, className: "text-stone-900 mb-4" })}
                                <p className="text-stone-600 font-serif italic text-xl">The pile is empty...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default TableTop;
