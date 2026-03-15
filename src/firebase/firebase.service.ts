import { Injectable } from '@nestjs/common';
import admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
    private db: admin.firestore.Firestore;

    constructor() {
        // Avoid re-initializing the default app when using hot reload / multiple module instantiation

        const app = admin.apps.length
            ? admin.app()
            : admin.initializeApp({
                  credential: admin.credential.cert({
                      projectId: process.env.FIREBASE_PROJECT_ID,
                      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(
                          /\\n/g,
                          '\n',
                      ),
                      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                  }),
              });

        this.db = app.firestore();
    }

    getDB(): admin.firestore.Firestore {
        return this.db;
    }
}
