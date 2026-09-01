import React from 'react';
import { getIcon } from '../../../../assets/icons';

interface NotificationBannerProps {
  notification: { message: string; type: 'info' | 'gold-gain' | 'gold-loss' | 'power' | 'alert' } | null;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ notification }) => {
  if (!notification) return null;

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
    <div className="absolute top-[84px] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-[120] w-full max-w-md px-4">
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
    </div>
  );
};
