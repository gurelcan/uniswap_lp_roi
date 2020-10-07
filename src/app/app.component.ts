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
}
