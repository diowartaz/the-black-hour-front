import { formatNumber } from './format';

describe('formatNumber', () => {
  const gap = ' ';

  it('ne sépare rien jusqu’à 3 chiffres', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(950)).toBe('950');
    expect(formatNumber(-950)).toBe('-950');
  });

  it('sépare les groupes à partir de 4 chiffres', () => {
    expect(formatNumber(1000)).toBe(`1${gap}000`);
    expect(formatNumber(2575)).toBe(`2${gap}575`);
    expect(formatNumber(-1500)).toBe(`-1${gap}500`);
    expect(formatNumber(10000)).toBe(`10${gap}000`);
    expect(formatNumber(23400)).toBe(`23${gap}400`);
    expect(formatNumber(4565787867)).toBe(`4${gap}565${gap}787${gap}867`);
    expect(formatNumber(-23400)).toBe(`-23${gap}400`);
  });

  it('garde au plus 2 décimales, avec un point', () => {
    expect(formatNumber(12.5)).toBe('12.5');
    expect(formatNumber(1500.126)).toBe(`1${gap}500.13`);
    expect(formatNumber(23400.5)).toBe(`23${gap}400.5`);
  });
});
