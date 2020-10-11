import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { PoolQuery } from 'src/app/services/state/pool.query';
import { PoolService } from 'src/app/services/state/pool.service';

@Component({
  selector: 'app-search-bar',
  templateUrl: 'search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent {

  public loading = this.query.selectLoading();

  searchForm = new FormGroup({
    searchBySymbols: new FormControl(false),
    tokenOne: new FormControl({
      "address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "symbol": "WETH",
      "decimal": 18,
      "chainId": 1,
      "type": "default",
      "img": `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png`
    }),
    tokenTwo: new FormControl({
      "address": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      "symbol": "WBTC",
      "decimal": 18,
      "chainId": 1,
      "type": "default",
      "img": `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png`
    }),
    poolAddress: new FormControl('0xbb2b8038a1640196fbe3e38816f3e67cba72d940')
  });

  constructor(private poolService: PoolService, private query: PoolQuery) { }

  async fetchPool() {
    if (this.searchForm.value.searchBySymbols) {
      this.poolService.fetchPoolWithTokenAddresses(this.searchForm.value.tokenOne?.address
        ? this.searchForm.value.tokenOne.address
        : this.searchForm.value.tokenOne.trim(),
        this.searchForm.value.tokenTwo?.address
          ? this.searchForm.value.tokenTwo.address
          : this.searchForm.value.tokenTwo.trim());
    } else {
      this.poolService.fetchPoolWithAddress(this.searchForm.value.poolAddress);

    }
  }
}
