
import React, { useState, useEffect } from 'react';
import Card from './tda/Card';
import { generateStandardDeck } from '../../utils/constants';
import { StandardCardData, Rank, Suit } from '../../types';
import { getIcon } from '../../assets/icons';
import { useAnimationStore } from '../../store/useAnimationStore';
import { playSound } from '../../services/soundService';

interface SolitaireGameProps {
  onBack: () => void;
}

const RANK_VALUE: Record<Rank, number> = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
};

const isRed = (suit: Suit) => suit === 'hearts' || suit === 'diamonds';

type LocationType = 'waste' | 'tableau' | 'foundation';

interface Selection {
    location: LocationType;
    colIdx?: number; // For tableau/foundation
    cardIdx?: number; // Index in the stack
}

const SolitaireGame: React.FC<SolitaireGameProps> = ({ onBack }) => {
  const [stock, setStock] = useState<StandardCardData[]>([]);
  const [waste, setWaste] = useState<StandardCardData[]>([]);
  const [foundations, setFoundations] = useState<StandardCardData[][]>([[], [], [], []]);
  const [tableau, setTableau] = useState<StandardCardData[][]>([[], [], [], [], [], [], []]);

  const [selection, setSelection] = useState<Selection | null>(null);
  const [isDealing, setIsDealing] = useState(false);
  const [isWon, setIsWon] = useState(false);

  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const [dragOverTarget, setDragOverTarget] = useState<{loc: LocationType, idx: number} | null>(null);

  const dealNewGame = () => {
    setIsDealing(true);
    setIsWon(false);
    setScore(0);
    setSeconds(0);
    const deck = generateStandardDeck();

    const newTableau: StandardCardData[][] = [[], [], [], [], [], [], []];
    let cardIdx = 0;

    for (let i = 0; i < 7; i++) {
        for (let j = 0; j <= i; j++) {
            const card = deck[cardIdx++];
            card.isFaceUp = (j === i);
            newTableau[i].push(card);
        }
    }

    const newStock = deck.slice(cardIdx);

    setStock([]);
    setWaste([]);
    setFoundations([[], [], [], []]);
    setTableau([[], [], [], [], [], [], []]);
    setSelection(null);
    playSound('CARD_SHUFFLE');

    setTimeout(() => {
        setTableau(newTableau);
        setStock(newStock);
        setIsDealing(false);
        playSound('CARD_DEAL');
        useAnimationStore.getState().triggerShake(0);
    }, 500);
  };

  useEffect(() => {
    dealNewGame();
  }, []);

  useEffect(() => {
      if (isWon) return;
      const interval = setInterval(() => {
          setSeconds(s => s + 1);
      }, 1000);
      return () => clearInterval(interval);
  }, [isWon]);

  useEffect(() => {
      if (foundations.every(f => f.length === 13)) {
          setIsWon(true);
          playSound('SOLITAIRE_WIN');
          useAnimationStore.getState().spawnCoins(50, {x: window.innerWidth/2, y: window.innerHeight/2}, {x: window.innerWidth/2, y: 0});
      }
  }, [foundations]);

  const formatTime = (totalSeconds: number) => {
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getCard = (sel: Selection): StandardCardData | null => {
      if (sel.location === 'waste') return waste[waste.length - 1] || null;
      if (sel.location === 'tableau' && typeof sel.colIdx === 'number' && typeof sel.cardIdx === 'number') {
          return tableau[sel.colIdx][sel.cardIdx] || null;
      }
      return null;
  };

  const canMoveToFoundation = (card: StandardCardData, pileIdx: number): boolean => {
      const pile = foundations[pileIdx];
      if (pile.length === 0) {
          return card.rank === 'A';
      }
      const top = pile[pile.length - 1];
      return top.suit === card.suit && RANK_VALUE[card.rank] === RANK_VALUE[top.rank] + 1;
  };

  const canMoveToTableau = (card: StandardCardData, colIdx: number): boolean => {
      const col = tableau[colIdx];
      if (col.length === 0) {
          return card.rank === 'K';
      }
      const top = col[col.length - 1];
      return isRed(card.suit) !== isRed(top.suit) && RANK_VALUE[card.rank] === RANK_VALUE[top.rank] - 1;
  };

  const handleStockClick = () => {
      setSelection(null);
      if (stock.length === 0) {
          if (waste.length === 0) return;
          playSound('CARD_SHUFFLE');
          const newStock = [...waste].reverse().map(c => ({ ...c, isFaceUp: false }));
          setStock(newStock);
          setWaste([]);
      } else {
          const newStock = [...stock];
          const card = newStock.pop();
          if (card) {
              playSound('CARD_FLIP');
              card.isFaceUp = true;
              setWaste(prev => [...prev, card]);
              setStock(newStock);
          }
      }
  };

  const attemptAutoMoveToFoundation = (card: StandardCardData, fromSelection: Selection): boolean => {
      for (let i = 0; i < 4; i++) {
          if (canMoveToFoundation(card, i)) {
              executeMove(fromSelection, { location: 'foundation', colIdx: i });
              return true;
          }
      }
      return false;
  };

  const handleDoubleClick = (location: LocationType, colIdx?: number, cardIdx?: number) => {
      let clickedCard: StandardCardData | null = null;
      let fromSelection: Selection | null = null;

      if (location === 'waste') {
          if (waste.length === 0) return;
          clickedCard = waste[waste.length - 1];
          fromSelection = { location: 'waste' };
      } else if (location === 'tableau' && typeof colIdx === 'number' && typeof cardIdx === 'number') {
          if (cardIdx !== tableau[colIdx].length - 1) return;
          clickedCard = tableau[colIdx][cardIdx];
          fromSelection = { location: 'tableau', colIdx, cardIdx };
      }

      if (clickedCard && fromSelection) {
           attemptAutoMoveToFoundation(clickedCard, fromSelection);
      }
  };

  const handleCardClick = (location: LocationType, colIdx?: number, cardIdx?: number) => {
      if (selection) {
          if (location === 'tableau' && typeof colIdx === 'number') {
              const cardToMove = getCard(selection);
              if (cardToMove && canMoveToTableau(cardToMove, colIdx)) {
                  executeMove(selection, { location: 'tableau', colIdx });
                  setSelection(null);
                  return;
              }
          }
      }

      let clickedCard: StandardCardData | null = null;
      let newSelection: Selection | null = null;

      if (location === 'waste') {
          if (waste.length === 0) return;
          clickedCard = waste[waste.length - 1];
          newSelection = { location: 'waste' };
      }
      else if (location === 'tableau' && typeof colIdx === 'number' && typeof cardIdx === 'number') {
          clickedCard = tableau[colIdx][cardIdx];
          if (!clickedCard.isFaceUp) return;
          newSelection = { location: 'tableau', colIdx, cardIdx };
      }

      if (clickedCard && newSelection) {
          if (selection && selection.location === location && selection.colIdx === colIdx && selection.cardIdx === cardIdx) {
              setSelection(null);
          } else {
              setSelection(newSelection);
          }
      }
  };

  const handleEmptyTableauClick = (colIdx: number) => {
      if (selection) {
          const card = getCard(selection);
          if (card && card.rank === 'K') {
              executeMove(selection, { location: 'tableau', colIdx });
              setSelection(null);
          }
      }
  };

  const executeMove = (from: Selection, to: { location: LocationType, colIdx?: number }) => {
      const nextWaste = [...waste];
      const nextTableau = tableau.map(col => [...col]);
      const nextFoundations = foundations.map(pile => [...pile]);

      let stackToMove: StandardCardData[] = [];

      if (from.location === 'waste') {
          stackToMove = [nextWaste.pop()!];
      } else if (from.location === 'tableau') {
          stackToMove = nextTableau[from.colIdx!].splice(from.cardIdx!);
          const sourceCol = nextTableau[from.colIdx!];
          if (sourceCol.length > 0) sourceCol[sourceCol.length-1].isFaceUp = true;
      }

      if (to.location === 'foundation') {
          nextFoundations[to.colIdx!].push(stackToMove[0]);
          setScore(s => s + 10);
          playSound('SOLITAIRE_STACK');
      } else if (to.location === 'tableau') {
          nextTableau[to.colIdx!].push(...stackToMove);
          playSound('CARD_SLAM');
      }

      setWaste(nextWaste);
      setTableau(nextTableau);
      setFoundations(nextFoundations);
  };

  const handleDragStart = (e: React.DragEvent, location: LocationType, colIdx?: number, cardIdx?: number) => {
      const dragData: Selection = { location, colIdx, cardIdx };
      e.dataTransfer.setData('application/json', JSON.stringify(dragData));
      e.dataTransfer.effectAllowed = 'move';
      setSelection(dragData);
  };

  const handleDragOver = (e: React.DragEvent, location: LocationType, colIdx: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverTarget?.loc !== location || dragOverTarget?.idx !== colIdx) {
          setDragOverTarget({ loc: location, idx: colIdx });
      }
  };

  const handleDrop = (e: React.DragEvent, location: LocationType, colIdx: number) => {
      e.preventDefault();
      setDragOverTarget(null);

      try {
          const data = JSON.parse(e.dataTransfer.getData('application/json')) as Selection;
          const cardToMove = getCard(data);

          if (!cardToMove) return;

          if (location === 'foundation') {
              if (canMoveToFoundation(cardToMove, colIdx)) {
                  executeMove(data, { location: 'foundation', colIdx });
                  setSelection(null);
              }
          } else if (location === 'tableau') {
              if (canMoveToTableau(cardToMove, colIdx)) {
                  executeMove(data, { location: 'tableau', colIdx });
                  setSelection(null);
              }
          }
      } catch (err) {
          console.error("Drop failed", err);
      }
  };


  return (
    <div className="w-full h-full flex flex-col p-4 relative bg-[#1c1917]/90">

        {/* Header / HUD */}
        <div className="flex justify-between items-center mb-6 z-20">
             <div className="flex gap-4">
                 <button onClick={onBack} className="flex items-center gap-2 text-stone-400 hover:text-amber-400 transition-colors bg-stone-900/50 px-4 py-2 rounded-full border border-stone-700 backdrop-blur-md">
                    {getIcon('minigames', 'arrow_left', { size: 18 })} Exit
                </button>
                <div className="flex items-center gap-6 bg-stone-900/50 px-6 py-2 rounded-full border border-stone-700 backdrop-blur-md">
                     <div className="flex items-center gap-2 text-stone-300">
                         {getIcon('minigames', 'trophy', { size: 16, className: 'text-amber-500' })}
                         <span className="font-gothic text-xl">{score}</span>
                     </div>
                     <div className="flex items-center gap-2 text-stone-300">
                         {getIcon('minigames', 'clock', { size: 16, className: 'text-stone-500' })}
                         <span className="font-mono text-sm">{formatTime(seconds)}</span>
                     </div>
                </div>
             </div>

            <h2 className="hidden md:block font-gothic text-3xl text-stone-300 drop-shadow-md">Tavern Solitaire</h2>

            <button onClick={dealNewGame} className="flex items-center gap-2 text-stone-400 hover:text-amber-400 transition-colors bg-stone-900/50 px-4 py-2 rounded-full border border-stone-700 backdrop-blur-md">
                {getIcon('minigames', 'refresh', { size: 18, className: isDealing ? 'animate-spin' : '' })} Redeal
            </button>
        </div>

        {/* Legend / Key for Thematic Suits */}
        <div className="flex justify-center gap-8 mb-4 opacity-70">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-200 border border-amber-400" />
                <span className="text-[10px] uppercase tracking-widest text-amber-200">White Suit (Good)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-700 border border-amber-900" />
                <span className="text-[10px] uppercase tracking-widest text-amber-700">Bronze Suit (Evil)</span>
            </div>
        </div>

        {/* Game Board */}
        <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col gap-8">

            {/* TOP ROW */}
            <div className="flex justify-between items-start px-4">

                {/* Stock & Waste */}
                <div className="flex gap-6">
                    <div onClick={handleStockClick} className="relative w-24 h-32 sm:w-28 sm:h-40 cursor-pointer hover:brightness-110 transition-all">
                        {stock.length > 0 ? (
                            <div className="relative">
                                {stock.length > 1 && <div className="absolute top-1 left-1 w-full h-full bg-stone-800 border border-stone-600 rounded-[10px]" />}
                                <Card variant="standard" isFaceUp={false} spriteIndex={23} className="shadow-xl" />
                                <div className="absolute -bottom-6 w-full text-center text-xs text-stone-500 font-gothic">Stock ({stock.length})</div>
                            </div>
                        ) : (
                            <div className="w-24 h-32 sm:w-28 sm:h-40 border-2 border-stone-700/50 rounded-[25px] flex items-center justify-center bg-stone-900/20">
                                {getIcon('minigames', 'rotate_ccw', { className: 'text-stone-600' })}
                            </div>
                        )}
                    </div>

                    <div
                        onClick={() => handleCardClick('waste')}
                        onDoubleClick={() => handleDoubleClick('waste')}
                        className="relative w-24 h-32 sm:w-28 sm:h-40 cursor-pointer"
                    >
                        {waste.length > 0 ? (
                            <div
                                className={`transition-transform ${selection?.location === 'waste' ? 'ring-4 ring-yellow-400 rounded-[25px]' : ''}`}
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, 'waste')}
                            >
                                <Card
                                    variant="standard"
                                    spriteIndex={waste[waste.length-1].spriteIndex}
                                    rank={waste[waste.length-1].rank}
                                    suit={waste[waste.length-1].suit}
                                    isFaceUp={true}
                                    className="shadow-xl"
                                />
                            </div>
                        ) : (
                             <div className="w-24 h-32 sm:w-28 sm:h-40 border-2 border-dashed border-stone-800/30 rounded-[25px]" />
                        )}
                    </div>
                </div>

                {/* Foundations */}
                <div className="flex gap-4">
                    {foundations.map((pile, i) => (
                        <div
                            key={i}
                            className={`
                                w-24 h-32 sm:w-28 sm:h-40 border-2 rounded-[25px] bg-stone-900/30 flex items-center justify-center relative
                                ${dragOverTarget?.loc === 'foundation' && dragOverTarget.idx === i ? 'border-amber-400 bg-amber-900/20' : 'border-stone-700/50'}
                            `}
                            onDragOver={(e) => handleDragOver(e, 'foundation', i)}
                            onDrop={(e) => handleDrop(e, 'foundation', i)}
                        >
                            {pile.length === 0 ? (
                                <span className={`text-4xl font-gothic opacity-50 ${i < 2 ? 'text-amber-200' : 'text-amber-700'}`}>
                                    {['♥','♦','♣','♠'][i]}
                                </span>
                            ) : (
                                <Card
                                    variant="standard"
                                    spriteIndex={pile[pile.length-1].spriteIndex}
                                    rank={pile[pile.length-1].rank}
                                    suit={pile[pile.length-1].suit}
                                    isFaceUp={true}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* TABLEAU */}
            <div className="grid grid-cols-7 gap-2 sm:gap-4 px-2 h-full">
                {tableau.map((col, colIdx) => (
                    <div
                        key={colIdx}
                        className={`
                            flex flex-col items-center relative min-h-[200px] rounded-[25px]
                            ${dragOverTarget?.loc === 'tableau' && dragOverTarget.idx === colIdx ? 'bg-amber-500/10' : ''}
                        `}
                        onClick={() => { if(col.length === 0) handleEmptyTableauClick(colIdx); }}
                        onDragOver={(e) => handleDragOver(e, 'tableau', colIdx)}
                        onDrop={(e) => handleDrop(e, 'tableau', colIdx)}
                    >
                        {col.length === 0 && <div className="w-24 h-32 sm:w-28 sm:h-40 border-2 border-stone-800/30 rounded-[25px] bg-stone-950/20" />}

                        {col.map((card, idx) => {
                            const isSelected = selection?.location === 'tableau' && selection?.colIdx === colIdx && selection?.cardIdx === idx;
                            return (
                                <div
                                    key={card.id}
                                    className={`absolute transition-all duration-300 ${isSelected ? 'z-50 ring-2 ring-yellow-400 rounded-[25px]' : ''}`}
                                    style={{ top: `${idx * 30}px`, zIndex: idx }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCardClick('tableau', colIdx, idx);
                                    }}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        handleDoubleClick('tableau', colIdx, idx);
                                    }}
                                    draggable={card.isFaceUp}
                                    onDragStart={(e) => handleDragStart(e, 'tableau', colIdx, idx)}
                                >
                                    <Card
                                        variant="standard"
                                        spriteIndex={card.spriteIndex}
                                        rank={card.rank}
                                        suit={card.suit}
                                        isFaceUp={card.isFaceUp}
                                        className={`w-24 h-32 sm:w-28 sm:h-40 shadow-md ${card.isFaceUp ? 'cursor-pointer hover:brightness-110' : ''}`}
                                        disabled={!card.isFaceUp}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>

        {/* WIN SCREEN */}
        {isWon && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 animate-in fade-in backdrop-blur-md">
                <div className="text-center p-12 bg-stone-900 border-4 border-amber-500 rounded-xl shadow-[0_0_50px_rgba(245,158,11,0.3)] max-w-md w-full">
                    {getIcon('minigames', 'crown', { size: 80, className: 'text-yellow-400 mx-auto mb-6 animate-bounce' })}
                    <h2 className="text-6xl font-gothic text-transparent bg-clip-text bg-gradient-to-t from-yellow-600 to-yellow-200 mb-4">Ascended!</h2>
                    <p className="text-stone-300 mb-2 font-serif text-xl italic">The cards obey your will.</p>
                    <p className="text-stone-400 mb-8 font-mono">Score: {score} • Time: {formatTime(seconds)}</p>
                    <button onClick={dealNewGame} className="w-full px-8 py-4 bg-amber-700 hover:bg-amber-600 text-stone-100 font-bold rounded shadow-lg text-2xl transition-transform hover:scale-105 active:scale-95">
                        Deal Again
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default SolitaireGame;
