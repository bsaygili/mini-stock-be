import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { CriticalService } from './critical.service';

@Module({
    imports: [SettingsModule],
    providers: [CriticalService],
    exports: [CriticalService],
})
export class CriticalModule {}
