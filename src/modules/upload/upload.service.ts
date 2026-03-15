import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';

export interface UploadFile {
    fileName: string;
    totalProducts: number;
    criticalCount: number;
}

@Injectable()
export class UploadService {
    constructor(private firebase: FirebaseService) {}

    async saveUpload(data: UploadFile) {
        const db = this.firebase.getDB();

        const doc = await db.collection('uploads').add({
            ...data,
            uploadedAt: new Date(),
        });

        return doc.id;
    }

    async getUploads() {
        const db = this.firebase.getDB();

        const snapshot = await db
            .collection('uploads')
            .orderBy('uploadedAt', 'desc')
            .get();

        return snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
        }));
    }
}
