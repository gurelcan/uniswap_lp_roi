// Angular
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormArray } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

// Service
import { PoolService } from './services/pool.service';

// RxJs
import { BehaviorSubject, Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

// Lodash
import { isEqual } from 'lodash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  host: {
    class: 'mat-elevation-z4'
  }
})
export class AppComponent {
  public searchCtrl = new FormControl('0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852');

  public loading = new BehaviorSubject(false);

  public showInputs = new BehaviorSubject(false);

  public roiResult = new Map();

  public inputConfig = {
    liqMin: 0, liqMax: 10000, volMin: 0, volMax: 10000,
    0: { min: 0, max: 1000 }, 1: { min: 0, max: 1000 }
  };

  public form = new FormGroup({
    investment: new FormControl(1000),
    days: new FormControl(30),
    tokens: new FormArray([]),
    liquidity: new FormControl(),
    volume: new FormControl()
  });

  public poolData;

  private tokenOnePriceFetched: number;

  private tokenTwoPriceFetched: number;

  private sub: Subscription;

  private shouldUpdateSliders = true;

  constructor(
    private poolService: PoolService,
    private snackbar: MatSnackBar,
    private title: Title) {
    this.title.setTitle('Uniswap ROI');

    this.form.valueChanges.pipe(distinctUntilChanged((prev, cur) => {
      this.shouldUpdateSliders = prev.liquidity === cur.liquidity && prev.volume === cur.volume;
      return isEqual(prev, cur);
    })).subscribe(_ => this.calculateROI(this.shouldUpdateSliders));

  }

  searchPool(): void {
    /* State handling */
    if ((this.form.get('tokens') as FormArray).controls.length) {
      (this.form.get('tokens') as FormArray).controls = [];
    }
    this.showInputs.next(false);
    this.poolData = undefined;
    this.loading.next(true);
    if (this.sub) this.sub.unsubscribe();

    /* Fetching and parsing data */
    this.sub = this.poolService.fetchPool().subscribe(async data => {

      this.poolData = data.results.filter(x => x.exchange.toLowerCase() === this.searchCtrl.value.toLowerCase())[0];

      this.updateData();

    }, () => {
      this.showInputs.next(false);
      this.loading.next(false);
    });
  }

  updateData(): void {
    if (!this.poolData) {
      this.snackbar.open('Did not found any pool for the address', '', { duration: 3000 });
      this.loading.next(false);
    } else {
      try {
        /* Set the form controls */
        this.form.get('liquidity').setValue(this.poolData.usdLiquidity);
        this.form.get('volume').setValue(this.poolData.usdVolume);
        (this.form.get('tokens') as FormArray).push(new FormControl(this.calculateUSDValue(this.poolData.assets[0]).toFixed(4)));
        (this.form.get('tokens') as FormArray).push(new FormControl(this.calculateUSDValue(this.poolData.assets[1]).toFixed(4)));

        this.calculateROI(true);
      } catch (error) {
        console.error('error parsing data');
        this.loading.next(false);
        this.showInputs.next(false);
      }
    }
  }

