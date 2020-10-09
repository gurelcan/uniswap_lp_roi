import { Component } from '@angular/core';
import { Web3Service } from 'src/app/services/web3.service';
@Component({
  selector: 'app-connect-button',
  templateUrl: 'connect-button.component.html',
  styleUrls: ['./connect-button.component.scss']
})
export class ConnectButtonComponent {

  isConnected = this.web3Service.isConnected;

  constructor(private web3Service: Web3Service) { }

  public connect() {
    this.web3Service.init();
  }

  public disconnect() {
    this.web3Service.disconnect();
  }
}
