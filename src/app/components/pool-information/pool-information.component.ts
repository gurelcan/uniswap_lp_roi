import { Component, Input, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatAccordion } from '@angular/material/expansion';
import { distinctUntilChanged, throttle, throttleTime } from 'rxjs/operators';
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

  constructor(private query: PoolQuery, private poolStore: PoolStore) {
    this.form.get('tokenOne').setValue(this.query.getValue().token0.priceUSD.toFixed(2));
    this.form.get('tokenTwo').setValue(this.query.getValue().token1.priceUSD.toFixed(2));
    this.form.get('volume').setValue(Math.round(this.query.getValue().volumeUSD));
    this.form.get('liquidity').setValue(Math.round(this.query.getValue().liquidityUSD));
    this.form.valueChanges.pipe(distinctUntilChanged(), throttleTime(500)).subscribe(() => {
      this.calculateROI();
    });
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

    const { liquidityUSD, volumeUSD, token0, token1, reserveTokenOne, reserveTokenTwo } = this.query.getValue();

    const poolTokenOne = token0;
    const poolTokenTwo = token1;
    console.log(poolTokenTwo, poolTokenOne)

    try {

      const tokenOneInvested = (investment / 2) / poolTokenOne.priceUSD;
      const tokenTwoInvested = (investment / 2) / poolTokenTwo.priceUSD;
      const CONSTANT = (tokenOneInvested + tokenOne.balance) * (tokenTwoInvested + tokenTwo.balance);
      const tokenOnePriceInTokenTwo = reserveTokenOne / reserveTokenTwo;
      const tokenOneLPAtExit = Math.sqrt(CONSTANT / tokenOnePriceInTokenTwo);
      const tokenTwoLPAtExit = Math.sqrt(CONSTANT * tokenOnePriceInTokenTwo);
      const liquidityShareAtEntry = tokenOneInvested / (tokenOneInvested + tokenOne.balance);
      const tokenOneRemoved = liquidityShareAtEntry * tokenOneLPAtExit;
      const liquidityShareAtExit = tokenOneRemoved / (liquidity / 2 / reserveTokenOne);
      const liquidityShareAverage = (liquidityShareAtExit + liquidityShareAtEntry) / 2;
      const tokenTwoRemoved = tokenTwoLPAtExit * liquidityShareAtEntry;
      const volumePriceAppreciation = ((reserveTokenOne / poolTokenOne.priceUSD) +
        (reserveTokenTwo / poolTokenTwo.priceUSD)) / 2;
      const volumeAfterAppreciation = volumeUSD * volumePriceAppreciation;

      const liquidityAfterAppreciation = tokenOneLPAtExit * reserveTokenOne + tokenTwoLPAtExit * reserveTokenTwo;
      const liquidtyPriceAppreciation = liquidityAfterAppreciation / (investment + liquidityUSD);
      const tokenOnePriceAllowedRange = 10;
      const tokenTwoPriceAllowedRange = 10;
      const volumeChangeAllowedRange = 5;
      const liquidityChangeAllowedRange = 5;


      this.form.get('tokenOne').setValidators(Validators.min(poolTokenOne.priceUSD / tokenOnePriceAllowedRange));
      this.form.get('tokenOne').setValidators(Validators.max(poolTokenOne.priceUSD * tokenOnePriceAllowedRange));
      this.form.get('tokenTwo').setValidators(Validators.min(poolTokenTwo.priceUSD * tokenTwoPriceAllowedRange));
      this.form.get('tokenTwo').setValidators(Validators.max(poolTokenTwo.priceUSD * tokenTwoPriceAllowedRange));
      this.sliderRange.vol.min = volumeAfterAppreciation / volumeChangeAllowedRange;
      this.sliderRange.vol.max = volumeAfterAppreciation * volumeChangeAllowedRange;
      this.sliderRange.liq.min = this.findMaxValue(liquidityAfterAppreciation / liquidityChangeAllowedRange,
        liquidtyPriceAppreciation * investment);
      this.sliderRange.liq.max = liquidityAfterAppreciation * liquidityChangeAllowedRange;


      const priceAppreciationForPool = (reserveTokenOne[0] * tokenOneInvested + reserveTokenTwo * tokenTwoInvested) - investment;
      const priceAppreciationHODLTokenOne = (investment * reserveTokenOne[0]) / token0.priceUSD - investment;
      const priceAppreciationHODLTokenTwo = (investment * reserveTokenTwo[1]) / token1.priceUSD - investment;
      const priceAppreciationHODL5050 = investment / 2 * reserveTokenOne[0] / token0.priceUSD
        + investment / 2 * reserveTokenTwo[1] / token1.priceUSD - investment;
      const impermenantLoss = tokenOneRemoved * reserveTokenOne[0] +
        tokenTwoRemoved * reserveTokenTwo[1] - investment - priceAppreciationForPool;
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

      console.log(tokenOneInvested, tokenTwoInvested, CONSTANT, tokenOnePriceInTokenTwo, tokenOneLPAtExit, tokenTwoLPAtExit,
        liquidityShareAtEntry, tokenOneRemoved, liquidityShareAtExit, liquidityShareAverage, tokenTwoRemoved, volumePriceAppreciation,
        volumeAfterAppreciation, feesCollected);
      /*       if (updateSliders) {
              this.form.get('liquidity').setValue(liquidityAfterAppreciation.toFixed(2));
              this.form.get('volume').setValue(volumeAfterAppreciation.toFixed(2));
            } */



    } catch (error) {
      console.error(error);
    }
  }
  private findMaxValue(one: number, two: number): number {
    return one >= two ? one : two;
  }
}
