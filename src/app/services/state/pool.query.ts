import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { PoolState, PoolStore } from './pool.store';

@Injectable({
  providedIn: 'root'
})
export class PoolQuery extends Query<PoolState> {
  constructor(protected store: PoolStore) {
    super(store);
  }
}
