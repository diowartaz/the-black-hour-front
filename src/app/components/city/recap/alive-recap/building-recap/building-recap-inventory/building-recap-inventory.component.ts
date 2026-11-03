import { Component, inject, Input } from '@angular/core';
import { CityService } from 'src/app/services/city/city.service';
import { KeyValuePipe } from '@angular/common';
import { BuildingModel, createDefaultBuildingModel, ItemModel } from 'src/app/models/game';
import { ResourceGemComponent } from 'src/app/shared/components/resource-gem/resource-gem.component';
import { TPipe } from 'src/app/shared/i18n/t.pipe';

@Component({
  selector: 'app-building-recap-inventory-inventory',
  imports: [TPipe, KeyValuePipe, ResourceGemComponent],
  templateUrl: './building-recap-inventory.component.html',
  styleUrls: ['./building-recap-inventory.component.scss'],
})
export class BuildingRecapInventoryComponent {
  @Input() building: BuildingModel = createDefaultBuildingModel();

  cityService = inject(CityService);

  castKey(key: string): ItemModel {
    return key as ItemModel;
  }
}
