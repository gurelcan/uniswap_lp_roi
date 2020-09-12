import { Injectable } from '@angular/core';

// Ethers
import { providers } from 'ethers'

// RxJs
import { BehaviorSubject } from 'rxjs';
import { DBService } from './db.service';

@Injectable({ providedIn: 'root' })
export class Web3Service {
  private provider: providers.Web3Provider;

  public isConnected = new BehaviorSubject(false);

  constructor(private db: DBService) { }


  get ethereum(): any {
    return (window as any).ethereum;
  }

  async init(): Promise<void> {
    if (this.ethereum) {
      await this.ethereum.enable();
      this.provider = new providers.Web3Provider(this.ethereum);
      this.isConnected.next(true);
      const address = await this.getAddress();
      const exists = await this.db.keyExists(address);
      if (!exists) {
        this.db.addKey(address);
      }
    }
  }

  disconnect(): void {
    delete this.provider;
    this.isConnected.next(false);
  }

  private async getAddress(): Promise<string> {
    return this.provider.getSigner().getAddress();
  }
}
