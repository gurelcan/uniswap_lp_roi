import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface Token {
  address: string;
  symbol: string;
  decimal: number;
  img?: string;
  type?: string;
  chainId?: number;
  priceUSD: number;
}

export interface PoolState {
  address: string;
  token0: Token;
  token1: Token;
  roi: Record<string, number>;
  totalSupply: number;
  reserveUSD: number;
  volumeUSD: number;
  isConnected: boolean;
}

const initPoolState: PoolState = {
  address: '',
  token0: {
    address: '',
    decimal: 0,
    symbol: '',
    priceUSD: 0
  },
  token1: {
    address: '',
    decimal: 0,
    symbol: '',
    priceUSD: 0
  },
  roi: {},
  totalSupply: 0,
  reserveUSD: 0,
  volumeUSD: 0,
  isConnected: false
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'pool' })
export class PoolStore extends Store<PoolState> {
  constructor() {
    super(initPoolState);
  }
}
