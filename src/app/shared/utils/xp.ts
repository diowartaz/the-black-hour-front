import { XPToLVL } from '../../models/game';
import { formatNumber } from './format';

export function XPToLVLandXP(xp: number): XPToLVL {
  const lvl = xpToLvl(xp);
  const remainder = Math.max(xp - lvlToXp(lvl) - 8, 0);
  const xpToNextLvl = lvlToXp(lvl + 1) - lvlToXp(lvl);
  return {
    lvl: lvl.toString(),
    xpString: `${formatNumber(remainder)}/${formatNumber(xpToNextLvl)} xp`,
    ratio: Math.floor((remainder / xpToNextLvl) * 100),
  };
}

export function xpToLvl(xp: number) {
  const lvl = 10.4067 * Math.log(6.62457 + 0.00043575 * xp) - 18.6718;
  return Math.floor(lvl);
}

export function lvlToXp(lvl: number) {
  const xp = (Math.exp((lvl + 18.6718) / 10.4067) - 6.62457) / 0.00043575;
  return Math.floor(xp);
}
