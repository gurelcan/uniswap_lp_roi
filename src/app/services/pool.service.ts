// Angular
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// RxJs
import { Observable } from 'rxjs';
import { apiKey } from 'secrets';

@Injectable({ providedIn: 'root' })
export class PoolService {
  constructor(private http: HttpClient) { }

  fetchPool(address: string): Observable<any> {
    return this.http.get(
      `https://data-api.defipulse.com/api/v1/blocklytics/pools/v1/exchanges`,
      {
        params: {
        /*   address, */
          'api-key': apiKey
        }
      });
  }
}
