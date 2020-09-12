import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toFix'
})
export class ToFixPipe implements PipeTransform {
  transform(value: number, decimal?: number): string {
    if (decimal) return value.toFixed(decimal);
    return value.toFixed(0);
  }
}
