import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatAccordion } from '@angular/material/expansion';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { PoolQuery } from 'src/app/services/state/pool.query';
import { PoolStore } from 'src/app/services/state/pool.store';
import { Web3Service } from 'src/app/services/web3.service';

// Lodash
import { isEqual } from 'lodash';

@Component({
  selector: 'app-pool-information',
  templateUrl: 'pool-information.component.html',
  styleUrls: ['./pool-information.component.scss']
})
export class PoolInformationComponent {
  @ViewChild(MatAccordion) accordion: MatAccordion;

  showPoolInfo = this.query.select('address');

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

  volume = this.query.select('volumeUSD').pipe(map(volume => volume.toFixed()));

  liquidityUSD = this.query.select('liquidityUSD').pipe(map(liquidity => liquidity.toFixed()));

  isConnected = this.web3.isConnected;

  inputRange = {
    tokenOne: { min: 0, max: 99999999 }, tokenTwo: { min: 0, max: 999999999 },
    vol: { min: 0, max: 99999999 }, liq: { min: 0, max: 999999999 }
  };

  roi = this.query.select('roi');

  private shouldUpdateSliders = true;

  constructor(
    private query: PoolQuery,
    private poolStore: PoolStore,
    private cdr: ChangeDetectorRef,
    private web3: Web3Service,
    private snackbar: MatSnackBar) {
    this.showPoolInfo.subscribe(value => {
      if (value.length) {
        this.form.get('tokenOne').setValue(this.query.getValue().token0.priceUSD);
        this.form.get('tokenTwo').setValue(this.query.getValue().token1.priceUSD);
        this.form.get('volume').setValue(Math.round(this.query.getValue().volumeUSD));
        this.form.get('liquidity').setValue(Math.round(this.query.getValue().liquidityUSD));
        this.accordion.openAll();
        this.form.valueChanges.pipe(distinctUntilChanged((prev, cur) => {
          this.shouldUpdateSliders = prev.liquidity === cur.liquidity && prev.volume === cur.volume;
          return isEqual(prev, cur);
        })).subscribe(_ => {
          console.log(this.isInRange());
          if (this.isInRange()) {
            this.calculateROI(this.shouldUpdateSliders);
          } else {
            this.snackbar.open('Something is not in range', 'close', { duration: 3000 });
          }
        });
      }
    });
  }

  calculateROI(updateSliders: boolean) {
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
      const liquidityAfterAppreciation = tokenOneLPAtExit * tokenOne + tokenTwoLPAtExit * tokenTwo;

      /* Range calculations */
      const liquidtyPriceAppreciation = liquidityAfterAppreciation / (investment + liquidityUSD);
      const tokenOnePriceAllowedRange = 10;
      const tokenTwoPriceAllowedRange = 10;
      const volumeChangeAllowedRange = 5;
      const liquidityChangeAllowedRange = 5;

      this.inputRange.tokenOne.min = Math.round(poolTokenOne / tokenOnePriceAllowedRange);
      this.inputRange.tokenOne.max = Math.round(poolTokenOne * tokenOnePriceAllowedRange);
      this.inputRange.tokenTwo.min = Math.round(poolTokenTwo / tokenTwoPriceAllowedRange);
      this.inputRange.tokenTwo.max = Math.round(poolTokenTwo * tokenTwoPriceAllowedRange);
      this.inputRange.vol.min = Math.round(Math.round(volumeAfterAppreciation) / volumeChangeAllowedRange);
      this.inputRange.vol.max = Math.round(Math.round(volumeAfterAppreciation) * volumeChangeAllowedRange);
      this.inputRange.liq.min = Math.round(this.findMaxValue(liquidityAfterAppreciation / liquidityChangeAllowedRange,
        liquidtyPriceAppreciation * investment));
      this.inputRange.liq.max = Math.round(liquidityAfterAppreciation * liquidityChangeAllowedRange);

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

      if (updateSliders) {
        this.form.get('liquidity').setValue(liquidityAfterAppreciation.toFixed(2));
        this.form.get('volume').setValue(volumeAfterAppreciation.toFixed(2));
      }
      this.cdr.markForCheck();
    } catch (error) {
      console.error(error);
    }
  }
  private findMaxValue(one: number, two: number): number {
    return one >= two ? one : two;
  }

  private isInRange() {
    return (
      this.form.get('tokenTwo').value > this.inputRange.tokenTwo.min &&
      this.form.get('tokenTwo').value < this.inputRange.tokenTwo.max &&
      this.form.get('tokenOne').value > this.inputRange.tokenOne.min &&
      this.form.get('tokenOne').value < this.inputRange.tokenOne.max &&
      this.form.get('days').value > 1 &&
      this.form.get('days').value <= 365 &&
      this.form.get('investment').value > 100 &&
      this.form.get('investment').value < this.query.getValue().liquidityUSD
    );
  }
}
