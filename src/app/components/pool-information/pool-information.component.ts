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
    investment: new FormControl(1000),
    days: new FormControl(30)
  });

  tokenOne$ = this.query.select('token0');

  tokenTwo$ = this.query.select('token1');

  poolAddress = this.query.select('address');

  volume = this.query.select('volumeUSD');

  liquidity = this.query.select('liquidity');

  isConnected$ = this.query.select('isConnected');

  @Input() set shouldOpen(value: boolean) {
    value ? setTimeout(() => this.accordion.openAll(), 100) : null;
  }

  constructor(private query: PoolQuery) {
    this.form.get('tokenOne').setValue(this.query.getValue().token0.priceUSD.toFixed(2));
    this.form.get('tokenTwo').setValue(this.query.getValue().token1.priceUSD.toFixed(2));
    this.form.get('volume').setValue(Math.round(this.query.getValue().volumeUSD));
    this.form.get('liquidity').setValue(Math.round(this.query.getValue().liquidity));
  }

  formatLabel(value: number): string | number {
    if (value >= 1000000) {
      return Math.round(value / 1000000) + 'M';
    }

    if (value >= 1000) {
      return Math.round(value / 1000) + 'K';
    }

    return value;
  }

  private calculateROI() {

  }
}
