// Angular
import { Injectable } from '@angular/core';
import { PoolStore } from './pool.store';

@Injectable({ providedIn: 'root' })
export class PoolService {

  constructor(private poolStore: PoolStore) { }

  private query = `
  {
    query {
      pairs(id: ${'0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852'.toLowerCase()}) {
        id
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
    }
  }
  `;

  fetchPool(addressOrSymbol: string, symbolTwo?: string) {
    this.poolStore.setLoading(true);
    fetch('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2', {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.query)
    }).then(data => data.json()).then(value => {
      console.log(value);
      this.poolStore.update({ address: value });
      this.poolStore.setLoading(false);
    }).catch(_ => this.poolStore.setLoading(false));
  }
}
