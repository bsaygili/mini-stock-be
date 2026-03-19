import { Module } from '@nestjs/common';
import { CriticalModule } from '../critical/critical.module';
import { ExcelModule } from '../excel/excel.module';
import { MailModule } from '../mail/mail.module';
import { ProgressModule } from '../progress/progress.module';
import { SettingsModule } from '../settings/settings.module';
import { UploadModule } from '../upload/upload.module';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
    imports: [
        ExcelModule,
        CriticalModule,
        MailModule,
        UploadModule,
        SettingsModule,
        ProgressModule,
    ],
    controllers: [StockController],
    providers: [StockService],
})
export class StockModule {}
