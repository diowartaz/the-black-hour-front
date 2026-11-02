// Géométrie du radar du récap d'attaque. Les rayons sont en fraction du rayon du radar (0 = ville, 1 = bord).

// Un point représente plusieurs zombies au-delà de ce nombre
export const MAX_RADAR_DOTS = 60;

export interface RadarDot {
  // Angle en degrés, 0 à droite, sens horaire
  angle: number;
  from: number;
  to: number;
  // Décalage du départ de l'approche, en secondes
  delay: number;
}

export interface RadarLayout {
  ringRadius: number;
  dots: RadarDot[];
  zombiesPerDot: number;
  breached: boolean;
}

// PRNG déterministe : le même jour redonne le même dessin
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function between(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

export function radarLayout(defense: number, zombies: number, seed: number): RadarLayout {
  const total = defense + zombies;
  const ringRadius = 0.25 + 0.45 * (total === 0 ? 0.5 : defense / total);
  const breached = defense < zombies;
  const nbDots = Math.min(MAX_RADAR_DOTS, Math.max(0, zombies));
  const random = mulberry32(seed);

  // Survie : le zombie le plus proche s'arrête d'autant plus loin du mur que la marge est grande
  const closest = ringRadius + 0.02 + 0.2 * Math.min(1, (defense - zombies) / Math.max(defense, 1));
  // Mort : plus la horde dépasse la défense, plus de zombies passent le mur
  const insideShare = Math.min(0.9, 0.25 + (zombies - defense) / Math.max(zombies, 1));

  const dots: RadarDot[] = [];
  for (let i = 0; i < nbDots; i++) {
    const angle = between(random, 0, 360);
    const from = between(random, 1.05, 1.2);
    let to: number;
    if (!breached) {
      to = Math.min(0.97, i === 0 ? closest : closest + between(random, 0, 0.25));
    } else if (random() < insideShare) {
      to = between(random, 0.08, ringRadius - 0.03);
    } else {
      to = between(random, ringRadius + 0.01, ringRadius + 0.12);
    }
    dots.push({ angle, from, to, delay: between(random, 0, 0.8) });
  }

  return { ringRadius, dots, zombiesPerDot: nbDots === 0 ? 0 : Math.ceil(zombies / nbDots), breached };
}

// Position d'un signal de la nuit, à l'intérieur du cercle de défense, autour de la ville
export function blipPosition(index: number, count: number, ringRadius: number, seed: number): { x: number; y: number } {
  const offset = mulberry32(seed)() * 360;
  const angle = ((offset + ((index + 0.5) / count) * 360) * Math.PI) / 180;
  const radius = Math.max(0.17, ringRadius * 0.65);
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

// Heure d'affichage d'un événement de la nuit, répartie entre 23:00 et 05:30 (pour le décor)
export function nightTime(index: number, count: number): string {
  const start = -60;
  const end = 330;
  const minutes = Math.round((start + ((index + 1) / (count + 1)) * (end - start)) / 5) * 5;
  const wrapped = (minutes + 1440) % 1440;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
}
