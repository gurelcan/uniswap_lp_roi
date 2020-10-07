import { ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatAccordion } from '@angular/material/expansion';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PoolQuery } from 'src/app/services/state/pool.query';
import { PoolStore } from 'src/app/services/state/pool.store';

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

  liquidityUSD = this.query.select('liquidityUSD');

  isConnected$ = this.query.select('isConnected');

  sliderRange = { vol: { min: 0, max: 99999999 }, liq: { min: 0, max: 99999999 } };

  roi = this.query.select('roi');

  @Input() set shouldOpen(value: boolean) {
    value ? setTimeout(() => this.accordion.openAll(), 100) : null;
  }

  constructor(private query: PoolQuery, private poolStore: PoolStore, private cdr: ChangeDetectorRef) {
    this.form.get('tokenOne').setValue(Math.round(this.query.getValue().token0.priceUSD));
    this.form.get('tokenTwo').setValue(Math.round(this.query.getValue().token1.priceUSD));
    this.form.get('volume').setValue(Math.round(this.query.getValue().volumeUSD));
    this.form.get('liquidity').setValue(Math.round(this.query.getValue().liquidityUSD));
    this.form.valueChanges.pipe(distinctUntilChanged(), debounceTime(500)).subscribe(() => {
      this.calculateROI();
    });
    this.calculateROI();
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

  calculateROI() {
    const { investment, days, liquidity, tokenOne, tokenTwo, volume } = this.form.value;

    const { liquidityUSD, volumeUSD, reserveTokenOne, reserveTokenTwo } = this.query.getValue();

    const poolTokenOne = liquidityUSD / 2 / reserveTokenOne;
    const poolTokenTwo = liquidityUSD / 2 / reserveTokenTwo;

    try {

      /* Calculation variables for ROI */
      const tokenOneInvested = (investment / 2) / poolTokenOne;
      const tokenTwoInvested = (investment / 2) / poolTokenTwo;
      const CONSTANT = (tokenOneInvested + reserveTokenOne) * (tokenTwoInvested + reserveTokenTwo);
      const tokenOnePriceInTokenTwo = tokenOne / tokenTwo;
      const tokenOneLPAtExit = Math.sqrt(CONSTANT / tokenOnePriceInTokenTwo);
      const tokenTwoLPAtExit = Math.sqrt(CONSTANT * tokenOnePriceInTokenTwo);
      const liquidityShareAtEntry = tokenOneInvested / (tokenOneInvested + reserveTokenOne);
      const tokenOneRemoved = liquidityShareAtEntry * tokenOneLPAtExit;
      const liquidityShareAtExit = tokenOneRemoved / (liquidity / 2 / tokenOne);
      const liquidityShareAverage = (liquidityShareAtExit + liquidityShareAtEntry) / 2;
      const tokenTwoRemoved = tokenTwoLPAtExit * liquidityShareAtEntry;
      const volumePriceAppreciation = ((tokenOne / poolTokenOne) + (tokenTwo / poolTokenTwo)) / 2;
      const volumeAfterAppreciation = volumeUSD * volumePriceAppreciation;

      /* Range calculations */
      const liquidityAfterAppreciation = tokenOneLPAtExit * tokenOne + tokenTwoLPAtExit * tokenTwo;
      const liquidtyPriceAppreciation = liquidityAfterAppreciation / (investment + liquidityUSD);
      const tokenOnePriceAllowedRange = 10;
      const tokenTwoPriceAllowedRange = 10;
      const volumeChangeAllowedRange = 5;
      const liquidityChangeAllowedRange = 5;

      this.form.get('tokenOne').setValidators(Validators.min(poolTokenOne / tokenOnePriceAllowedRange));
      this.form.get('tokenOne').setValidators(Validators.max(poolTokenOne * tokenOnePriceAllowedRange));
      this.form.get('tokenTwo').setValidators(Validators.min(poolTokenTwo / tokenTwoPriceAllowedRange));
      this.form.get('tokenTwo').setValidators(Validators.max(poolTokenTwo * tokenTwoPriceAllowedRange));
      this.sliderRange.vol.min = Math.round(Math.round(volumeAfterAppreciation) / volumeChangeAllowedRange);
      this.sliderRange.vol.max = Math.round(Math.round(volumeAfterAppreciation) * volumeChangeAllowedRange);
      this.sliderRange.liq.min = this.findMaxValue(liquidityAfterAppreciation / liquidityChangeAllowedRange,
        liquidtyPriceAppreciation * investment);
      this.sliderRange.liq.max = liquidityAfterAppreciation * liquidityChangeAllowedRange;
      console.log(this.sliderRange)
      /* Calculate Table */
      const priceAppreciationForPool = (tokenOne * tokenOneInvested + tokenTwo * tokenTwoInvested) - investment;
      const priceAppreciationHODLTokenOne = (investment * tokenOne) / poolTokenOne - investment;
      const priceAppreciationHODLTokenTwo = (investment * tokenTwo) / poolTokenTwo - investment;
      const priceAppreciationHODL5050 = investment / 2 * tokenOne / poolTokenOne
        + investment / 2 * tokenTwo / poolTokenTwo - investment;
      const impermenantLoss = tokenOneRemoved * tokenOne + tokenTwoRemoved * tokenTwo - investment - priceAppreciationForPool;
      const feesCollected = volume * days * liquidityShareAverage * 0.003;
      const totalPool = priceAppreciationForPool + impermenantLoss + feesCollected + investment;
      const totalHODLTokenOne = investment + priceAppreciationHODLTokenOne;
      const totalHODLTokenTwo = investment + priceAppreciationHODLTokenTwo;
      const total5050 = investment + priceAppreciationHODL5050;

      this.poolStore.update({
        roi: {
          roiPool: Math.round(totalPool / investment * 100),
          ROIHODLTokenOne: Math.round(totalHODLTokenOne / investment * 100),
          ROIHODLTokenTwo: Math.round(totalHODLTokenTwo / investment * 100),
          roi5050: Math.round(total5050 / investment * 100),
          priceAppreciationForPool: Math.round(priceAppreciationForPool),
          priceAppreciationHODLTokenOne: Math.round(priceAppreciationHODLTokenOne),
          priceAppreciationHODLTokenTwo: Math.round(priceAppreciationHODLTokenTwo),
          priceAppreciationHODL5050: Math.round(priceAppreciationHODL5050),
          fees: Math.round(feesCollected),
          impermenantLoss: Math.round(impermenantLoss),
          totalPool: Math.round(totalPool),
          totalHODLTokenOne: Math.round(totalHODLTokenOne),
          totalHODLTokenTwo: Math.round(totalHODLTokenTwo),
          total5050: Math.round(total5050)
        }
      });
      console.log(this.poolStore.getValue())
      this.cdr.markForCheck();
    } catch (error) {
      console.error(error);
    }
  }
  private findMaxValue(one: number, two: number): number {
    return one >= two ? one : two;
  }
}
