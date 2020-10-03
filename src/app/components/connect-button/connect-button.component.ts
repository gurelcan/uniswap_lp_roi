import { Component } from '@angular/core';
import { PoolQuery } from 'src/app/services/state/pool.query';
import { Web3Service } from 'src/app/services/web3.service';
@Component({
  selector: 'app-connect-button',
  templateUrl: 'connect-button.component.html',
  styleUrls: ['./connect-button.component.scss']
})
export class ConnectButtonComponent {

  public isConnected = this.query.select('isConnected');

  constructor(private query: PoolQuery, private web3Service: Web3Service) { }

  public connect() {
    this.web3Service.init();
  }

  public disconnect() {
    this.web3Service.disconnect();
  }
}