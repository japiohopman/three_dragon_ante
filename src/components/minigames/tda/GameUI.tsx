import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { useAnimationStore } from '../../../store/useAnimationStore';
import { CardData, PlayerSkill } from '../../../types';
import { NPC_LIST } from '../../../utils/npcConstants';
import RulebookModal from './RulebookModal';
import { playSound } from '../../../services/soundService';

import { HeaderHUD } from './ui/HeaderHUD';
import { NotificationBanner } from './ui/NotificationBanner';
import { FocusOverlay } from './ui/FocusOverlay';
import { InteractionModal } from './ui/InteractionModal';
import { LobbyScreen } from './ui/LobbyScreen';
import { EndGameModal } from './ui/EndGameModal';

interface GameUIProps {
  onExit?: () => void;
}

const GameUI: React.FC<GameUIProps> = ({ onExit }) => {
  const {
    playerGold,
    opponentGold,
    phase,
    notification,
    startGame,
    startNextGambit,
    currentLeader,
    pendingInteraction,
    playerHand,
    respondToInteraction,
    gambitResult,
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
    characterStats,
    lastCardPlayed
  } = useGameStore();

  const { focusedCardId, hoveredCardId, setFocusedCard } = useAnimationStore();

  const players = useGameStore(s => s.players);
  const activePlayerIndex = useGameStore(s => s.activePlayerIndex);
  const currentLeaderIndex = useGameStore(s => s.currentLeaderIndex);
  const activeP = players[activePlayerIndex];
  const leaderP = players[currentLeaderIndex];

  const isGambitEnd = phase === 'gambit-end';
  const isGameOver = phase === 'game-over';
  const isLobby = phase === 'lobby';
  const isInteraction = !!pendingInteraction;

  // AI State Check for subtle UI indicator
  const isAiThinking = Boolean(
    (activeP?.isNpc && (phase === 'opponent-turn' || phase === 'round-start')) ||
    (isInteraction && pendingInteraction?.target !== 'player')
  );

  // --- KEYBOARD SHORTCUTS (e.g. ? or h for Rulebook) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        setShowRules((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showHud = !isLobby && !isGameOver;

  const [selectedSkill, setSelectedSkill] = useState<PlayerSkill>('none');
  const [showRules, setShowRules] = useState(false);
  const [longTurn, setLongTurn] = useState(false);
  const [opponentCount, setOpponentCount] = useState<number>(1);

  // --- WATCHDOG: AUTO-FIX STUCK AI ---
  useEffect(() => {
      if (activeP?.isNpc && (phase === 'opponent-turn' || phase === 'round-start') && !pendingInteraction) {
          const timer = setTimeout(() => {
              console.warn(`Watchdog: AI (${activeP.name}) taking too long. Forcing turn.`);
              useGameStore.getState().aiTurn();
          }, 6000);
          return () => clearTimeout(timer);
      }
  }, [phase, activeP, pendingInteraction]);

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

  const canPlayFocused = Boolean(focusedCard && playerHand.some(c => c.id === focusedCard.id)
      && (phase === 'player-turn' || phase === 'round-start') && activePlayer === 'player');

  const canAnteFocused = Boolean(focusedCard && playerHand.some(c => c.id === focusedCard.id)
      && phase === 'ante-selection');

  const getNPCName = () => {
      return NPC_LIST.find(n => n.id === npcId)?.name || 'Opponent';
  };

  const getPhaseInstruction = () => {
      if (pendingInteraction) {
          if (pendingInteraction.target === 'player') {
              return `${pendingInteraction.sourceCardName}: Make your decision!`;
          }
          const targetPlayer = players.find(p => p.id === pendingInteraction.target);
          const targetName = targetPlayer ? targetPlayer.name : 'Opponent';
          return `${targetName} is resolving ${pendingInteraction.sourceCardName}...`;
      }
      if (phase === 'ante-selection') return "Select a card from your hand to Ante.";
      if (phase === 'ante-reveal') return "Revealing Antes...";
      if (phase === 'player-turn') return "Your Turn: Play a card to your Flight.";
      if (phase === 'round-start' && leaderP?.id === 'player') return "You lead the round: Play a card.";
      if (phase === 'round-start' && leaderP?.isNpc) return `${leaderP.name} leads the round...`;
      if (phase === 'opponent-turn' && activeP?.isNpc) return `${activeP.name} is thinking...`;
      if (phase === 'round-resolution') return "Resolving round...";
      if (phase === 'gambit-end') return "Gambit Complete.";
      return "";
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex flex-col justify-between overflow-hidden">
      {/* HUD */}
      {showHud && (
        <HeaderHUD
          onExit={onExit}
          setShowRules={setShowRules}
          infoCard={infoCard}
          isAiThinking={isAiThinking}
          getPhaseInstruction={getPhaseInstruction}
          longTurn={longTurn}
        />
      )}

      {/* NOTIFICATIONS */}
      <NotificationBanner notification={notification} />

      {/* FOCUS OVERLAY */}
      <FocusOverlay
        focusedCard={focusedCard}
        canPlayFocused={canPlayFocused}
        canAnteFocused={canAnteFocused}
        lastCardPlayed={lastCardPlayed}
        onPlayFocused={handlePlayFocused}
        onSelectAnteFocused={handleSelectAnteFocused}
        onClose={() => setFocusedCard(null)}
      />

      {/* INTERACTION MODAL */}
      {isInteraction && (
        <InteractionModal
          pendingInteraction={pendingInteraction}
          playerGold={playerGold}
          selectableCards={selectableCards}
          respondToInteraction={respondToInteraction}
        />
      )}

      {/* LOBBY */}
      {isLobby && (
        <LobbyScreen
          characterStats={characterStats}
          selectedSkill={selectedSkill}
          setSelectedSkill={setSelectedSkill}
          opponentCount={opponentCount}
          setOpponentCount={setOpponentCount}
          showRules={showRules}
          setShowRules={setShowRules}
          startGame={startGame}
        />
      )}

      {/* RULEBOOK MODAL */}
      {showRules && (
          <RulebookModal onClose={() => {
              playSound('UI_MODAL_CLOSE');
              setShowRules(false);
          }} />
      )}

      {/* GAMBIT END & GAME OVER MODALS */}
      <EndGameModal
        isGambitEnd={isGambitEnd}
        isGameOver={isGameOver}
        gambitResult={gambitResult}
        playerGold={playerGold}
        opponentGold={opponentGold}
        npcName={getNPCName()}
        startNextGambit={startNextGambit}
        resetGame={resetGame}
        onExit={onExit}
      />
    </div>
  );
};

export default GameUI;
