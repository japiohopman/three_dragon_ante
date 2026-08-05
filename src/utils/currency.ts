/**
 * D&D 5e Currency Exchange Rates
 * All values relative to 1 Copper Piece (cp)
 */
export const EXCHANGE_RATES = {
  cp: 1,
  sp: 10,
  ep: 50,
  gp: 100,
  pp: 1000,
} as const;

export interface Money {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

// Retrocompatible interface alias for TDA game views
export type Coinage = Money;

export const CP_PER_SP = EXCHANGE_RATES.sp;
export const CP_PER_EP = EXCHANGE_RATES.ep;
export const CP_PER_GP = EXCHANGE_RATES.gp;
export const CP_PER_PP = EXCHANGE_RATES.pp;

/**
 * Converts a Money object into its total value in Copper Pieces.
 */
export const toTotalCopper = (money: Partial<Money>): number => {
  return (
    (money.cp || 0) * EXCHANGE_RATES.cp +
    (money.sp || 0) * EXCHANGE_RATES.sp +
    (money.ep || 0) * EXCHANGE_RATES.ep +
    (money.gp || 0) * EXCHANGE_RATES.gp +
    (money.pp || 0) * EXCHANGE_RATES.pp
  );
};

/**
 * Converts total copper into a simplified Money object using the highest denominations.
 * Note: EP is usually bypassed in auto-consolidation unless specified,
 * but we'll include it in the logic for completeness.
 */
export const fromCopper = (totalCopper: number, includeElectrum: boolean = false): Money => {
  let remaining = Math.max(0, totalCopper);

  const pp = Math.floor(remaining / EXCHANGE_RATES.pp);
  remaining %= EXCHANGE_RATES.pp;

  const gp = Math.floor(remaining / EXCHANGE_RATES.gp);
  remaining %= EXCHANGE_RATES.gp;

  let ep = 0;
  if (includeElectrum) {
    ep = Math.floor(remaining / EXCHANGE_RATES.ep);
    remaining %= EXCHANGE_RATES.ep;
  }

  const sp = Math.floor(remaining / EXCHANGE_RATES.sp);
  remaining %= EXCHANGE_RATES.sp;

  const cp = remaining;

  return { cp, sp, ep, gp, pp };
};

/**
 * Formats a Money object into a readable string (e.g., "1gp 5sp").
 */
export const formatMoney = (money: Partial<Money>): string => {
  const parts = [];
  if (money.pp) parts.push(`${money.pp}pp`);
  if (money.gp) parts.push(`${money.gp}gp`);
  if (money.ep) parts.push(`${money.ep}ep`);
  if (money.sp) parts.push(`${money.sp}sp`);
  if (money.cp) parts.push(`${money.cp}cp`);

  return parts.length > 0 ? parts.join(' ') : '0cp';
};

/**
 * Calculates the weight of coins in pounds.
 * Standard D&D 5e: 50 coins weigh 1 pound.
 */
export const calculateCurrencyWeight = (money: Partial<Money>): number => {
  const totalCoins = (money.cp || 0) + (money.sp || 0) + (money.ep || 0) + (money.gp || 0) + (money.pp || 0);
  return totalCoins / 50;
};

/**
 * Legacy TDA helper to format total copper to the coinage split (with Electrum included).
 */
export function formatWealth(totalCopper: number): Coinage {
  return fromCopper(totalCopper, true);
}

/**
 * Legacy TDA helper to format total copper to a single dominant unit string.
 */
export function formatPrice(totalCopper: number): string {
  if (totalCopper === 0) return "0 cp";

  if (totalCopper % CP_PER_PP === 0) return `${totalCopper / CP_PER_PP} pp`;
  if (totalCopper % CP_PER_GP === 0) return `${totalCopper / CP_PER_GP} gp`;
  if (totalCopper % CP_PER_EP === 0) return `${totalCopper / CP_PER_EP} ep`;
  if (totalCopper % CP_PER_SP === 0) return `${totalCopper / CP_PER_SP} sp`;

  // For values that aren't clean divisions, show the most significant unit
  const coinage = formatWealth(totalCopper);
  if (coinage.pp > 0) return `${(totalCopper / CP_PER_PP).toFixed(2)} pp`;
  if (coinage.gp > 0) return `${(totalCopper / CP_PER_GP).toFixed(2)} gp`;
  if (coinage.ep > 0) return `${(totalCopper / CP_PER_EP).toFixed(1)} ep`;
  if (coinage.sp > 0) return `${(totalCopper / CP_PER_SP).toFixed(1)} sp`;

  return `${coinage.cp} cp`;
}
