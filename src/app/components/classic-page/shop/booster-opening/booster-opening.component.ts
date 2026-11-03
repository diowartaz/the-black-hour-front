import { Component, computed, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { BoosterCardModel } from 'src/app/models/game';
import { CityService } from 'src/app/services/city/city.service';
import { BuildingCardComponent } from 'src/app/shared/components/building-card/building-card.component';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { RarityToColorPipe } from 'src/app/shared/pipes/rarity-to-color.pipe';
import { TPipe } from 'src/app/shared/i18n/t.pipe';

// Atterrissage d'un plan après le clic, à garder égal à $impact dans le SCSS
const IMPACT_MS = 500;
// Écart entre deux plans révélés par « Reveal all »
const STAGGER_MS = 180;

// Grains de poussière projetés des deux côtés de la carte à l'atterrissage, répartis au nombre d'or
const dust = (count: number): Record<string, string>[] =>
  Array.from({ length: count }, (_, i) => {
    const right = i % 2 === 1;
    const spread = (i * 0.618) % 1;
    const tilt = 5 + ((i * 0.382 + 0.5) % 1) * 35;
    return {
      '--x': `${right ? 65 + spread * 35 : spread * 35}%`,
      '--a': `${right ? -tilt : 180 + tilt}deg`,
      '--r': `${20 + ((i * 0.754 + 0.2) % 1) * 45}px`,
      '--t': `${350 + ((i * 0.271) % 1) * 300}ms`,
    };
  });

// Force de l'atterrissage selon la rareté : secousse du panneau (px) et poussière
const IMPACT: Record<string, { shake: number; dust: Record<string, string>[] }> = {
  common: { shake: 2, dust: dust(6) },
  rare: { shake: 4, dust: dust(10) },
  epic: { shake: 7, dust: dust(16) },
};

// Révélation des plans d'un booster, un par un : chaque plan tombe sur la table
@Component({
  selector: 'app-booster-opening',
  imports: [TPipe, BuildingCardComponent, IconComponent, RarityToColorPipe],
  templateUrl: './booster-opening.component.html',
  styleUrls: ['./booster-opening.component.scss'],
})
export class BoosterOpeningComponent {
  readonly cityService = inject(CityService);

  cards = input.required<BoosterCardModel[]>();
  boosterName = input('');
  canOpenAnother = input(false);
  openAnother = output<void>();
  closed = output<void>();

  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  revealed = signal(0);
  // Retard de l'animation de chaque plan révélé (ms), pour enchaîner ceux de « Reveal all »
  delays = signal<number[]>([]);
  allRevealed = computed(() => this.revealed() >= this.cards().length);
  shownCards = computed(() =>
    this.cards().map((card) => {
      const building = this.cityService.catalogBuildings().find((b) => b.id === card.building_id);
      const rarity = building?.rarity ?? 'common';
      return {
        ...card,
        building,
        rarity,
        impact: IMPACT[rarity] ?? IMPACT['common'],
        count: this.cityService.collection()[card.building_id] ?? 1,
      };
    }),
  );

  reveal(index: number): void {
    // Les plans se révèlent dans l'ordre : cliquer sur un plan caché révèle le suivant
    if (index >= this.revealed()) {
      this.revealUpTo(this.revealed() + 1);
    }
  }

  revealAll(): void {
    this.revealUpTo(this.cards().length);
  }

  again(): void {
    this.revealed.set(0);
    this.delays.set([]);
    this.openAnother.emit();
  }

  // Révèle les plans jusqu'à `end` (exclu), l'un après l'autre
  private revealUpTo(end: number): void {
    const start = this.revealed();
    const delays = [...this.delays()];
    for (let index = start; index < end; index++) {
      delays[index] = (index - start) * STAGGER_MS;
      const card = this.shownCards()[index];
      if (card.building) {
        this.shake(card.impact.shake, delays[index] + IMPACT_MS);
      }
    }
    this.delays.set(delays);
    this.revealed.set(end);
  }

  // Secousse du panneau quand un plan touche la table
  private shake(amplitude: number, delay: number): void {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const a = amplitude;
    this.panel().nativeElement.animate(
      [
        { transform: 'translate(0, 0)' },
        { transform: `translate(${-a}px, ${a * 0.6}px)`, offset: 0.15 },
        { transform: `translate(${a}px, ${-a * 0.4}px)`, offset: 0.35 },
        { transform: `translate(${-a * 0.6}px, ${a * 0.3}px)`, offset: 0.55 },
        { transform: `translate(${a * 0.3}px, 0)`, offset: 0.75 },
        { transform: 'translate(0, 0)' },
      ],
      { duration: 340, delay, easing: 'ease-out' },
    );
  }
}
