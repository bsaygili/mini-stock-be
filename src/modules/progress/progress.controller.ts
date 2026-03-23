import { Controller, Get, Param } from '@nestjs/common';
import { ProgressService } from './progress.service';

@Controller('progress')
export class ProgressController {
    constructor(private progressService: ProgressService) {}

    @Get(':jobId')
    getProgress(@Param('jobId') jobId: string) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return this.progressService.get(jobId);
    }
}
