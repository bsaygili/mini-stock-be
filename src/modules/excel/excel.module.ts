import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { ExcelService } from './excel.service';

@Module({
    providers: [ExcelService],
    exports: [ExcelService],
    imports: [SettingsModule],
})
export class ExcelModule {}
