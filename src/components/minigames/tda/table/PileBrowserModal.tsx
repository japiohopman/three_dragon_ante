import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameIcon } from '../../../../assets/icons';
import Card from '../Card';
import { CardData } from '../../../../types';

interface PileBrowserModalProps {
  browsingPile: 'deck' | 'discard' | null;
  deck: CardData[];
  discardPile: CardData[];
  onClose: () => void;
}

export const PileBrowserModal: React.FC<PileBrowserModalProps> = ({
  browsingPile,
  deck,
  discardPile,
  onClose
}) => {
  return (
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
                      onClick={onClose}
                      className="bg-stone-900 border border-stone-700 text-stone-400 p-4 rounded-full hover:bg-stone-800 hover:text-white transition-all shadow-xl active:scale-90"
                  >
                      <GameIcon name="close" size={32} />
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
                              <GameIcon name="skull" size={48} className="text-stone-900 mb-4" />
                              <p className="text-stone-600 font-serif italic text-xl">The pile is empty...</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
