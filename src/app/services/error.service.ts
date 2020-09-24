import { ErrorHandler, Injectable } from '@angular/core';
import { DBService } from './db.service';

@Injectable({ providedIn: 'root' })
export class MyErrorHandler implements ErrorHandler {
  constructor(private db: DBService) { }
  handleError(error: Error): void {
    if (error) {
      this.db.logError(error);
    }
  }
}