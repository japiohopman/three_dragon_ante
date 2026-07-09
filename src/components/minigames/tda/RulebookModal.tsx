
import React, { useEffect, useRef } from 'react';
import { getIcon } from '../../../assets/icons';

interface RulebookModalProps {
  onClose: () => void;
}

const RulebookModal: React.FC<RulebookModalProps> = ({ onClose }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Prevent background scrolling when modal is open
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    // Smooth scroll to top on open
    if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
    }

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 p-4" onClick={onClose}>
        {/* CSS INJECTION FOR THIS COMPONENT */}
        <style>{`
            .book-cover {
                position: relative;
                width: 100%;
                max-width: 550px;
                height: 90vh;
                max-height: 850px;
                background:
                    radial-gradient(circle at center, transparent 30%, #3e0303 100%),
                    url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc1MDAnIGhlaWdodD0nNTAwJz48ZmlsdGVyIGlkPSdub2lzZSc+PGZlVHVyYnVsZW5jZSB0eXBlPSdmcmFjdGFsTm9pc2UnIGJhc2VGcmVxdWVuY3k9JzAuNjUnIG51bSBPY3RhdmVzPSczJyBzdGl0Y2hUaWxlcz0nc3RpdGNoJy8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9JzEwMCUnIGhlaWdodD0nMTAwJScgZmlsdGVyPSd1cmwoI25vaXNlKScgb3BhY2l0eT0nMC40Jy8+PC9zdmc+'),
                    radial-gradient(circle at 50% 40%, #d63328, #680b0b);
                box-shadow: inset 0 0 50px #1a0202, 10px 10px 30px rgba(0,0,0,0.5);
                border: 2px solid #3e0303;
                border-radius: 5px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 2px;
                z-index: 10;
            }
            .custom-scrollbar::-webkit-scrollbar {
                width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: #f0ead6;
                border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #8a6e2f;
                border: 2px solid #f0ead6;
                border-radius: 10px;
            }
            .book-cover::after {
                content: "";
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.2) 100%);
                pointer-events: none;
                mix-blend-mode: overlay;
            }
            .gold-text-gradient {
                background: linear-gradient(to bottom, #fff5d1 0%, #e6be6e 30%, #b88a32 50%, #e6be6e 80%, #fff5d1 100%);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
                filter: drop-shadow(0px 2px 0px rgba(0,0,0,0.5));
            }
            .dragon-medallion {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                background: radial-gradient(circle, #eecf73 30%, #b68d40 70%, #634819 100%);
                box-shadow: inset 5px 5px 20px rgba(255,255,255,0.4), inset -5px -5px 20px rgba(0,0,0,0.4), 5px 10px 15px rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 15px 0;
                flex-shrink: 0;
            }
            .title-stroke {
                -webkit-text-stroke: 1px rgba(255,255,255,0.4);
            }
        `}</style>

        <div className="book-cover" onClick={e => e.stopPropagation()}>
            {/* CLOSE BUTTON */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="absolute top-4 right-4 z-[100] text-amber-200 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-all hover:scale-110 active:scale-95 pointer-events-auto border border-amber-500/20 shadow-lg"
                title="Close Rulebook"
            >
                {getIcon('ui', 'close', { size: 28 })}
            </button>

            {/* HEADER */}
            <div className="w-full text-center mt-6 z-10">
                <h1 className="font-serif text-3xl font-bold tracking-widest text-[#ebd188] uppercase drop-shadow-md">
                    <span className="gold-text-gradient">Rulebook</span>
                </h1>
            </div>

            {/* MEDALLION LOGO */}
            <div className="dragon-medallion z-10">
                 <div className="font-gothic text-5xl text-[#7a0b0b] mix-blend-multiply opacity-80">
                    3D
                 </div>
            </div>

            {/* SCROLLABLE CONTENT AREA */}
            <div
                ref={scrollRef}
                className="flex-1 w-full px-6 py-4 overflow-y-auto z-20 custom-scrollbar mb-6 min-h-0 overscroll-contain"
            >
                <div className="bg-[#fdf6e3] text-[#2b0808] p-6 rounded shadow-inner font-serif text-sm leading-relaxed border border-[#d6cba8] relative">
                    {/* Paper Texture Overlay */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 pointer-events-none"></div>

                    <div className="relative z-10">
                        <h2 className="font-bold text-xl uppercase border-b border-[#8a6e2f] pb-2 mb-4 text-[#8a6e2f]">Play Summary</h2>

                        <h3 className="font-bold text-base mt-4 mb-1">Setup</h3>
                        <p className="mb-2">Each player starts with 50 gold. Hand size is 6 cards (Max 10). Ante up to determine the Leader.</p>

                        <h3 className="font-bold text-base mt-4 mb-1">The Gambit (Turn Structure)</h3>
                        <ol className="list-decimal pl-5 space-y-1 mb-4">
                            <li><strong>Leader Plays:</strong> Power ALWAYS triggers.</li>
                            <li><strong>Others Play:</strong> Power triggers ONLY if the card is weaker or equal to the previous card played.</li>
                            <li><strong>Round End:</strong> Strongest card becomes the new Leader.</li>
                        </ol>

                        <h3 className="font-bold text-base mt-4 mb-1">Winning</h3>
                        <p className="mb-2">After 3 rounds, the player with the highest total Flight Strength wins the Stakes (Pot).</p>

                        <h3 className="font-bold text-base mt-4 mb-1">Special Flights</h3>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li><strong>Color Flight (3 Same Color):</strong> Opponents pay you the strength of your 2nd dragon.</li>
                            <li><strong>Strength Flight (3 Same Strength):</strong> Steal gold from the Pot equal to the dragon's strength.</li>
                        </ul>

                        <h3 className="font-bold text-base mt-4 mb-1">Buying Cards</h3>
                        <p className="mb-2">If you start your turn with 0 or 1 card, you MUST buy. Pay the top deck card's strength to refill your hand to 4.</p>

                        <div className="mt-8 text-center text-xs italic text-[#8a6e2f] opacity-80">
                            "Gold on the table is for the game."
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div className="text-center mb-6 z-10">
                <div className="font-gothic text-3xl leading-none text-[#f7e6b7] title-stroke drop-shadow-md">
                    <span className="gold-text-gradient block">Three-Dragon</span>
                </div>
                <div className="font-gothic text-2xl leading-none text-[#f7e6b7] title-stroke drop-shadow-md mt-1">
                    <span className="gold-text-gradient">Ante</span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default RulebookModal;
