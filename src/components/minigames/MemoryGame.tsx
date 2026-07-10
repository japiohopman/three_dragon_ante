
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Card from './tda/Card';
import { VALID_SPRITES } from '../../utils/constants';
import { getIcon } from '../../assets/icons';
import { useAnimationStore } from '../../store/useAnimationStore';
import { playSound, playAmbience } from '../../services/soundService';
import { getNPCPersona } from '../../constants/npcLines';
import { motion, AnimatePresence } from 'motion/react';

import { NPCData } from '../../types';

interface MemoryCard {
  id: string;
  spriteIndex: number;
  isMatched: boolean;
  isFlipped: boolean;
}

interface MemoryGameProps {
  onBack: () => void;
  opponent: NPCData;
}

type Turn = 'player' | 'opponent';

const MemoryGame: React.FC<MemoryGameProps> = ({ onBack, opponent }) => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [turn, setTurn] = useState<Turn>('player');
  const [scores, setScores] = useState({ player: 0, opponent: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'finished'>('playing');
  const [aiThinkingIndex, setAiThinkingIndex] = useState<number | null>(null);
  const [opponentSpeech, setOpponentSpeech] = useState<string | null>(null);

  const speechTimeout = useRef<NodeJS.Timeout | null>(null);

  const speak = useCallback((eventType: string, duration: number = 3000) => {
      if (speechTimeout.current) clearTimeout(speechTimeout.current);

      const persona = getNPCPersona(opponent.id);

      // Map the move event to a persona seed category
      let seedType: 'start' | 'power' | 'victory' | 'defeat' | 'thinking' = 'thinking';
      const eventLower = eventType.toLowerCase();

      if (eventLower.includes('matched') || eventLower.includes('success')) seedType = 'power';
      else if (eventLower.includes('win') || eventLower.includes('victory') || eventLower.includes('won')) seedType = 'victory';
      else if (eventLower.includes('lost') || eventLower.includes('defeat') || eventLower.includes('loss')) seedType = 'defeat';
      else if (eventLower.includes('start')) seedType = 'start';

      const options = persona.seeds[seedType];
      const text = options[Math.floor(Math.random() * options.length)];

      setOpponentSpeech(text);

      speechTimeout.current = setTimeout(() => {
          setOpponentSpeech(null);
      }, duration);
  }, [opponent]);

  // AI Memory: Index -> SpriteIndex
  // The opponent remembers what they have seen, but not perfectly.
  const aiMemory = useRef<Map<number, { sprite: number; time: number; accuracy: number }>>(new Map());

  const TOTAL_PAIRS = 9;
  const AI_MEMORY_LIMIT = 12; // AI can only remember so many cards at once
  const AI_BASE_ACCURACY = 0.85; // 85% chance to remember a card correctly

  // Initialize Game
  const startNewGame = useCallback(() => {
    // Pick 9 random sprites (for 18 cards / 9 pairs)
    const shuffledSprites = [...VALID_SPRITES].sort(() => Math.random() - 0.5);
    const selectedSprites = shuffledSprites.slice(0, TOTAL_PAIRS);

    // Create pairs
    const deckPairs = [...selectedSprites, ...selectedSprites];

    // Shuffle deck
    const shuffledDeck = deckPairs
        .sort(() => Math.random() - 0.5)
        .map((spriteIndex, i) => ({
            id: `mem-${i}-${Math.random().toString(36).substr(2, 9)}`,
            spriteIndex,
            isMatched: false,
            isFlipped: false
        }));

    setCards(shuffledDeck);
    setScores({ player: 0, opponent: 0 });
    setTurn('player');
    setFlippedIndices([]);
    setGameStatus('playing');
    setIsProcessing(false);
    aiMemory.current.clear();
    playSound('CARD_SHUFFLE');
  }, []);

  useEffect(() => {
    startNewGame();
    playAmbience('TAVERN_AMBIENCE_01');
  }, [startNewGame]);

  // --- MATCH LOGIC (Moved to useEffect to avoid render-during-render) ---
  useEffect(() => {
    if (flippedIndices.length === 2 && !isProcessing) {
        const [idx1, idx2] = flippedIndices;
        setIsProcessing(true);

        const isMatch = cards[idx1].spriteIndex === cards[idx2].spriteIndex;

        if (isMatch) {
            // Match side effects
            playSound('MEMORY_MATCH');
            useAnimationStore.getState().triggerShake(0);

            if (turn === 'opponent') {
                speak('The AI matched two cards successfully in the Memory Game.');
            } else {
                speak('The player matched two cards successfully. The AI is observing.');
            }

            const timer = setTimeout(() => {
                setCards(prev => {
                    const updatedCards = [...prev];
                    updatedCards[idx1].isMatched = true;
                    updatedCards[idx2].isMatched = true;
                    return updatedCards;
                });
                setFlippedIndices([]);

                setScores(prev => ({
                    ...prev,
                    [turn]: prev[turn] + 1
                }));
                setIsProcessing(false);
            }, 800);
            return () => clearTimeout(timer);
        } else {
            // No match
            playSound('MEMORY_MISMATCH');

            if (turn === 'opponent') {
                speak('The AI failed to find a match in the Memory Game.');
            } else {
                speak('The player failed to find a match. The AI is amused.');
            }

            const timer = setTimeout(() => {
                setCards(prev => {
                    const resetCards = [...prev];
                    resetCards[idx1].isFlipped = false;
                    resetCards[idx2].isFlipped = false;
                    return resetCards;
                });
                setFlippedIndices([]);
                setTurn(prev => prev === 'player' ? 'opponent' : 'player');
                setIsProcessing(false);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }
  }, [flippedIndices, cards, turn, isProcessing]);

  // --- AI HELPERS ---
  const memorize = useCallback((index: number, sprite: number) => {
      // If memory is full, remove the oldest entry
      if (aiMemory.current.size >= AI_MEMORY_LIMIT) {
          let oldestTime = Infinity;
          let oldestKey = -1;
          for (const [key, val] of aiMemory.current.entries()) {
              if (val.time < oldestTime) {
                  oldestTime = val.time;
                  oldestKey = key;
              }
          }
          if (oldestKey !== -1) aiMemory.current.delete(oldestKey);
      }

      // Store with accuracy check
      const accuracy = AI_BASE_ACCURACY + (Math.random() * 0.15);
      aiMemory.current.set(index, {
          sprite,
          time: Date.now(),
          accuracy
      });
  }, []);

  // --- PLAYER ACTIONS ---
  const handleCardClick = useCallback((index: number) => {
    if (isProcessing || turn !== 'player' || gameStatus !== 'playing') return;
    if (cards[index].isFlipped || cards[index].isMatched) return;

    revealCard(index);
  }, [isProcessing, turn, gameStatus, cards]);

  const revealCard = useCallback((index: number) => {
    playSound('CARD_FLIP');
    setCards(prev => {
        const newCards = [...prev];
        newCards[index].isFlipped = true;
        return newCards;
    });
    setFlippedIndices(prev => [...prev, index]);
    memorize(index, cards[index].spriteIndex);
  }, [cards, memorize]);

  const findKnownPair = useCallback((): [number, number] | null => {
      const reverseMap = new Map<number, number>(); // sprite -> index

      for (const [index, data] of aiMemory.current.entries()) {
          // Only consider cards that are still in play (not matched)
          if (!cards[index].isMatched) {
              // Accuracy check: sometimes the AI "forgets" or "misremembers"
              if (Math.random() > data.accuracy) continue;

              if (reverseMap.has(data.sprite)) {
                  return [reverseMap.get(data.sprite)!, index];
              }
              reverseMap.set(data.sprite, index);
          }
      }
      return null;
  }, [cards]);

  const pickRandomUnknown = useCallback((excludeIndex: number = -1): number => {
      const unknownIndices = cards
          .map((c, i) => i)
          .filter(i => !cards[i].isMatched && !cards[i].isFlipped && i !== excludeIndex && !aiMemory.current.has(i));

      // If we have exhausted truly "unknown" cards, pick from any unmatched
      let pool = unknownIndices;
      if (pool.length === 0) {
          pool = cards.map((c, i) => i).filter(i => !cards[i].isMatched && !cards[i].isFlipped && i !== excludeIndex);
      }

      if (pool.length === 0) return -1;

      // Sophisticated picking: AI might prefer cards near ones it already knows
      // to "explore" a specific area, or just pick random.
      return pool[Math.floor(Math.random() * pool.length)];
  }, [cards]);

  const findMatchInMemory = useCallback((sprite: number, excludeIndex: number): number => {
      for (const [index, data] of aiMemory.current.entries()) {
          if (data.sprite === sprite && index !== excludeIndex && !cards[index].isMatched) {
              // Accuracy check for recall
              if (Math.random() < data.accuracy) {
                  return index;
              }
          }
      }
      return -1;
  }, [cards]);

  const revealCardForAi = useCallback((index: number) => {
      setCards(prev => {
          const newCards = [...prev];
          newCards[index].isFlipped = true;
          return newCards;
      });

      // AI visual update
      setFlippedIndices(prev => [...prev, index]);
      memorize(index, cards[index].spriteIndex);
  }, [cards, memorize]);

  const playAiTurn = useCallback(async () => {
      if (gameStatus !== 'playing' || turn !== 'opponent' || isProcessing || flippedIndices.length > 0) return;

      // 1. "Thinking" phase - AI scans the board
      const scanCount = 2 + Math.floor(Math.random() * 3);
      if (Math.random() < 0.3) {
          speak('The AI is thinking about its move in Memory Game.');
      }
      for (let i = 0; i < scanCount; i++) {
          const pool = cards.map((_, idx) => idx).filter(idx => !cards[idx].isMatched && !cards[idx].isFlipped);
          if (pool.length === 0) break;
          const randomIdx = pool[Math.floor(Math.random() * pool.length)];
          setAiThinkingIndex(randomIdx);
          playSound('UI_HOVER'); // Subtle sound for AI scanning
          await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
      }
      setAiThinkingIndex(null);
      await new Promise(r => setTimeout(r, 400));

      // 2. Check if AI knows a pair in memory
      const knownPair = findKnownPair();

      if (knownPair && Math.random() < 0.9) { // 90% chance to act on a known pair
          // Execute perfect match
          revealCardForAi(knownPair[0]);
          await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
          revealCardForAi(knownPair[1]);
      } else {
          // 3. Pick a random unknown card
          const firstPick = pickRandomUnknown();
          if (firstPick === -1) return;

          // Flip first
          revealCardForAi(firstPick);

          // Wait for first card to be visible
          await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));

          // 4. After seeing first card, do I know its match?
          const sprite = cards[firstPick].spriteIndex;
          const matchInMem = findMatchInMemory(sprite, firstPick);

          if (matchInMem !== -1 && Math.random() < 0.95) {
              // Found match in memory!
              revealCardForAi(matchInMem);
          } else {
              // Pick another random
              const secondPick = pickRandomUnknown(firstPick);
              if (secondPick !== -1) {
                  revealCardForAi(secondPick);
              }
          }
      }
  }, [cards, gameStatus, turn, isProcessing, flippedIndices, findKnownPair, revealCardForAi, findMatchInMemory, pickRandomUnknown]);

  // --- GAME END & TURN TRANSITION LOGIC ---
  useEffect(() => {
    if (gameStatus === 'finished' || isProcessing || flippedIndices.length > 0) return;

    const matchedCount = cards.filter(c => c.isMatched).length;
    if (cards.length > 0 && matchedCount === cards.length) {
        setGameStatus('finished');
        if (scores.player > scores.opponent) {
            playSound('MATCH_VICTORY');
            speak('The AI lost the Memory Game to the player.', 5000);
            useAnimationStore.getState().spawnCoins(20, {x: window.innerWidth/2, y: window.innerHeight/2}, {x: window.innerWidth/2, y: window.innerHeight});
        } else if (scores.player < scores.opponent) {
            playSound('MATCH_DEFEAT');
            speak('The AI won the Memory Game against the player.', 5000);
        } else {
            // Draw
            playSound('UI_CLICK');
        }
        return;
    }

    if (turn === 'opponent') {
        const timer = setTimeout(playAiTurn, 1000);
        return () => clearTimeout(timer);
    }
  }, [cards, gameStatus, isProcessing, flippedIndices, turn, scores, playAiTurn]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-start py-4 sm:py-6 relative">

        {/* HUD - Opponent (Top) */}
        <div className="w-full max-w-4xl px-4 flex justify-between items-center mb-4">
             <button onClick={onBack} className="flex items-center gap-2 text-stone-400 hover:text-amber-400 transition-colors z-20">
                {getIcon('minigames', 'arrow_left', { size: 20 })} <span className="hidden sm:inline">Leave Table</span>
            </button>

            <div className={`
                flex items-center gap-4 bg-stone-900/90 p-2 pr-6 rounded-bl-xl rounded-tr-xl border border-stone-700 transition-all duration-300 relative
                ${turn === 'opponent' ? 'ring-2 ring-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] scale-105' : 'opacity-80'}
            `}>
                <AnimatePresence>
                    {opponentSpeech && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5, y: 20, x: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            className="absolute -bottom-16 left-0 bg-stone-100 text-stone-900 px-4 py-2 rounded-lg rounded-tl-none shadow-xl border-2 border-stone-300 z-30 font-serif italic text-sm min-w-[150px]"
                        >
                            <div className="absolute -top-2 left-0 w-4 h-4 bg-stone-100 border-l-2 border-t-2 border-stone-300 transform -rotate-45 -translate-y-1"></div>
                            {opponentSpeech}
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center border-2 border-amber-600 relative overflow-hidden">
                    <img
                      src={opponent.matrixUrl}
                      alt={opponent.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                </div>
                <div>
                    <div className="text-[10px] uppercase text-amber-500 font-bold tracking-widest leading-none mb-1">{opponent.role}</div>
                    <div className="text-xl font-gothic text-stone-200 leading-none">{opponent.name}</div>
                    <div className="text-sm font-sans text-stone-500 mt-1">{scores.opponent} <span className="text-[10px] uppercase">pairs</span></div>
                </div>
            </div>
        </div>

        {/* Game Status Banner */}
        <div className="h-12 mb-4 flex items-center justify-center w-full">
            {turn === 'player' && gameStatus === 'playing' && (
                <div className="bg-blue-900/30 text-blue-200 px-6 py-1 rounded-full border border-blue-500/50 animate-pulse flex items-center gap-2">
                    {getIcon('minigames', 'user', { size: 16 })} Your Turn
                </div>
            )}
            {turn === 'opponent' && gameStatus === 'playing' && (
                <div className="bg-red-900/30 text-red-200 px-6 py-1 rounded-full border border-red-500/50 flex items-center gap-2">
                    {getIcon('minigames', 'refresh', { size: 16, className: 'animate-spin' })} Opponent is thinking...
                </div>
            )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-6 px-4 pb-8 max-w-5xl mx-auto flex-1 content-center justify-items-center">
            <AnimatePresence>
                {cards.map((card, i) => {
                    const isFaceUp = card.isFlipped || card.isMatched;
                    return (
                        <motion.div
                            key={card.id}
                            layout
                            initial={{
                                opacity: 0,
                                scale: 0,
                                x: 0,
                                y: 500, // Slide from "hand" (bottom)
                                rotate: Math.random() * 20 - 10
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                x: 0,
                                y: 0,
                                rotate: 0,
                                transition: {
                                    type: 'spring',
                                    stiffness: 100,
                                    damping: 15,
                                    delay: i * 0.05 // Staggered deal
                                }
                            }}
                            whileHover={!card.isMatched && !card.isFlipped && turn === 'player' ? {
                                scale: 1.05,
                                y: -5,
                                zIndex: 10,
                                transition: { duration: 0.2 }
                            } : {}}
                            className="relative w-14 h-20 sm:w-24 sm:h-32"
                        >
                            {aiThinkingIndex === i && (
                                <motion.div
                                    layoutId="ai-focus"
                                    className="absolute -inset-2 border-2 border-red-500/50 rounded-lg z-10 pointer-events-none"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.2 }}
                                />
                            )}
                            <Card
                                variant="simple"
                                spriteIndex={card.spriteIndex}
                                isFaceUp={isFaceUp}
                                inverted={false}
                                onClick={() => handleCardClick(i)}
                                className={`
                                    w-full h-full transition-all duration-500
                                    ${card.isMatched ? 'opacity-40 grayscale scale-95' : 'shadow-xl'}
                                    ${!card.isMatched && !card.isFlipped && turn === 'player' ? 'ring-amber-400/50' : ''}
                                `}
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>

        {/* HUD - Player (Bottom) */}
        <div className="w-full max-w-4xl px-4 flex justify-end items-end mt-auto mb-4">
            <div className={`
                flex items-center gap-4 bg-stone-900/90 p-2 pl-6 rounded-tl-xl rounded-br-xl border border-stone-700 transition-all duration-300
                ${turn === 'player' ? 'ring-2 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-105' : 'opacity-80'}
            `}>
                <div className="text-right">
                    <div className="text-xs uppercase text-blue-500 font-bold tracking-widest">You</div>
                    <div className="text-2xl font-gothic text-stone-200 leading-none">{scores.player} <span className="text-xs font-sans text-stone-500">pairs</span></div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center border-2 border-blue-700">
                    {getIcon('minigames', 'user', { size: 20, className: 'text-blue-200' })}
                </div>
            </div>
        </div>

        {/* End Screen Overlay */}
        {gameStatus === 'finished' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 animate-in fade-in backdrop-blur-sm">
                <div className="text-center p-8 bg-stone-900 border-4 border-amber-600 rounded-xl shadow-2xl max-w-md w-full mx-4">
                    {scores.player > scores.opponent ? (
                        <>
                            {getIcon('minigames', 'trophy', { size: 64, className: 'text-yellow-400 mx-auto mb-4 animate-bounce' })}
                            <h2 className="text-5xl font-gothic text-transparent bg-clip-text bg-gradient-to-t from-yellow-600 to-yellow-200 mb-2">Victory!</h2>
                            <p className="text-stone-300 mb-6 text-lg">You outwitted your opponent.</p>
                        </>
                    ) : scores.player < scores.opponent ? (
                        <>
                            {getIcon('minigames', 'skull', { size: 64, className: 'text-stone-500 mx-auto mb-4' })}
                            <h2 className="text-5xl font-gothic text-stone-500 mb-2">Defeat</h2>
                            <p className="text-stone-400 mb-6 text-lg">Opponent claims the pot.</p>
                        </>
                    ) : (
                        <>
                            {getIcon('minigames', 'refresh', { size: 64, className: 'text-stone-400 mx-auto mb-4' })}
                            <h2 className="text-5xl font-gothic text-stone-300 mb-2">Draw</h2>
                            <p className="text-stone-400 mb-6 text-lg">A test of equals.</p>
                        </>
                    )}

                    <div className="flex justify-center gap-8 text-2xl font-gothic mb-8 border-t border-b border-stone-800 py-4">
                        <div className="text-blue-400 flex flex-col">
                            <span className="text-xs font-sans uppercase text-stone-500">You</span>
                            {scores.player}
                        </div>
                        <div className="text-red-500 flex flex-col">
                            <span className="text-xs font-sans uppercase text-stone-500">Opponent</span>
                            {scores.opponent}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={startNewGame}
                            className="px-8 py-3 bg-amber-700 hover:bg-amber-600 text-stone-100 font-bold rounded shadow-lg text-lg transition-transform hover:scale-105"
                        >
                            Play Again
                        </button>
                        <button
                            onClick={onBack}
                            className="px-8 py-3 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 font-bold rounded transition-colors"
                        >
                            Back to Tavern
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default MemoryGame;
