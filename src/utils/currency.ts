
export interface Coinage {
  pp: number;
  gp: number;
  ep: number;
  sp: number;
  cp: number;
}

export const CP_PER_SP = 10;
export const CP_PER_EP = 50;
export const CP_PER_GP = 100;
export const CP_PER_PP = 1000;

export function formatWealth(totalCopper: number): Coinage {
  let remaining = totalCopper;

  const pp = Math.floor(remaining / CP_PER_PP);
  remaining %= CP_PER_PP;

  const gp = Math.floor(remaining / CP_PER_GP);
  remaining %= CP_PER_GP;

  const ep = Math.floor(remaining / CP_PER_EP);
  remaining %= CP_PER_EP;

  const sp = Math.floor(remaining / CP_PER_SP);
  remaining %= CP_PER_SP;

  const cp = Math.floor(remaining);

  return { pp, gp, ep, sp, cp };
}

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
