import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, signal } from '@angular/core';
import { BuildingEffectModel } from 'src/app/models/game';
import { CityService } from 'src/app/services/city/city.service';
import { buildingEffectText } from '../../utils/building-effects';
import { rankMultiplier } from '../../utils/ranks';
import { IconComponent } from '../icon/icon.component';

// Bulle ouverte dans toute l'application : en ouvrir une ferme la précédente
const openTooltip = signal<EffectTooltipComponent | null>(null);

// Sous le bouton, ou au-dessus s'il n'y a pas la place
const POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
];

// Bouton « effet » d'un bâtiment spécial : une bulle décrit l'effet. À la souris elle suit le survol et un clic
// l'épingle ; au doigt, un tap l'affiche ou la masque (un tap émet aussi les événements pointer, d'où le filtre).
// La bulle est rendue dans l'overlay du CDK (fin du <body>) : elle passe au-dessus des cartes voisines
// sans hériter de leur opacité. Elle se ferme au clic ailleurs ou avec Échap ; le clic ne remonte pas jusqu'à la carte.
@Component({
  selector: 'app-effect-tooltip',
  imports: [IconComponent, CdkConnectedOverlay, CdkOverlayOrigin],
  template: `
    <button
      #button
      type="button"
      class="effect-btn"
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      [attr.aria-expanded]="open()"
      aria-label="Show the building effect"
      (pointerenter)="show($event)"
      (pointerleave)="hide($event)"
      (click)="toggle($event)"
    >
      <app-icon name="sparkle" [size]="variant() === 'stat' ? 22 : 13" />Effect
    </button>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="positions"
      (overlayOutsideClick)="closeOutside($event, button)"
      (detach)="close()"
    >
      <span class="bubble" role="tooltip">{{ text() }}</span>
    </ng-template>
  `,
  styleUrls: ['./effect-tooltip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'close()',
    '[class.stat]': "variant() === 'stat'",
  },
})
export class EffectTooltipComponent implements OnDestroy {
  private cityService = inject(CityService);

  effect = input.required<BuildingEffectModel>();
  // Jour de la ville en cours : affiche la valeur actuelle des effets qui en dépendent
  day = input<number>();
  // Rang du plan, pour ses plafonds (`effect` doit déjà être au rang)
  rank = input(0);
  // En partie : les valeurs de défense incluent le bonus de défense du joueur
  withDefenseBonus = input(false);
  // « stat » : grande icône et libellé dessous, à la place d'un bloc de défense (tuiles de construction)
  variant = input<'chip' | 'stat'>('chip');

  readonly positions = POSITIONS;
  open = computed(() => openTooltip() === this);
  text = computed(() => {
    const defaultValues = this.cityService.defaultValues();
    return buildingEffectText(this.effect(), {
      day: this.day(),
      rules: defaultValues.effect_rules,
      rankMultiplier: rankMultiplier(this.rank(), defaultValues.rank_rules),
      defenseMultiplier: this.withDefenseBonus() ? this.cityService.defenseMultiplier() : 1,
    });
  });
  // Ouverte par un clic : reste affichée quand la souris quitte le bouton
  private pinned = false;

  show(event: PointerEvent) {
    if (event.pointerType === 'mouse' && !this.open()) {
      this.pinned = false;
      openTooltip.set(this);
    }
  }

  hide(event: PointerEvent) {
    if (event.pointerType === 'mouse' && !this.pinned) {
      this.close();
    }
  }

  toggle(event: Event) {
    event.stopPropagation();
    if (this.open() && this.pinned) {
      this.close();
    } else {
      this.pinned = true;
      openTooltip.set(this);
    }
  }

  close() {
    if (this.open()) {
      openTooltip.set(null);
    }
  }

  // Le clic sur le bouton est déjà traité par toggle() : ne pas fermer pour rouvrir aussitôt
  closeOutside(event: MouseEvent, button: HTMLElement) {
    if (!button.contains(event.target as Node)) {
      this.close();
    }
  }

  ngOnDestroy() {
    this.close();
  }
}
