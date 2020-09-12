// Angular
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

// Service
import { PoolService } from './services/pool.service';

// RxJs
import { BehaviorSubject } from 'rxjs';

// Utils
import { BigNumber } from 'ethers';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  host: {
    class: 'mat-elevation-z3'
  }
})
export class AppComponent {
  public searchCtrl = new FormControl('0xbb2b8038a1640196fbe3e38816f3e67cba72d940', Validators.pattern(/^0x[a-fA-F0-9]{40}$/g));

  public loading = new BehaviorSubject(false);

  public showInputs = new BehaviorSubject(false);

  public roiResult = {};

  public sliderConfig = { liqMin: 0, liqMax: 10000, volMin: 0, volMax: 10000 };

  public form = new FormGroup({
    investment: new FormControl(),
    days: new FormControl(),
    ethPrice: new FormControl(),
    tokenPrice: new FormControl(),
    liquidity: new FormControl(),
    volume: new FormControl()
  });

  public poolData;

  constructor(
    private poolService: PoolService,
    private snackbar: MatSnackBar) {
    this.form.valueChanges.subscribe(this.calculateROI);
  }

  searchPool(): void {
    this.loading.next(true);
    const poolAPI = this.poolService.fetchPool(this.searchCtrl.value);
    poolAPI.subscribe(data => {
      this.poolData = data.results.filter(pool => pool.exchange === this.searchCtrl.value)[0];
      if (!this.poolData?.assets) {
        this.snackbar.open('Did not found any pool for the address');
        this.loading.next(false);
      } else {
        try {
          this.form.get('liquidity').setValue(this.poolData.usdLiquidity);
          this.form.get('volume').setValue(this.poolData.usdVolume);
          this.sliderConfig = {
            liqMin: this.percentage(150, this.poolData.usdLiquidity) - this.poolData.usdLiquidity,
            liqMax: this.percentage(150, this.poolData.usdLiquidity),
            volMin: this.percentage(150, this.poolData.usdVolume) - this.poolData.usdVolume,
            volMax: this.percentage(150, this.poolData.usdVolume)
          };
        } catch (error) {
          console.error('error parsing data');
          console.error(error);
        }

        this.calculateROI();
        this.loading.next(false);
        this.showInputs.next(true);
      }
    }, (error: Error) => {
      this.showInputs.next(false);
      this.loading.next(false);
      console.error(error);
    });
  }

  calculateROI(): void {
    /*   const { investment, days, ethPrice, tokenPrice, liquidity, volume } = this.form.value; */
  }

  private percentage(percent: number, total: number): number {
    return parseInt(((percent / 100) * total).toFixed(), 10);
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
}
