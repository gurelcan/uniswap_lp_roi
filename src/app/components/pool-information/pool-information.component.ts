import { Component, Input, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatAccordion } from '@angular/material/expansion';
import { PoolQuery } from 'src/app/services/state/pool.query';

@Component({
  selector: 'app-pool-information',
  templateUrl: 'pool-information.component.html',
  styleUrls: ['./pool-information.component.scss']
})
export class PoolInformationComponent {
  @ViewChild(MatAccordion) accordion: MatAccordion;

  form = new FormGroup({
    tokenOne: new FormControl(),
    tokenTwo: new FormControl(),
    volume: new FormControl(),
    liquidity: new FormControl(),
    investment: new FormControl(),
    days: new FormControl()
  });

  tokenOne$ = this.query.select('token0');

  tokenTwo$ = this.query.select('token1');

  poolAddress = this.query.select('address');

  volume = this.query.select('volumeUSD');

  isConnected$ = this.query.select('isConnected');

  @Input() set shouldOpen(value: boolean) {
    value ? setTimeout(() => this.accordion.openAll(), 100) : null;
  }

  constructor(private query: PoolQuery) { }

  formatLabel(value: number): string | number {
    if (value >= 1000000) {
      return Math.round(value / 1000000) + 'M';
    }

    if (value >= 1000) {
      return Math.round(value / 1000) + 'K';
    }

    return value;
  }
}
