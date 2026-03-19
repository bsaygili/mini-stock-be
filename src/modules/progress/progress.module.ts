import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
    controllers: [ProgressController],
    exports: [ProgressService],
    providers: [ProgressService],
})
export class ProgressModule {}
