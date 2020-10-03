// Angular
import { Component, HostBinding } from '@angular/core';
import { PoolQuery } from './services/state/pool.query';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @HostBinding('class') class = 'mat-elevation-z4';

  showInputs$ = this.query.select('address');

  public roiResult = new Map();

  public inputConfig = {
    liqMin: 0, liqMax: 10000, volMin: 0, volMax: 10000,
    0: { min: 0, max: 1000 }, 1: { min: 0, max: 1000 }
  };

  constructor(private query: PoolQuery) { }

  /*   calculateROI(updateSliders: boolean): void {
      const { investment, days, liquidity, tokens, volume } = this.form.value;
  
      if (!tokens.length) return;
  
      const { usdLiquidity, usdVolume, assets } = this.poolData;
  
      const tokenOne = assets[0];
      const tokenTwo = assets[1];
  
      this.tokenOnePriceFetched = this.calculateUSDValue(this.poolData.assets[0]);
      this.tokenTwoPriceFetched = this.calculateUSDValue(this.poolData.assets[1]);
  
      try {
  
        
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
  
        
        const liquidityAfterAppreciation = tokenOneLPAtExit * tokens[0] + tokenTwoLPAtExit * tokens[1];
        const liquidtyPriceAppreciation = liquidityAfterAppreciation / (investment + usdLiquidity);
        const tokenOnePriceAllowedRange = 10;
        const tokenTwoPriceAllowedRange = 10;
        const volumeChangeAllowedRange = 5;
        const liquidityChangeAllowedRange = 5;
  
        
        this.inputConfig[0].min = this.tokenOnePriceFetched / tokenOnePriceAllowedRange;
        this.inputConfig[0].max = this.tokenOnePriceFetched * tokenOnePriceAllowedRange;
  
        this.inputConfig[1].min = this.tokenTwoPriceFetched / tokenTwoPriceAllowedRange;
        this.inputConfig[1].max = this.tokenTwoPriceFetched * tokenTwoPriceAllowedRange;
        this.inputConfig.volMin = volumeAfterAppreciation / volumeChangeAllowedRange;
        this.inputConfig.volMax = volumeAfterAppreciation * volumeChangeAllowedRange;
        this.inputConfig.liqMin = this.findMaxValue(liquidityAfterAppreciation / liquidityChangeAllowedRange,
          liquidtyPriceAppreciation * investment);
        this.inputConfig.liqMax = liquidityAfterAppreciation * liquidityChangeAllowedRange;
  
        
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
   */
  /* 
        console.log(tokenOneInvested, tokenTwoInvested, CONSTANT, tokenOnePriceInTokenTwo, tokenOneLPAtExit, tokenTwoLPAtExit,
          liquidityShareAtEntry, tokenOneRemoved, liquidityShareAtExit, liquidityShareAverage, tokenTwoRemoved, volumePriceAppreciation,
          volumeAfterAppreciation, feesCollected); */
  /* 
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
   */
}
