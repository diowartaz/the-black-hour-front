import { blipPosition, MAX_RADAR_DOTS, nightTime, radarLayout } from './recap-radar';

describe('recap radar', () => {
  it('agrandit le cercle de défense avec la défense', () => {
    expect(radarLayout(100, 400, 1).ringRadius).toBeLessThan(radarLayout(400, 400, 1).ringRadius);
    expect(radarLayout(400, 400, 1).ringRadius).toBeLessThan(radarLayout(1600, 400, 1).ringRadius);
  });

  it('arrête tous les zombies hors du cercle quand la ville survit', () => {
    const layout = radarLayout(530, 412, 7);
    expect(layout.breached).toBeFalse();
    expect(layout.dots.every((dot) => dot.to > layout.ringRadius && dot.to < dot.from)).toBeTrue();
  });

  it('laisse un vide plus grand quand la marge est grande', () => {
    const closest = (defense: number) => {
      const layout = radarLayout(defense, 400, 3);
      return Math.min(...layout.dots.map((dot) => dot.to)) - layout.ringRadius;
    };
    expect(closest(410)).toBeLessThan(closest(800));
  });

  it('fait passer des zombies dans le cercle quand la horde gagne', () => {
    const layout = radarLayout(200, 412, 7);
    expect(layout.breached).toBeTrue();
    expect(layout.dots.some((dot) => dot.to < layout.ringRadius)).toBeTrue();
  });

  it('plafonne le nombre de points et calcule les zombies par point', () => {
    const layout = radarLayout(530, 412, 7);
    expect(layout.dots.length).toBe(MAX_RADAR_DOTS);
    expect(layout.zombiesPerDot).toBe(7);
    expect(radarLayout(50, 12, 7).dots.length).toBe(12);
    expect(radarLayout(50, 0, 7)).toEqual(jasmine.objectContaining({ dots: [], zombiesPerDot: 0 }));
  });

  it('redonne le même dessin pour la même graine', () => {
    expect(radarLayout(530, 412, 7)).toEqual(radarLayout(530, 412, 7));
    expect(radarLayout(530, 412, 7)).not.toEqual(radarLayout(530, 412, 8));
  });

  it('place les signaux dans le cercle de défense', () => {
    const ring = radarLayout(530, 412, 7).ringRadius;
    for (let i = 0; i < 4; i++) {
      const { x, y } = blipPosition(i, 4, ring, 7);
      expect(Math.hypot(x, y)).toBeLessThan(ring);
    }
  });

  it('répartit les heures dans la nuit, dans l’ordre', () => {
    expect(nightTime(0, 1)).toBe('02:15');
    const times = [0, 1, 2].map((i) => nightTime(i, 3));
    expect(times).toEqual(['00:40', '02:15', '03:55']);
    expect(nightTime(0, 20)).toBe('23:20');
  });
});
