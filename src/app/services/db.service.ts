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
    return !!documents.docs.filter(async doc => {
      const docData = doc.data();
      return docData?.key === key;
    }).length;
  }

  async addKey(key: string): Promise<void> {
    this.firestore.collection('publicKeys').add({ key });
  }
}
