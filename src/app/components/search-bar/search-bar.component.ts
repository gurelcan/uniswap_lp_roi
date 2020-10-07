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
    tokenOne: new FormControl(),
    tokenTwo: new FormControl(),
    poolAddress: new FormControl('0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852')
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
