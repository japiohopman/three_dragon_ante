
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../../../store/useGameStore';
import { useAnimationStore } from '../../../store/useAnimationStore';
import { getIcon } from '../../../assets/icons';
import { CardData, PlayerSkill } from '../../../types';
import Card from './Card';
import { SPRITE_MAP, ATLAS_URL, HAND_LIMIT } from '../../../utils/constants';
import { NPC_LIST } from '../../../utils/npcConstants';
import RulebookModal from './RulebookModal';
import { playSound } from '../../../services/soundService';

interface GameUIProps {
  onExit?: () => void;
}

const GameUI: React.FC<GameUIProps> = ({ onExit }) => {
  const {
    playerGold,
    opponentGold,
    pot,
    phase,
    notification,
    history,
    startGame,
    startNextGambit,
    round,
    currentLeader,
    pendingInteraction,
    playerHand,
    respondToInteraction,
    gambitResult,
    gambitsPlayed,
    maxGambits,
    playerFlight,
    opponentFlight,
    playerAnte,
    opponentAnte,
    selectAnte,
    playCard,
    activePlayer,
    fixGameState,
    resetGame,
    npcId,
    characterStats
  } = useGameStore();

  const { focusedCardId, hoveredCardId, setFocusedCard } = useAnimationStore();

  const isGambitEnd = phase === 'gambit-end';
  const isGameOver = phase === 'game-over';
  const isLobby = phase === 'lobby';
  const isInteraction = !!pendingInteraction;

  // Skill Requirements
  const skillRequirements = {
    'bluff': { stat: 'charisma' as const, value: 14, label: 'Charisma' },
    'sleight-of-hand': { stat: 'dexterity' as const, value: 14, label: 'Dexterity' },
    'concentration': { stat: 'intelligence' as const, value: 12, label: 'Intelligence' }
  };

  const checkRequirement = (skill: PlayerSkill) => {
    if (skill === 'none') return true;
    if (!characterStats) return true;
    const req = skillRequirements[skill as keyof typeof skillRequirements];
    if (!req) return true;
    return characterStats[req.stat] >= req.value;
  };

  // AI State Check for subtle UI indicator
  const isAiThinking = activePlayer === 'opponent' || (isInteraction && pendingInteraction.target === 'opponent');

  const showHud = !isLobby && !isGameOver;

  const [selectedSkill, setSelectedSkill] = useState<PlayerSkill>('none');
  const [showRules, setShowRules] = useState(false);
  const [longTurn, setLongTurn] = useState(false);
  const [showLog, setShowLog] = useState(true);

  // --- WATCHDOG: AUTO-FIX STUCK AI ---
  useEffect(() => {
      if (phase === 'opponent-turn' || (phase === 'round-start' && currentLeader === 'opponent')) {
          const timer = setTimeout(() => {
              console.warn("Watchdog: AI taking too long. Forcing turn.");
              useGameStore.getState().aiTurn();
          }, 5000);
          return () => clearTimeout(timer);
      }
  }, [phase, currentLeader, activePlayer]);

  // --- TURN TIMER ---
  useEffect(() => {
      setLongTurn(false);
      if (phase === 'player-turn' || (phase === 'round-start' && currentLeader === 'player')) {
          const t = setTimeout(() => setLongTurn(true), 10000);
          return () => clearTimeout(t);
      }
  }, [phase, currentLeader, activePlayer]);

  // --- STATE RECOVERY ---
  useEffect(() => {
      if ((phase === 'player-turn' || phase === 'round-start') && pendingInteraction && !isInteraction) {
          console.warn("State Desync: Pending Interaction exists but UI didn't catch it. Fixing...");
          fixGameState();
      }
  }, [phase, pendingInteraction, isInteraction, fixGameState]);


  const getSelectableCards = () => {
      if (!pendingInteraction || !pendingInteraction.options) return [];
      const cardOption = pendingInteraction.options.find(o => o.value === 'give-card' || o.value === 'discard-card');
      if (!cardOption || !cardOption.cardFilter) return [];
      return playerHand.filter(cardOption.cardFilter);
  };

  const selectableCards = isInteraction ? getSelectableCards() : [];

  const formatGold = (amount: number) => {
    if (amount >= 0) return <span>{amount}</span>;
    return <span className="text-red-500 font-bold">DEBT: {Math.abs(amount)}</span>;
  };

  const getInfoCardData = (): CardData | undefined => {
      const id = hoveredCardId || focusedCardId;
      if (!id) return undefined;
      const opponentHandMock = useGameStore.getState().opponentHand;
      const deckMock = useGameStore.getState().deck;
      const discardMock = useGameStore.getState().discardPile;

      return playerHand.find(c => c.id === id)
          || opponentHandMock.find(c => c.id === id)
          || playerFlight.find(c => c.id === id)
          || opponentFlight.find(c => c.id === id)
          || (playerAnte && playerAnte.id === id ? playerAnte : undefined)
          || (opponentAnte && opponentAnte.id === id ? opponentAnte : undefined)
          || deckMock.find(c => c.id === id)
          || discardMock.find(c => c.id === id);
  };

  const infoCard = getInfoCardData();

  const getFocusedCardData = (): CardData | undefined => {
      if (!focusedCardId) return undefined;
      const id = focusedCardId;
      const opponentHandMock = useGameStore.getState().opponentHand;
      const deckMock = useGameStore.getState().deck;
      const discardMock = useGameStore.getState().discardPile;

      return playerHand.find(c => c.id === id)
          || opponentHandMock.find(c => c.id === id)
          || playerFlight.find(c => c.id === id)
          || opponentFlight.find(c => c.id === id)
          || (playerAnte && playerAnte.id === id ? playerAnte : undefined)
          || (opponentAnte && opponentAnte.id === id ? opponentAnte : undefined)
          || deckMock.find(c => c.id === id)
          || discardMock.find(c => c.id === id);
  };

  const focusedCard = getFocusedCardData();

  useEffect(() => {
      if (isGameOver) {
          if (playerGold > opponentGold) {
              playSound('MATCH_VICTORY');
          } else {
              playSound('MATCH_DEFEAT');
          }
      }
  }, [isGameOver, playerGold, opponentGold]);

  const handlePlayFocused = () => {
      if (!focusedCardId) return;
      playSound('UI_CLICK');
      playCard(focusedCardId);
      setFocusedCard(null);
  };

  const handleSelectAnteFocused = () => {
      if (!focusedCardId) return;
      playSound('UI_CLICK');
      selectAnte(focusedCardId);
      setFocusedCard(null);
  };

  const canPlayFocused = focusedCard && playerHand.some(c => c.id === focusedCard.id)
      && (phase === 'player-turn' || phase === 'round-start') && activePlayer === 'player';

  const canAnteFocused = focusedCard && playerHand.some(c => c.id === focusedCard.id)
      && phase === 'ante-selection';

  const getNPCName = () => {
      return NPC_LIST.find(n => n.id === npcId)?.name || 'Opponent';
  };

  // --- PHASE INSTRUCTION HELPER ---
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

  // --- NOTIFICATION FORMATTER ---
  const renderFormattedMessage = (text: string) => {
      const regex = /(\d+\s*gold)|(gold)|(draw)|(discard)|(steal)|(pickup)|(dispell)|(magic)/gi;
      const parts = text.split(regex);

      return parts.filter(part => part !== undefined && part !== '').map((part, index) => {
          const lower = part.toLowerCase();

          if (lower.includes('gold')) {
              const numMatch = part.match(/\d+/);
              const num = numMatch ? numMatch[0] : '';

              return (
                  <span key={index} className="inline-flex items-baseline gap-1 mx-1.5 whitespace-nowrap">
                      {num && <span className="font-bold text-amber-400 font-gothic text-2xl relative top-[1px]">{num}</span>}
                      {getIcon('ui', 'gold-coin', { size: 22, className: "text-amber-500 inline self-center filter drop-shadow-sm" })}
                  </span>
              );
          }

          const iconMap: Record<string, { icon: string; color: string }> = {
            'draw': { icon: 'draw_card', color: 'text-blue-400' },
            'discard': { icon: 'discard', color: 'text-red-400' },
            'steal': { icon: 'steal', color: 'text-orange-400' },
            'pickup': { icon: 'pickup_card', color: 'text-green-400' },
            'dispell': { icon: 'dispell_card', color: 'text-purple-400' },
            'magic': { icon: 'magic', color: 'text-cyan-400' }
          };

          for (const [key, config] of Object.entries(iconMap)) {
            if (lower === key || lower.includes(key)) {
              return (
                <span key={index} className={`inline-flex items-center gap-1 mx-1 font-bold ${config.color}`}>
                  {getIcon('ui', config.icon, { size: 18, className: "inline" })}
                  {part}
                </span>
              );
            }
          }

          return <span key={index}>{part}</span>;
      });
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex flex-col justify-between overflow-hidden">

      {/* --- MULTI-FUNCTIONAL TOP NAVIGATION BAR (HUD) --- */}
      {showHud && (
        <div className="w-full h-16 bg-stone-950/95 border-b border-amber-900/30 shadow-2xl backdrop-blur-xl flex items-center justify-between px-6 pointer-events-auto relative z-[100]">

            {/* LEFT: SESSION INFO & UTILITIES */}
            <div className="flex items-center gap-4 flex-1">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-0.5">Session</span>
                    <div className="flex items-center gap-3">
                         <div className="flex items-center gap-1.5 text-amber-500">
                             {getIcon('ui', 'gold-coin', { size: 14 })}
                             <span className="font-gothic text-xl">{playerGold}</span>
                         </div>
                         <div className="h-4 w-px bg-stone-800" />
                         <div className="flex items-center gap-2">
                             <button
                                onClick={fixGameState}
                                className={`p-1.5 bg-stone-900 rounded border border-stone-800 text-stone-500 hover:text-amber-500 hover:border-amber-900/50 transition-all ${longTurn ? 'animate-pulse ring-1 ring-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : ''}`}
                                title="Fix Game State"
                             >
                                 {getIcon('ui', 'wrench', { size: 14 })}
                             </button>
                             <button
                                onClick={() => {
                                    playSound('UI_CLICK');
                                    onExit?.();
                                }}
                                className="px-3 py-1 bg-red-950/20 hover:bg-red-900/40 text-red-500/70 hover:text-red-400 text-[9px] uppercase tracking-widest border border-red-900/30 hover:border-red-500/50 rounded transition-all font-bold"
                             >
                                Give up
                             </button>
                         </div>
                    </div>
                </div>
            </div>

            {/* CENTER: CARD INFORMATION (Multi-functional) */}
            <div className="flex-[2] h-full flex flex-col items-center justify-center border-x border-stone-800/40 px-8 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {infoCard ? (
                        <motion.div
                            key={`info-${infoCard.id}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-4 w-full justify-center"
                        >
                            <div className="flex flex-col items-center">
                                <span className="text-[8px] uppercase tracking-widest text-amber-500 font-bold mb-1">Inspecting</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-lg text-amber-100 font-serif font-bold uppercase tracking-widest">{infoCard.name}</span>
                                    <div className="w-6 h-6 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center">
                                        <span className="text-xs font-bold text-amber-400">{infoCard.strength}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-stone-800/60" />
                            <p className="text-[11px] text-stone-400 italic max-w-xs leading-tight line-clamp-2">
                                {infoCard.description || "A mysterious artifact of Draconic power."}
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="game-status"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center"
                        >
                            <span className="text-[9px] uppercase tracking-[0.4em] text-stone-600 font-bold mb-1">Current Directive</span>
                            <div className="flex items-center gap-4">
                                <span className={`text-sm font-serif italic ${isAiThinking ? 'text-amber-500 animate-pulse' : 'text-stone-300'}`}>
                                    {getPhaseInstruction()}
                                </span>
                                {isAiThinking && getIcon('ui', 'thinking', { size: 14, className: "text-amber-500" })}
                            </div>
                        </motion.div>
                    ) }
                </AnimatePresence>
            </div>

            {/* RIGHT: PLAYER PROFILE & MENU */}
            <div className="flex items-center justify-end gap-6 flex-1">
                <div className="flex flex-col items-end">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-0.5">Character</span>
                    <div className="flex items-center gap-3">
                         <div className="flex items-center gap-1.5">
                             <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800">
                                 {getIcon('ui', 'hand', { size: 10, className: "text-stone-500" })}
                                 <span className="text-[10px] font-mono text-stone-400 font-bold">{playerHand.length}</span>
                             </div>
                             <span className="text-sm font-serif font-bold text-blue-400 uppercase tracking-widest">Player</span>
                         </div>
                         <button
                            onClick={() => setShowRules(true)}
                            className="p-1.5 text-stone-500 hover:text-amber-500 transition-colors"
                            title="Rulebook"
                         >
                             {getIcon('ui', 'scroll', { size: 18 })}
                         </button>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-900/40 border border-blue-500/50 flex items-center justify-center shadow-lg">
                    {getIcon('ui', 'user', { size: 20, className: "text-blue-300" })}
                </div>
            </div>
        </div>
      )}

      {/* NOTIFICATIONS - Centered Top */}
      <div className="absolute top-[84px] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-[120] w-full max-w-md px-4">
        {notification && (
            <div className={`
                w-full py-3 px-6
                bg-stone-900/95 backdrop-blur-md border-x border-b-2 rounded-b-xl
                ${notification.type === 'power' ? 'border-purple-500/50' : notification.type === 'alert' ? 'border-red-500/50' : 'border-amber-600/50'}
                shadow-[0_10px_30px_rgba(0,0,0,0.8)]
                transform transition-all duration-500 animate-in fade-in slide-in-from-top-8
                flex items-center justify-center gap-4
            `}>
                <div className={`p-2 rounded-full shrink-0 shadow-inner ${notification.type === 'power' ? 'bg-purple-900/40 text-purple-300' : 'bg-amber-900/40 text-amber-300'}`}>
                    {notification.type === 'power'
                        ? getIcon('ui', 'swords', { size: 18 })
                        : getIcon('ui', 'gold-coin', { size: 18 })}
                </div>
                <p className={`text-stone-100 font-serif text-base sm:text-lg leading-tight text-center ${notification.type === 'power' ? 'italic text-purple-100' : ''}`}>
                    {renderFormattedMessage(notification.message)}
                </p>
            </div>
        )}
      </div>

      {/* FOCUS OVERLAY */}
      {focusedCard && (
          <div
            className="absolute inset-0 bg-black/90 z-[200] pointer-events-auto flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200"
            onClick={() => setFocusedCard(null)}
          >
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <Card
                    card={focusedCard}
                    className="w-64 h-[26.88rem] sm:w-80 sm:h-[33.6rem] shadow-2xl"
                    disableFocus={true}
                    radius={50}
                    size="lg"
                  />
                  <button
                    onClick={() => setFocusedCard(null)}
                    className="absolute -top-4 -right-4 bg-stone-800 text-stone-400 p-2 rounded-full hover:bg-red-900 hover:text-white transition-colors border border-stone-600"
                  >
                      {getIcon('ui', 'close', { size: 24 })}
                  </button>
                  <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 flex gap-4 w-max">
                      {canPlayFocused && (
                          <button
                            onClick={handlePlayFocused}
                            className="bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold py-3 px-8 rounded-full shadow-lg flex items-center gap-2 text-xl animate-bounce"
                          >
                              {getIcon('ui', 'play', { size: 24 })} Play Card
                          </button>
                      )}
                      {canAnteFocused && (
                          <button
                            onClick={handleSelectAnteFocused}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full shadow-lg flex items-center gap-2 text-xl animate-bounce"
                          >
                              {getIcon('ui', 'target', { size: 24 })} Select Ante
                          </button>
                      )}
                  </div>
              </div>
              <p className="mt-24 text-stone-500 font-serif italic">Tap anywhere to close</p>
          </div>
      )}

      {/* INTERACTION MODAL */}
      {isInteraction && pendingInteraction && (
         <div className="absolute inset-0 top-20 flex flex-col items-center justify-center z-[200] pointer-events-auto animate-in fade-in duration-300">

             {pendingInteraction.target === 'opponent' ? (
                 <div className="w-full h-full cursor-wait" />
             ) : (
                 <div className="bg-stone-900 border-2 border-amber-600 p-8 rounded-xl max-w-2xl w-full mx-4 shadow-2xl relative">
                     <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-stone-900 px-4 py-2 border-2 border-amber-600 rounded-full">
                        {getIcon('ui', 'alert', { className: "text-amber-500 inline-block mr-2" })}
                        <span className="text-amber-100 font-bold uppercase">{pendingInteraction.sourceCardName}</span>
                     </div>

                     <h3 className="text-center text-xl text-stone-300 mb-8 mt-4 font-serif">
                         You must make a choice:
                     </h3>

                     <div className="flex flex-col gap-4">
                         {pendingInteraction.options.map((opt, idx) => {
                             const isCardAction = opt.value === 'give-card' || opt.value === 'discard-card';
                             const isPayAction = opt.value === 'pay-gold';
                             const cost = opt.cost || 0;
                             const hasCards = isCardAction ? selectableCards.length > 0 : true;
                             const isDisabled = (isCardAction && !hasCards);

                             let label = opt.label;
                             if (isPayAction && playerGold < cost) {
                                 const debtAmount = cost - Math.max(0, playerGold);
                                 label = `${opt.label} (Debt: ${debtAmount})`;
                             }

                             return (
                                 <div key={idx} className="flex flex-col gap-2">
                                     <button
                                        onClick={() => {
                                            playSound('UI_CLICK');
                                            if (!isCardAction) respondToInteraction(opt.value);
                                        }}
                                        disabled={isDisabled}
                                        className={`w-full py-4 border border-stone-600 rounded text-lg font-bold transition-all
                                            ${isDisabled
                                                ? 'bg-stone-800 text-stone-600 cursor-not-allowed'
                                                : 'bg-stone-800 hover:bg-amber-900 text-amber-100 hover:border-amber-500 shadow-lg'}
                                        `}
                                     >
                                         {renderFormattedMessage(label)}
                                         {!hasCards && isCardAction && <span className="text-xs ml-2 text-red-500">(No matching cards)</span>}
                                     </button>

                                     {isCardAction && hasCards && (
                                         <div className="flex justify-center gap-2 py-2 overflow-x-auto">
                                             {selectableCards.map(card => (
                                                 <div key={card.id} className="transform scale-75 hover:scale-90 transition-transform origin-top">
                                                     <Card
                                                        card={card}
                                                        onClick={() => {
                                                            playSound('UI_CLICK');
                                                            respondToInteraction(opt.value, card.id);
                                                        }}
                                                        className="hover:ring-4 hover:ring-green-500"
                                                        disableFocus={true}
                                                     />
                                                 </div>
                                             ))}
                                         </div>
                                     )}
                                 </div>
                             );
                         })}
                     </div>
                 </div>
             )}
          </div>
      )}

      {/* LOBBY */}
      {isLobby && (
          <div className="absolute inset-0 bg-stone-950 flex flex-col items-center justify-center z-[100] pointer-events-auto overflow-hidden">
              <div className="absolute inset-0 z-0 flex items-center justify-center opacity-40 pointer-events-none">
                  <div
                      className="w-[500px] h-[840px] transform scale-150 md:scale-125"
                      style={{
                        backgroundImage: `url("${ATLAS_URL}")`,
                        backgroundSize: '500% 500%',
                        backgroundPosition: `${(SPRITE_MAP.Logo % 5) * 25}% ${(Math.floor(SPRITE_MAP.Logo / 5)) * 25}%`,
                        backgroundRepeat: 'no-repeat',
                      }}
                  ></div>
              </div>

              <div className={`relative z-10 flex flex-col items-center w-full h-full ${showRules ? 'overflow-hidden' : 'overflow-y-auto'} py-8`}>
                  <div className="mt-12 md:mt-16 text-center px-4">
                      <h1 className="text-5xl md:text-7xl font-gothic text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-700 mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                          The Dragon's Flagon
                      </h1>
                      <p className="text-stone-300 max-w-lg mx-auto font-serif text-lg md:text-xl drop-shadow-md">
                          Three-Dragon Ante: Wager gold, build flights, and outwit your opponent.
                      </p>
                  </div>

                  <div className="w-full max-w-4xl px-4 my-8">
                      <div className="flex flex-col items-center mb-6">
                        <h3 className="text-amber-500 font-bold tracking-widest uppercase mb-1 drop-shadow-sm">Your Attributes</h3>
                        <div className="flex gap-4 bg-stone-900/40 px-6 py-2 rounded-full border border-stone-800 backdrop-blur-sm">
                            {characterStats && Object.entries(characterStats).map(([stat, val]) => (
                                <div key={stat} className="flex flex-col items-center">
                                    <span className="text-[8px] uppercase text-stone-500 font-bold">{stat.slice(0,3)}</span>
                                    <span className={`text-sm font-mono font-bold ${val >= 14 ? 'text-amber-400' : 'text-stone-300'}`}>{val}</span>
                                </div>
                            ))}
                        </div>
                      </div>

                      <h3 className="text-center text-amber-500 font-bold tracking-widest uppercase mb-4 drop-shadow-sm">Choose Your Skill</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* BLUFF */}
                          <div
                            onClick={() => checkRequirement('bluff') && setSelectedSkill('bluff')}
                            className={`relative cursor-pointer border-2 rounded-lg p-4 transition-all duration-300 backdrop-blur-md
                                ${!checkRequirement('bluff') ? 'opacity-40 grayscale cursor-not-allowed border-stone-800' :
                                  selectedSkill === 'bluff' ? 'bg-stone-800/80 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-stone-900/60 border-stone-700 hover:bg-stone-800/80'}`}
                          >
                              {!checkRequirement('bluff') && (
                                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-900/80 text-red-200 text-[8px] px-1.5 py-0.5 rounded border border-red-500/30">
                                      {getIcon('ui', 'skull', { size: 10 })} REQ: CHA 14
                                  </div>
                              )}
                              <div className="flex items-center gap-2 mb-2">
                                  {getIcon('ui', 'magic', { className: selectedSkill === 'bluff' ? 'text-amber-400' : 'text-stone-500' })}
                                  <h4 className="font-gothic text-xl text-stone-200">Bluff</h4>
                              </div>
                              <p className="text-xs text-stone-400">"I'm good for it."</p>
                              <p className="text-sm text-stone-300 mt-2">Whenever you pay an opponent 2 or more gold, pay 1 less.</p>
                          </div>

                          {/* SLEIGHT */}
                          <div
                            onClick={() => checkRequirement('sleight-of-hand') && setSelectedSkill('sleight-of-hand')}
                            className={`relative cursor-pointer border-2 rounded-lg p-4 transition-all duration-300 backdrop-blur-md
                                ${!checkRequirement('sleight-of-hand') ? 'opacity-40 grayscale cursor-not-allowed border-stone-800' :
                                  selectedSkill === 'sleight-of-hand' ? 'bg-stone-800/80 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-stone-900/60 border-stone-700 hover:bg-stone-800/80'}`}
                          >
                              {!checkRequirement('sleight-of-hand') && (
                                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-900/80 text-red-200 text-[8px] px-1.5 py-0.5 rounded border border-red-500/30">
                                      {getIcon('ui', 'skull', { size: 10 })} REQ: DEX 14
                                  </div>
                              )}
                              <div className="flex items-center gap-2 mb-2">
                                  {getIcon('ui', 'hand', { className: selectedSkill === 'sleight-of-hand' ? 'text-amber-400' : 'text-stone-500' })}
                                  <h4 className="font-gothic text-xl text-stone-200">Sleight of Hand</h4>
                              </div>
                              <p className="text-xs text-stone-400">"Did you see that?"</p>
                              <p className="text-sm text-stone-300 mt-2">When stealing from the pot, if the pot has gold left, steal 1 extra.</p>
                          </div>

                          {/* CONCENTRATION */}
                          <div
                            onClick={() => checkRequirement('concentration') && setSelectedSkill('concentration')}
                            className={`relative cursor-pointer border-2 rounded-lg p-4 transition-all duration-300 backdrop-blur-md
                                ${!checkRequirement('concentration') ? 'opacity-40 grayscale cursor-not-allowed border-stone-800' :
                                  selectedSkill === 'concentration' ? 'bg-stone-800/80 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-stone-900/60 border-stone-700 hover:bg-stone-800/80'}`}
                          >
                              {!checkRequirement('concentration') && (
                                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-900/80 text-red-200 text-[8px] px-1.5 py-0.5 rounded border border-red-500/30">
                                      {getIcon('ui', 'skull', { size: 10 })} REQ: INT 12
                                  </div>
                              )}
                              <div className="flex items-center gap-2 mb-2">
                                  {getIcon('ui', 'brain', { className: selectedSkill === 'concentration' ? 'text-amber-400' : 'text-stone-500' })}
                                  <h4 className="font-gothic text-xl text-stone-200">Concentration</h4>
                              </div>
                              <p className="text-xs text-stone-400">"Eyes on the prize."</p>
                              <p className="text-sm text-stone-300 mt-2">Pay 1 less gold to the stakes when resolving the Ante.</p>
                          </div>
                      </div>
                  </div>

                  {/* Rulebook Button */}
                  <div className="mb-6">
                      <button
                        onClick={() => {
                            playSound('UI_MODAL_OPEN');
                            setShowRules(true);
                        }}
                        onMouseEnter={() => playSound('UI_HOVER')}
                        className="flex items-center gap-2 text-stone-400 hover:text-amber-400 transition-colors border border-stone-700 px-4 py-2 rounded-full bg-stone-900/50"
                      >
                          {getIcon('ui', 'scroll', { size: 16 })} Rulebook
                      </button>
                  </div>

                  <div className="bg-stone-800/80 p-3 rounded-lg border border-amber-900/50 mb-6 max-w-lg text-center mx-4 backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-2 text-amber-500 mb-1">
                          {getIcon('ui', 'scroll', { size: 14 })}
                          <span className="font-serif italic text-xs">"Gold on the table is for the game."</span>
                      </div>
                      <p className="text-stone-500 text-[10px]">
                          (Optional: Agree on real-world stakes before starting.)
                      </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl px-4 pb-8">
                    <button
                        onClick={() => {
                            playSound('UI_CLICK');
                            startGame(3, selectedSkill);
                        }}
                        onMouseEnter={() => playSound('UI_HOVER')}
                        disabled={selectedSkill === 'none'}
                        className="group relative px-6 py-4 bg-stone-800/90 border-2 border-amber-800/50 hover:border-amber-500 hover:bg-stone-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                    >
                        <span className="block text-xl text-amber-100 font-bold uppercase tracking-widest mb-1">Short</span>
                        <span className="block text-xs text-stone-400 uppercase tracking-wider">3 Gambits</span>
                    </button>
                    <button
                        onClick={() => {
                            playSound('UI_CLICK');
                            startGame(6, selectedSkill);
                        }}
                        onMouseEnter={() => playSound('UI_HOVER')}
                        disabled={selectedSkill === 'none'}
                        className="group relative px-6 py-4 bg-stone-800/90 border-2 border-amber-600 hover:bg-stone-700 transition-all duration-300 shadow-[0_0_20px_rgba(180,83,9,0.3)] hover:shadow-[0_0_40px_rgba(180,83,9,0.5)] transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                    >
                        <span className="block text-xl text-amber-100 font-bold uppercase tracking-widest mb-1">Standard</span>
                        <span className="block text-xs text-stone-400 uppercase tracking-wider">6 Gambits</span>
                    </button>
                    <button
                        onClick={() => {
                            playSound('UI_CLICK');
                            startGame(9, selectedSkill);
                        }}
                        onMouseEnter={() => playSound('UI_HOVER')}
                        disabled={selectedSkill === 'none'}
                        className="group relative px-6 py-4 bg-stone-800/90 border-2 border-amber-800/50 hover:border-amber-500 hover:bg-stone-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                    >
                        <span className="block text-xl text-amber-100 font-bold uppercase tracking-widest mb-1">Epic</span>
                        <span className="block text-xs text-stone-400 uppercase tracking-wider">9 Gambits</span>
                    </button>
                  </div>
              </div>
          </div>
      )}

      {/* RULEBOOK MODAL */}
      {showRules && (
          <RulebookModal onClose={() => {
              playSound('UI_MODAL_CLOSE');
              setShowRules(false);
          }} />
      )}

      {/* GAMBIT END */}
      {isGambitEnd && gambitResult && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-[200] pointer-events-auto animate-in fade-in duration-700">
               <div className={`p-6 rounded-full border-4 mb-6 ${gambitResult.winner === 'player' ? 'border-blue-500 bg-blue-900/30' : 'border-red-500 bg-red-900/30'}`}>
                   {gambitResult.winner === 'player' ? getIcon('ui', 'trophy', { size: 64, className: "text-blue-400" }) : getIcon('ui', 'skull', { size: 64, className: "text-red-500" })}
               </div>

               <h2 className="text-4xl font-gothic text-stone-100 mb-2">
                   {gambitResult.winner === 'player' ? 'Gambit Won!' : 'Gambit Lost'}
               </h2>

               <p className="text-lg text-stone-400 italic mb-8">{gambitResult.reason}</p>

               <div className="grid grid-cols-2 gap-8 mb-8 text-center border-t border-b border-stone-800 py-6 w-full max-w-lg bg-stone-900/50">
                   <div>
                       <div className="text-xs uppercase text-blue-500 font-bold mb-1">Your Strength</div>
                       <div className="text-4xl font-gothic text-stone-100">{gambitResult.playerStrength}</div>
                   </div>
                   <div>
                       <div className="text-xs uppercase text-red-500 font-bold mb-1">{getNPCName()}'s Strength</div>
                       <div className="text-4xl font-gothic text-stone-100">{gambitResult.opponentStrength}</div>
                   </div>
               </div>

               <p className="text-amber-400 font-gothic text-2xl mb-8">
                   {gambitResult.winner === 'player' ? `+${gambitResult.potWon} Gold` : `-${gambitResult.potWon} Gold`}
               </p>

               <button
                onClick={() => {
                    playSound('UI_CLICK');
                    startNextGambit();
                }}
                className="px-8 py-4 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-100 rounded shadow-lg flex items-center gap-3 transition-colors text-lg"
               >
                   {getIcon('ui', 'refresh', { size: 24 })} Start Next Gambit
               </button>
          </div>
      )}

      {/* GAME OVER */}
      {isGameOver && (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-[200] pointer-events-auto animate-in zoom-in duration-500">
               {playerGold > opponentGold ? (
                   <>
                       {getIcon('ui', 'crown', { size: 80, className: "text-yellow-400 mb-6 drop-shadow-lg animate-pulse" })}
                       <h2 className="text-6xl font-gothic text-transparent bg-clip-text bg-gradient-to-t from-yellow-600 to-yellow-200 mb-4">VICTORY</h2>
                       <p className="text-2xl text-stone-300 mb-2">Match Complete!</p>
                       <p className="text-lg text-stone-400 mb-8">You have bested {getNPCName()} with {playerGold} gold.</p>
                   </>
               ) : (
                   <>
                       {getIcon('ui', 'skull', { size: 80, className: "text-stone-500 mb-6 drop-shadow-lg" })}
                       <h2 className="text-6xl font-gothic text-stone-600 mb-4">DEFEAT</h2>
                       <p className="text-2xl text-stone-400 mb-2">Match Complete.</p>
                       <p className="text-lg text-stone-500 mb-8">{getNPCName()} wins with {opponentGold} gold.</p>
                   </>
               )}

               <button
                onClick={() => {
                    playSound('UI_CLICK');
                    resetGame();
                    if (onExit) onExit();
                }}
                className="px-8 py-4 bg-stone-800 border border-stone-600 hover:bg-stone-700 text-stone-200 rounded text-xl shadow-lg transition-all"
               >
                   Return to Lobby
               </button>
          </div>
      )}

      {/* NO FOOTER BUTTONS - MOVED TO TOP NAV */}
    </div>
  );
};

export default GameUI;
