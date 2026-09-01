import React from 'react';
import { getIcon } from '../../../../assets/icons';
import { PlayerSkill } from '../../../../types';
import { playSound } from '../../../../services/soundService';
import { SPRITE_MAP, ATLAS_URL } from '../../../../utils/constants';

interface LobbyScreenProps {
  characterStats?: Record<string, number>;
  selectedSkill: PlayerSkill;
  setSelectedSkill: (skill: PlayerSkill) => void;
  opponentCount: number;
  setOpponentCount: (count: number) => void;
  showRules: boolean;
  setShowRules: (show: boolean) => void;
  startGame: (duration: number, skill: PlayerSkill, opponentCount?: number) => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  characterStats,
  selectedSkill,
  setSelectedSkill,
  opponentCount,
  setOpponentCount,
  showRules,
  setShowRules,
  startGame
}) => {
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
    return (characterStats[req.stat] || 0) >= req.value;
  };

  return (
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
                              <span className={`text-sm font-mono font-bold ${Number(val) >= 14 ? 'text-amber-400' : 'text-stone-300'}`}>{val}</span>
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
              <div className="col-span-full mb-6 flex flex-col items-center">
                  <h3 className="text-amber-500 font-bold tracking-widest uppercase mb-3 drop-shadow-sm">Choose Opponents Count</h3>
                  <div className="flex gap-2 bg-stone-900/60 p-1.5 rounded-xl border border-stone-800">
                      {[1, 2, 3, 4, 5].map((count) => (
                          <button
                              key={count}
                              onClick={() => {
                                  playSound('UI_CLICK');
                                  setOpponentCount(count);
                              }}
                              className={`px-5 py-2 rounded-lg font-gothic text-xl transition-all ${opponentCount === count ? 'bg-amber-600 text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-200'}`}
                          >
                              {count} Opponent{count > 1 ? 's' : ''}
                          </button>
                      ))}
                  </div>
              </div>

              <button
                  onClick={() => {
                      playSound('UI_CLICK');
                      startGame(3, selectedSkill, opponentCount);
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
                      startGame(6, selectedSkill, opponentCount);
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
                      startGame(9, selectedSkill, opponentCount);
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
  );
};
