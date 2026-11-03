import { TPipe } from 'src/app/shared/i18n/t.pipe';
import { LanguageService } from 'src/app/shared/i18n/language.service';
import { Component, computed, effect, inject, signal, DestroyRef } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { CityService } from 'src/app/services/city/city.service';
import { ItemModel } from 'src/app/models/game';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { ResourceGemComponent } from 'src/app/shared/components/resource-gem/resource-gem.component';
import { ItemToColorPipe } from 'src/app/shared/pipes/item-to-color.pipe';
import { enoughTime, formatTimeToString } from 'src/app/shared/utils/time';
import { readStorage, StorageKey, writeStorage } from 'src/app/shared/utils/storage';

// Écran de fouille : choisir une ressource de la paire, ou fouiller au hasard
export type DigMode = 'pick' | 'random';

// Toggle Pick / Random masqué pour le moment : l'écran reste en mode Pick. Repasser à true pour le réactiver
export const DIG_MODE_TOGGLE_ENABLED = false;

@Component({
  selector: 'app-diggings',
  imports: [TPipe, KeyValuePipe, IconComponent, ResourceGemComponent, ItemToColorPipe],
  templateUrl: './diggings.component.html',
  styleUrls: ['./diggings.component.scss'],
})
export class DiggingsComponent {
  cityService = inject(CityService);
  private languageService = inject(LanguageService);

  dialogMessage = signal('');
  snackBarOpened = signal(false);
  readonly modeToggleEnabled = DIG_MODE_TOGGLE_ENABLED;
  mode = signal<DigMode>(this.modeToggleEnabled && readStorage(StorageKey.DIG_MODE) === 'random' ? 'random' : 'pick');
  private snackBarTimeout: ReturnType<typeof setTimeout> | undefined;
  // Nombre de fouilles de la dernière action, pour repérer les ressources en plus de Lucky Digger
  private lastDigCount = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.snackBarTimeout));
    effect(() => {
      const found = Object.values(this.cityService.inventoryItemFound()).reduce((a, b) => a + b, 0);
      if (this.lastDigCount > 0 && found > this.lastDigCount) {
        this.openSnackBar(this.languageService.t('dig.lucky', { count: found - this.lastDigCount }));
      }
    });
  }

  // Paire de ressources proposée pour la prochaine fouille
  digOffer = computed(() => this.cityService.city().dig_offer);

  // Durée d'une fouille, en secondes de jeu
  digTime = computed(() => this.cityService.city().dig_duration);

  digTimeString = computed(() => formatTimeToString(this.digTime()));

  pickEndTimeString = computed(() => this.endTimeAfter(this.digTime()));

  enoughTimeForPick = computed(() => this.hasTimeFor(this.digTime()));

  // Fouilles possibles d'ici l'attaque de fin de journée, pour l'affichage : le serveur refait le calcul
  // à la réception, avec le temps réel écoulé entre-temps
  maxDigs = computed(() => {
    const remaining = this.cityService.defaultValues().day_end_time - (this.cityService.cityTimeSeconds() || 0);
    return Math.max(0, Math.floor(remaining / this.digTime()));
  });

  maxDigsTimeString = computed(() => formatTimeToString(this.maxDigs() * this.digTime()));

  maxDigsEndTimeString = computed(() => this.endTimeAfter(this.maxDigs() * this.digTime()));

  setMode(mode: DigMode) {
    this.mode.set(mode);
    writeStorage(StorageKey.DIG_MODE, mode);
  }

  castKey(key: string): ItemModel {
    return key as ItemModel;
  }

  openSnackBar(message: string) {
    if (this.snackBarOpened()) {
      return;
    }
    this.dialogMessage.set(message);
    this.snackBarOpened.set(true);
    this.snackBarTimeout = setTimeout(() => this.closeSnackBar(), 1000);
  }

  closeSnackBar() {
    clearTimeout(this.snackBarTimeout);
    this.snackBarOpened.set(false);
  }

  // Fouille unique : la ressource choisie dans la paire
  pick(item: ItemModel) {
    if (!this.enoughTimeForPick()) {
      this.openSnackBar(this.languageService.t('play.notEnoughTime'));
      return;
    }
    this.lastDigCount = 1;
    this.cityService.findItems(1, item);
  }

  // Fouille au hasard dans la paire
  digOnce() {
    if (!this.enoughTimeForPick()) {
      this.openSnackBar(this.languageService.t('play.notEnoughTime'));
      return;
    }
    this.lastDigCount = 1;
    this.cityService.findItems(1);
  }

  // Fouilles au hasard jusqu'à l'attaque : la première dans la paire, les suivantes parmi toutes les ressources
  digMax() {
    if (this.maxDigs() < 1) {
      this.openSnackBar(this.languageService.t('play.notEnoughTime'));
      return;
    }
    this.lastDigCount = this.maxDigs();
    this.cityService.findItems('max');
  }

  // Heure de la ville après une durée donnée
  private endTimeAfter(seconds: number): string {
    return formatTimeToString((this.cityService.cityTimeSeconds() || 0) + seconds);
  }

  private hasTimeFor(seconds: number): boolean {
    return enoughTime(seconds, this.cityService.cityTimeSeconds(), this.cityService.defaultValues().day_end_time);
  }
}
