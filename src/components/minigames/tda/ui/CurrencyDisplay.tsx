import React from 'react';
import { GameIcon } from '../../../../assets/icons';
import { fromCopper, formatMoney, calculateCurrencyWeight, Money, formatPrice } from '../../../../utils/currency';

export interface CurrencyDisplayProps {
  copper: number;
  variant?: 'compact' | 'purse' | 'badge' | 'pot';
  includeElectrum?: boolean;
  title?: string;
  className?: string;
  iconSize?: number;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  copper,
  variant = 'compact',
  includeElectrum = true,
  title = 'Purse',
  className = '',
  iconSize
}) => {
  const money: Money = fromCopper(copper, includeElectrum);
  const totalWeight = calculateCurrencyWeight(money);
  const formattedBreakdown = formatMoney(money);
  const formattedPrice = formatPrice(copper);

  const containerTooltip = `${title}: ${formattedPrice} (${formattedBreakdown}) — Total Weight: ${totalWeight.toFixed(2)} lbs`;

  if (variant === 'badge') {
    const badgeSize = iconSize || 10;
    return (
      <div
        className={`flex items-center gap-1 bg-stone-950/70 px-1.5 py-0.5 rounded border border-amber-900/40 text-amber-400 cursor-help ${className}`}
        title={containerTooltip}
      >
        <GameIcon name="currency/gold_coin" size={badgeSize} className="text-amber-400 drop-shadow-xs" />
        <span className="text-[9px] font-mono font-bold leading-none">{formattedPrice}</span>
      </div>
    );
  }

  if (variant === 'pot') {
    const potSize = iconSize || 24;
    return (
      <div
        className={`flex items-center gap-2 sm:gap-3 cursor-help ${className}`}
        title={`Stakes Pot: ${formattedPrice} (${formattedBreakdown}) — Weight: ${totalWeight.toFixed(2)} lbs`}
      >
        <GameIcon name="currency/coins" size={potSize} className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
        <span className="font-gothic text-2xl sm:text-3xl text-amber-100 drop-shadow-xl">{formattedPrice}</span>
      </div>
    );
  }

  if (variant === 'purse') {
    const headerIconSize = iconSize || 14;
    const colIconSize = 16;

    const coinsConfig = [
      { key: 'pp' as const, label: 'PP', name: 'Platinum Pieces', val: money.pp, icon: 'currency/platinum_coin', color: 'text-slate-200' },
      { key: 'gp' as const, label: 'GP', name: 'Gold Pieces', val: money.gp, icon: 'currency/gold_coin', color: 'text-amber-400' },
      { key: 'ep' as const, label: 'EP', name: 'Electrum Pieces', val: money.ep, icon: 'currency/electrum_coin', color: 'text-cyan-400' },
      { key: 'sp' as const, label: 'SP', name: 'Silver Pieces', val: money.sp, icon: 'currency/silver_coin', color: 'text-stone-300' },
      { key: 'cp' as const, label: 'CP', name: 'Copper Pieces', val: money.cp, icon: 'currency/copper_coin', color: 'text-amber-700' },
    ];

    return (
      <div
        className={`bg-stone-950/60 rounded-xl p-3 sm:p-4 border border-stone-800 ${className}`}
        title={containerTooltip}
      >
        <div className="flex items-center justify-between mb-2 sm:mb-3 border-b border-stone-800/80 pb-1.5">
          <span className="text-[9px] sm:text-[10px] text-stone-400 uppercase font-bold tracking-widest">{title}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-stone-500 font-semibold">{totalWeight.toFixed(2)} lbs</span>
            <GameIcon name="currency/coins" size={headerIconSize} className="text-amber-500" />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1 text-center">
          {coinsConfig.map(({ key, label, name, val, icon, color }) => {
            const coinWeight = (val / 50).toFixed(2);
            return (
              <div
                key={key}
                className={`flex flex-col items-center p-1 rounded transition-colors ${val > 0 ? 'bg-stone-900/50' : 'opacity-35 hover:opacity-60'}`}
                title={`${val} ${name} (${coinWeight} lbs)`}
              >
                <GameIcon name={icon} size={colIconSize} className="mb-0.5" />
                <span className="text-[8px] uppercase text-stone-500 font-bold">{label}</span>
                <span className={`font-gothic text-xs sm:text-sm font-bold ${color}`}>{val}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Default: variant === 'compact'
  const compactIconSize = iconSize || 14;

  const activeDenominations = [
    { key: 'pp', val: money.pp, name: 'Platinum Pieces', icon: 'currency/platinum_coin', color: 'text-slate-100', labelColor: 'text-slate-400' },
    { key: 'gp', val: money.gp, name: 'Gold Pieces', icon: 'currency/gold_coin', color: 'text-amber-400', labelColor: 'text-amber-600' },
    { key: 'ep', val: money.ep, name: 'Electrum Pieces', icon: 'currency/electrum_coin', color: 'text-cyan-400', labelColor: 'text-cyan-600' },
    { key: 'sp', val: money.sp, name: 'Silver Pieces', icon: 'currency/silver_coin', color: 'text-stone-300', labelColor: 'text-stone-500' },
    { key: 'cp', val: money.cp, name: 'Copper Pieces', icon: 'currency/copper_coin', color: 'text-amber-600', labelColor: 'text-amber-800' },
  ].filter(d => d.val > 0);

  return (
    <div
      className={`flex items-center gap-2.5 cursor-help ${className}`}
      title={containerTooltip}
    >
      {activeDenominations.length > 0 ? (
        activeDenominations.map(({ key, val, name, icon, color, labelColor }) => (
          <div
            key={key}
            className={`flex items-center gap-1 ${color}`}
            title={`${val} ${name} (${(val / 50).toFixed(2)} lbs)`}
          >
            <GameIcon name={icon} size={compactIconSize} />
            <span className="font-gothic text-lg font-bold">{val}</span>
            <span className={`text-[10px] ${labelColor} font-bold`}>{key}</span>
          </div>
        ))
      ) : (
        <div
          className="flex items-center gap-1 text-stone-600"
          title="0 Copper Pieces (0 lbs)"
        >
          <GameIcon name="currency/copper_coin" size={compactIconSize} className="text-stone-600" />
          <span className="font-gothic text-lg">0</span>
          <span className="text-[10px] text-stone-600 font-bold">cp</span>
        </div>
      )}
    </div>
  );
};

export default CurrencyDisplay;
