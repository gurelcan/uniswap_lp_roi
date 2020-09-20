import { Pipe, PipeTransform, NgModule } from '@angular/core';

@Pipe({
  name: 'parseBigNumber'
})

export class ParseBigNumberPipe implements PipeTransform {
  transform(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'K';
    }
    return value.toString();
  }
}

@NgModule({
  exports: [ParseBigNumberPipe],
  declarations: [ParseBigNumberPipe],
})
export class ParseBigNumberPipeModule { }
