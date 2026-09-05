import { describe, it, expect } from 'vitest';
import {
  EXCHANGE_RATES,
  toTotalCopper,
  fromCopper,
  formatMoney,
  calculateCurrencyWeight,
  formatWealth,
  formatPrice,
} from './currency';

describe('D&D 5e Currency Utility', () => {
  it('correctly calculates exchange rates relative to 1 CP', () => {
    expect(EXCHANGE_RATES.cp).toBe(1);
    expect(EXCHANGE_RATES.sp).toBe(10);
    expect(EXCHANGE_RATES.ep).toBe(50);
    expect(EXCHANGE_RATES.gp).toBe(100);
    expect(EXCHANGE_RATES.pp).toBe(1000);
  });

  it('converts Money objects into total copper', () => {
    expect(toTotalCopper({ cp: 5 })).toBe(5);
    expect(toTotalCopper({ sp: 2, cp: 5 })).toBe(25);
    expect(toTotalCopper({ gp: 1, ep: 1, sp: 1, cp: 1 })).toBe(161);
    expect(toTotalCopper({ pp: 2, gp: 5 })).toBe(2500);
  });

  it('converts copper to Money using highest denomination (without electrum)', () => {
    const money = fromCopper(2563, false);
    expect(money).toEqual({
      pp: 2,
      gp: 5,
      ep: 0,
      sp: 6,
      cp: 3,
    });
  });

  it('converts copper to Money including electrum', () => {
    const money = fromCopper(2563, true);
    expect(money).toEqual({
      pp: 2,
      gp: 5,
      ep: 1,
      sp: 1,
      cp: 3,
    });
  });

  it('formats Money object into readable string', () => {
    expect(formatMoney({ pp: 1, gp: 5, sp: 2 })).toBe('1pp 5gp 2sp');
    expect(formatMoney({ cp: 5 })).toBe('5cp');
    expect(formatMoney({})).toBe('0cp');
  });

  it('calculates coin weight according to D&D 5e standard (50 coins per lb)', () => {
    expect(calculateCurrencyWeight({ gp: 50 })).toBe(1.0);
    expect(calculateCurrencyWeight({ pp: 10, gp: 20, sp: 20 })).toBe(1.0);
    expect(calculateCurrencyWeight({ cp: 5 })).toBe(0.1);
  });

  it('formats legacy price and wealth appropriately', () => {
    expect(formatWealth(5000)).toEqual({ pp: 5, gp: 0, ep: 0, sp: 0, cp: 0 });
    expect(formatPrice(5000)).toBe('5 pp');
    expect(formatPrice(1000)).toBe('1 pp');
    expect(formatPrice(500)).toBe('5 gp');
    expect(formatPrice(10)).toBe('1 sp');
    expect(formatPrice(1)).toBe('1 cp');
    expect(formatPrice(0)).toBe('0 cp');
  });
});
