// Angular
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

// Others
import { PoolStore } from './pool.store';

@Injectable({ providedIn: 'root' })
export class PoolService {

  constructor(private poolStore: PoolStore, private snackbar: MatSnackBar) { }

  private createQuery = (tokenAddressOne: string, tokenAddressTwo?: string) => {
    const parsedTokenOne = tokenAddressOne.toLowerCase().trim();
    const parsedTokenTwo = tokenAddressTwo?.toLowerCase().trim();
    if (parsedTokenTwo?.length) {
      return ` query {
        pairs(where: {
          token0: "${parsedTokenOne}"
          token1: "${parsedTokenTwo}"
        }) {
          id
          token0 {
            id
            symbol
            decimals
          }
          token1 {
            id
            symbol
            decimals
            }
            reserveUSD
            reserve0
            reserve1
            volumeUSD
          }
        }`;
    } else {
      return ` query {
        pairs(where: {
          id: "${parsedTokenOne}"
        }) {
          id
          token0 {
            id
            symbol
            decimals
          }
          token1 {
            id
            symbol
            decimals
            }
            reserveUSD
            reserve0
            reserve1
            volumeUSD
            totalSupply
          }
            pairDayDatas(orderBy: date,
              orderDirection: desc, where: {pairAddress:
                "${parsedTokenOne}"}, first: 1) {
              id
              dailyVolumeToken0
              dailyVolumeToken1
              dailyVolumeUSD
          }
        }`;
    }
  }

  fetchPool(tokenAddressOne: string, tokenAddressTwo?: string, secondTry?: boolean) {
    this.poolStore.reset();
    this.poolStore.setLoading(true);
    let query;
    if (secondTry) {
      query = this.createQuery(tokenAddressTwo, tokenAddressOne);
    }
    query = this.createQuery(tokenAddressOne, tokenAddressTwo);
    const opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    };
    fetch('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2', opts)
      .then(data => data.json()).catch(error => {
        console.error(error);
        this.poolStore.setLoading(false);
      }).then(value => {
        const volume = value.data.pairDayDatas[0].dailyVolumeUSD;
        value = value.data.pairs[0];
        this.poolStore.update({
          address: value.id,
          token0: {
            decimal: value.token0.decimals,
            address: value.token0.id,
            symbol: value.token0.symbol,
            priceUSD: value.reserveUSD / 2 / value.reserve0
          },
          token1: {
            decimal: value.token1.decimals,
            address: value.token1.id,
            symbol: value.token1.symbol,
            priceUSD: value.reserveUSD / 2 / value.reserve1
          },
          liquidityUSD: Math.round(value.reserveUSD),
          volumeUSD: Math.round(volume),
          reserveTokenOne: Math.round(value.reserve0),
          reserveTokenTwo: Math.round(value.reserve1)
        });
        this.poolStore.setLoading(false);
      }).catch(error => {
        if (false) {
          this.fetchPool(tokenAddressTwo, tokenAddressOne, true);
        } else {
          this.snackbar.open('Could not find any pool!', 'Close', { duration: 3000 });
          console.error(error);
          this.poolStore.setLoading(false);
        }
      });
  }
}