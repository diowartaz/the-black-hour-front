import { Pipe, PipeTransform } from '@angular/core';
import { formatNumber } from '../utils/format';

@Pipe({
  name: 'formatNumber',
})
export class FormatNumberPipe implements PipeTransform {
  transform(value: number): string {
    return formatNumber(value);
  }
}