  calculateROI(updateSliders: boolean): void {
    const { investment, days, liquidity, tokens, volume } = this.form.value;

    if (!tokens.length) return;

    const { usdLiquidity, usdVolume, assets } = this.poolData;

    const tokenOne = assets[0];
    const tokenTwo = assets[1];

    this.tokenOnePriceFetched = this.calculateUSDValue(this.poolData.assets[0]);
    this.tokenTwoPriceFetched = this.calculateUSDValue(this.poolData.assets[1]);

    try {

      /* Calculation variables for ROI */
      const tokenOneInvested = (investment / 2) / this.tokenOnePriceFetched;
      const tokenTwoInvested = (investment / 2) / this.tokenTwoPriceFetched;
      const CONSTANT = (tokenOneInvested + tokenOne.balance) * (tokenTwoInvested + tokenTwo.balance);
      const tokenOnePriceInTokenTwo = tokens[0] / tokens[1];
      const tokenOneLPAtExit = Math.sqrt(CONSTANT / tokenOnePriceInTokenTwo);
      const tokenTwoLPAtExit = Math.sqrt(CONSTANT * tokenOnePriceInTokenTwo);
      const liquidityShareAtEntry = tokenOneInvested / (tokenOneInvested + tokenOne.balance);
      const tokenOneRemoved = liquidityShareAtEntry * tokenOneLPAtExit;
      const liquidityShareAtExit = tokenOneRemoved / (liquidity / 2 / tokens[0]);
      const liquidityShareAverage = (liquidityShareAtExit + liquidityShareAtEntry) / 2;
      const tokenTwoRemoved = tokenTwoLPAtExit * liquidityShareAtEntry;
      const volumePriceAppreciation = ((tokens[0] / this.tokenOnePriceFetched) + (tokens[1] / this.tokenTwoPriceFetched)) / 2;
      const volumeAfterAppreciation = usdVolume * volumePriceAppreciation;

      /* Range calculations */
      const liquidityAfterAppreciation = tokenOneLPAtExit * tokens[0] + tokenTwoLPAtExit * tokens[1];
      const liquidtyPriceAppreciation = liquidityAfterAppreciation / (investment + usdLiquidity);
      const tokenOnePriceAllowedRange = 10;
      const tokenTwoPriceAllowedRange = 10;
      const volumeChangeAllowedRange = 5;
      const liquidityChangeAllowedRange = 5;

      /* User input ranges */
      this.inputConfig[0].min = this.tokenOnePriceFetched / tokenOnePriceAllowedRange;
      this.inputConfig[0].max = this.tokenOnePriceFetched * tokenOnePriceAllowedRange;

      this.inputConfig[1].min = this.tokenTwoPriceFetched / tokenTwoPriceAllowedRange;
      this.inputConfig[1].max = this.tokenTwoPriceFetched * tokenTwoPriceAllowedRange;
      this.inputConfig.volMin = volumeAfterAppreciation / volumeChangeAllowedRange;
      this.inputConfig.volMax = volumeAfterAppreciation * volumeChangeAllowedRange;
      this.inputConfig.liqMin = this.findMaxValue(liquidityAfterAppreciation / liquidityChangeAllowedRange,
        liquidtyPriceAppreciation * investment);
      this.inputConfig.liqMax = liquidityAfterAppreciation * liquidityChangeAllowedRange;

      /* Calculate Table */
      const priceAppreciationForPool = (tokens[0] * tokenOneInvested + tokens[1] * tokenTwoInvested) - investment;
      const priceAppreciationHODLTokenOne = (investment * tokens[0]) / this.tokenOnePriceFetched - investment;
      const priceAppreciationHODLTokenTwo = (investment * tokens[1]) / this.tokenTwoPriceFetched - investment;
      const priceAppreciationHODL5050 = investment / 2 * tokens[0] / this.tokenOnePriceFetched
        + investment / 2 * tokens[1] / this.tokenTwoPriceFetched - investment;
      const impermenantLoss = tokenOneRemoved * tokens[0] + tokenTwoRemoved * tokens[1] - investment - priceAppreciationForPool;
      const feesCollected = volume * days * liquidityShareAverage * 0.003;
      const totalPool = priceAppreciationForPool + impermenantLoss + feesCollected + investment;
      const totalHODLTokenOne = investment + priceAppreciationHODLTokenOne;
      const totalHODLTokenTwo = investment + priceAppreciationHODLTokenTwo;
      const total5050 = investment + priceAppreciationHODL5050;

      this.roiResult.set('roiPool', Math.round(totalPool / investment * 100));
      this.roiResult.set('ROIHODLTokenOne', Math.round(totalHODLTokenOne / investment * 100));
      this.roiResult.set('ROIHODLTokenTwo', Math.round(totalHODLTokenTwo / investment * 100));
      this.roiResult.set('roi5050', Math.round(total5050 / investment * 100));
      this.roiResult.set('priceAppreciationForPool', Math.round(priceAppreciationForPool));
      this.roiResult.set('priceAppreciationHODLTokenOne', Math.round(priceAppreciationHODLTokenOne));
      this.roiResult.set('priceAppreciationHODLTokenTwo', Math.round(priceAppreciationHODLTokenTwo));
      this.roiResult.set('priceAppreciationHODL5050', Math.round(priceAppreciationHODL5050));
      this.roiResult.set('fees', Math.round(feesCollected));
      this.roiResult.set('impermenantLoss', Math.round(impermenantLoss));
      this.roiResult.set('totalPool', Math.round(totalPool));
      this.roiResult.set('totalHODLTokenOne', Math.round(totalHODLTokenOne));
      this.roiResult.set('totalHODLTokenTwo', Math.round(totalHODLTokenTwo));
      this.roiResult.set('total5050', Math.round(total5050));

      /* 
            console.log(tokenOneInvested, tokenTwoInvested, CONSTANT, tokenOnePriceInTokenTwo, tokenOneLPAtExit, tokenTwoLPAtExit,
              liquidityShareAtEntry, tokenOneRemoved, liquidityShareAtExit, liquidityShareAverage, tokenTwoRemoved, volumePriceAppreciation,
              volumeAfterAppreciation, feesCollected); */

      this.showInputs.next(true);
      this.loading.next(false);

      if (updateSliders) {
        this.form.get('liquidity').setValue(liquidityAfterAppreciation.toFixed(2));
        this.form.get('volume').setValue(volumeAfterAppreciation.toFixed(2));
      }

    } catch (error) {
      this.showInputs.next(false);
      this.loading.next(false);
    }
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

  calculateUSDValue(asset: any): number {
    const usdPrice = (this.poolData.usdLiquidity / 2) / (asset.balance);
    return usdPrice;
  }

  private findMaxValue(one: number, two: number): number {
    return one >= two ? one : two;
  }
}
