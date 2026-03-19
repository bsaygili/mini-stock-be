import { Injectable } from '@nestjs/common';

@Injectable()
export class ProgressService {
    private progressMap = new Map<string, any>();

    create(jobId: string) {
        this.progressMap.set(jobId, {
            progress: 0,
            status: 'uploading',
        });
    }

    update(jobId: string, data: Partial<any>) {
        const current = this.progressMap.get(jobId) || {};
        this.progressMap.set(jobId, { ...current, ...data });
    }

    get(jobId: string) {
        return (
            this.progressMap.get(jobId) || {
                progress: 0,
                status: 'not_found',
            }
        );
    }

    complete(jobId: string) {
        this.progressMap.set(jobId, {
            progress: 100,
            status: 'done',
        });
    }
}
