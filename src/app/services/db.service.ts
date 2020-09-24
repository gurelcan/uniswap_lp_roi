// Angular
import { Injectable } from '@angular/core';

// Fire
import { AngularFirestore } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class DBService {
  constructor(private firestore: AngularFirestore) { }

  async keyExists(key: string): Promise<boolean> {
    const col = this.firestore.collection('publicKeys').get().toPromise();
    const documents = await col;
    const allKeys = documents.docs.map(doc => doc.data()?.key);
    return allKeys.includes(key)
  }

  async addKey(key: string): Promise<void> {
    this.firestore.collection('publicKeys').add({ key });
  }

  logError(error: Error): void {
    this.firestore.collection('errors').add({ message: error.message })
  }
}
