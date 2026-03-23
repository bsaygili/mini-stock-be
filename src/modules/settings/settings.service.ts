import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';

export interface Settings {
    emails: string[];
    criticalLimitPercent: number;
    salesPeriodDays: number;
    stockDays: number;
    mailEnabled: boolean;
}

@Injectable()
export class SettingsService {
    constructor(private firebase: FirebaseService) {}

    async getSettings(): Promise<Settings> {
        const db = this.firebase.getDB();
        const doc = await db.collection('settings').doc('main').get();

        if (!doc.exists) {
            return {
                emails: [],
                criticalLimitPercent: 25,
                salesPeriodDays: 60,
                stockDays: 7,
                mailEnabled: true,
            };
        }

        const data = doc.data() as Partial<Settings> | undefined;

        return {
            emails: data?.emails ?? [],
            criticalLimitPercent: data?.criticalLimitPercent ?? 25,
            salesPeriodDays: data?.salesPeriodDays ?? 60,
            stockDays: data?.stockDays ?? 7,
            mailEnabled: data?.mailEnabled ?? true,
        };
    }

    async updateSettings(data: Partial<Settings>) {
        const db = this.firebase.getDB();

        await db.collection('settings').doc('main').set(data, { merge: true });

        return {
            message: 'Settings updated',
            success: true,
        };
    }
}
