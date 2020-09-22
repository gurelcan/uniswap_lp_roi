import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toFix',
  pure: false
})
export class ToFixPipe implements PipeTransform {
  transform(value: number, decimal?: number): string {
    if (decimal) return value.toFixed(decimal);
    if (value < 1) return value.toFixed(4);
    return value.toFixed(0)
  }
}
