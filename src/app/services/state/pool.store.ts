import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface Token {
  address: string;
  symbol: string;
  decimal: number;
  img?: string;
  type?: string;
  chainId?: number;
}

export interface PoolState {
  address: string;
  token0: Token;
  token1: Token;
  roi: Record<string, number>;
}

const initPoolState: PoolState = {
  address: '',
  token0: {
    address: '',
    decimal: 0,
    symbol: ''
  },
  token1: {
    address: '',
    decimal: 0,
    symbol: ''
  },
  roi: {}
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'pool' })
export class PoolStore extends Store<PoolState> {
  constructor() {
    super(initPoolState);
  }
}
