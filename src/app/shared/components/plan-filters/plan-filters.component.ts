import { Component, computed, input, model, ModelSignal, output, signal } from '@angular/core';
import { ItemModel, Rarity } from 'src/app/models/game';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { ResourceGemComponent } from 'src/app/shared/components/resource-gem/resource-gem.component';
import { RarityToColorPipe } from 'src/app/shared/pipes/rarity-to-color.pipe';
import { ITEMS, PLAN_KINDS, PlanKind, RARITIES_DESC } from 'src/app/shared/utils/deck';
import { TPipe } from 'src/app/shared/i18n/t.pipe';

// Recherche et filtres de plans, communs à la collection et au Black Market.
// Les filtres sont dans un panneau du bas ; le contenu projeté y ajoute les options propres à la page,
// sauf celui marqué [filtersEnd], affiché sur la ligne de la recherche
@Component({
  selector: 'app-plan-filters',
  imports: [TPipe, IconComponent, RarityToColorPipe, ResourceGemComponent],
  templateUrl: './plan-filters.component.html',
  styleUrls: ['./plan-filters.component.scss'],
  host: {
    '(document:keydown.escape)': 'open.set(false)',
  },
})
export class PlanFiltersComponent {
  readonly kinds = PLAN_KINDS.filter((kind) => kind !== 'all');
  readonly rarities = RARITIES_DESC;
  readonly items = ITEMS;

  search = model('');
  rarity = model<Rarity | 'all'>('all');
  item = model<ItemModel | 'all'>('all');
  kind = model<PlanKind>('all');
  // Nombre de plans affichés avec les filtres actuels
  count = input.required<number>();
  // Options actives du contenu projeté, comptées dans le badge
  extraFilters = input(0);
  cleared = output<void>();

  open = signal(false);

  activeCount = computed(
    () => [this.rarity(), this.item(), this.kind()].filter((value) => value !== 'all').length + this.extraFilters(),
  );

  // Pas de bouton « All » : un filtre actif se retire en le touchant à nouveau
  toggle<T extends string>(filter: ModelSignal<T>, value: T): void {
    filter.update((current) => (current === value ? ('all' as T) : value));
  }

  reset(): void {
    this.rarity.set('all');
    this.item.set('all');
    this.kind.set('all');
    this.cleared.emit();
  }
}
