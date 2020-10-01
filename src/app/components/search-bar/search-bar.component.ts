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
    searchBySymbols: new FormControl(true),
    tokenOne: new FormControl(),
    tokenTwo: new FormControl(),
    poolAddress: new FormControl()
  });

  constructor(private poolService: PoolService, private query: PoolQuery) { }

  fetchPool() {
    this.searchForm.value.searchBySymbols
      ? this.poolService.fetchPool(this.searchForm.value.tokenOne.symbol, this.searchForm.value.tokenTwo.symbol)
      : this.poolService.fetchPool(this.searchForm.value.poolAddress);
  }
}
