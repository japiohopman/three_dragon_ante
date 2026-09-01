import React, { useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { NPC_LIST } from '../../../utils/npcConstants';
import { playSound } from '../../../services/soundService';

import { TavernLeftAside } from './table/TavernLeftAside';
import { MultiplayerSeats } from './table/MultiplayerSeats';
import { Battleground } from './table/Battleground';
import { PlayerHandArea } from './table/PlayerHandArea';
import { TavernRightAside } from './table/TavernRightAside';
import { PileBrowserModal } from './table/PileBrowserModal';
import { OpponentInspectorDrawer } from './table/OpponentInspectorDrawer';

const TableTop: React.FC = () => {
  const {
    players,
    activePlayerIndex,
    focusedOpponentIndex,
    setFocusedOpponentIndex,
    playerHand,
    playerFlight,
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
    round
  } = useGameStore();

  const getNPCName = () => {
    return NPC_LIST.find(n => n.id === npcId)?.name || 'Opponent';
  };

  const [showLog, setShowLog] = useState(false);
  const [browsingPile, setBrowsingPile] = useState<'deck' | 'discard' | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [direction, setDirection] = useState(0);

  // Helper to go to next opponent
  const nextOpponent = () => {
    if (players.length <= 2) return;
    setDirection(1);
    const nextIdx = focusedOpponentIndex === players.length - 1 ? 1 : focusedOpponentIndex + 1;
    setFocusedOpponentIndex(nextIdx);
    playSound('UI_CLICK');
  };

  // Helper to go to previous opponent
  const prevOpponent = () => {
    if (players.length <= 2) return;
    setDirection(-1);
    const prevIdx = focusedOpponentIndex === 1 ? players.length - 1 : focusedOpponentIndex - 1;
    setFocusedOpponentIndex(prevIdx);
    playSound('UI_CLICK');
  };

  const focusedOpponent = players[focusedOpponentIndex] || players[1];

  React.useEffect(() => {
    if (activePlayerIndex > 0 && activePlayerIndex < players.length) {
      setFocusedOpponentIndex(activePlayerIndex);
    }
  }, [activePlayerIndex, players.length, setFocusedOpponentIndex]);

  React.useEffect(() => {
    if (phase === 'opponent-turn' || (phase === 'round-start' && activePlayer !== 'player' && activePlayer !== null)) {
      setIsDrawerOpen(true);
    }
  }, [phase, activePlayer]);

  const isPlayerTurn = (phase === 'player-turn' && activePlayer === 'player') ||
                       (phase === 'round-start' && currentLeader === 'player');

  return (
    <div className="relative w-full h-full flex bg-stone-950 overflow-hidden font-serif">

      {/* 1. LEFT ASIDE: TAVERN & NPC INFO */}
      <TavernLeftAside
        npcId={npcId}
        opponentEmotion={opponentEmotion}
        isTalking={isTalking}
        npcLine={npcLine}
        activePlayer={activePlayer}
        getNPCName={getNPCName}
        currentLeader={currentLeader}
        opponentGold={opponentGold}
        deckLength={deck.length}
        onOpenDeck={() => setBrowsingPile('deck')}
      />

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
            <div className="relative z-10 w-full h-full flex flex-col items-center py-6">

                {/* MULTIPLAYER SEATS */}
                <MultiplayerSeats
                  players={players}
                  focusedOpponentIndex={focusedOpponentIndex}
                  activePlayer={activePlayer}
                  currentLeader={currentLeader}
                  lastCardPlayed={lastCardPlayed}
                  onSelectOpponent={(idx) => {
                      setFocusedOpponentIndex(idx);
                      setIsDrawerOpen(true);
                  }}
                />

                {/* BATTLEGROUND */}
                <Battleground
                  opponentAnte={opponentAnte}
                  playerAnte={playerAnte}
                  pot={pot}
                  phase={phase}
                />

                {/* PLAYER FLIGHT & HAND */}
                <PlayerHandArea
                  playerHand={playerHand}
                  playerFlight={playerFlight}
                  lastCardPlayed={lastCardPlayed}
                  phase={phase}
                  isPlayerTurn={isPlayerTurn}
                  selectAnte={selectAnte}
                  playCard={playCard}
                  isLeader={currentLeader === 'player'}
                />
            </div>

        </div>
      </main>

      {/* 3. RIGHT ASIDE: GAME INFO & STAKES */}
      <TavernRightAside
        gambitsPlayed={gambitsPlayed}
        round={round}
        maxGambits={maxGambits}
        history={useGameStore.getState().history}
        showLog={showLog}
        setShowLog={setShowLog}
        onInspect={() => {
            playSound('UI_CLICK');
            setIsDrawerOpen(true);
        }}
        discardPile={discardPile}
        onOpenDiscard={() => setBrowsingPile('discard')}
      />

      {/* PILE BROWSING OVERLAY */}
      <PileBrowserModal
        browsingPile={browsingPile}
        deck={deck}
        discardPile={discardPile}
        onClose={() => setBrowsingPile(null)}
      />

      {/* 4. SLIDE-OUT OPPONENTS CAROUSEL DRAWER */}
      <OpponentInspectorDrawer
        isDrawerOpen={isDrawerOpen}
        focusedOpponent={focusedOpponent}
        players={players}
        activePlayer={activePlayer}
        phase={phase}
        lastCardPlayed={lastCardPlayed}
        direction={direction}
        prevOpponent={prevOpponent}
        nextOpponent={nextOpponent}
        onClose={() => setIsDrawerOpen(false)}
      />

    </div>
  );
};

export default TableTop;
